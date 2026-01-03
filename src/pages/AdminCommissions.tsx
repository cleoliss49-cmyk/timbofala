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
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
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
  Clock, AlertTriangle, Receipt, TrendingUp,
  Calendar, Loader2, ExternalLink, Package, FileText,
  Truck, MapPin, CreditCard, ShoppingBag, ArrowLeft,
  Printer, History, PlusCircle, Wallet, Scale, Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  last_receipt_url: string | null;
  last_receipt_at: string | null;
  balance_status: 'pending' | 'awaiting_confirmation' | 'paid';
  payments: CommissionPayment[];
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
  const [processing, setProcessing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailDialog, setShowOrderDetailDialog] = useState(false);
  
  // New payment registration states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showPaymentsHistoryDialog, setShowPaymentsHistoryDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admtbo');
    } else if (user) {
      checkAdminAccess();
    }
  }, [user, authLoading]);

  // Realtime subscription for automatic updates
  useEffect(() => {
    if (!isAdmin) return;

    const ordersChannel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'business_orders'
      }, () => {
        fetchData();
      })
      .subscribe();

    const commissionsChannel = supabase
      .channel('admin-commissions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'platform_commissions'
      }, () => {
        fetchData();
      })
      .subscribe();

    const paymentsChannel = supabase
      .channel('admin-payments-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'commission_payments'
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(commissionsChannel);
      supabase.removeChannel(paymentsChannel);
    };
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
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      // Calculate month date range for filtering orders
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Fetch all businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (businessesError) throw businessesError;

      // Fetch orders for this month only
      const { data: ordersData, error: ordersError } = await supabase
        .from('business_orders')
        .select('business_id, status, total, created_at')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (ordersError) throw ordersError;

      // Fetch ALL commissions (not just current month) for accurate balance
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('platform_commissions')
        .select('*');

      if (commissionsError) throw commissionsError;

      // Fetch ALL payments for balance calculation
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('commission_payments')
        .select('*')
        .not('confirmed_at', 'is', null)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Build business data with calculated balances
      const businessesWithStats: BusinessData[] = (businessesData || []).map(business => {
        const businessOrders = (ordersData || []).filter(o => o.business_id === business.id);
        const deliveredOrders = businessOrders.filter(o => o.status === 'delivered');
        const businessCommissions = (commissionsData || []).filter(c => c.business_id === business.id);
        const businessPayments = (paymentsData || []).filter(p => p.business_id === business.id);
        
        // Calculate totals
        const totalCommission = businessCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const totalPaid = businessPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const currentBalance = totalCommission - totalPaid;
        
        // Get latest receipt info
        const lastReceipt = businessCommissions.find(c => c.receipt_url);
        
        // Calculate status based on real balance
        let balanceStatus: 'pending' | 'awaiting_confirmation' | 'paid' = 'pending';
        if (currentBalance <= 0) {
          balanceStatus = 'paid';
        } else if (businessCommissions.some(c => c.status === 'awaiting_confirmation')) {
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
          current_balance: Math.max(0, currentBalance),
          last_receipt_url: lastReceipt?.receipt_url || null,
          last_receipt_at: lastReceipt?.receipt_uploaded_at || null,
          balance_status: balanceStatus,
          payments: businessPayments
        };
      });

      setBusinesses(businessesWithStats);

      // Calculate stats based on REAL balances
      const totalPendingAmount = businessesWithStats
        .filter(b => b.balance_status === 'pending' && b.current_balance > 0)
        .reduce((sum, b) => sum + b.current_balance, 0);
      
      const totalAwaitingAmount = businessesWithStats
        .filter(b => b.balance_status === 'awaiting_confirmation')
        .reduce((sum, b) => sum + b.current_balance, 0);
      
      const totalPaidAmount = businessesWithStats.reduce((sum, b) => sum + b.total_paid, 0);

      // Get this month's delivered orders for sales stats
      const deliveredThisMonth = (ordersData || []).filter(o => o.status === 'delivered');

      setStats({
        totalPending: totalPendingAmount,
        totalAwaitingConfirmation: totalAwaitingAmount,
        totalPaid: totalPaidAmount,
        totalBusinesses: businessesWithStats.length,
        totalOrdersThisMonth: (ordersData || []).length,
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

  // NEW: Register payment using RPC function
  const handleRegisterPayment = async () => {
    if (!selectedBusiness) return;
    
    const amount = parseFloat(paymentAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor maior que zero.',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('register_commission_payment', {
        p_business_id: selectedBusiness.id,
        p_amount: amount,
        p_receipt_url: selectedBusiness.last_receipt_url,
        p_notes: paymentNotes || `Pagamento registrado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`
      });

      if (error) throw error;

      const newBalance = selectedBusiness.current_balance - amount;
      const message = newBalance <= 0 
        ? `Saldo quitado! Crédito de R$ ${Math.abs(newBalance).toFixed(2)}`
        : `Pagamento registrado. Saldo restante: R$ ${newBalance.toFixed(2)}`;

      toast({
        title: '✅ Pagamento Registrado!',
        description: message
      });

      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedBusiness(null);
      fetchData();
    } catch (error: any) {
      console.error('Error registering payment:', error);
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message || 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedBusiness) return;
    
    const deliveredOrders = businessOrders.filter(o => o.status === 'delivered');
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const commission = totalSales * 0.07;
    
    const ordersHtml = businessOrders.map(order => {
      const statusLabel = ORDER_STATUS_CONFIG[order.status]?.label || order.status;
      const statusClass = order.status === 'delivered' ? 'delivered' : 
                          (order.status === 'cancelled' || order.status === 'rejected') ? 'cancelled' : '';
      const commissionValue = order.status === 'delivered' ? 'R$ ' + (order.total * 0.07).toFixed(2) : '-';
      
      return '<tr>' +
        '<td>' + order.order_number + '</td>' +
        '<td>' + (order.customer?.full_name || 'Cliente') + '</td>' +
        '<td>' + format(new Date(order.created_at), "dd/MM HH:mm") + '</td>' +
        '<td class="' + statusClass + '">' + statusLabel + '</td>' +
        '<td style="text-align: right">R$ ' + order.total.toFixed(2) + '</td>' +
        '<td style="text-align: right">' + commissionValue + '</td>' +
      '</tr>';
    }).join('');

    const paymentsHtml = selectedBusiness.payments.map(p => `
      <tr>
        <td>${format(new Date(p.confirmed_at), "dd/MM/yyyy HH:mm")}</td>
        <td style="text-align: right; color: green;">R$ ${p.amount.toFixed(2)}</td>
        <td>${p.notes || '-'}</td>
      </tr>
    `).join('');

    const currentMonth = format(new Date(), 'MMMM/yyyy', { locale: ptBR });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Financeiro - ${selectedBusiness.business_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; font-size: 20px; }
          h2 { color: #555; font-size: 16px; margin-top: 30px; }
          .header { margin-bottom: 20px; }
          .stats { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
          .stat-box { padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; flex: 1; min-width: 100px; }
          .stat-value { font-size: 18px; font-weight: bold; color: #333; }
          .stat-label { font-size: 10px; color: #666; }
          .balance-box { padding: 20px; background: #fff3e0; border: 2px solid #e65100; border-radius: 8px; margin: 20px 0; }
          .balance-value { font-size: 28px; font-weight: bold; color: #e65100; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 11px; }
          th { background: #f5f5f5; font-weight: bold; }
          .delivered { color: green; }
          .cancelled { color: red; }
          .total-row { font-weight: bold; background: #e8f5e9; }
          .commission-row { font-weight: bold; background: #fff3e0; color: #e65100; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório Financeiro - ${selectedBusiness.business_name}</h1>
          <p><strong>Período:</strong> ${currentMonth}</p>
          <p><strong>Gerado em:</strong> ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
        </div>

        <div class="balance-box">
          <p style="margin: 0 0 10px 0; font-size: 12px;">SALDO DEVEDOR ATUAL</p>
          <div class="balance-value">R$ ${selectedBusiness.current_balance.toFixed(2)}</div>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #666;">
            Comissões Totais: R$ ${selectedBusiness.total_commission.toFixed(2)} | 
            Total Pago: R$ ${selectedBusiness.total_paid.toFixed(2)}
          </p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <div class="stat-value">${businessOrders.length}</div>
            <div class="stat-label">Total Pedidos</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${deliveredOrders.length}</div>
            <div class="stat-label">Entregues</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">R$ ${totalSales.toFixed(2)}</div>
            <div class="stat-label">Vendas</div>
          </div>
          <div class="stat-box" style="background: #fff3e0;">
            <div class="stat-value" style="color: #e65100;">R$ ${commission.toFixed(2)}</div>
            <div class="stat-label">Comissão (7%)</div>
          </div>
        </div>

        ${selectedBusiness.payments.length > 0 ? `
          <h2>Histórico de Pagamentos</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th style="text-align: right">Valor</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsHtml}
            </tbody>
          </table>
        ` : ''}

        <h2>Pedidos do Período</h2>
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Status</th>
              <th style="text-align: right">Valor</th>
              <th style="text-align: right">Comissão</th>
            </tr>
          </thead>
          <tbody>
            ${ordersHtml}
            <tr class="total-row">
              <td colspan="4"><strong>Total em Vendas (entregues)</strong></td>
              <td style="text-align: right"><strong>R$ ${totalSales.toFixed(2)}</strong></td>
              <td></td>
            </tr>
            <tr class="commission-row">
              <td colspan="5"><strong>Comissão da Plataforma (7%)</strong></td>
              <td style="text-align: right"><strong>R$ ${commission.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Timbó Fala</strong> - Plataforma de Comércio Local</p>
          <p>Relatório gerado automaticamente pelo sistema administrativo.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="w-7 h-7 text-primary" />
              Central de Comissões
            </h1>
            <p className="text-muted-foreground">
              Controle financeiro de comissões - <span className="font-medium capitalize">{currentMonth}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
        </div>

        {/* Total Balance Card - Main Focus */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-primary/20">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Total a Receber</p>
                  <p className="text-4xl font-bold text-primary">
                    R$ {stats.totalCommissionToReceive.toFixed(2)}
                  </p>
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
              <div>
                <CardTitle>Empresas e Saldos</CardTitle>
                <CardDescription>Gerencie comissões e registre pagamentos</CardDescription>
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
                <TabsTrigger value="all">
                  Todas ({businesses.length})
                </TabsTrigger>
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
                      <TableHead className="text-center">Comprovante</TableHead>
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
                        <TableRow key={business.id} className={business.current_balance > 0 ? '' : 'bg-green-50/50'}>
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
                                  {business.orders_delivered_count} entregues • R$ {business.total_sales.toFixed(2)} em vendas
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {business.total_commission.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            R$ {business.total_paid.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-bold text-lg ${business.current_balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              R$ {business.current_balance.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getBalanceStatusBadge(business)}
                          </TableCell>
                          <TableCell className="text-center">
                            {business.last_receipt_url ? (
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
                              
                              {business.payments.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedBusiness(business);
                                    setShowPaymentsHistoryDialog(true);
                                  }}
                                >
                                  <History className="w-4 h-4" />
                                </Button>
                              )}
                              
                              {business.current_balance > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBusiness(business);
                                    setPaymentAmount(business.current_balance.toFixed(2).replace('.', ','));
                                    setShowPaymentDialog(true);
                                  }}
                                >
                                  <PlusCircle className="w-4 h-4 mr-1" />
                                  Registrar Pgto
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

      {/* Register Payment Dialog - THE KEY FEATURE */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        setShowPaymentDialog(open);
        if (!open) {
          setPaymentAmount('');
          setPaymentNotes('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Registrar Pagamento
            </DialogTitle>
            <DialogDescription>
              {selectedBusiness?.business_name}
            </DialogDescription>
          </DialogHeader>

          {selectedBusiness && (
            <div className="space-y-6">
              {/* Balance Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">Saldo Devedor Atual</p>
                    <p className="text-3xl font-bold text-orange-600">
                      R$ {selectedBusiness.current_balance.toFixed(2)}
                    </p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-orange-400" />
                </div>
                <Separator className="my-3 bg-orange-200" />
                <div className="flex justify-between text-sm text-orange-700">
                  <span>Comissões Totais:</span>
                  <span>R$ {selectedBusiness.total_commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-700">
                  <span>Já Pago:</span>
                  <span>R$ {selectedBusiness.total_paid.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor Recebido
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-10 text-2xl font-bold h-14"
                  />
                </div>
                {paymentAmount && (() => {
                  const amount = parseFloat(paymentAmount.replace(',', '.')) || 0;
                  const newBalance = selectedBusiness.current_balance - amount;
                  return (
                    <div className={`p-2 rounded text-sm ${newBalance <= 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {newBalance <= 0 
                        ? `✅ Saldo será quitado${newBalance < 0 ? `. Crédito: R$ ${Math.abs(newBalance).toFixed(2)}` : ''}`
                        : `⚠️ Saldo restante: R$ ${newBalance.toFixed(2)}`
                      }
                    </div>
                  );
                })()}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Textarea
                  placeholder="Ex: Pagamento referente a janeiro/2026"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment} disabled={processing}>
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payments History Dialog */}
      <Dialog open={showPaymentsHistoryDialog} onOpenChange={setShowPaymentsHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Pagamentos
            </DialogTitle>
            <DialogDescription>
              {selectedBusiness?.business_name}
            </DialogDescription>
          </DialogHeader>

          {selectedBusiness && (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {selectedBusiness.payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum pagamento registrado</p>
                  </div>
                ) : (
                  selectedBusiness.payments.map((payment) => (
                    <div key={payment.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            R$ {payment.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.confirmed_at), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Orders Report Dialog */}
      <Dialog open={showOrdersDialog} onOpenChange={setShowOrdersDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                  <DialogTitle>{selectedBusiness?.business_name}</DialogTitle>
                  <DialogDescription>
                    Relatório Financeiro - {currentMonth}
                  </DialogDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportPDF}
              >
                <Printer className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </DialogHeader>

          {/* Balance Summary */}
          {selectedBusiness && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-orange-50 border">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Comissões Totais</p>
                  <p className="text-xl font-bold">R$ {selectedBusiness.total_commission.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Total Pago</p>
                  <p className="text-xl font-bold text-green-600">R$ {selectedBusiness.total_paid.toFixed(2)}</p>
                </div>
                <div className="col-span-2 p-2 bg-orange-100 rounded-lg">
                  <p className="text-xs text-orange-700">Saldo Devedor</p>
                  <p className="text-2xl font-bold text-orange-600">R$ {selectedBusiness.current_balance.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

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
              {selectedBusiness?.business_name}
            </DialogDescription>
          </DialogHeader>

          {selectedBusiness && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Devedor</p>
                  <p className="text-xl font-bold text-orange-600">R$ {selectedBusiness.current_balance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enviado em</p>
                  <p className="font-medium">
                    {selectedBusiness.last_receipt_at && 
                      format(new Date(selectedBusiness.last_receipt_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
              </div>

              {selectedBusiness.last_receipt_url && (
                <div className="border rounded-lg overflow-hidden">
                  {selectedBusiness.last_receipt_url.endsWith('.pdf') ? (
                    <div className="p-8 text-center">
                      <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">Arquivo PDF</p>
                      <Button onClick={() => window.open(selectedBusiness.last_receipt_url!, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir PDF
                      </Button>
                    </div>
                  ) : (
                    <img 
                      src={selectedBusiness.last_receipt_url} 
                      alt="Comprovante" 
                      className="w-full max-h-96 object-contain"
                    />
                  )}
                </div>
              )}

              {selectedBusiness.current_balance > 0 && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setShowReceiptDialog(false);
                    setPaymentAmount(selectedBusiness.current_balance.toFixed(2).replace('.', ','));
                    setShowPaymentDialog(true);
                  }}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
