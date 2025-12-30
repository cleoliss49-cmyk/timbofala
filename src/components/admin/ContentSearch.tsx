import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Trash2, 
  Eye, 
  FileText, 
  MessageCircle, 
  User,
  Calendar,
  Copy,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SearchResult {
  type: 'post' | 'comment' | 'user' | 'product' | 'event';
  id: string;
  content: string;
  author?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  created_at: string;
  extra?: Record<string, any>;
}

interface ContentSearchProps {
  canDeletePosts: boolean;
  canDeleteUsers: boolean;
  onAction?: () => void;
}

export function ContentSearch({ canDeletePosts, canDeleteUsers, onAction }: ContentSearchProps) {
  const { toast } = useToast();
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    
    setSearching(true);
    setResult(null);
    setNotFound(false);

    // Try post
    const { data: post } = await supabase
      .from('posts')
      .select(`*, profiles!posts_user_id_fkey(id, username, full_name, avatar_url)`)
      .eq('id', searchId.trim())
      .maybeSingle();

    if (post) {
      setResult({
        type: 'post',
        id: post.id,
        content: post.content || '[Sem conteúdo de texto]',
        author: post.profiles as any,
        created_at: post.created_at,
        extra: { image_url: post.image_url, feeling: post.feeling }
      });
      setSearching(false);
      return;
    }

    // Try comment
    const { data: comment } = await supabase
      .from('comments')
      .select(`*, profiles!comments_user_id_fkey(id, username, full_name, avatar_url)`)
      .eq('id', searchId.trim())
      .maybeSingle();

    if (comment) {
      setResult({
        type: 'comment',
        id: comment.id,
        content: comment.content,
        author: comment.profiles as any,
        created_at: comment.created_at,
        extra: { post_id: comment.post_id }
      });
      setSearching(false);
      return;
    }

    // Try user/profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', searchId.trim())
      .maybeSingle();

    if (profile) {
      setResult({
        type: 'user',
        id: profile.id,
        content: `${profile.full_name} (@${profile.username})`,
        author: {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        },
        created_at: profile.created_at,
        extra: { neighborhood: profile.neighborhood, city: profile.city, bio: profile.bio }
      });
      setSearching(false);
      return;
    }

    // Try product
    const { data: product } = await supabase
      .from('products')
      .select(`*, profiles!products_user_id_fkey(id, username, full_name, avatar_url)`)
      .eq('id', searchId.trim())
      .maybeSingle();

    if (product) {
      setResult({
        type: 'product',
        id: product.id,
        content: product.title,
        author: product.profiles as any,
        created_at: product.created_at,
        extra: { price: product.price, category: product.category }
      });
      setSearching(false);
      return;
    }

    // Try event
    const { data: event } = await supabase
      .from('events')
      .select(`*, profiles!events_user_id_fkey(id, username, full_name, avatar_url)`)
      .eq('id', searchId.trim())
      .maybeSingle();

    if (event) {
      setResult({
        type: 'event',
        id: event.id,
        content: event.title,
        author: event.profiles as any,
        created_at: event.created_at,
        extra: { location: event.location, event_date: event.event_date }
      });
      setSearching(false);
      return;
    }

    setNotFound(true);
    setSearching(false);
  };

  const handleDelete = async () => {
    if (!result) return;
    
    setDeleting(true);
    let success = false;

    try {
      switch (result.type) {
        case 'post':
          // Notify user
          if (result.author) {
            await supabase.from('notifications').insert({
              user_id: result.author.id,
              type: 'admin_action',
              title: 'Publicação removida',
              message: 'Sua publicação foi removida por violar as diretrizes da comunidade.',
            });
          }
          await supabase.from('posts').delete().eq('id', result.id);
          success = true;
          break;

        case 'comment':
          if (result.author) {
            await supabase.from('notifications').insert({
              user_id: result.author.id,
              type: 'admin_action',
              title: 'Comentário removido',
              message: 'Seu comentário foi removido por violar as diretrizes da comunidade.',
            });
          }
          await supabase.from('comments').delete().eq('id', result.id);
          success = true;
          break;

        case 'product':
          if (result.author) {
            await supabase.from('notifications').insert({
              user_id: result.author.id,
              type: 'admin_action',
              title: 'Produto removido',
              message: 'Seu produto foi removido do marketplace por violar as diretrizes.',
            });
          }
          await supabase.from('products').delete().eq('id', result.id);
          success = true;
          break;

        case 'event':
          if (result.author) {
            await supabase.from('notifications').insert({
              user_id: result.author.id,
              type: 'admin_action',
              title: 'Evento removido',
              message: 'Seu evento foi removido por violar as diretrizes da comunidade.',
            });
          }
          await supabase.from('events').delete().eq('id', result.id);
          success = true;
          break;
      }

      if (success) {
        toast({ title: 'Conteúdo excluído com sucesso' });
        setResult(null);
        setSearchId('');
        onAction?.();
      }
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }

    setDeleting(false);
    setShowDeleteDialog(false);
  };

  const copyId = () => {
    navigator.clipboard.writeText(result?.id || '');
    toast({ title: 'ID copiado!' });
  };

  const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    post: { label: 'Publicação', icon: <FileText className="w-4 h-4" />, color: 'bg-primary' },
    comment: { label: 'Comentário', icon: <MessageCircle className="w-4 h-4" />, color: 'bg-secondary' },
    user: { label: 'Usuário', icon: <User className="w-4 h-4" />, color: 'bg-purple-500' },
    product: { label: 'Produto', icon: <FileText className="w-4 h-4" />, color: 'bg-green-500' },
    event: { label: 'Evento', icon: <Calendar className="w-4 h-4" />, color: 'bg-blue-500' },
  };

  return (
    <>
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5 text-primary" />
            Busca Avançada por ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Cole o ID de qualquer conteúdo..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="font-mono text-sm"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {notFound && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Nenhum conteúdo encontrado com este ID</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-muted rounded-xl space-y-4 animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${typeLabels[result.type].color} flex items-center justify-center text-white`}>
                    {typeLabels[result.type].icon}
                  </div>
                  <div>
                    <Badge variant="outline">{typeLabels[result.type].label}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(result.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={copyId}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  {result.type === 'post' && (
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/post/${result.id}`, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  {result.type === 'user' && (
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/profile/${result.author?.username}`, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {result.author && result.type !== 'user' && (
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={result.author.avatar_url || undefined} />
                    <AvatarFallback className="gradient-primary text-primary-foreground">
                      {result.author.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{result.author.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{result.author.username}</p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-background rounded-lg">
                <p className="text-sm font-medium mb-1">Conteúdo:</p>
                <p className="text-sm text-muted-foreground">{result.content}</p>
                {result.extra?.image_url && (
                  <img src={result.extra.image_url} alt="Imagem" className="mt-2 rounded-lg max-h-40 object-cover" />
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-mono flex-1 truncate">ID: {result.id}</p>
                {(canDeletePosts || (result.type === 'user' && canDeleteUsers)) && result.type !== 'user' && (
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O conteúdo será permanentemente removido e o autor será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
