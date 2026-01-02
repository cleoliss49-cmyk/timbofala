import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingBag, Package, Truck, Clock, CheckCircle, 
  XCircle, Store, ChefHat, ArrowLeft, RefreshCw, 
  Upload, Eye, MessageCircle, Wallet, CreditCard,
  Banknote, Image, FileText, Loader2, ExternalLink
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  receipt_url: string | null;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  wants_delivery: boolean;
  delivery_address: string | null;
  customer_phone: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  estimated_time_minutes: number | null;
  business: {
    id: string;
    business_name: string;
    slug: string;
    logo_url: string | null;
    whatsapp: string | null;
    pix_key: string | null;
    pix_key_type: string | null;
    pix_holder_name: string | null;
  };
  items: OrderItem[];
}

const ORDER_STATUS = [
  { value: 'pending', label: 'Pedido Realizado', icon: Clock, emoji: '🕒', description: 'Aguardando confirmação da loja' },
  { value: 'awaiting_payment', label: 'Aguardando Pagamento', icon: Wallet, emoji: '💰', description: 'Efetue o pagamento PIX' },
  { value: 'pending_confirmation', label: 'Comprovante Enviado', icon: FileText, emoji: '📎', description: 'Aguardando confirmação do pagamento' },
  { value: 'confirmed', label: 'Pagamento Confirmado', icon: CheckCircle, emoji: '✅', description: 'Pagamento recebido' },
  { value: 'preparing', label: 'Preparando', icon: ChefHat, emoji: '🍳', description: 'Seu pedido está sendo preparado' },
  { value: 'ready', label: 'Pronto', icon: Package, emoji: '📦', description: 'Pronto para retirada/entrega' },
  { value: 'delivered', label: 'Entregue', icon: CheckCircle, emoji: '🚚', description: 'Pedido finalizado' },
  { value: 'cancelled', label: 'Cancelado', icon: XCircle, emoji: '❌', description: 'Pedido cancelado' }
];

const PAYMENT_METHODS = {
  pix: { label: 'PIX', icon: Wallet, color: 'text-green-600' },
  cash: { label: 'Dinheiro', icon: Banknote, color: 'text-yellow-600' },
  debit: { label: 'Débito', icon: CreditCard, color: 'text-blue-600' },
  credit: { label: 'Crédito', icon: CreditCard, color: 'text-purple-600' }
};

