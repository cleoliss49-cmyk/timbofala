import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, X, Maximize2 } from 'lucide-react';

interface ChatUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface Conversation {
  user: ChatUser;
  lastMessage: string;
  unreadCount: number;
  lastMessageAt: string;
}

export function ChatSidebar() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    // Real-time subscription for new messages
    const channel = supabase
      .channel('chat-sidebar-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all messages involving the user
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages) return;

      // Group by conversation partner
      const conversationsMap = new Map<string, { lastMessage: any; unreadCount: number }>();
      
      messages.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            lastMessage: msg,
            unreadCount: 0,
          });
        }
        
        if (msg.receiver_id === user.id && !msg.read_at) {
          const conv = conversationsMap.get(partnerId)!;
          conv.unreadCount++;
        }
      });

      // Fetch user profiles
      const partnerIds = Array.from(conversationsMap.keys());
      if (partnerIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', partnerIds);

      if (!profiles) return;

      const conversationsList: Conversation[] = [];
      let unreadTotal = 0;

      partnerIds.forEach((partnerId) => {
        const profile = profiles.find((p) => p.id === partnerId);
        const conv = conversationsMap.get(partnerId)!;
        
        if (profile) {
          unreadTotal += conv.unreadCount;
          conversationsList.push({
            user: profile,
            lastMessage: conv.lastMessage.content,
            unreadCount: conv.unreadCount,
            lastMessageAt: conv.lastMessage.created_at,
          });
        }
      });

      // Sort by last message time
      conversationsList.sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      setConversations(conversationsList.slice(0, 5));
      setTotalUnread(unreadTotal);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  if (!user) return null;

  // Minimized state - just a floating button
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="hidden lg:flex fixed right-4 bottom-4 z-40 items-center gap-2 px-4 py-3 bg-card border border-border rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5 text-primary" />
        <span className="font-medium text-sm">Mensagens</span>
        {totalUnread > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-destructive rounded-full">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

  // Expanded state - shows conversations
  return (
    <div className="hidden lg:flex fixed right-4 bottom-4 z-40 flex-col w-80 max-h-[500px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="font-semibold">Mensagens</span>
          {totalUnread > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-destructive rounded-full">
              {totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma conversa ainda
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <Link
                key={conv.user.id}
                to={`/messages/${conv.user.id}`}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(false)}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={conv.user.avatar_url || undefined} />
                    <AvatarFallback className="gradient-primary text-white text-sm">
                      {conv.user.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-destructive rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conv.user.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Link
          to="/messages"
          onClick={() => setIsExpanded(false)}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
        >
          <Maximize2 className="w-4 h-4" />
          Ver todas as mensagens
        </Link>
      </div>
    </div>
  );
}
