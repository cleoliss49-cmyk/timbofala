import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  TrendingUp, DollarSign, ShoppingBag, Package, Users,
  Clock, CheckCircle, XCircle, Truck, Eye, Calendar,
  Receipt, ArrowUp, ArrowDown, Zap, Target, Award, 
  Flame, Star, AlertCircle, MessageCircle, RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  receipt_url: string | null;
  created_at: string;
  customer_id: string;
  customer?: {
    full_name: string;
    avatar_url: string | null;
  };
  items?: {
    product_name: string;
    quantity: number;
  }[];
}

interface BusinessDashboardPremiumProps {
  businessId: string;
  orders: Order[];
  onViewReceipt?: (url: string) => void;
  onViewOrder?: (orderId: string) => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  debit: 'Débito',
  credit: 'Crédito'
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending: { label: 'Novos', color: 'text-yellow-600', icon: Clock, bg: 'bg-yellow-500' },
  preparing: { label: 'Preparando', color: 'text-orange-600', icon: Package, bg: 'bg-orange-500' },
  ready: { label: 'Prontos', color: 'text-blue-600', icon: CheckCircle, bg: 'bg-blue-500' },
  delivered: { label: 'Entregues', color: 'text-green-600', icon: Truck, bg: 'bg-green-500' },
  cancelled: { label: 'Cancelados', color: 'text-red-600', icon: XCircle, bg: 'bg-red-500' },
  rejected: { label: 'Rejeitados', color: 'text-red-600', icon: XCircle, bg: 'bg-red-500' }
};

