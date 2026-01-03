import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DollarSign, Building2, Search, Eye, CheckCircle, 
  Clock, AlertTriangle, Receipt, TrendingUp, Users,
  Calendar, Loader2, ExternalLink, Package, FileText,
  Truck, MapPin, CreditCard, Phone, ShoppingBag, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BusinessData {
  id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  user_id: string;
  created_at: string;
  accepted_platform_terms: boolean;
  orders_count: number;
  orders_delivered_count: number;
  total_sales: number;
  commission: BusinessCommission | null;
}

interface BusinessCommission {
  id: string;
  business_id: string;
  month_year: string;
  total_sales: number;
  commission_amount: number;
  status: 'pending' | 'awaiting_confirmation' | 'paid';
  receipt_url: string | null;
  receipt_uploaded_at: string | null;
  paid_at: string | null;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  wants_delivery: boolean;
  delivery_address: string | null;
  delivery_street: string | null;
  delivery_number: string | null;
  customer_neighborhood: string | null;
  created_at: string;
  customer: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  items: OrderItem[];
}

interface Stats {
  totalPending: number;
  totalAwaitingConfirmation: number;
  totalPaid: number;
  totalBusinesses: number;
  totalOrdersThisMonth: number;
  totalSalesThisMonth: number;
  totalCommissionToReceive: number;
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  awaiting_payment: { label: 'Aguardando Pgto', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  pending_confirmation: { label: 'Aguardando Conf.', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  confirmed: { label: 'Confirmado', color: 'text-green-700', bgColor: 'bg-green-100' },
  preparing: { label: 'Em Preparo', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  ready: { label: 'Pronto', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  delivered: { label: 'Entregue', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  rejected: { label: 'Rejeitado', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' }
};

export default function AdminCommissions() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    totalAwaitingConfirmation: 0,
    totalPaid: 0,
    totalBusinesses: 0,
    totalOrdersThisMonth: 0,
    totalSalesThisMonth: 0,
    totalCommissionToReceive: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
  const [businessOrders, setBusinessOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailDialog, setShowOrderDetailDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admtbo');
    } else if (user) {
      checkAdminAccess();
    }
  }, [user, authLoading]);

  const checkAdminAccess = async () => {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!data) {
        navigate('/admtbo');
        return;
      }

      setIsAdmin(true);
      await fetchData();
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate('/admtbo');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');

      // Fetch all businesses with their stats
      const { data: businessesData, error: businessesError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (businessesError) throw businessesError;

      // Fetch orders for all businesses
      const { data: ordersData, error: ordersError } = await supabase
        .from('business_orders')
        .select('business_id, status, total');

      if (ordersError) throw ordersError;

      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('platform_commissions')
        .select('*')
        .eq('month_year', currentMonth);

      if (commissionsError) throw commissionsError;

      // Build business data with stats
      const businessesWithStats: BusinessData[] = (businessesData || []).map(business => {
        const businessOrders = (ordersData || []).filter(o => o.business_id === business.id);
        const deliveredOrders = businessOrders.filter(o => o.status === 'delivered');
        const totalSales = deliveredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        const commission = (commissionsData || []).find(c => c.business_id === business.id) || null;

        return {
          id: business.id,
          business_name: business.business_name,
          slug: business.slug,
          logo_url: business.logo_url,
          user_id: business.user_id,
          created_at: business.created_at,
          accepted_platform_terms: business.accepted_platform_terms || false,
          orders_count: businessOrders.length,
          orders_delivered_count: deliveredOrders.length,
          total_sales: totalSales,
          commission: commission ? {
            id: commission.id,
            business_id: commission.business_id,
            month_year: commission.month_year,
            total_sales: commission.total_sales,
            commission_amount: commission.commission_amount,
            status: commission.status as 'pending' | 'awaiting_confirmation' | 'paid',
            receipt_url: commission.receipt_url,
            receipt_uploaded_at: commission.receipt_uploaded_at,
            paid_at: commission.paid_at
          } : null
        };
      });

      setBusinesses(businessesWithStats);

      // Calculate stats
      const allCommissions = commissionsData || [];
      const pendingCommissions = allCommissions.filter(c => c.status === 'pending');
      const awaitingCommissions = allCommissions.filter(c => c.status === 'awaiting_confirmation');
      const paidCommissions = allCommissions.filter(c => c.status === 'paid');

      // Get this month's orders
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      const { data: thisMonthOrders } = await supabase
        .from('business_orders')
        .select('total, status')
        .gte('created_at', thisMonthStart.toISOString());

      const deliveredThisMonth = (thisMonthOrders || []).filter(o => o.status === 'delivered');

      const totalPendingAmount = pendingCommissions.reduce((acc, c) => acc + c.commission_amount, 0);
      const totalAwaitingAmount = awaitingCommissions.reduce((acc, c) => acc + c.commission_amount, 0);
      
      setStats({
        totalPending: totalPendingAmount,
        totalAwaitingConfirmation: totalAwaitingAmount,
        totalPaid: paidCommissions.reduce((acc, c) => acc + c.commission_amount, 0),
        totalBusinesses: businessesWithStats.length,
        totalOrdersThisMonth: (thisMonthOrders || []).length,
        totalSalesThisMonth: deliveredThisMonth.reduce((acc, o) => acc + (o.total || 0), 0),
        totalCommissionToReceive: totalPendingAmount + totalAwaitingAmount
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessOrders = async (businessId: string) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('business_orders')
        .select(`
          *,
          items:business_order_items(
            product_name,
            quantity,
            product_price
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles separately
      const ordersWithCustomers = await Promise.all(
        (data || []).map(async (order) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', order.customer_id)
            .maybeSingle();

          return {
            ...order,
            customer: profile || { full_name: 'Cliente', username: 'unknown', avatar_url: null }
          };
        })
      );

      setBusinessOrders(ordersWithCustomers);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        variant: 'destructive'
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleViewOrders = async (business: BusinessData) => {
    setSelectedBusiness(business);
    setShowOrdersDialog(true);
    await fetchBusinessOrders(business.id);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBusiness?.commission) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('platform_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          confirmed_by: user!.id
        })
        .eq('id', selectedBusiness.commission.id);

      if (error) throw error;

      toast({
        title: 'Pagamento confirmado!',
        description: `Comissão de ${selectedBusiness.business_name} marcada como paga.`
      });

      setShowConfirmDialog(false);
      setSelectedBusiness(null);
      fetchData();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Erro ao confirmar',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, "MMMM/yyyy", { locale: ptBR });
  };

  const getCommissionStatusBadge = (business: BusinessData) => {
    if (!business.commission) {
      if (business.total_sales === 0) {
        return <Badge variant="outline" className="text-muted-foreground">Sem vendas</Badge>;
      }
      return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Sem comissão</Badge>;
    }

    switch (business.commission.status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
      case 'awaiting_confirmation':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Aguardando</Badge>;
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Pago</Badge>;
      default:
        return <Badge>{business.commission.status}</Badge>;
    }
  };

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = b.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'awaiting' && b.commission?.status === 'awaiting_confirmation') ||
      (activeTab === 'pending' && b.commission?.status === 'pending') ||
      (activeTab === 'paid' && b.commission?.status === 'paid') ||
      (activeTab === 'no-sales' && b.total_sales === 0);
    return matchesSearch && matchesTab;
  });

  const currentMonth = format(new Date(), 'MMMM/yyyy', { locale: ptBR });

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Comissões da Plataforma</h1>
            <p className="text-muted-foreground">
              Gerencie todas as comissões das empresas - <span className="font-medium capitalize">{currentMonth}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
        </div>

        {/* Total Commission to Receive - Highlight Card */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-primary/20">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total a Receber em Comissões</p>
                  <p className="text-4xl font-bold text-primary">
                    R$ {stats.totalCommissionToReceive.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    7% de todas as vendas concluídas (pendentes + aguardando confirmação)
                  </p>
                </div>
              </div>
              <div className="hidden md:flex gap-6">
                <div className="text-center px-4 border-l">
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold text-yellow-600">R$ {stats.totalPending.toFixed(2)}</p>
                </div>
                <div className="text-center px-4 border-l">
                  <p className="text-xs text-muted-foreground">Aguardando</p>
                  <p className="text-xl font-bold text-blue-600">R$ {stats.totalAwaitingConfirmation.toFixed(2)}</p>
                </div>
                <div className="text-center px-4 border-l">
                  <p className="text-xs text-muted-foreground">Já Recebido</p>
                  <p className="text-xl font-bold text-green-600">R$ {stats.totalPaid.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Empresas</p>
                  <p className="text-lg font-bold">{stats.totalBusinesses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos (mês)</p>
                  <p className="text-lg font-bold">{stats.totalOrdersThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/10">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vendas (mês)</p>
                  <p className="text-lg font-bold">R$ {stats.totalSalesThisMonth.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/10">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendente</p>
                  <p className="text-lg font-bold">R$ {stats.totalPending.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aguardando</p>
                  <p className="text-lg font-bold">R$ {stats.totalAwaitingConfirmation.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recebido</p>
                  <p className="text-lg font-bold text-green-600">R$ {stats.totalPaid.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Empresas Cadastradas</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="all">
                  Todas ({businesses.length})
                </TabsTrigger>
                <TabsTrigger value="awaiting" className="relative">
                  Aguardando
                  {businesses.filter(b => b.commission?.status === 'awaiting_confirmation').length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                      {businesses.filter(b => b.commission?.status === 'awaiting_confirmation').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="paid">Pagos</TabsTrigger>
                <TabsTrigger value="no-sales">Sem vendas</TabsTrigger>
              </TabsList>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-center">Pedidos</TableHead>
                      <TableHead className="text-center">Entregues</TableHead>
                      <TableHead className="text-right">Vendas (mês)</TableHead>
                      <TableHead className="text-right">Comissão (7%)</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Comprovante</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBusinesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhuma empresa encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBusinesses.map((business) => (
                        <TableRow key={business.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={business.logo_url || ''} />
                                <AvatarFallback className="bg-primary/10">
                                  <Building2 className="w-5 h-5 text-primary" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{business.business_name}</p>
                                <p className="text-xs text-muted-foreground">/{business.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{business.orders_count}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {business.orders_delivered_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {business.total_sales.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            R$ {(business.total_sales * 0.07).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getCommissionStatusBadge(business)}
                          </TableCell>
                          <TableCell className="text-center">
                            {business.commission?.receipt_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBusiness(business);
                                  setShowReceiptDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewOrders(business)}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Relatório
                              </Button>
                              {business.commission?.status === 'awaiting_confirmation' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBusiness(business);
                                    setShowConfirmDialog(true);
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Pago
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Orders Report Dialog */}
      <Dialog open={showOrdersDialog} onOpenChange={setShowOrdersDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedBusiness?.logo_url ? (
                <Avatar>
                  <AvatarImage src={selectedBusiness.logo_url} />
                  <AvatarFallback><Building2 className="w-4 h-4" /></AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <span>{selectedBusiness?.business_name}</span>
                <p className="text-sm font-normal text-muted-foreground">
                  Relatório de Pedidos - {currentMonth}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Total Pedidos</p>
              <p className="text-xl font-bold">{selectedBusiness?.orders_count || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-center">
              <p className="text-xs text-green-700">Entregues</p>
              <p className="text-xl font-bold text-green-700">{selectedBusiness?.orders_delivered_count || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-center">
              <p className="text-xs text-muted-foreground">Total Vendas</p>
              <p className="text-xl font-bold">R$ {selectedBusiness?.total_sales.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 text-center">
              <p className="text-xs text-orange-700">Comissão (7%)</p>
              <p className="text-xl font-bold text-orange-700">
                R$ {((selectedBusiness?.total_sales || 0) * 0.07).toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Orders List */}
          <ScrollArea className="flex-1 pr-4">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : businessOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                {businessOrders.map((order) => {
                  const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;
                  return (
                    <div 
                      key={order.id} 
                      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetailDialog(true);
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={order.customer?.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10">
                              {order.customer?.full_name?.[0] || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{order.customer?.full_name || 'Cliente'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{order.order_number}</span>
                              <span>•</span>
                              <span>{format(new Date(order.created_at), "dd/MM HH:mm")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {order.wants_delivery && (
                            <Badge variant="outline" className="gap-1">
                              <Truck className="w-3 h-3" />
                              Delivery
                            </Badge>
                          )}
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                            {statusConfig.label}
                          </Badge>
                          <div className="text-right">
                            <p className="font-bold">R$ {order.total.toFixed(2)}</p>
                            {order.status === 'delivered' && (
                              <p className="text-xs text-orange-600">
                                7%: R$ {(order.total * 0.07).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Items Preview */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item.quantity}x {item.product_name}
                          </Badge>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{order.items.length - 3} itens
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDetailDialog} onOpenChange={setShowOrderDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number} - {selectedOrder && format(new Date(selectedOrder.created_at), "dd/MM/yyyy 'às' HH:mm")}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedOrder.customer?.avatar_url || ''} />
                  <AvatarFallback>{selectedOrder.customer?.full_name?.[0] || 'C'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedOrder.customer?.full_name}</p>
                  <p className="text-sm text-muted-foreground">@{selectedOrder.customer?.username}</p>
                </div>
                <Badge className={`ml-auto ${ORDER_STATUS_CONFIG[selectedOrder.status]?.bgColor} ${ORDER_STATUS_CONFIG[selectedOrder.status]?.color} border-0`}>
                  {ORDER_STATUS_CONFIG[selectedOrder.status]?.label}
                </Badge>
              </div>

              {/* Delivery Info */}
              {selectedOrder.wants_delivery && (selectedOrder.delivery_address || selectedOrder.delivery_street) && (
                <div className="p-4 rounded-lg border bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Endereço de Entrega</h4>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      {selectedOrder.delivery_street && selectedOrder.delivery_number ? (
                        <p>{selectedOrder.delivery_street}, {selectedOrder.delivery_number}</p>
                      ) : (
                        <p>{selectedOrder.delivery_address}</p>
                      )}
                      {selectedOrder.customer_neighborhood && (
                        <Badge variant="outline" className="mt-1">{selectedOrder.customer_neighborhood}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <h4 className="font-medium">Itens do Pedido</h4>
                </div>
                <div className="divide-y">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                          {item.quantity}x
                        </div>
                        <span>{item.product_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {(item.product_price * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">R$ {item.product_price.toFixed(2)} un.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-background p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4" />
                  <h4 className="font-medium">Resumo do Pagamento</h4>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de Entrega</span>
                    <span>R$ {selectedOrder.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl text-primary">R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
                {selectedOrder.status === 'delivered' && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-orange-600">
                      <span className="font-medium">Comissão Plataforma (7%)</span>
                      <span className="font-bold">R$ {(selectedOrder.total * 0.07).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              {selectedBusiness?.business_name} - {selectedBusiness?.commission && formatMonthYear(selectedBusiness.commission.month_year)}
            </DialogDescription>
          </DialogHeader>

          {selectedBusiness?.commission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Valor da Comissão</p>
                  <p className="text-xl font-bold">R$ {selectedBusiness.commission.commission_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enviado em</p>
                  <p className="font-medium">
                    {selectedBusiness.commission.receipt_uploaded_at && 
                      format(new Date(selectedBusiness.commission.receipt_uploaded_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
              </div>

              {selectedBusiness.commission.receipt_url && (
                <div className="border rounded-lg overflow-hidden">
                  {selectedBusiness.commission.receipt_url.endsWith('.pdf') ? (
                    <div className="p-8 text-center">
                      <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">Arquivo PDF</p>
                      <Button onClick={() => window.open(selectedBusiness.commission!.receipt_url!, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir PDF
                      </Button>
                    </div>
                  ) : (
                    <img 
                      src={selectedBusiness.commission.receipt_url} 
                      alt="Comprovante" 
                      className="w-full max-h-96 object-contain"
                    />
                  )}
                </div>
              )}

              {selectedBusiness.commission.status === 'awaiting_confirmation' && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setShowReceiptDialog(false);
                    setShowConfirmDialog(true);
                  }}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Pagamento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar que a empresa <strong>{selectedBusiness?.business_name}</strong> pagou a comissão de{' '}
              <strong>R$ {selectedBusiness?.commission?.commission_amount.toFixed(2)}</strong> referente a{' '}
              <strong>{selectedBusiness?.commission && formatMonthYear(selectedBusiness.commission.month_year)}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment} disabled={processing}>
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
