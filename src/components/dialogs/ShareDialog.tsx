import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Check, MessageCircle, Send } from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent?: string | null;
}

export function ShareDialog({ open, onOpenChange, postId, postContent }: ShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareText = postContent 
    ? `${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`
    : 'Confira esta publicação no Timbó Fala!';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast({ title: 'Link copiado!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Timbó Fala',
          text: shareText,
          url: postUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Compartilhar publicação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy link */}
          <div className="flex gap-2">
            <Input
              value={postUrl}
              readOnly
              className="text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Share options */}
          <div className="grid grid-cols-2 gap-2">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                className="gap-2"
                onClick={() => handleShare(option.url)}
              >
                <option.icon className="w-4 h-4" />
                {option.name}
              </Button>
            ))}
          </div>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              variant="default"
              className="w-full gradient-primary text-white"
              onClick={handleNativeShare}
            >
              <Send className="w-4 h-4 mr-2" />
              Mais opções de compartilhamento
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
