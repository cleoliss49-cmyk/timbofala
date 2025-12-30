import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/feed/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark } from 'lucide-react';

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

export default function Saved() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSavedPosts();
    }
  }, [user]);

  const fetchSavedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          post_id,
          posts (
            id,
            content,
            image_url,
            created_at,
            user_id,
            profiles!posts_user_id_fkey (
              id,
              username,
              full_name,
              avatar_url,
              neighborhood
            ),
            reactions (user_id, reaction_type),
            comments (id)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data
        ?.filter(item => item.posts)
        .map(item => {
          const post = item.posts as any;
          return {
            id: post.id,
            content: post.content,
            image_url: post.image_url,
            created_at: post.created_at,
            user_id: post.user_id,
            profiles: {
              id: post.profiles.id,
              username: post.profiles.username,
              full_name: post.profiles.full_name,
              avatar_url: post.profiles.avatar_url,
            },
            reactions: post.reactions || [],
            comments: post.comments || [],
          };
        }) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-48 rounded-2xl mb-4" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Salvos</h1>
            <p className="text-muted-foreground">Publicações que você salvou</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Bookmark className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma publicação salva</h3>
            <p className="text-muted-foreground">
              Salve publicações clicando no ícone de marcador para vê-las aqui
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onRefresh={fetchSavedPosts}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
