import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, TrendingUp, Users } from 'lucide-react';

interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  neighborhood: string;
  avatar_url: string | null;
}

export default function Explore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExploreContent = async () => {
    if (!user) return;

    // Get users that current user is NOT following
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = follows?.map(f => f.following_id) || [];
    followingIds.push(user.id); // Exclude self

    // Get suggested users
    const { data: suggestions } = await supabase
      .from('profiles')
      .select('id, username, full_name, neighborhood, avatar_url')
      .not('id', 'in', `(${followingIds.join(',')})`)
      .limit(5);

    if (suggestions) {
      setSuggestedUsers(suggestions);
    }

    // Get trending/recent posts from everyone
    const { data: explorePosts } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        reactions (user_id),
        comments (id)
      `)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (explorePosts) {
      setPosts(explorePosts);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchExploreContent();
    }
  }, [user]);

  const handleFollow = async (userId: string) => {
    if (!user) return;

    try {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: userId,
      });

      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: 'Seguindo!',
        description: 'Usuário adicionado ao seu feed.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível seguir o usuário.',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Suggested users */}
        {suggestedUsers.length > 0 && (
          <div className="bg-card rounded-2xl shadow-card p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold">Sugestões para você</h2>
            </div>
            
            <div className="space-y-3">
              {suggestedUsers.map((sugUser) => (
                <div
                  key={sugUser.id}
                  className="flex items-center justify-between gap-3"
                >
                  <button
                    onClick={() => navigate(`/profile/${sugUser.username}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left"
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={sugUser.avatar_url || undefined} />
                      <AvatarFallback className="gradient-secondary text-secondary-foreground text-sm">
                        {sugUser.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{sugUser.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{sugUser.username} · {sugUser.neighborhood}
                      </p>
                    </div>
                  </button>
                  
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => handleFollow(sugUser.id)}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending posts */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold">Explorar publicações</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 shadow-card border border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-24 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-full h-20" />
                  </div>
                ))}
              </>
            ) : posts.length === 0 ? (
              <div className="bg-card rounded-2xl p-8 shadow-card text-center border border-border">
                <p className="text-muted-foreground">
                  Nenhuma publicação encontrada. Seja o primeiro a publicar!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={fetchExploreContent} />
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
