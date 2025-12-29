import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Facebook, Instagram, Twitter, ImagePlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  onUpdate,
}: EditProfileDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    neighborhood: profile?.neighborhood || '',
    city: profile?.city || '',
    facebook_url: profile?.facebook_url || '',
    instagram_url: profile?.instagram_url || '',
    twitter_url: profile?.twitter_url || '',
    tiktok_url: profile?.tiktok_url || '',
    kwai_url: profile?.kwai_url || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let avatarUrl = profile?.avatar_url;
      let coverUrl = profile?.cover_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}/cover.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, coverFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);

        coverUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio || null,
          neighborhood: formData.neighborhood,
          city: formData.city,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          facebook_url: formData.facebook_url || null,
          instagram_url: formData.instagram_url || null,
          twitter_url: formData.twitter_url || null,
          tiktok_url: formData.tiktok_url || null,
          kwai_url: formData.kwai_url || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas alterações foram salvas.',
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cover Photo */}
            <div className="relative">
              <div 
                className="h-32 rounded-xl bg-muted overflow-hidden cursor-pointer group"
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview || profile?.cover_url ? (
                  <img 
                    src={coverPreview || profile?.cover_url || undefined} 
                    alt="Capa" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full gradient-hero" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-white" />
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </div>

            {/* Avatar */}
            <div className="flex justify-center -mt-12 relative z-10">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-card">
                  <AvatarImage src={avatarPreview || profile?.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-2xl">
                    {formData.full_name.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Conte um pouco sobre você..."
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-3 pt-2">
              <Label className="text-base font-medium">Redes Sociais</Label>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Facebook className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Link do Facebook"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Link do Instagram"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Link do X (Twitter)"
                    value={formData.twitter_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <Input
                    placeholder="Link do TikTok"
                    value={formData.tiktok_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, tiktok_url: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                  </svg>
                  <Input
                    placeholder="Link do Kwai"
                    value={formData.kwai_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, kwai_url: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
