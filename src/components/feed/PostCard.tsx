import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, MoreHorizontal, Flag, Trash2, Send, Bookmark, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportDialog } from '@/components/dialogs/ReportDialog';
import { ShareDialog } from '@/components/dialogs/ShareDialog';
import { PollDisplay } from './PollDisplay';
import { AuctionDisplay } from './AuctionDisplay';

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

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
  onRefresh?: () => void;
}

export function PostCard({ post, onUpdate, onRefresh }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isLiked = post.reactions.some(r => r.user_id === user?.id);
  const isOwner = post.user_id === user?.id;

  const handleUpdate = () => {
    onUpdate?.();
    onRefresh?.();
  };

  // Check if post is saved
  useEffect(() => {
    if (user) {
      supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .maybeSingle()
        .then(({ data }) => {
          setIsSaved(!!data);
        });
    }
  }, [user, post.id]);

  const handleSave = async () => {
    if (!user) return;

    try {
      if (isSaved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
        setIsSaved(false);
        toast({ title: 'Publicação removida dos salvos' });
      } else {
        await supabase.from('saved_posts').insert({
          user_id: user.id,
          post_id: post.id,
        });
        setIsSaved(true);
        toast({ title: 'Publicação salva!' });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a publicação.',
        variant: 'destructive',
      });
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('reactions').insert({
          post_id: post.id,
          user_id: user.id,
          reaction_type: 'like',
        });
      }
      handleUpdate();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível reagir à publicação.',
        variant: 'destructive',
      });
    }
  };

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);

    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data);
    }
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!user || !commentContent.trim()) return;

    try {
      await supabase.from('comments').insert({
        post_id: post.id,
        user_id: user.id,
        content: commentContent.trim(),
      });

      setCommentContent('');
      loadComments();
      handleUpdate();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível comentar.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;

    try {
      await supabase.from('posts').delete().eq('id', post.id);
      toast({
        title: 'Publicação excluída',
        description: 'Sua publicação foi removida.',
      });
      handleUpdate();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a publicação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <article className="bg-card rounded-2xl shadow-card border border-border overflow-hidden animate-fade-in group/post">
        {/* Header with ID tooltip */}
        <div className="p-4 md:p-6 relative">
          <div className="absolute top-2 right-2 opacity-0 group-hover/post:opacity-100 transition-opacity">
            <button
              onClick={() => {
                navigator.clipboard.writeText(post.id);
                toast({ title: 'ID copiado!' });
              }}
              className="text-[10px] px-1.5 py-0.5 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              title={post.id}
            >
              id
            </button>
          </div>
          <div className="flex items-start justify-between">
            <Link
              to={`/profile/${post.profiles.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-10 h-10 md:w-12 md:h-12">
                <AvatarImage src={post.profiles.avatar_url || undefined} />
                <AvatarFallback className="gradient-secondary text-secondary-foreground">
                  {post.profiles.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{post.profiles.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  @{post.profiles.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                    <Flag className="w-4 h-4 mr-2" />
                    Denunciar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          {post.content && (
            <p className="mt-4 text-foreground whitespace-pre-wrap">{post.content}</p>
          )}

          {/* Poll Display */}
          <PollDisplay postId={post.id} />

          {/* Auction Display */}
          <AuctionDisplay postId={post.id} isOwner={isOwner} />
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="relative">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full object-cover max-h-[500px]"
            />
          </div>
        )}

        {/* Actions */}
        <div className="px-4 md:px-6 py-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                {post.reactions.length > 0 && post.reactions.length}
              </button>

              <button
                onClick={toggleComments}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                {post.comments.length > 0 && post.comments.length}
              </button>
              <button
                onClick={() => setShowShareDialog(true)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSave}
              className={`text-sm font-medium transition-colors ${
                isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="px-4 md:px-6 pb-4 border-t border-border pt-4 space-y-4">
            {/* Comment input */}
            <div className="flex gap-3">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Escreva um comentário..."
                className="min-h-[60px] text-sm"
              />
              <Button
                onClick={handleComment}
                disabled={!commentContent.trim()}
                size="icon"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={comment.profiles.avatar_url || undefined} />
                    <AvatarFallback className="text-xs gradient-secondary text-secondary-foreground">
                      {comment.profiles.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted rounded-xl p-3">
                    <Link
                      to={`/profile/${comment.profiles.username}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {comment.profiles.full_name}
                    </Link>
                    <p className="text-sm text-foreground mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportedUserId={post.profiles.id}
        reportedPostId={post.id}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        postId={post.id}
        postContent={post.content}
      />
    </>
  );
}
