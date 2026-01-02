import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, UserPlus, Mail, X, Check, CheckCheck, ShoppingBag } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotificationSound } from '@/hooks/useNotificationSound';

type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'order' | 'paquera_match';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  actor_id: string | null;
  post_id: string | null;
  read_at: string | null;
  created_at: string;
  actor?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function NotificationsPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playNotificationSound } = useNotificationSound();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch actor profiles
      const actorIds = [...new Set(data?.filter(n => n.actor_id).map(n => n.actor_id))];
      
      let actorProfiles: Record<string, any> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', actorIds);
        
        if (profiles) {
          actorProfiles = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
      }

      const notificationsWithActors: Notification[] = data?.map(n => ({
        ...n,
        type: n.type as NotificationType,
        actor: n.actor_id ? actorProfiles[n.actor_id] : null
      })) || [];

      setNotifications(notificationsWithActors);
      setUnreadCount(notificationsWithActors.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New notification:', payload);
          
          // Fetch actor profile for new notification
          let actor = null;
          if (payload.new.actor_id) {
            const { data } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', payload.new.actor_id)
              .single();
            actor = data;
          }

          const newNotification: Notification = {
            id: (payload.new as any).id,
            type: (payload.new as any).type as NotificationType,
            title: (payload.new as any).title,
            message: (payload.new as any).message,
            actor_id: (payload.new as any).actor_id,
            post_id: (payload.new as any).post_id,
            read_at: (payload.new as any).read_at,
            created_at: (payload.new as any).created_at,
            actor
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play notification sound
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'follow' && notification.actor?.username) {
      navigate(`/profile/${notification.actor.username}`);
    } else if (notification.type === 'message' && notification.actor?.username) {
      navigate('/messages');
    } else if ((notification.type === 'like' || notification.type === 'comment') && notification.post_id) {
      navigate('/feed');
    } else if (notification.type === 'order') {
      navigate('/empresa/gerenciar');
    } else if (notification.type === 'paquera_match') {
      navigate('/paquera');
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'message':
        return <Mail className="w-4 h-4 text-purple-500" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-orange-500" />;
      case 'paquera_match':
        return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read_at ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={notification.actor?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {notification.actor?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{notification.actor?.full_name || 'Alguém'}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        {notification.type === 'like' && 'curtiu sua publicação'}
                        {notification.type === 'comment' && 'comentou na sua publicação'}
                        {notification.type === 'follow' && 'começou a seguir você'}
                        {notification.type === 'message' && 'enviou uma mensagem'}
                        {notification.type === 'order' && 'fez um pedido na sua loja'}
                        {notification.type === 'paquera_match' && 'deu match com você!'}
                        {notification.type === 'mention' && 'mencionou você'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!notification.read_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
