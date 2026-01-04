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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Heart, AlertTriangle } from 'lucide-react';
import { TIMBO_NEIGHBORHOODS } from '@/lib/neighborhoods';

interface PaqueraSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProfile?: any;
  onSave: () => void;
}

export function PaqueraSetupDialog({
  open,
  onOpenChange,
  existingProfile,
  onSave,
}: PaqueraSetupDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    gender: existingProfile?.gender || '',
    looking_for_gender: existingProfile?.looking_for_gender || '',
    sexual_orientation: existingProfile?.sexual_orientation || '',
    hobbies: existingProfile?.hobbies?.join(', ') || '',
    city: existingProfile?.city || profile?.city || '',
    bio: existingProfile?.bio || '',
    age_range_min: existingProfile?.age_range_min || 18,
    age_range_max: existingProfile?.age_range_max || 50,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingProfile?.photo_url || null);
  const [acceptedTerms, setAcceptedTerms] = useState(existingProfile?.accepted_terms || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        gender: existingProfile.gender || '',
        looking_for_gender: existingProfile.looking_for_gender || '',
        sexual_orientation: existingProfile.sexual_orientation || '',
        hobbies: existingProfile.hobbies?.join(', ') || '',
        city: existingProfile.city || '',
        bio: existingProfile.bio || '',
        age_range_min: existingProfile.age_range_min || 18,
        age_range_max: existingProfile.age_range_max || 50,
      });
      setPhotoPreview(existingProfile.photo_url || null);
      setAcceptedTerms(existingProfile.accepted_terms || false);
    }
  }, [existingProfile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!photoPreview && !existingProfile?.photo_url) {
      toast({
        title: 'Foto obrigatória',
        description: 'Por favor, adicione uma foto ao seu perfil.',
        variant: 'destructive',
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: 'Termos obrigatórios',
        description: 'Você precisa aceitar os termos para usar o Paquera.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let photoUrl = existingProfile?.photo_url;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/paquera.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('paquera')
          .upload(fileName, photoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('paquera')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      const hobbiesArray = formData.hobbies
        .split(',')
        .map(h => h.trim())
        .filter(h => h);

      const profileData = {
        user_id: user.id,
        photo_url: photoUrl,
        gender: formData.gender,
        looking_for_gender: formData.looking_for_gender,
        sexual_orientation: formData.sexual_orientation,
        hobbies: hobbiesArray,
        city: formData.city,
        bio: formData.bio || null,
        age_range_min: formData.age_range_min,
        age_range_max: formData.age_range_max,
        accepted_terms: true,
        accepted_terms_at: new Date().toISOString(),
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('paquera_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('paquera_profiles')
          .insert(profileData);

        if (error) throw error;
      }

      toast({
        title: existingProfile ? 'Perfil atualizado!' : 'Perfil criado!',
        description: existingProfile 
          ? 'Seu perfil do Paquera foi atualizado.'
          : 'Agora você pode começar a conhecer pessoas!',
      });

      onSave();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            {existingProfile ? 'Editar perfil do Paquera' : 'Criar perfil do Paquera'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Age warning */}
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-xl text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-300">
                O Paquera é exclusivo para maiores de 18 anos. Ao criar seu perfil, você confirma ter mais de 18 anos.
              </p>
            </div>

            {/* Photo */}
            <div className="flex justify-center">
              <div 
                className="relative w-32 h-32 rounded-2xl overflow-hidden bg-muted cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <Label>Seu gênero *</Label>
              <Select
                value={formData.gender}
                onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Procurando *</Label>
              <Select
                value={formData.looking_for_gender}
                onValueChange={(v) => setFormData(prev => ({ ...prev, looking_for_gender: v }))}
              >
                <SelectTrigger className="relative z-50">
                  <SelectValue placeholder="Gênero que procura" />
                </SelectTrigger>
                <SelectContent className="z-[100]" position="popper" sideOffset={4}>
                  <SelectItem value="male">Homens</SelectItem>
                  <SelectItem value="female">Mulheres</SelectItem>
                  <SelectItem value="other">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Orientação sexual * (privado - apenas para filtros)</Label>
              <Select
                value={formData.sexual_orientation}
                onValueChange={(v) => setFormData(prev => ({ ...prev, sexual_orientation: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heterosexual">Heterossexual</SelectItem>
                  <SelectItem value="homosexual">Homossexual</SelectItem>
                  <SelectItem value="bisexual">Bissexual</SelectItem>
                  <SelectItem value="pansexual">Pansexual</SelectItem>
                  <SelectItem value="asexual">Assexual</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Esta informação NÃO é visível para outros usuários.
              </p>
            </div>

            <div>
              <Label>Bairro *</Label>
              <Select
                value={formData.city}
                onValueChange={(v) => setFormData(prev => ({ ...prev, city: v }))}
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
              <Label>Hobbies (separados por vírgula)</Label>
              <Input
                value={formData.hobbies}
                onChange={(e) => setFormData(prev => ({ ...prev, hobbies: e.target.value }))}
                placeholder="Ex: música, esportes, viagens"
              />
            </div>

            <div>
              <Label>Sobre você</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Conte um pouco sobre você..."
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Idade mínima</Label>
                <Input
                  type="number"
                  min={18}
                  max={99}
                  value={formData.age_range_min}
                  onChange={(e) => {
                    const val = Math.max(18, parseInt(e.target.value) || 18);
                    setFormData(prev => ({ 
                      ...prev, 
                      age_range_min: val,
                      age_range_max: Math.max(val, prev.age_range_max)
                    }));
                  }}
                />
              </div>
              <div>
                <Label>Idade máxima</Label>
                <Input
                  type="number"
                  min={18}
                  max={99}
                  value={formData.age_range_max}
                  onChange={(e) => {
                    const val = Math.max(18, parseInt(e.target.value) || 18);
                    setFormData(prev => ({ 
                      ...prev, 
                      age_range_max: Math.max(val, prev.age_range_min)
                    }));
                  }}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-xl">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aceito os termos e políticas de privacidade
                </label>
                <p className="text-xs text-muted-foreground">
                  Confirmo ter mais de 18 anos e aceito as regras do Paquera. 
                  <strong className="block mt-1">Os primeiros 10 pares/matches são gratuitos.</strong> 
                  Após isso, o acesso ao Paquera custa <strong>R$ 29,90/mês</strong> para uso ilimitado.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.gender || !formData.looking_for_gender || !formData.sexual_orientation || !formData.city}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : existingProfile ? (
                  'Salvar alterações'
                ) : (
                  'Criar perfil'
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
