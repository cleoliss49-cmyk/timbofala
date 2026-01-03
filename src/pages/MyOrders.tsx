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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { OrderChat } from '@/components/business/OrderChat';
import { CountdownTimer } from '@/components/business/CountdownTimer';
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
import { 
  ShoppingBag, Package, Truck, Clock, CheckCircle, 
  XCircle, Store, ChefHat, ArrowLeft, RefreshCw, 
  Upload, Eye, MessageCircle, Wallet, CreditCard,
  Banknote, FileText, Loader2, ExternalLink, Sparkles,
  Zap, Timer, MapPin, Phone, Send, ChevronRight,
  Star, Gift, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  { value: 'pending', label: 'Pedido Realizado', icon: Clock, emoji: '🕒', description: 'Aguardando confirmação da loja', color: 'from-yellow-500 to-amber-500' },
  { value: 'awaiting_payment', label: 'Aguardando Pagamento', icon: Wallet, emoji: '💰', description: 'Efetue o pagamento PIX', color: 'from-orange-500 to-yellow-500' },
  { value: 'pending_confirmation', label: 'Comprovante Enviado', icon: FileText, emoji: '📎', description: 'Aguardando confirmação do pagamento', color: 'from-blue-500 to-cyan-500' },
  { value: 'confirmed', label: 'Pagamento Confirmado', icon: CheckCircle, emoji: '✅', description: 'Pagamento recebido', color: 'from-green-500 to-emerald-500' },
  { value: 'preparing', label: 'Preparando', icon: ChefHat, emoji: '🍳', description: 'Seu pedido está sendo preparado', color: 'from-purple-500 to-pink-500' },
  { value: 'ready', label: 'Pronto', icon: Package, emoji: '📦', description: 'Pronto para retirada/entrega', color: 'from-indigo-500 to-blue-500' },
  { value: 'delivered', label: 'Entregue', icon: CheckCircle, emoji: '🚚', description: 'Pedido finalizado', color: 'from-green-600 to-emerald-600' },
  { value: 'rejected', label: 'Rejeitado', icon: XCircle, emoji: '🚫', description: 'Pedido rejeitado pela loja', color: 'from-orange-600 to-red-500' },
  { value: 'cancelled', label: 'Cancelado', icon: XCircle, emoji: '❌', description: 'Pedido cancelado', color: 'from-red-500 to-rose-500' }
];

