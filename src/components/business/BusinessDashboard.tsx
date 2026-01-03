import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, Users,
  Wallet, CreditCard, Banknote, Clock, CheckCircle, XCircle, Truck,
  Eye, Download, Calendar, Star, Receipt, BarChart3, PieChart as PieChartIcon,
  ArrowUp, ArrowDown, Zap, Target, Award
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

interface BusinessDashboardProps {
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

export function BusinessDashboard({ businessId, orders, onViewReceipt, onViewOrder }: BusinessDashboardProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    calculateAnalytics();
  }, [orders, period]);

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

  const calculateAnalytics = () => {
    const filteredOrders = filterOrdersByPeriod();
    
    // CRITICAL: Revenue ONLY from delivered orders
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
    
    // Cancelled + Rejected = Cancelados
    const cancelledOrders = filteredOrders.filter(o => 
      o.status === 'cancelled' || o.status === 'rejected'
    );
    
    // Revenue stats - ONLY from delivered orders
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
    
    // Payment breakdown - ONLY from delivered orders
    const paymentBreakdown = deliveredOrders.reduce((acc, order) => {
      const method = order.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + order.total;
      return acc;
    }, {} as Record<string, number>);

    const paymentChartData = Object.entries(paymentBreakdown).map(([method, total]) => ({
      name: PAYMENT_LABELS[method] || method,
      value: total,
      method
    }));

    // Status breakdown
    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily revenue (last 7 days) - ONLY from delivered orders
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
               o.status === 'delivered';
      });
      dailyRevenue.push({
        date: format(date, 'EEE', { locale: ptBR }),
        fullDate: format(date, 'dd/MM'),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length
      });
    }

    // Pending receipts
    const pendingReceipts = filteredOrders.filter(o => 
      o.payment_status === 'pending_confirmation' && o.receipt_url
    );

    // Unique customers - from all orders
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customer_id)).size;

    setAnalyticsData({
      totalOrders: filteredOrders.length,
      completedOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length, // cancelled + rejected
      totalRevenue, // ONLY from delivered
      avgOrderValue,
      paymentBreakdown,
      paymentChartData,
      statusBreakdown,
      dailyRevenue,
      pendingReceipts,
      uniqueCustomers,
      pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
      preparingOrders: filteredOrders.filter(o => o.status === 'preparing').length,
      readyOrders: filteredOrders.filter(o => o.status === 'ready').length,
      deliveredOrders: deliveredOrders.length,
      rejectedOrders: filteredOrders.filter(o => o.status === 'rejected').length
    });
  };

  if (!analyticsData) return null;

  const growthRate = analyticsData.dailyRevenue.length >= 2 
    ? ((analyticsData.dailyRevenue[6]?.revenue - analyticsData.dailyRevenue[0]?.revenue) / 
       (analyticsData.dailyRevenue[0]?.revenue || 1)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">Período:</span>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Tudo'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              {growthRate !== 0 && (
                <Badge variant={growthRate > 0 ? 'default' : 'destructive'} className="text-xs gap-1">
                  {growthRate > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(growthRate).toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-green-700">
              R$ {analyticsData.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Receita Total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{analyticsData.totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">Pedidos Totais</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700">
              R$ {analyticsData.avgOrderValue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ticket Médio</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-orange-600" />
              <Award className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-orange-700">{analyticsData.uniqueCustomers}</p>
            <p className="text-xs text-muted-foreground mt-1">Clientes Únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="w-4 h-4" />
            Status dos Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center p-3 rounded-lg bg-yellow-50">
              <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-yellow-700">{analyticsData.pendingOrders}</p>
              <p className="text-[10px] text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50">
              <Package className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-700">{analyticsData.preparingOrders}</p>
              <p className="text-[10px] text-muted-foreground">Preparando</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">{analyticsData.readyOrders}</p>
              <p className="text-[10px] text-muted-foreground">Prontos</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50">
              <Truck className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{analyticsData.deliveredOrders}</p>
              <p className="text-[10px] text-muted-foreground">Entregues</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50">
              <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-700">{analyticsData.cancelledOrders}</p>
              <p className="text-[10px] text-muted-foreground">Cancelados/Rejeitados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Receita Diária (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center">
              {analyticsData.paymentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.paymentChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full text-center text-muted-foreground">
                  <p>Sem dados de pagamento</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {analyticsData.paymentChartData.map((entry: any, index: number) => (
                <Badge 
                  key={entry.name} 
                  variant="outline" 
                  className="text-xs gap-1"
                  style={{ borderColor: COLORS[index % COLORS.length] }}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {entry.name}: R$ {entry.value.toFixed(0)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Receipts */}
      {analyticsData.pendingReceipts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-800">
              <Receipt className="w-4 h-4" />
              Comprovantes Pendentes ({analyticsData.pendingReceipts.length})
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Comprovantes aguardando sua confirmação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {analyticsData.pendingReceipts.map((order: Order) => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div>
                      <p className="font-mono font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {order.total.toFixed(2)} • {format(new Date(order.created_at), "dd/MM HH:mm")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {order.receipt_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onViewReceipt?.(order.receipt_url!)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        onClick={() => onViewOrder?.(order.id)}
                      >
                        Analisar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Resumo Financeiro por Forma de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analyticsData.paymentBreakdown).map(([method, total]) => {
              const percentage = analyticsData.totalRevenue > 0 
                ? ((total as number) / analyticsData.totalRevenue) * 100 
                : 0;
              const Icon = method === 'pix' ? Wallet : method === 'cash' ? Banknote : CreditCard;
              const color = method === 'pix' ? 'bg-green-500' : method === 'cash' ? 'bg-yellow-500' : method === 'debit' ? 'bg-blue-500' : 'bg-purple-500';
              
              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{PAYMENT_LABELS[method] || method}</span>
                    </div>
                    <span className="font-bold">R$ {(total as number).toFixed(2)}</span>
                  </div>
                  <Progress value={percentage} className={`h-2 ${color}`} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
