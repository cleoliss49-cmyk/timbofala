import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export function ChatSidebar() {
  const { user } = useAuth();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChatUsers = async () => {
      // Get users that the current user follows
      const { data: follows } = await supabase
        .from('follows')
        .select(`
          profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', user.id)
        .limit(10);

      if (follows) {
        const users = follows
          .map((f: any) => f.profiles)
          .filter(Boolean);
        setChatUsers(users);
      }
    };

    fetchChatUsers();
  }, [user]);

  return (
    <aside className="hidden lg:flex flex-col fixed right-0 top-16 w-80 h-[calc(100vh-4rem)] bg-card border-l border-border">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="font-semibold">Mensagens</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {/* Chat list */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-2">
          {chatUsers.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground">
                Siga pessoas para começar a conversar!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {chatUsers.map((chatUser) => (
                <Link
                  key={chatUser.id}
                  to={`/messages/${chatUser.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={chatUser.avatar_url || undefined} />
                    <AvatarFallback className="gradient-secondary text-secondary-foreground text-sm">
                      {chatUser.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{chatUser.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{chatUser.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick action */}
      <div className="p-4 border-t border-border">
        <Link
          to="/messages"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
        >
          Ver todas as mensagens
        </Link>
      </div>
    </aside>
  );
}
