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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingBag, Package, Truck, Clock, CheckCircle, 
  XCircle, Store, ChefHat, ArrowLeft, RefreshCw
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
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  wants_delivery: boolean;
  delivery_address: string | null;
  customer_phone: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  business: {
    id: string;
    business_name: string;
    slug: string;
    logo_url: string | null;
  };
  items: OrderItem[];
}

const ORDER_STATUS = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-500', icon: Clock, description: 'Aguardando confirmação' },
  { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle, description: 'Pedido aceito pela loja' },
  { value: 'preparing', label: 'Preparando', color: 'bg-orange-500', icon: ChefHat, description: 'Seu pedido está sendo preparado' },
  { value: 'ready', label: 'Pronto', color: 'bg-green-500', icon: Package, description: 'Pronto para retirada/entrega' },
  { value: 'delivered', label: 'Entregue', color: 'bg-emerald-500', icon: CheckCircle, description: 'Pedido finalizado' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500', icon: XCircle, description: 'Pedido cancelado' }
];

export default function MyOrders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

      // Fetch business info and items for each order
      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: business } = await supabase
            .from('business_profiles')
            .select('id, business_name, slug, logo_url')
            .eq('id', order.business_id)
            .single();

          const { data: items } = await supabase
            .from('business_order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            business: business || { id: '', business_name: 'Loja', slug: '', logo_url: null },
            items: items || []
          };
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
          event: 'UPDATE',
          schema: 'public',
          table: 'business_orders',
          filter: `customer_id=eq.${user!.id}`
        },
        (payload) => {
          console.log('Order update:', payload);
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id 
              ? { ...order, ...payload.new as any }
              : order
          ));
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono">{selectedOrder?.order_number}</span>
                {selectedOrder && (
                  <Badge className={`${getStatusInfo(selectedOrder.status).color} text-white`}>
                    {getStatusInfo(selectedOrder.status).label}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedOrder && new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  {/* Status Timeline */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-3">Status do Pedido</p>
                    <div className="space-y-3">
                      {ORDER_STATUS.filter(s => s.value !== 'cancelled').map((status, index) => {
                        const StatusIcon = status.icon;
                        const isActive = ORDER_STATUS.findIndex(s => s.value === selectedOrder.status) >= index;
                        const isCurrent = selectedOrder.status === status.value;
                        
                        return (
                          <div key={status.value} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? status.color : 'bg-muted'}`}>
                              <StatusIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                            </div>
                            <div className={isCurrent ? 'font-medium' : 'text-muted-foreground'}>
                              <p className="text-sm">{status.label}</p>
                              {isCurrent && (
                                <p className="text-xs text-muted-foreground">{status.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Business */}
                  <Link to={`/empresa/${selectedOrder.business.slug}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      {selectedOrder.business.logo_url ? (
                        <img 
                          src={selectedOrder.business.logo_url} 
                          alt={selectedOrder.business.business_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{selectedOrder.business.business_name}</p>
                        <p className="text-xs text-muted-foreground">Ver loja</p>
                      </div>
                    </div>
                  </Link>

                  {/* Items */}
                  <div>
                    <p className="text-sm font-medium mb-2">Itens do Pedido</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span>R$ {item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  {selectedOrder.wants_delivery && selectedOrder.delivery_address && (
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Endereço de Entrega
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.delivery_address}</p>
                    </div>
                  )}

                  {selectedOrder.customer_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Observações</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer_notes}</p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t pt-3 space-y-1">
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
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function OrderCard({ order, onSelect }: { order: Order; onSelect: (order: Order) => void }) {
  const statusInfo = ORDER_STATUS.find(s => s.value === order.status) || ORDER_STATUS[0];
  const StatusIcon = statusInfo.icon;

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

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full ${statusInfo.color} flex items-center justify-center`}>
                  <StatusIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm">{statusInfo.label}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {order.wants_delivery && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Truck className="w-3 h-3" />
                    Entrega
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
