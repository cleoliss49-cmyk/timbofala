import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePost } from '@/components/feed/CreatePost';
import { PinnedPosts } from '@/components/feed/PinnedPosts';
import { BanNotice } from '@/components/BanNotice';
import { StoriesBar } from '@/components/stories/StoriesBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, RefreshCw } from 'lucide-react';

interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  reactions: { user_id: string }[];
  comments: { id: string }[];
}

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchPosts = async (showRefresh = false) => {
    if (!user) return;
    
    if (showRefresh) setRefreshing(true);

    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = follows?.map(f => f.following_id) || [];
    const userIds = [user.id, ...followingIds];

    const { data, error } = await supabase
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
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setPosts(data as Post[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <BanNotice />
        <StoriesBar />
        <CreatePost onPostCreated={fetchPosts} />
        <PinnedPosts location="feed" onRefresh={fetchPosts} />

        {posts.length > 0 && (
          <div className="flex justify-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchPosts(true)}
              disabled={refreshing}
              className="text-muted-foreground hover:text-primary"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar feed'}
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => (
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
            ))
          ) : posts.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 shadow-card text-center border border-border">
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Seu feed está vazio</h3>
              <p className="text-muted-foreground mb-4">
                Comece seguindo pessoas ou criando sua primeira publicação!
              </p>
              <Button onClick={() => navigate('/explore')}>
                Explorar comunidade
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
