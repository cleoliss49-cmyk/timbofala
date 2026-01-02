import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Wallet, CreditCard, Banknote, Copy, CheckCircle, 
  Truck, MapPin, MessageCircle
} from 'lucide-react';

interface DeliveryZone {
  id: string;
  neighborhood: string;
  city: string;
  delivery_fee: number;
}

interface BusinessProfile {
  id: string;
  business_name: string;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_holder_name: string | null;
  offers_delivery: boolean;
  delivery_fee: number | null;
  whatsapp: string | null;
}

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
    allows_delivery: boolean;
  };
  quantity: number;
  wants_delivery: boolean;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: BusinessProfile;
  cart: CartItem[];
  onSuccess: () => void;
}

export function CheckoutDialog({ 
  open, 
  onOpenChange, 
  business, 
  cart, 
  onSuccess 
}: CheckoutDialogProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPixCode, setShowPixCode] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  const [formData, setFormData] = useState({
    whatsapp: '',
    address: '',
    neighborhood: '',
    notes: '',
    payment_method: 'cash',
    wants_delivery: false
  });

  useEffect(() => {
    if (open && business) {
      fetchDeliveryZones();
    }
  }, [open, business]);

  const fetchDeliveryZones = async () => {
    const { data, error } = await supabase
      .from('business_delivery_zones')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true);

    if (!error && data) {
      setDeliveryZones(data);
    }
  };

  const getProductPrice = (product: CartItem['product']) => {
    return product.promotional_price || product.price;
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0);
  };

  const calculateDeliveryFee = () => {
    if (!formData.wants_delivery) return 0;
    
    // Check for zone-specific fee
    const zone = deliveryZones.find(z => z.neighborhood === formData.neighborhood);
    if (zone) {
      return zone.delivery_fee;
    }
    
    // Fall back to default fee
    return business.delivery_fee || 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const generatePixCode = (orderNum: string) => {
    // Generate a simple PIX code (in production this would be a proper PIX API)
    if (!business.pix_key) return null;
    
    const holderName = business.pix_holder_name || business.business_name;
    const amount = calculateTotal().toFixed(2);
    const description = `Pedido ${orderNum} - ${profile?.full_name || 'Cliente'}`;
    
    // Simplified PIX copy-paste code format
    return `${business.pix_key}\nValor: R$ ${amount}\nDescrição: ${description}\nRecebedor: ${holderName}`;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para finalizar a compra',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (!formData.whatsapp) {
      toast({
        title: 'WhatsApp obrigatório',
        description: 'Por favor, informe seu WhatsApp para contato',
        variant: 'destructive'
      });
      return;
    }

    if (formData.wants_delivery && !formData.address) {
      toast({
        title: 'Endereço obrigatório',
        description: 'Por favor, informe o endereço completo de entrega',
        variant: 'destructive'
      });
      return;
    }

    if (formData.wants_delivery && deliveryZones.length > 0 && !formData.neighborhood) {
      toast({
        title: 'Bairro obrigatório',
        description: 'Por favor, selecione seu bairro para calcular a entrega',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const newOrderNumber = 'TF' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('business_orders')
        .insert({
          order_number: newOrderNumber,
          business_id: business.id,
          customer_id: user.id,
          subtotal: calculateSubtotal(),
          delivery_fee: calculateDeliveryFee(),
          total: calculateTotal(),
          wants_delivery: formData.wants_delivery,
          delivery_address: formData.wants_delivery ? formData.address : null,
          customer_phone: formData.whatsapp,
          customer_notes: formData.notes || null,
          customer_neighborhood: formData.neighborhood || null,
          payment_method: formData.payment_method,
          payment_status: formData.payment_method === 'pix' ? 'pending' : 'pending',
          pix_code: formData.payment_method === 'pix' ? generatePixCode(newOrderNumber) : null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: getProductPrice(item.product),
        quantity: item.quantity,
        subtotal: getProductPrice(item.product) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('business_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderNumber(newOrderNumber);

      if (formData.payment_method === 'pix' && business.pix_key) {
        setShowPixCode(true);
      } else {
        toast({
          title: '🎉 Pedido realizado!',
          description: `Número do pedido: ${newOrderNumber}`
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar o pedido',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyPixCode = () => {
    const pixCode = generatePixCode(orderNumber);
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
      toast({
        title: 'Código PIX copiado!',
        description: 'Cole em seu app de pagamento',
        duration: 2000
      });
    }
  };

  const openWhatsApp = () => {
    if (business.whatsapp) {
      const message = encodeURIComponent(`Olá! Acabei de fazer o pedido ${orderNumber}. Vou enviar o comprovante do PIX.`);
      window.open(`https://wa.me/55${business.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const finishOrder = () => {
    toast({
      title: '🎉 Pedido realizado!',
      description: `Número do pedido: ${orderNumber}`
    });
    onSuccess();
    onOpenChange(false);
    setShowPixCode(false);
    navigate('/meus-pedidos');
  };

  if (showPixCode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Wallet className="w-5 h-5" />
              Pagamento PIX
            </DialogTitle>
            <DialogDescription>
              Copie o código abaixo e cole no seu aplicativo de pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {calculateTotal().toFixed(2)}
                  </p>
                </div>

                <Separator />

                <div className="bg-muted/50 p-3 rounded-lg font-mono text-sm break-all">
                  <p><strong>Chave PIX:</strong> {business.pix_key}</p>
                  <p><strong>Pedido:</strong> {orderNumber}</p>
                  <p><strong>Cliente:</strong> {profile?.full_name}</p>
                </div>

                <Button 
                  onClick={copyPixCode} 
                  className="w-full gap-2"
                  variant={pixCopied ? "secondary" : "default"}
                >
                  {pixCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar código PIX
                    </>
                  )}
                </Button>

                {business.whatsapp && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50"
                    onClick={openWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar comprovante via WhatsApp
                  </Button>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Após efetuar o pagamento, aguarde a confirmação da empresa.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={finishOrder} className="w-full">
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Pedido</DialogTitle>
          <DialogDescription>
            Preencha seus dados para enviar o pedido para {business.business_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-600" />
              WhatsApp para contato *
            </Label>
            <Input
              id="whatsapp"
              placeholder="(00) 00000-0000"
              value={formData.whatsapp}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
            />
          </div>

          {/* Delivery Options */}
          {business.offers_delivery && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Tipo de pedido
              </Label>
              <RadioGroup
                value={formData.wants_delivery ? 'delivery' : 'pickup'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  wants_delivery: value === 'delivery' 
                }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="cursor-pointer">Retirar no local</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="cursor-pointer">Entrega</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Delivery Address */}
          {formData.wants_delivery && (
            <div className="space-y-4">
              {deliveryZones.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="neighborhood" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Bairro *
                  </Label>
                  <Select
                    value={formData.neighborhood}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, neighborhood: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu bairro" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.neighborhood}>
                          {zone.neighborhood} - R$ {zone.delivery_fee.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">Endereço completo *</Label>
                <Textarea
                  id="address"
                  placeholder="Rua, número, complemento..."
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Forma de pagamento
            </Label>
            <RadioGroup
              value={formData.payment_method}
              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="cursor-pointer flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-600" />
                  PIX
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="cursor-pointer flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Cartão
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="cursor-pointer flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Dinheiro
                </Label>
              </div>
            </RadioGroup>
            
            {formData.payment_method === 'pix' && !business.pix_key && (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                Esta empresa ainda não configurou o PIX. Selecione outro método.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Alguma observação sobre o pedido..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Order Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
                  </span>
                  <span>R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
                {calculateDeliveryFee() > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa de entrega</span>
                    <span>R$ {calculateDeliveryFee().toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">R$ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || (formData.payment_method === 'pix' && !business.pix_key)}
          >
            {submitting ? 'Enviando...' : 'Confirmar Pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