const PAYMENT_METHODS = {
  pix: { label: 'PIX', icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
  cash: { label: 'Dinheiro', icon: Banknote, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  debit: { label: 'Débito', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' },
  credit: { label: 'Crédito', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' }
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
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptToView, setReceiptToView] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchOrders();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
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
            .select('id, business_name, slug, logo_url, whatsapp, pix_key, pix_key_type, pix_holder_name, estimated_prep_time_minutes')
            .eq('id', order.business_id)
            .single();

          const { data: items } = await supabase
            .from('business_order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            receipt_url: (order as any).receipt_url || null,
            estimated_time_minutes: business?.estimated_prep_time_minutes || null,
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
    !['delivered', 'cancelled', 'rejected'].includes(o.status)
  );
  
  const completedOrders = orders.filter(o => 
    ['delivered', 'cancelled', 'rejected'].includes(o.status)
  );

  const getOrderProgress = (order: Order) => {
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statuses.length) * 100 : 0;
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Futuristic Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 border">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Meus Pedidos
                  </h1>
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {orders.length} pedidos • {activeOrders.length} em andamento
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="gap-2 bg-background/50 backdrop-blur"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="py-20 border-dashed">
            <CardContent className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-primary/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Explore as lojas da nossa comunidade e faça seu primeiro pedido!
              </p>
              <Button onClick={() => navigate('/empresas')} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                <Store className="w-4 h-4" />
                Explorar Lojas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 backdrop-blur">
              <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Zap className="w-4 h-4" />
                Em Andamento
                {activeOrders.length > 0 && (
                  <Badge className="h-5 px-1.5 bg-primary/20 text-primary hover:bg-primary/20">
                    {activeOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <CheckCircle className="w-4 h-4" />
                Finalizados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeOrders.length === 0 ? (
                <Card className="py-12 border-dashed">
                  <CardContent className="text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum pedido em andamento</p>
                  </CardContent>
                </Card>
              ) : (
                activeOrders.map(order => (
                  <FuturisticOrderCard 
                    key={order.id} 
                    order={order} 
                    onSelect={setSelectedOrder}
                    getProgress={getOrderProgress}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedOrders.length === 0 ? (
                <Card className="py-12 border-dashed">
                  <CardContent className="text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum pedido finalizado</p>
                  </CardContent>
                </Card>
              ) : (
                completedOrders.map(order => (
                  <FuturisticOrderCard 
                    key={order.id} 
                    order={order} 
                    onSelect={setSelectedOrder}
                    getProgress={getOrderProgress}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Order Details Dialog - Futuristic */}
        <Dialog open={!!selectedOrder} onOpenChange={() => { setSelectedOrder(null); setActiveTab('details'); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
            {selectedOrder && (
              <>
                {/* Header with gradient */}
                <div className={`relative p-6 bg-gradient-to-r ${getStatusInfo(selectedOrder.status).color}`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative text-white">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {getStatusInfo(selectedOrder.status).emoji} {getStatusInfo(selectedOrder.status).label}
                      </Badge>
                      <span className="text-sm font-mono opacity-80">{selectedOrder.order_number}</span>
                    </div>
                    <h3 className="text-xl font-bold">{selectedOrder.business.business_name}</h3>
                    <p className="text-sm opacity-80 mt-1">
                      {format(new Date(selectedOrder.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Tabs for details/chat */}
                <div className="border-b px-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'details' 
                          ? 'border-primary text-primary' 
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Detalhes
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'chat' 
                          ? 'border-primary text-primary' 
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat do Pedido
                    </button>
                  </div>
                </div>

                <ScrollArea className="flex-1 px-6 py-4">
                  {activeTab === 'details' ? (
                    <div className="space-y-4 pb-4">
                      {/* Progress Timeline */}
                      {!['cancelled'].includes(selectedOrder.status) && (
                        <Card className="bg-muted/30 border-0">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <span>Progresso do Pedido</span>
                              <span>{Math.round(getOrderProgress(selectedOrder))}%</span>
                            </div>
                            <Progress value={getOrderProgress(selectedOrder)} className="h-2" />
                            
                            <div className="flex justify-between mt-3 text-[10px] text-muted-foreground">
                              <span>Recebido</span>
                              <span>Preparando</span>
                              <span>Pronto</span>
                              <span>Entregue</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Countdown Timer for active orders with confirmed status */}
                      {selectedOrder.estimated_time_minutes && 
                       ['confirmed', 'preparing', 'ready'].includes(selectedOrder.status) && (
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                          <CardContent className="p-4">
                            <CountdownTimer
                              startTime={selectedOrder.updated_at}
                              estimatedMinutes={selectedOrder.estimated_time_minutes}
                              status={selectedOrder.status}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {/* Estimated Time for pending orders */}
                      {selectedOrder.estimated_time_minutes && 
                       ['pending', 'awaiting_payment', 'pending_confirmation'].includes(selectedOrder.status) && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                          <Timer className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Tempo estimado após confirmação</p>
                            <p className="text-xs text-muted-foreground">
                              Aproximadamente {selectedOrder.estimated_time_minutes} minutos
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Rejected order notice */}
                      {selectedOrder.status === 'rejected' && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <XCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-orange-800">Pedido Rejeitado</p>
                              <p className="text-sm text-orange-700">
                                Este pedido foi rejeitado pela loja. Entre em contato para mais informações.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Actions */}
                      {(selectedOrder.payment_status === 'awaiting_payment' || selectedOrder.status === 'awaiting_payment') && 
                        selectedOrder.payment_method === 'pix' && (
                        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-green-700 font-medium">
                              <Wallet className="w-5 h-5" />
                              Pagamento Pendente
                            </div>
                            <p className="text-sm text-green-800">
                              Efetue o pagamento PIX e envie o comprovante
                            </p>
                            <label className="block">
                              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled={uploadingReceipt}>
                                {uploadingReceipt ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                                Enviar Comprovante
                              </Button>
                              <input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx,.heic,.webp"
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

                      {/* Receipt Status */}
                      {selectedOrder.payment_status === 'pending_confirmation' && selectedOrder.receipt_url && (
                        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
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
                                className="border-yellow-300"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Items */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Itens do Pedido
                        </h4>
                        <div className="space-y-2">
                          {selectedOrder.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                  {item.quantity}x
                                </div>
                                <span className="font-medium text-sm">{item.product_name}</span>
                              </div>
                              <span className="font-bold">R$ {item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment & Delivery Info */}
                      <div className="grid grid-cols-2 gap-3">
                        {getPaymentInfo(selectedOrder.payment_method) && (
                          <div className={`p-3 rounded-xl ${getPaymentInfo(selectedOrder.payment_method)!.bg}`}>
                            {(() => {
                              const PaymentIcon = getPaymentInfo(selectedOrder.payment_method)!.icon;
                              return <PaymentIcon className={`w-5 h-5 ${getPaymentInfo(selectedOrder.payment_method)!.color}`} />;
                            })()}
                            <p className="text-xs text-muted-foreground mt-1">Pagamento</p>
                            <p className="font-medium text-sm">{getPaymentInfo(selectedOrder.payment_method)!.label}</p>
                          </div>
                        )}
                        
                        <div className="p-3 rounded-xl bg-muted/50">
                          <Truck className="w-5 h-5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground mt-1">Entrega</p>
                          <p className="font-medium text-sm">
                            {selectedOrder.wants_delivery ? 'Delivery' : 'Retirada'}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {selectedOrder.wants_delivery && selectedOrder.delivery_address && (
                        <div className="p-3 rounded-xl bg-muted/30">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Endereço de Entrega</p>
                              <p className="text-sm mt-0.5">{selectedOrder.delivery_address}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {selectedOrder.customer_notes && (
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-xs text-muted-foreground">Observações</p>
                          <p className="text-sm mt-0.5">{selectedOrder.customer_notes}</p>
                        </div>
                      )}

                      {/* Totals */}
                      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                          </div>
                          {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Taxa de entrega</span>
                              <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-primary">R$ {selectedOrder.total.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
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
                            Comprovante
                          </Button>
                        )}

                        {['pending', 'awaiting_payment'].includes(selectedOrder.status) && (
                          <Button 
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 col-span-2"
                            onClick={() => setShowCancelDialog(true)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar Pedido
                          </Button>
                        )}
                      </div>

                      {/* Store Link */}
                      <Link to={`/empresa/${selectedOrder.business.slug}`}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                          <CardContent className="p-3 flex items-center gap-3">
                            <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                              <AvatarImage src={selectedOrder.business.logo_url || ''} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {selectedOrder.business.business_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{selectedOrder.business.business_name}</p>
                              <p className="text-xs text-muted-foreground">Ver loja</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  ) : (
                    /* Chat Tab */
                    <div className="py-2">
                      <OrderChat
                        orderId={selectedOrder.id}
                        businessName={selectedOrder.business.business_name}
                        businessLogo={selectedOrder.business.logo_url}
                        isBusinessView={false}
                      />
                    </div>
                  )}
                </ScrollArea>
              </>
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

function FuturisticOrderCard({ order, onSelect, getProgress }: { 
  order: Order; 
  onSelect: (order: Order) => void;
  getProgress: (order: Order) => number;
}) {
  const statusInfo = ORDER_STATUS.find(s => s.value === order.status || s.value === order.payment_status) || ORDER_STATUS[0];
  const paymentInfo = order.payment_method ? PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS] : null;
  const isActive = !['delivered', 'cancelled'].includes(order.status);

  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] ${
        isActive ? 'ring-1 ring-primary/20' : ''
      }`} 
      onClick={() => onSelect(order)}
    >
      {/* Progress bar at top */}
      {isActive && (
        <div className="h-1 bg-muted">
          <div 
            className={`h-full bg-gradient-to-r ${statusInfo.color} transition-all duration-500`}
            style={{ width: `${getProgress(order)}%` }}
          />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Business Avatar */}
          <div className="relative">
            <Avatar className="w-14 h-14 ring-2 ring-background shadow-lg">
              <AvatarImage src={order.business.logo_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground font-bold">
                {order.business.business_name[0]}
              </AvatarFallback>
            </Avatar>
            {isActive && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{order.business.business_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">R$ {order.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className={`gap-1.5 border-0 bg-gradient-to-r ${statusInfo.color} text-white shadow-sm`}
              >
                <span>{statusInfo.emoji}</span>
                {statusInfo.label}
              </Badge>
              
              <div className="flex items-center gap-2">
                {paymentInfo && (
                  <Badge variant="secondary" className={`gap-1 text-xs ${paymentInfo.color} ${paymentInfo.bg}`}>
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
                    Delivery
                  </Badge>
                )}
              </div>
            </div>

            {/* Items Preview */}
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
              {order.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
