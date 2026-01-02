import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, Upload, MapPin, Phone, Mail, Globe, 
  Instagram, Facebook, Truck, ArrowRight, Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'moda', label: 'Moda e Vestuário' },
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'casa', label: 'Casa e Decoração' },
  { value: 'beleza', label: 'Beleza e Cosméticos' },
  { value: 'esportes', label: 'Esportes e Lazer' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outros', label: 'Outros' },
];

export default function BusinessSetup() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    business_name: '',
    slug: '',
    description: '',
    category: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: 'Timbó',
    neighborhood: '',
    website: '',
    instagram: '',
    facebook: '',
    offers_delivery: false,
    delivery_fee: '',
    min_order_value: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      checkExistingBusiness();
    }
  }, [user, authLoading]);

  const checkExistingBusiness = async () => {
    try {
      const { data } = await supabase
        .from('business_profiles')
        .select('slug')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) {
        navigate('/empresa/gerenciar');
      }
    } catch (error) {
      console.error('Error checking business:', error);
    } finally {
      setChecking(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      business_name: name,
      slug: generateSlug(name)
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('business')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('business')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name || !formData.category) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e categoria da empresa',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      let logo_url = null;
      let cover_url = null;

      if (logoFile) {
        logo_url = await uploadImage(logoFile, `${user!.id}/logo`);
      }
      if (coverFile) {
        cover_url = await uploadImage(coverFile, `${user!.id}/cover`);
      }

      const { error } = await supabase
        .from('business_profiles')
        .insert({
          user_id: user!.id,
          business_name: formData.business_name,
          slug: formData.slug,
          description: formData.description || null,
          category: formData.category,
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city,
          neighborhood: formData.neighborhood || null,
          website: formData.website || null,
          instagram: formData.instagram || null,
          facebook: formData.facebook || null,
          offers_delivery: formData.offers_delivery,
          delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : null,
          min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
          logo_url,
          cover_url
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'URL já existe',
            description: 'Este nome de empresa já está em uso. Tente outro.',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Conta empresarial criada!',
        description: 'Sua loja está pronta. Agora adicione seus produtos.'
      });

      navigate('/empresa/gerenciar');
    } catch (error) {
      console.error('Error creating business:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar sua conta empresarial',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checking) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Criar Conta Empresarial</h1>
          <p className="text-muted-foreground">
            Configure sua vitrine e comece a vender para toda a comunidade de Timbó
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
              <CardDescription>Dados principais da sua empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business_name">Nome da Empresa *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Padaria do João"
                />
                {formData.slug && (
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: timbofala.com/empresa/{formData.slug}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva sua empresa e o que você oferece..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Imagens</CardTitle>
              <CardDescription>Logo e capa da sua loja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo</Label>
                  <label className="block mt-1 cursor-pointer">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'logo')}
                    />
                  </label>
                </div>

                <div>
                  <Label>Capa</Label>
                  <label className="block mt-1 cursor-pointer">
                    <div className="w-full h-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                      {coverPreview ? (
                        <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'cover')}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contato</CardTitle>
              <CardDescription>Como os clientes podem entrar em contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-9"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(47) 3333-3333"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      className="pl-9"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="(47) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="website"
                    className="pl-9"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.suaempresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      className="pl-9"
                      value={formData.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="@seuinstagram"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="facebook"
                      className="pl-9"
                      value={formData.facebook}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="URL do Facebook"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço completo</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="address"
                    className="pl-9"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, complemento..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Oferece entrega?</Label>
                  <p className="text-xs text-muted-foreground">Ative se você entrega os produtos</p>
                </div>
                <Switch
                  checked={formData.offers_delivery}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, offers_delivery: checked }))}
                />
              </div>

              {formData.offers_delivery && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delivery_fee">Taxa de entrega (R$)</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_order">Pedido mínimo (R$)</Label>
                    <Input
                      id="min_order"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_order_value: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                Criar Conta Empresarial
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
