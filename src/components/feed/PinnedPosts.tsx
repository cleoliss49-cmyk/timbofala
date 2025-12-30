import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from './PostCard';
import { Pin } from 'lucide-react';

interface PinnedPostsProps {
  location: 'feed' | 'marketplace' | 'auction';
  onRefresh?: () => void;
}

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

export function PinnedPosts({ location, onRefresh }: PinnedPostsProps) {
  const { user } = useAuth();
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPinnedPosts();
    }
  }, [user, location]);

  const fetchPinnedPosts = async () => {
    if (!user) return;

    const { data: pins } = await supabase
      .from('pinned_posts')
      .select('id, post_id')
      .eq('pin_location', location)
      .gt('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!pins || pins.length === 0) {
      setPinnedPosts([]);
      setLoading(false);
      return;
    }

    const postIds = pins.map(p => p.post_id);

    const { data: posts } = await supabase
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
      .in('id', postIds);

    if (posts) {
      const orderedPosts = postIds
        .map(id => posts.find(p => p.id === id))
        .filter(Boolean) as Post[];
      setPinnedPosts(orderedPosts);
    }

    setLoading(false);
  };

  if (loading || pinnedPosts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {pinnedPosts.map((post) => (
        <div key={post.id} className="relative">
          <div className="absolute -top-2 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-lg">
            <Pin className="w-3 h-3" />
            <span>Fixado</span>
          </div>
          <div className="pt-2">
            <PostCard post={post} onUpdate={onRefresh} />
          </div>
        </div>
      ))}
    </div>
  );
}
