import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, Plus, Trash2, MapPin, ArrowLeft, Save, 
  AlertCircle, CheckCircle, DollarSign, CreditCard, Banknote
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { TIMBO_NEIGHBORHOODS } from '@/lib/neighborhoods';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BusinessProfile {
  id: string;
  business_name: string;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_holder_name: string | null;
  accepts_pix: boolean;
  accepts_card: boolean;
  accepts_cash: boolean;
}

interface DeliveryZone {
  id: string;
  neighborhood: string;
  city: string;
  delivery_fee: number;
  is_active: boolean;
}

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave Aleatória' },
];


export default function BusinessPaymentSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<DeliveryZone | null>(null);

  const [pixData, setPixData] = useState({
    pix_key: '',
    pix_key_type: 'cpf',
    pix_holder_name: ''
  });

  const [paymentMethods, setPaymentMethods] = useState({
    accepts_pix: true,
    accepts_card: false,
    accepts_cash: true
  });

  const [newZone, setNewZone] = useState({
    neighborhood: '',
    delivery_fee: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchBusiness();
    }
  }, [user, authLoading]);

  const fetchBusiness = async () => {
    try {
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('id, business_name, pix_key, pix_key_type, pix_holder_name, accepts_pix, accepts_card, accepts_cash')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (businessError) throw businessError;

      if (!businessData) {
        navigate('/empresa/criar');
        return;
      }

      setBusiness(businessData);
      setPixData({
        pix_key: businessData.pix_key || '',
        pix_key_type: businessData.pix_key_type || 'cpf',
        pix_holder_name: businessData.pix_holder_name || ''
      });
      setPaymentMethods({
        accepts_pix: businessData.accepts_pix ?? true,
        accepts_card: businessData.accepts_card ?? false,
        accepts_cash: businessData.accepts_cash ?? true
      });

      await fetchDeliveryZones(businessData.id);
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryZones = async (businessId: string) => {
    const { data, error } = await supabase
      .from('business_delivery_zones')
      .select('*')
      .eq('business_id', businessId)
      .order('neighborhood');

    if (!error && data) {
      setDeliveryZones(data);
    }
  };

  const savePaymentSettings = async () => {
    if (!business) return;

    if (paymentMethods.accepts_pix && pixData.pix_key && !pixData.pix_holder_name) {
      toast({
        title: 'Nome do titular obrigatório',
        description: 'Informe o nome que aparecerá no PIX',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          pix_key: pixData.pix_key || null,
          pix_key_type: pixData.pix_key_type,
          pix_holder_name: pixData.pix_holder_name || null,
          accepts_pix: paymentMethods.accepts_pix,
          accepts_card: paymentMethods.accepts_card,
          accepts_cash: paymentMethods.accepts_cash
        })
        .eq('id', business.id);

      if (error) throw error;

      toast({
        title: 'Configurações salvas!',
        description: 'Suas formas de pagamento foram atualizadas'
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addDeliveryZone = async () => {
    if (!business) return;

    if (!newZone.neighborhood) {
      toast({
        title: 'Selecione um bairro',
        variant: 'destructive'
      });
      return;
    }

    const fee = parseFloat(newZone.delivery_fee) || 0;

    try {
      const { error } = await supabase
        .from('business_delivery_zones')
        .insert({
          business_id: business.id,
          neighborhood: newZone.neighborhood,
          city: 'Timbó',
          delivery_fee: fee
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Bairro já cadastrado',
            description: 'Este bairro já possui uma taxa configurada',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      toast({ title: 'Bairro adicionado!' });
      setNewZone({ neighborhood: '', delivery_fee: '' });
      await fetchDeliveryZones(business.id);
    } catch (error) {
      console.error('Error adding delivery zone:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o bairro',
        variant: 'destructive'
      });
    }
  };

  const deleteDeliveryZone = async () => {
    if (!zoneToDelete) return;

    try {
      const { error } = await supabase
        .from('business_delivery_zones')
        .delete()
        .eq('id', zoneToDelete.id);

      if (error) throw error;

      setDeliveryZones(prev => prev.filter(z => z.id !== zoneToDelete.id));
      toast({ title: 'Bairro removido!' });
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o bairro',
        variant: 'destructive'
      });
    } finally {
      setZoneToDelete(null);
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!business) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/empresa/gerenciar')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurações de Pagamento</h1>
            <p className="text-muted-foreground">{business.business_name}</p>
          </div>
        </div>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Formas de Pagamento
            </CardTitle>
            <CardDescription>
              Escolha quais formas de pagamento você aceita
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PIX */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">PIX</h3>
                  <p className="text-sm text-muted-foreground">
                    Receba do cliente direto na sua conta. Sem intermediação, sem taxas!
                  </p>
                </div>
              </div>
              <Switch
                checked={paymentMethods.accepts_pix}
                onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, accepts_pix: checked }))}
              />
            </div>

            {/* Card */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Cartão (Débito/Crédito)</h3>
                  <p className="text-sm text-muted-foreground">
                    Cobre na entrega ou retirada usando sua maquininha.
                  </p>
                </div>
              </div>
              <Switch
                checked={paymentMethods.accepts_card}
                onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, accepts_card: checked }))}
              />
            </div>

            {/* Cash */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Dinheiro</h3>
                  <p className="text-sm text-muted-foreground">
                    Cobre na entrega ou retirada em espécie.
                  </p>
                </div>
              </div>
              <Switch
                checked={paymentMethods.accepts_cash}
                onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, accepts_cash: checked }))}
              />
            </div>

            <Separator />

            {/* PIX Configuration (only if accepts_pix is true) */}
            {paymentMethods.accepts_pix && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-600" />
                  Configurar Chave PIX
                </h3>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Importante</AlertTitle>
                  <AlertDescription>
                    Cadastre sua chave PIX para receber pagamentos instantâneos. 
                    <strong> Não intermediamos pagamentos e não cobramos taxas</strong>.
                  </AlertDescription>
                </Alert>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Chave</Label>
                    <Select
                      value={pixData.pix_key_type}
                      onValueChange={(value) => setPixData(prev => ({ ...prev, pix_key_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIX_KEY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input
                      placeholder="Sua chave PIX"
                      value={pixData.pix_key}
                      onChange={(e) => setPixData(prev => ({ ...prev, pix_key: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome do Titular (aparecerá no PIX)</Label>
                  <Input
                    placeholder="Nome completo ou razão social"
                    value={pixData.pix_holder_name}
                    onChange={(e) => setPixData(prev => ({ ...prev, pix_holder_name: e.target.value }))}
                  />
                </div>

                {pixData.pix_key && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    PIX configurado! Os clientes poderão pagar via PIX.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={savePaymentSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Zones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Taxas de Entrega por Bairro
            </CardTitle>
            <CardDescription>
              Configure taxas de entrega diferentes para cada bairro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new zone */}
            <div className="flex gap-2">
              <Select
                value={newZone.neighborhood}
                onValueChange={(value) => setNewZone(prev => ({ ...prev, neighborhood: value }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o bairro" />
                </SelectTrigger>
                <SelectContent>
                  {TIMBO_NEIGHBORHOODS.filter(n => !deliveryZones.some(z => z.neighborhood === n)).map((neighborhood) => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-32">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="pl-9"
                  value={newZone.delivery_fee}
                  onChange={(e) => setNewZone(prev => ({ ...prev, delivery_fee: e.target.value }))}
                />
              </div>
              <Button onClick={addDeliveryZone}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <Separator />

            {/* Zones list */}
            {deliveryZones.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum bairro configurado. A taxa padrão será usada.
              </p>
            ) : (
              <div className="space-y-2">
                {deliveryZones.map((zone) => (
                  <div 
                    key={zone.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{zone.neighborhood}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 font-semibold">
                        R$ {zone.delivery_fee.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setZoneToDelete(zone)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Zone Dialog */}
        <AlertDialog open={!!zoneToDelete} onOpenChange={() => setZoneToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover bairro?</AlertDialogTitle>
              <AlertDialogDescription>
                A taxa de entrega para "{zoneToDelete?.neighborhood}" será removida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteDeliveryZone}>
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