export default function MyOrders() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptToView, setReceiptToView] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchOrders();
      setupRealtimeSubscription();
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('business_orders')
        .select('*')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: business } = await supabase
            .from('business_profiles')
            .select('id, business_name, slug, logo_url, whatsapp, pix_key, pix_key_type, pix_holder_name')
            .eq('id', order.business_id)
            .single();

          const { data: items } = await supabase
            .from('business_order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            receipt_url: (order as any).receipt_url || null,
            estimated_time_minutes: (order as any).estimated_time_minutes || null,
            business: business || { id: '', business_name: 'Loja', slug: '', logo_url: null, whatsapp: null, pix_key: null, pix_key_type: null, pix_holder_name: null },
            items: items || []
          } as Order;
        })
      );

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('my-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_orders',
          filter: `customer_id=eq.${user!.id}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUS.find(s => s.value === status) || ORDER_STATUS[0];
  };

  const getPaymentInfo = (method: string | null) => {
    if (!method) return null;
    return PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS];
  };

  const handleUploadReceipt = async (file: File) => {
    if (!selectedOrder) return;

    setUploadingReceipt(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${selectedOrder.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('business_orders')
        .update({
          receipt_url: publicUrl,
          receipt_uploaded_at: new Date().toISOString(),
          payment_status: 'pending_confirmation'
        })
        .eq('id', selectedOrder.id);

      if (updateError) throw updateError;

      toast({
        title: '✅ Comprovante enviado!',
        description: 'Aguarde a confirmação do pagamento'
      });

      fetchOrders();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar o comprovante',
        variant: 'destructive'
      });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('business_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user!.id
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: 'Pedido cancelado',
        description: 'Seu pedido foi cancelado'
      });

      setShowCancelDialog(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o pedido',
        variant: 'destructive'
      });
    }
  };

  const openWhatsApp = (order: Order) => {
    if (order.business.whatsapp) {
      const message = encodeURIComponent(
        `Olá! Tenho uma dúvida sobre meu pedido ${order.order_number}.`
      );
      window.open(`https://wa.me/55${order.business.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const activeOrders = orders.filter(o => 
    !['delivered', 'cancelled'].includes(o.status)
  );
  
  const completedOrders = orders.filter(o => 
    ['delivered', 'cancelled'].includes(o.status)
  );

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Meus Pedidos</h1>
              <p className="text-sm text-muted-foreground">{orders.length} pedidos realizados</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h3>
              <p className="text-muted-foreground mb-6">
                Seus pedidos de lojas aparecerão aqui
              </p>
              <Button onClick={() => navigate('/empresas')}>
                <Store className="w-4 h-4 mr-2" />
                Explorar Lojas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Em Andamento
                {activeOrders.length > 0 && (
                  <Badge className="ml-2 h-5 px-1.5" variant="secondary">
                    {activeOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">Finalizados</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-3">
              {activeOrders.length === 0 ? (
                <Card className="py-8">
                  <CardContent className="text-center text-muted-foreground">
                    Nenhum pedido em andamento
                  </CardContent>
                </Card>
              ) : (
                activeOrders.map(order => <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />)
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4 space-y-3">
              {completedOrders.length === 0 ? (
                <Card className="py-8">
                  <CardContent className="text-center text-muted-foreground">
                    Nenhum pedido finalizado
                  </CardContent>
                </Card>
              ) : (
                completedOrders.map(order => <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />)
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono">{selectedOrder?.order_number}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedOrder && new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 pb-4">
                  {/* Visual Timeline */}
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium mb-4">Acompanhe seu pedido</p>
                      <div className="relative">
                        {ORDER_STATUS.filter(s => !['cancelled', 'awaiting_payment', 'pending_confirmation'].includes(s.value) || 
                          [selectedOrder.status, selectedOrder.payment_status].includes(s.value))
                          .slice(0, -1)
                          .map((status, index, arr) => {
                          const isActive = getStatusIndex(selectedOrder.status, selectedOrder.payment_status) >= index;
                          const isCurrent = isCurrentStatus(selectedOrder.status, selectedOrder.payment_status, status.value);

                          return (
                            <div key={status.value} className="flex items-start gap-3 pb-4 last:pb-0">
                              <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                  isActive 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                  {status.emoji}
                                </div>
                                {index < arr.length - 1 && (
                                  <div className={`w-0.5 h-8 ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                )}
                              </div>
                              <div className={`pt-2 ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                                <p className="text-sm">{status.label}</p>
                                {isCurrent && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{status.description}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Actions */}
                  {(selectedOrder.payment_status === 'awaiting_payment' || selectedOrder.status === 'awaiting_payment') && 
                    selectedOrder.payment_method === 'pix' && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                          <Wallet className="w-5 h-5" />
                          Pagamento Pendente
                        </div>
                        <p className="text-sm text-green-800">
                          Efetue o pagamento PIX e envie o comprovante
                        </p>
                        <label className="block">
                          <Button className="w-full gap-2" disabled={uploadingReceipt}>
                            {uploadingReceipt ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            Enviar Comprovante
                          </Button>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadReceipt(file);
                            }}
                          />
                        </label>
                      </CardContent>
                    </Card>
                  )}

                  {/* Receipt Sent Status */}
                  {selectedOrder.payment_status === 'pending_confirmation' && selectedOrder.receipt_url && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <FileText className="w-5 h-5" />
                            <span className="font-medium">Comprovante em Análise</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setReceiptToView(selectedOrder.receipt_url)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Business Info */}
                  <Link to={`/empresa/${selectedOrder.business.slug}`}>
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-3 flex items-center gap-3">
                        {selectedOrder.business.logo_url ? (
                          <img 
                            src={selectedOrder.business.logo_url} 
                            alt={selectedOrder.business.business_name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{selectedOrder.business.business_name}</p>
                          <p className="text-xs text-muted-foreground">Ver loja</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Order Details */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Itens do Pedido</p>
                      <div className="space-y-1.5">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.product_name}</span>
                            <span className="font-medium">R$ {item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm text-muted-foreground">Forma de Pagamento</span>
                      {getPaymentInfo(selectedOrder.payment_method) && (
                        <div className={`flex items-center gap-2 ${getPaymentInfo(selectedOrder.payment_method)!.color}`}>
                          {(() => {
                            const PaymentIcon = getPaymentInfo(selectedOrder.payment_method)!.icon;
                            return <PaymentIcon className="w-4 h-4" />;
                          })()}
                          <span className="font-medium">{getPaymentInfo(selectedOrder.payment_method)!.label}</span>
                        </div>
                      )}
                    </div>

                    {/* Delivery Info */}
                    {selectedOrder.wants_delivery && selectedOrder.delivery_address && (
                      <div className="py-2 border-t">
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Endereço de Entrega
                        </p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.delivery_address}</p>
                      </div>
                    )}

                    {selectedOrder.customer_notes && (
                      <div className="py-2 border-t">
                        <p className="text-sm font-medium mb-1">Observações</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.customer_notes}</p>
                      </div>
                    )}

                    {/* Totals */}
                    <div className="pt-3 border-t space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Taxa de entrega</span>
                          <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">R$ {selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-4">
                    {selectedOrder.business.whatsapp && (
                      <Button 
                        variant="outline" 
                        className="gap-2 border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => openWhatsApp(selectedOrder)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    )}
                    
                    {selectedOrder.receipt_url && (
                      <Button 
                        variant="outline"
                        onClick={() => setReceiptToView(selectedOrder.receipt_url)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Comprovante
                      </Button>
                    )}

                    {['pending', 'awaiting_payment'].includes(selectedOrder.status) && (
                      <Button 
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar o pedido {selectedOrder?.order_number}? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não, manter</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sim, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Receipt Viewer */}
        <Dialog open={!!receiptToView} onOpenChange={() => setReceiptToView(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Comprovante de Pagamento</DialogTitle>
            </DialogHeader>
            {receiptToView && (
              <div className="flex justify-center">
                <img 
                  src={receiptToView} 
                  alt="Comprovante" 
                  className="max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function getStatusIndex(status: string, paymentStatus: string | null): number {
  const statusOrder = ['pending', 'awaiting_payment', 'pending_confirmation', 'confirmed', 'preparing', 'ready', 'delivered'];
  const currentStatus = paymentStatus || status;
  return statusOrder.indexOf(currentStatus);
}

function isCurrentStatus(status: string, paymentStatus: string | null, checkStatus: string): boolean {
  if (paymentStatus && ['awaiting_payment', 'pending_confirmation', 'confirmed'].includes(paymentStatus)) {
    return paymentStatus === checkStatus;
  }
  return status === checkStatus;
}

function OrderCard({ order, onSelect }: { order: Order; onSelect: (order: Order) => void }) {
  const statusInfo = ORDER_STATUS.find(s => s.value === order.status || s.value === order.payment_status) || ORDER_STATUS[0];
  const paymentInfo = order.payment_method ? PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS] : null;

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(order)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Business Logo */}
          {order.business.logo_url ? (
            <img 
              src={order.business.logo_url} 
              alt={order.business.business_name}
              className="w-14 h-14 rounded-xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-7 h-7 text-primary" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{order.business.business_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">R$ {order.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <Badge variant="outline" className="gap-1.5">
                <span>{statusInfo.emoji}</span>
                {statusInfo.label}
              </Badge>
              
              <div className="flex items-center gap-2">
                {paymentInfo && (
                  <Badge variant="secondary" className={`gap-1 text-xs ${paymentInfo.color}`}>
                    {(() => {
                      const PaymentIcon = paymentInfo.icon;
                      return <PaymentIcon className="w-3 h-3" />;
                    })()}
                    {paymentInfo.label}
                  </Badge>
                )}
                {order.wants_delivery && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Truck className="w-3 h-3" />
                    Entrega
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
