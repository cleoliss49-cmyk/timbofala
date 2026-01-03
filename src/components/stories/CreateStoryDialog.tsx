import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video, Image, X, Loader2 } from 'lucide-react';

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryCreated: () => void;
}

export function CreateStoryDialog({ open, onOpenChange, onStoryCreated }: CreateStoryDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [durationHours, setDurationHours] = useState('24');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione uma imagem ou vídeo.',
        variant: 'destructive',
      });
      return;
    }

    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      toast({
        title: 'Mídia obrigatória',
        description: 'Selecione uma imagem ou vídeo para o story.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upload media
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, mediaFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(durationHours));

      // Create story
      const { error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption,
          title,
          target_audience: targetAudience,
          duration_hours: parseInt(durationHours),
          expires_at: expiresAt.toISOString(),
        });

      if (storyError) throw storyError;

      toast({
        title: 'Story publicado!',
        description: 'Seu story está no ar.',
      });

      // Reset form
      setTitle('');
      setCaption('');
      setTargetAudience('all');
      setDurationHours('24');
      removeMedia();
      onStoryCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating story:', error);
      toast({
        title: 'Erro ao publicar',
        description: error.message || 'Não foi possível criar o story.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            Publicar Story Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Título (opcional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do story"
            />
          </div>

          {/* Media Upload */}
          <div>
            <Label>Mídia (imagem ou vídeo)</Label>
            {!mediaPreview ? (
              <div
                className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex justify-center gap-4 mb-2">
                  <Image className="w-8 h-8 text-muted-foreground" />
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Clique para selecionar</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="relative mt-2 rounded-lg overflow-hidden">
                {mediaType === 'video' ? (
                  <video
                    src={mediaPreview}
                    className="w-full max-h-64 object-cover rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeMedia}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <Label htmlFor="caption">Legenda (opcional)</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione uma legenda..."
              rows={2}
            />
          </div>

          {/* Target Audience */}
          <div>
            <Label>Público-alvo</Label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="women">Apenas mulheres</SelectItem>
                <SelectItem value="men">Apenas homens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div>
            <Label>Duração</Label>
            <Select value={durationHours} onValueChange={setDurationHours}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 horas</SelectItem>
                <SelectItem value="12">12 horas</SelectItem>
                <SelectItem value="24">24 horas</SelectItem>
                <SelectItem value="48">48 horas</SelectItem>
                <SelectItem value="72">72 horas (3 dias)</SelectItem>
                <SelectItem value="168">168 horas (7 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit} 
            disabled={uploading || !mediaFile}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Publicar Story
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
