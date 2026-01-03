import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DollarSign, Building2, Search, Eye, CheckCircle, 
  Clock, AlertTriangle, Receipt, TrendingUp,
  Calendar, Loader2, ShoppingBag, FileText, ArrowLeft,
  History, Wallet, Scale, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommissionReportDialog } from '@/components/admin/CommissionReportDialog';

interface CommissionPayment {
  id: string;
  business_id: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  notes: string | null;
  confirmed_at: string;
  confirmed_by: string | null;
  created_at: string;
  reference_month: string | null;
}

interface CommissionReceipt {
  id: string;
  business_id: string;
  receipt_url: string;
  reference_month: string | null;
  notes: string | null;
  uploaded_at: string;
  status: string;
  amount_claimed: number | null;
}

interface BusinessData {
  id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  user_id: string;
  created_at: string;
  accepted_platform_terms: boolean;
  // Calculated fields
  total_commission: number;
  total_paid: number;
  current_balance: number;
  orders_count: number;
  orders_delivered_count: number;
  total_sales: number;
  balance_status: 'pending' | 'awaiting_confirmation' | 'paid';
  payments: CommissionPayment[];
  pending_receipts_count: number;
}

interface Stats {
  totalPending: number;
  totalAwaitingConfirmation: number;
  totalPaid: number;
  totalBusinesses: number;
  totalOrdersThisMonth: number;
  totalSalesThisMonth: number;
  totalCommissionToReceive: number;
  pendingReceiptsCount: number;
}

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
    totalCommissionToReceive: 0,
    pendingReceiptsCount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Month filter
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'total'>('total');
  
  // Report dialog
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  // Pending receipts dialog
  const [showPendingReceiptsDialog, setShowPendingReceiptsDialog] = useState(false);
  const [pendingReceipts, setPendingReceipts] = useState<CommissionReceipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admtbo');
    } else if (user) {
      checkAdminAccess();
    }
  }, [user, authLoading]);

  // Realtime subscription
  useEffect(() => {
    if (!isAdmin) return;

    const channels = [
      supabase.channel('admin-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'business_orders' }, () => fetchData()).subscribe(),
      supabase.channel('admin-commissions').on('postgres_changes', { event: '*', schema: 'public', table: 'platform_commissions' }, () => fetchData()).subscribe(),
      supabase.channel('admin-payments').on('postgres_changes', { event: '*', schema: 'public', table: 'commission_payments' }, () => fetchData()).subscribe(),
      supabase.channel('admin-receipts').on('postgres_changes', { event: '*', schema: 'public', table: 'commission_receipts' }, () => fetchData()).subscribe(),
    ];

    return () => channels.forEach(ch => supabase.removeChannel(ch));
  }, [isAdmin]);

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
      const monthYear = format(selectedMonth, 'yyyy-MM');
      const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);

      // Fetch all businesses
      const { data: businessesData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Fetch orders based on view mode
      let ordersQuery = supabase.from('business_orders').select('business_id, status, total, created_at');
      if (viewMode === 'month') {
        ordersQuery = ordersQuery.gte('created_at', monthStart.toISOString()).lte('created_at', monthEnd.toISOString());
      }
      const { data: ordersData } = await ordersQuery;

      // Fetch ALL commissions
      const { data: commissionsData } = await supabase.from('platform_commissions').select('*');

      // Fetch ALL confirmed payments
      const { data: paymentsData } = await supabase
        .from('commission_payments')
        .select('*')
        .not('confirmed_at', 'is', null)
        .order('created_at', { ascending: false });

      // Fetch pending receipts count
      const { data: receiptsData } = await supabase
        .from('commission_receipts')
        .select('*')
        .eq('status', 'pending');

      // Build business data
      const businessesWithStats: BusinessData[] = (businessesData || []).map(business => {
        const businessOrders = (ordersData || []).filter(o => o.business_id === business.id);
        const deliveredOrders = businessOrders.filter(o => o.status === 'delivered');
        const businessCommissions = (commissionsData || []).filter(c => c.business_id === business.id);
        const businessPayments = (paymentsData || []).filter(p => p.business_id === business.id);
        const businessPendingReceipts = (receiptsData || []).filter(r => r.business_id === business.id);
        
        const totalCommission = businessCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const totalPaid = businessPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const currentBalance = Math.max(0, totalCommission - totalPaid);
        
        let balanceStatus: 'pending' | 'awaiting_confirmation' | 'paid' = 'pending';
        if (currentBalance <= 0) {
          balanceStatus = 'paid';
        } else if (businessPendingReceipts.length > 0) {
          balanceStatus = 'awaiting_confirmation';
        }

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
          total_sales: deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
          total_commission: totalCommission,
          total_paid: totalPaid,
          current_balance: currentBalance,
          balance_status: balanceStatus,
          payments: businessPayments,
          pending_receipts_count: businessPendingReceipts.length
        };
      });

      setBusinesses(businessesWithStats);

      // Calculate stats
      const totalPendingAmount = businessesWithStats
        .filter(b => b.current_balance > 0 && b.balance_status === 'pending')
        .reduce((sum, b) => sum + b.current_balance, 0);
      
      const totalAwaitingAmount = businessesWithStats
        .filter(b => b.balance_status === 'awaiting_confirmation')
        .reduce((sum, b) => sum + b.current_balance, 0);
      
      const totalPaidAmount = businessesWithStats.reduce((sum, b) => sum + b.total_paid, 0);
      const deliveredThisMonth = (ordersData || []).filter(o => o.status === 'delivered');

      setStats({
        totalPending: totalPendingAmount,
        totalAwaitingConfirmation: totalAwaitingAmount,
        totalPaid: totalPaidAmount,
        totalBusinesses: businessesWithStats.length,
        totalOrdersThisMonth: (ordersData || []).length,
        totalSalesThisMonth: deliveredThisMonth.reduce((acc, o) => acc + (o.total || 0), 0),
        totalCommissionToReceive: totalPendingAmount + totalAwaitingAmount,
        pendingReceiptsCount: (receiptsData || []).length
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReceipts = async () => {
    setLoadingReceipts(true);
    try {
      const { data } = await supabase
        .from('commission_receipts')
        .select('*')
        .eq('status', 'pending')
        .order('uploaded_at', { ascending: false });

      setPendingReceipts(data || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleConfirmReceipt = async (receipt: CommissionReceipt, action: 'confirm' | 'reject') => {
    try {
      if (action === 'confirm' && receipt.amount_claimed) {
        // Register the payment
        const { error: paymentError } = await supabase.rpc('register_commission_payment', {
          p_business_id: receipt.business_id,
          p_amount: receipt.amount_claimed,
          p_receipt_url: receipt.receipt_url,
          p_notes: `Comprovante confirmado em ${format(new Date(), "dd/MM/yyyy")}`
        });

        if (paymentError) throw paymentError;
      }

      // Update receipt status
      const { error: updateError } = await supabase
        .from('commission_receipts')
        .update({
          status: action === 'confirm' ? 'confirmed' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user!.id
        })
        .eq('id', receipt.id);

      if (updateError) throw updateError;

      toast({
        title: action === 'confirm' ? '✅ Comprovante Confirmado!' : 'Comprovante Rejeitado',
        description: action === 'confirm' ? 'Pagamento registrado automaticamente.' : 'O lojista será notificado.'
      });

      fetchPendingReceipts();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const getBalanceStatusBadge = (business: BusinessData) => {
    if (business.current_balance <= 0) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Quitado</Badge>;
    }
    if (business.balance_status === 'awaiting_confirmation') {
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Aguardando</Badge>;
    }
    return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
  };

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = b.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'awaiting' && b.balance_status === 'awaiting_confirmation') ||
      (activeTab === 'pending' && b.current_balance > 0 && b.balance_status !== 'awaiting_confirmation') ||
      (activeTab === 'paid' && b.current_balance <= 0) ||
      (activeTab === 'no-sales' && b.total_sales === 0);
    return matchesSearch && matchesTab;
  });

  const currentMonthLabel = viewMode === 'month' 
    ? format(selectedMonth, "MMMM/yyyy", { locale: ptBR })
    : 'Total Geral';

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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="w-7 h-7 text-primary" />
              Central de Comissões
            </h1>
            <p className="text-muted-foreground">
              Controle financeiro enterprise - <span className="font-medium capitalize">{currentMonthLabel}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {stats.pendingReceiptsCount > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  fetchPendingReceipts();
                  setShowPendingReceiptsDialog(true);
                }}
                className="relative"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Comprovantes
                <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {stats.pendingReceiptsCount}
                </span>
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'total' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setViewMode('total'); fetchData(); }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Total Geral
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setViewMode('month'); fetchData(); }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Por Mês
                </Button>
              </div>

              {viewMode === 'month' && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedMonth(prev => subMonths(prev, 1)); }}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium px-4 capitalize min-w-[180px] text-center">
                    {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedMonth(prev => addMonths(prev, 1)); }}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Balance Card */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-primary/20">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Total a Receber</p>
                  <p className="text-4xl font-bold text-primary">R$ {stats.totalCommissionToReceive.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Soma de todos os saldos devedores das empresas
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
                  <p className="text-xs text-muted-foreground">Total Recebido</p>
                  <p className="text-xl font-bold text-green-600">R$ {stats.totalPaid.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                  <p className="text-xs text-muted-foreground">Pedidos</p>
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
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-lg font-bold">R$ {stats.totalSalesThisMonth.toFixed(0)}</p>
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
                  <p className="text-lg font-bold">R$ {stats.totalPending.toFixed(0)}</p>
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
                  <p className="text-lg font-bold">R$ {stats.totalAwaitingConfirmation.toFixed(0)}</p>
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
                  <p className="text-lg font-bold text-green-600">R$ {stats.totalPaid.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Empresas e Saldos</CardTitle>
                <CardDescription>Clique em uma empresa para ver o relatório completo</CardDescription>
              </div>
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
                <TabsTrigger value="all">Todas ({businesses.length})</TabsTrigger>
                <TabsTrigger value="awaiting" className="relative">
                  Aguardando
                  {businesses.filter(b => b.balance_status === 'awaiting_confirmation').length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                      {businesses.filter(b => b.balance_status === 'awaiting_confirmation').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Com Saldo
                  {businesses.filter(b => b.current_balance > 0 && b.balance_status !== 'awaiting_confirmation').length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                      {businesses.filter(b => b.current_balance > 0 && b.balance_status !== 'awaiting_confirmation').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="paid">Quitados</TabsTrigger>
                <TabsTrigger value="no-sales">Sem vendas</TabsTrigger>
              </TabsList>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Comissão Total</TableHead>
                      <TableHead className="text-right">Total Pago</TableHead>
                      <TableHead className="text-right">
                        <span className="text-primary font-bold">Saldo Devedor</span>
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Pagamentos</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBusinesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma empresa encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBusinesses.map((business) => (
                        <TableRow 
                          key={business.id} 
                          className={`${business.current_balance > 0 ? '' : 'bg-green-50/50'} cursor-pointer hover:bg-muted/50`}
                          onClick={() => {
                            setSelectedBusiness(business);
                            setShowReportDialog(true);
                          }}
                        >
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
                                <p className="text-xs text-muted-foreground">
                                  {business.orders_delivered_count} entregues • R$ {business.total_sales.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">R$ {business.total_commission.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-green-600">R$ {business.total_paid.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-bold text-lg ${business.current_balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              R$ {business.current_balance.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              {getBalanceStatusBadge(business)}
                              {business.pending_receipts_count > 0 && (
                                <span className="text-xs text-blue-600">
                                  {business.pending_receipts_count} comprovante(s)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <History className="w-4 h-4 text-muted-foreground" />
                              <span>{business.payments.length}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBusiness(business);
                                setShowReportDialog(true);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Relatório
                            </Button>
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

      {/* Commission Report Dialog */}
      {selectedBusiness && (
        <CommissionReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          business={selectedBusiness}
          onPaymentRegistered={fetchData}
        />
      )}

      {/* Pending Receipts Dialog */}
      <Dialog open={showPendingReceiptsDialog} onOpenChange={setShowPendingReceiptsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Comprovantes Pendentes ({pendingReceipts.length})
            </DialogTitle>
            <DialogDescription>
              Comprovantes enviados pelos lojistas aguardando confirmação
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {loadingReceipts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : pendingReceipts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum comprovante pendente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReceipts.map((receipt) => {
                  const business = businesses.find(b => b.id === receipt.business_id);
                  return (
                    <div key={receipt.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={business?.logo_url || ''} />
                            <AvatarFallback><Building2 className="w-4 h-4" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{business?.business_name || 'Empresa'}</p>
                            <p className="text-xs text-muted-foreground">
                              Enviado em {format(new Date(receipt.uploaded_at), "dd/MM/yyyy 'às' HH:mm")}
                            </p>
                            {receipt.amount_claimed && (
                              <p className="text-sm font-medium mt-1">
                                Valor informado: R$ {receipt.amount_claimed.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(receipt.receipt_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleConfirmReceipt(receipt, 'reject')}
                          >
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmReceipt(receipt, 'confirm')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                        </div>
                      </div>
                      {receipt.notes && (
                        <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                          {receipt.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
