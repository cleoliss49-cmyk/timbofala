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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, CreditCard, Banknote, Loader2,
  Truck, MapPin, MessageCircle, AlertCircle
} from 'lucide-react';
import { PixPaymentDialog } from './PixPaymentDialog';

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
  estimated_prep_time_minutes: number | null;
}

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
    allows_delivery: boolean;
    accepts_pix?: boolean;
    accepts_cash?: boolean;
    accepts_debit?: boolean;
    accepts_credit?: boolean;
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
  const [submitting, setSubmitting] = useState(false);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{
    id: string;
    orderNumber: string;
    total: number;
    productNames: string[];
  } | null>(null);
  
  const [formData, setFormData] = useState({
    whatsapp: '',
    address: '',
    neighborhood: '',
    notes: '',
    payment_method: 'cash',
    wants_delivery: false
  });

  // Determine available payment methods based on products
  // Regras: PIX pode ser online; dinheiro/débito/crédito são apenas para retirada/no local.
  const availablePaymentMethods = {
    pix: cart.every(item => item.product.accepts_pix !== false) && !!business.pix_key,
    cash: !formData.wants_delivery && cart.every(item => item.product.accepts_cash !== false),
    debit: !formData.wants_delivery && cart.every(item => item.product.accepts_debit !== false),
    credit: !formData.wants_delivery && cart.every(item => item.product.accepts_credit !== false)
  };

  useEffect(() => {
    if (open && business) {
      fetchDeliveryZones();

      // Se virou delivery, força PIX (pagamento online)
      if (formData.wants_delivery) {
        if (availablePaymentMethods.pix && formData.payment_method !== 'pix') {
          setFormData(prev => ({ ...prev, payment_method: 'pix' }));
        }
        return;
      }

      // Retirada/no local: escolhe o primeiro disponível
      if (availablePaymentMethods.cash) setFormData(prev => ({ ...prev, payment_method: 'cash' }));
      else if (availablePaymentMethods.pix) setFormData(prev => ({ ...prev, payment_method: 'pix' }));
      else if (availablePaymentMethods.debit) setFormData(prev => ({ ...prev, payment_method: 'debit' }));
      else if (availablePaymentMethods.credit) setFormData(prev => ({ ...prev, payment_method: 'credit' }));
    }
  }, [open, business, formData.wants_delivery]);

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
    
    const zone = deliveryZones.find(z => z.neighborhood === formData.neighborhood);
    if (zone) return zone.delivery_fee;
    
    return business.delivery_fee || 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
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
          payment_status: formData.payment_method === 'pix' ? 'awaiting_payment' : 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

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

      // If PIX payment, show PIX dialog
      if (formData.payment_method === 'pix' && business.pix_key) {
        setCreatedOrder({
          id: order.id,
          orderNumber: newOrderNumber,
          total: calculateTotal(),
          productNames: cart.map(item => item.product.name)
        });
        onOpenChange(false);
        setShowPixPayment(true);
      } else {
        // For cash/card, just complete
        toast({
          title: '🎉 Pedido realizado!',
          description: `Pedido ${newOrderNumber} - ${
            formData.payment_method === 'cash' ? 'Pagamento em dinheiro na entrega' :
            formData.payment_method === 'debit' ? 'Pagamento no débito na entrega' :
            'Pagamento no crédito na entrega'
          }`
        });
        onSuccess();
        onOpenChange(false);
        navigate('/meus-pedidos');
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

  const handlePixSuccess = () => {
    onSuccess();
    navigate('/meus-pedidos');
  };

  return (
    <>
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
                className="grid grid-cols-2 gap-2"
              >
                {availablePaymentMethods.pix && (
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer flex items-center gap-2 flex-1">
                      <Wallet className="w-4 h-4 text-green-600" />
                      PIX
                    </Label>
                  </div>
                )}
                {availablePaymentMethods.cash && (
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer flex items-center gap-2 flex-1">
                      <Banknote className="w-4 h-4" />
                      Dinheiro
                    </Label>
                  </div>
                )}
                {availablePaymentMethods.debit && (
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="debit" id="debit" />
                    <Label htmlFor="debit" className="cursor-pointer flex items-center gap-2 flex-1">
                      <CreditCard className="w-4 h-4" />
                      Débito
                    </Label>
                  </div>
                )}
                {availablePaymentMethods.credit && (
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="credit" id="credit" />
                    <Label htmlFor="credit" className="cursor-pointer flex items-center gap-2 flex-1">
                      <CreditCard className="w-4 h-4" />
                      Crédito
                    </Label>
                  </div>
                )}
              </RadioGroup>
              
              {formData.payment_method === 'pix' && (
                <Alert className="border-green-200 bg-green-50">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-xs">
                    Você receberá um QR Code PIX para pagamento imediato
                  </AlertDescription>
                </Alert>
              )}

              {['cash', 'debit', 'credit'].includes(formData.payment_method) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Dinheiro, débito e crédito são pagos <strong>apenas na retirada/no local</strong>.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Alguma informação adicional para a loja..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <Separator />

            {/* Estimated Time Info */}
            {business.estimated_prep_time_minutes && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tempo estimado</p>
                  <p className="text-xs text-muted-foreground">
                    {business.estimated_prep_time_minutes < 60 
                      ? `${business.estimated_prep_time_minutes} minutos`
                      : `${Math.floor(business.estimated_prep_time_minutes / 60)}h${business.estimated_prep_time_minutes % 60 > 0 ? business.estimated_prep_time_minutes % 60 : ''}`
                    }
                    {formData.wants_delivery ? ' para entrega' : ' para retirada'}
                  </p>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} itens)</span>
                <span>R$ {calculateSubtotal().toFixed(2)}</span>
              </div>
              {formData.wants_delivery && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>R$ {calculateDeliveryFee().toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="w-full sm:w-auto gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : formData.payment_method === 'pix' ? (
                <>
                  <Wallet className="w-4 h-4" />
                  Pagar com PIX
                </>
              ) : (
                'Confirmar Pedido'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIX Payment Dialog */}
      {createdOrder && (
        <PixPaymentDialog
          open={showPixPayment}
          onOpenChange={setShowPixPayment}
          orderId={createdOrder.id}
          orderNumber={createdOrder.orderNumber}
          total={createdOrder.total}
          pixKey={business.pix_key!}
          pixKeyType={(business.pix_key_type || 'cpf') as any}
          holderName={business.pix_holder_name || business.business_name}
          businessName={business.business_name}
          businessWhatsapp={business.whatsapp || undefined}
          customerName={profile?.full_name || 'Cliente'}
          productNames={createdOrder.productNames}
          onSuccess={handlePixSuccess}
        />
      )}
    </>
  );
}
