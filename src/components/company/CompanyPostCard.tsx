import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Share2, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompanyPostCardProps {
  post: {
    id: string;
    content: string | null;
    image_url: string | null;
    created_at: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  onShare?: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function CompanyPostCard({ post, company, onShare }: CompanyPostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [post.id]);

  const fetchLikes = async () => {
    const { data, count } = await supabase
      .from('company_post_likes')
      .select('*', { count: 'exact' })
      .eq('post_id', post.id);

    setLikesCount(count || 0);
    
    if (user && data) {
      setLiked(data.some(like => like.user_id === user.id));
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('company_post_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) {
      // Fetch profile info for each comment
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const commentsWithProfiles = data.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || undefined,
      }));
      
      setComments(commentsWithProfiles as Comment[]);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para curtir.',
        variant: 'destructive',
      });
      return;
    }

    setLikeLoading(true);
    try {
      if (liked) {
        await supabase
          .from('company_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from('company_post_likes')
          .insert({ post_id: post.id, user_id: user.id });
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('company_post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/company/${company.slug}`;
    if (navigator.share) {
      navigator.share({
        title: company.name,
        text: post.content || `Confira esta publicação de ${company.name}`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência.',
      });
    }
    onShare?.();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <Link to={`/company/${company.slug}`}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={company.logo_url || ''} />
              <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <Link to={`/company/${company.slug}`} className="font-semibold hover:underline">
              {company.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </p>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p className="px-4 pb-3 whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Image */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="w-full max-h-[500px] object-cover"
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${liked ? 'text-red-500' : ''}`}
            onClick={handleLike}
            disabled={likeLoading}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {likesCount > 0 && likesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            {comments.length > 0 && comments.length}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="border-t p-4 space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {comment.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                  <Link 
                    to={`/profile/${comment.profiles?.username}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {comment.profiles?.full_name}
                  </Link>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}

            {user && (
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button 
                  size="icon" 
                  onClick={handleComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}