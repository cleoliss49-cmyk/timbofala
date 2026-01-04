import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Building2, CheckCircle, Briefcase, Users, Image } from 'lucide-react';
import { COMPANY_CATEGORIES, COMPANY_SIZES } from '@/lib/companyCategories';
import { NEIGHBORHOODS } from '@/lib/neighborhoods';
import { CompanyTermsDialog } from '@/components/company/CompanyTermsDialog';

export default function CompanySetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    size: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    city: 'Timbó',
    neighborhood: '',
    address: '',
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkExistingCompany();
  }, [user]);

  const checkExistingCompany = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      navigate('/empresa/painel');
    }
    setCheckingExisting(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(reader.result as string);
      } else {
        setCoverFile(file);
        setCoverPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('companies')
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('companies')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTerms(false);
  };

  const handleTermsDecline = () => {
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name || !formData.category) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e a categoria da empresa.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let logoUrl = null;
      let coverUrl = null;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile, `${user.id}/logo-${Date.now()}`);
      }
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, `${user.id}/cover-${Date.now()}`);
      }

      const slug = generateSlug(formData.name);

      const { error } = await supabase.from('companies').insert({
        user_id: user.id,
        name: formData.name,
        slug,
        description: formData.description || null,
        category: formData.category,
        subcategory: formData.subcategory || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        website: formData.website || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        linkedin: formData.linkedin || null,
        city: formData.city,
        neighborhood: formData.neighborhood || null,
        address: formData.address || null,
        logo_url: logoUrl,
        cover_url: coverUrl,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Nome já existe',
            description: 'Já existe uma empresa com esse nome. Tente outro.',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Empresa cadastrada!',
        description: 'Sua empresa foi cadastrada com sucesso.',
      });

      navigate('/empresa/painel');
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Ocorreu um erro ao cadastrar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <CompanyTermsDialog
        open={showTerms && !termsAccepted}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Cadastrar Empresa</h1>
          <p className="text-muted-foreground mt-2">
            Cadastre sua empresa gratuitamente para publicar vagas e criar seu portfólio
          </p>
          <Badge variant="secondary" className="mt-3 gap-1">
            <CheckCircle className="w-3 h-3" />
            100% Gratuito
          </Badge>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <Briefcase className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold text-sm">Publique Vagas</h3>
              <p className="text-xs text-muted-foreground">Encontre talentos da região</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <Image className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold text-sm">Crie seu Portfólio</h3>
              <p className="text-xs text-muted-foreground">Mostre seus trabalhos</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold text-sm">Conecte-se</h3>
              <p className="text-xs text-muted-foreground">Com a comunidade local</p>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>Dados principais do seu negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da sua empresa"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Porte da Empresa</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData({ ...formData, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o porte" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label} - {size.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva sua empresa, produtos ou serviços..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
              <CardDescription>Logo e capa da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20 rounded-lg">
                      <AvatarImage src={logoPreview || ''} />
                      <AvatarFallback className="rounded-lg bg-primary/10">
                        <Building2 className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'logo')}
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span className="gap-2">
                          <Upload className="w-4 h-4" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capa</Label>
                <div 
                  className="relative h-32 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25"
                  style={coverPreview ? { backgroundImage: `url(${coverPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-background/50 transition-colors">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'cover')}
                    />
                    <Button type="button" variant="secondary" size="sm" asChild>
                      <span className="gap-2">
                        <Upload className="w-4 h-4" />
                        {coverPreview ? 'Alterar capa' : 'Upload da capa'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>Como os candidatos podem entrar em contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(47) 0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(47) 90000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.empresa.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="empresa"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
              <CardDescription>Onde sua empresa está localizada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Timbó"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Select
                    value={formData.neighborhood}
                    onValueChange={(value) => setFormData({ ...formData, neighborhood: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o bairro" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEIGHBORHOODS.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Cadastrar Empresa Gratuitamente
              </>
            )}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