export function BusinessDashboardPremium({ businessId, orders, onViewReceipt, onViewOrder }: BusinessDashboardPremiumProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [activeTab, setActiveTab] = useState('overview');

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
      case 'month':
        return { start: startOfMonth(now), end: now };
      default:
        return null;
    }
  };

  const filterOrdersByPeriod = () => {
    const range = getDateRange();
    if (!range) return orders;
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: range.start, end: range.end });
    });
  };

  const filteredOrders = filterOrdersByPeriod();
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled' || o.status === 'rejected');
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
  const preparingOrders = filteredOrders.filter(o => o.status === 'preparing');
  const readyOrders = filteredOrders.filter(o => o.status === 'ready');
  
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
  const uniqueCustomers = new Set(filteredOrders.map(o => o.customer_id)).size;
  
  const pendingReceipts = filteredOrders.filter(o => o.payment_status === 'pending_confirmation' && o.receipt_url);

  // Calculate growth
  const previousPeriodOrders = orders.filter(order => {
    const range = getDateRange();
    if (!range) return false;
    const periodLength = range.end.getTime() - range.start.getTime();
    const previousStart = new Date(range.start.getTime() - periodLength);
    const previousEnd = range.start;
    const orderDate = new Date(order.created_at);
    return orderDate >= previousStart && orderDate < previousEnd && order.status === 'delivered';
  });
  const previousRevenue = previousPeriodOrders.reduce((sum, o) => sum + o.total, 0);
  const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Payment breakdown
  const paymentBreakdown = deliveredOrders.reduce((acc, order) => {
    const method = order.payment_method || 'unknown';
    acc[method] = (acc[method] || 0) + order.total;
    return acc;
  }, {} as Record<string, number>);

  const paymentChartData = Object.entries(paymentBreakdown).map(([method, total]) => ({
    name: PAYMENT_LABELS[method] || method,
    value: total
  }));

  // Daily revenue
  const dailyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && o.status === 'delivered';
    });
    dailyRevenue.push({
      date: format(date, 'EEE', { locale: ptBR }),
      fullDate: format(date, 'dd/MM'),
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      orders: dayOrders.length
    });
  }

  // Hourly distribution
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourOrders = filteredOrders.filter(o => {
      const hour = new Date(o.created_at).getHours();
      return hour === i;
    });
    return {
      hour: `${i.toString().padStart(2, '0')}h`,
      orders: hourOrders.length
    };
  }).filter(h => h.orders > 0);

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Painel de Controle
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o desempenho da sua loja em tempo real
          </p>
        </div>
        
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              onClick={() => setPeriod(p)}
              className={`text-xs transition-all ${period === p ? 'shadow-md' : ''}`}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? '7 dias' : p === 'month' ? '30 dias' : 'Total'}
            </Button>
          ))}
        </div>
      </div>

      {/* Alert for pending receipts */}
      <AnimatePresence>
        {pendingReceipts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-800 dark:text-blue-200">
                        {pendingReceipts.length} comprovante{pendingReceipts.length > 1 ? 's' : ''} aguardando análise
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        Clientes aguardando confirmação de pagamento
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="default" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => onViewReceipt?.(pendingReceipts[0].receipt_url!)}
                  >
                    Analisar agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <DollarSign className="w-6 h-6" />
                </div>
                {growthRate !== 0 && (
                  <Badge className={`${growthRate > 0 ? 'bg-white/20' : 'bg-red-500/50'} text-white border-0`}>
                    {growthRate > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {Math.abs(growthRate).toFixed(0)}%
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-white/80 mt-1">Receita Total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <Zap className="w-5 h-5 text-yellow-300" />
              </div>
              <p className="text-3xl font-bold">{filteredOrders.length}</p>
              <p className="text-sm text-white/80 mt-1">Total de Pedidos</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <Target className="w-6 h-6" />
                </div>
                <Star className="w-5 h-5 text-yellow-300" />
              </div>
              <p className="text-3xl font-bold">R$ {avgOrderValue.toFixed(2)}</p>
              <p className="text-sm text-white/80 mt-1">Ticket Médio</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <Users className="w-6 h-6" />
                </div>
                <Award className="w-5 h-5 text-yellow-300" />
              </div>
              <p className="text-3xl font-bold">{uniqueCustomers}</p>
              <p className="text-sm text-white/80 mt-1">Clientes</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status Pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Pipeline de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: 'pending', count: pendingOrders.length, label: 'Novos', icon: Clock, color: 'yellow' },
              { key: 'preparing', count: preparingOrders.length, label: 'Preparando', icon: Package, color: 'orange' },
              { key: 'ready', count: readyOrders.length, label: 'Prontos', icon: CheckCircle, color: 'blue' },
              { key: 'delivered', count: deliveredOrders.length, label: 'Entregues', icon: Truck, color: 'green' },
              { key: 'cancelled', count: cancelledOrders.length, label: 'Cancelados', icon: XCircle, color: 'red' },
            ].map((item) => (
              <motion.div
                key={item.key}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-950/30 border border-${item.color}-200 dark:border-${item.color}-800 cursor-pointer transition-all hover:shadow-lg`}
                onClick={() => onViewOrder?.(filteredOrders.find(o => o.status === item.key)?.id || '')}
              >
                <item.icon className={`w-6 h-6 text-${item.color}-600 mb-2`} />
                <p className={`text-2xl font-bold text-${item.color}-700 dark:text-${item.color}-400`}>
                  {item.count}
                </p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Receita dos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[200px] flex items-center justify-center">
              {paymentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Sem dados de pagamento</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {paymentChartData.map((entry, index) => (
                <Badge 
                  key={entry.name} 
                  variant="outline" 
                  className="gap-2 py-1.5"
                >
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {entry.name}: R$ {entry.value.toFixed(0)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      {filteredOrders.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y">
                {filteredOrders.slice(0, 10).map((order) => {
                  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = status.icon;
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onViewOrder?.(order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center`}>
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{order.order_number}</span>
                            {order.payment_status === 'pending_confirmation' && (
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                                <Receipt className="w-3 h-3 mr-1" />
                                Comprovante
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold">R$ {order.total.toFixed(2)}</p>
                          <Badge variant="secondary" className="text-xs">
                            {PAYMENT_LABELS[order.payment_method || 'unknown'] || order.payment_method}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhum pedido ainda</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Quando clientes fizerem pedidos, eles aparecerão aqui em tempo real
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
