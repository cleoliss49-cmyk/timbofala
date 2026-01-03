import { useState, useRef, useEffect } from 'react';
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
import { Camera, Loader2, Facebook, Instagram, Twitter, ImagePlus, Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { TIMBO_NEIGHBORHOODS } from '@/lib/neighborhoods';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const relationshipOptions = [
  { value: 'single', label: 'Solteiro(a)' },
  { value: 'married', label: 'Casado(a)' },
  { value: 'dating', label: 'Namorando' },
  { value: 'widowed', label: 'Viúvo(a)' },
  { value: 'complicated', label: 'Em relacionamento complicado' },
  { value: 'prefer_not_to_say', label: 'Prefiro não informar' },
];

const genderOptions = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'non_binary', label: 'Não-binário' },
  { value: 'other', label: 'Outro' },
  { value: 'prefer_not_to_say', label: 'Prefiro não informar' },
];

export function EditProfileDialog({
  open,
  onOpenChange,
  onUpdate,
}: EditProfileDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    neighborhood: '',
    city: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    tiktok_url: '',
    kwai_url: '',
    relationship_status: '',
    birth_date: null as Date | null,
    gender: '',
    languages: '',
    education: '',
    profession: '',
    show_relationship_status: true,
    show_birth_date: true,
    show_languages: true,
    show_education: true,
    show_profession: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && open) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        facebook_url: profile.facebook_url || '',
        instagram_url: profile.instagram_url || '',
        twitter_url: profile.twitter_url || '',
        tiktok_url: profile.tiktok_url || '',
        kwai_url: profile.kwai_url || '',
        relationship_status: profile.relationship_status || '',
        birth_date: profile.birth_date ? new Date(profile.birth_date) : null,
        gender: profile.gender || '',
        languages: profile.languages?.join(', ') || '',
        education: profile.education || '',
        profession: profile.profession || '',
        show_relationship_status: profile.show_relationship_status !== false,
        show_birth_date: profile.show_birth_date !== false,
        show_languages: profile.show_languages !== false,
        show_education: profile.show_education !== false,
        show_profession: profile.show_profession !== false,
      });
      setAvatarPreview(null);
      setCoverPreview(null);
      setAvatarFile(null);
      setCoverFile(null);
    }
  }, [profile, open]);

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

      const languagesArray = formData.languages
        ? formData.languages.split(',').map(l => l.trim()).filter(Boolean)
        : null;

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
          relationship_status: formData.relationship_status || null,
          birth_date: formData.birth_date ? format(formData.birth_date, 'yyyy-MM-dd') : null,
          gender: formData.gender || null,
          languages: languagesArray,
          education: formData.education || null,
          profession: formData.profession || null,
          show_relationship_status: formData.show_relationship_status,
          show_birth_date: formData.show_birth_date,
          show_languages: formData.show_languages,
          show_education: formData.show_education,
          show_profession: formData.show_profession,
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
                <Select
                  value={formData.neighborhood}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, neighborhood: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu bairro" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMBO_NEIGHBORHOODS.map((neighborhood) => (
                      <SelectItem key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Personal Details Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <Label className="text-base font-medium">Informações Pessoais</Label>
              
              {/* Gender */}
              <div>
                <Label htmlFor="gender">Gênero</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Relationship Status with visibility toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Status de relacionamento</Label>
                  <div className="flex items-center gap-2">
                    {formData.show_relationship_status ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={formData.show_relationship_status}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_relationship_status: checked }))}
                    />
                  </div>
                </div>
                <Select
                  value={formData.relationship_status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu status" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Birth Date with visibility toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Data de nascimento</Label>
                  <div className="flex items-center gap-2">
                    {formData.show_birth_date ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={formData.show_birth_date}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_birth_date: checked }))}
                    />
                  </div>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.birth_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birth_date ? (
                        format(formData.birth_date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birth_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, birth_date: date || null }))}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Languages with visibility toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="languages">Idiomas falados</Label>
                  <div className="flex items-center gap-2">
                    {formData.show_languages ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={formData.show_languages}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_languages: checked }))}
                    />
                  </div>
                </div>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) => setFormData(prev => ({ ...prev, languages: e.target.value }))}
                  placeholder="Português, Inglês, Espanhol..."
                />
                <p className="text-xs text-muted-foreground">Separe os idiomas por vírgula</p>
              </div>

              {/* Education with visibility toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="education">Escolaridade / Formação</Label>
                  <div className="flex items-center gap-2">
                    {formData.show_education ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={formData.show_education}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_education: checked }))}
                    />
                  </div>
                </div>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                  placeholder="Ex: Ensino Superior em Administração"
                />
              </div>

              {/* Profession with visibility toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="profession">Profissão / Ocupação</Label>
                  <div className="flex items-center gap-2">
                    {formData.show_profession ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={formData.show_profession}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_profession: checked }))}
                    />
                  </div>
                </div>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                  placeholder="Ex: Desenvolvedor de Software"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-3 pt-4 border-t border-border">
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
