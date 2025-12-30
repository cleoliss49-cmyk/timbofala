import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

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

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          ),
          reactions (user_id),
          comments (id)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        }
        throw error;
      }

      setPost({
        id: data.id,
        content: data.content,
        image_url: data.image_url,
        created_at: data.created_at,
        user_id: data.user_id,
        profiles: data.profiles as any,
        reactions: data.reactions || [],
        comments: data.comments || [],
      });
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {loading ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : notFound ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <h2 className="text-xl font-bold mb-2">Publicação não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              Esta publicação pode ter sido removida ou não existe.
            </p>
            <Link to="/feed">
              <Button>Voltar ao Feed</Button>
            </Link>
          </div>
        ) : post ? (
          <PostCard post={post} onUpdate={fetchPost} />
        ) : null}
      </div>
    </MainLayout>
  );
}
