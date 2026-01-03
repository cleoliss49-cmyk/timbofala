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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
  Clock, AlertTriangle, Receipt, TrendingUp, Users,
  Calendar, Loader2, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  business: {
    business_name: string;
    slug: string;
    logo_url: string | null;
  };
}

interface Stats {
  totalPending: number;
  totalAwaitingConfirmation: number;
  totalPaid: number;
  totalBusinesses: number;
  totalCommissionThisMonth: number;
}

export default function AdminCommissions() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [commissions, setCommissions] = useState<BusinessCommission[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    totalAwaitingConfirmation: 0,
    totalPaid: 0,
    totalBusinesses: 0,
    totalCommissionThisMonth: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('awaiting');
  const [selectedCommission, setSelectedCommission] = useState<BusinessCommission | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

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
      // Fetch all commissions with business info
      const { data: commissionsData, error } = await supabase
        .from('platform_commissions')
        .select(`
          *,
          business:business_profiles!inner(
            business_name,
            slug,
            logo_url
          )
        `)
        .order('month_year', { ascending: false })
        .order('status', { ascending: true });

      if (error) throw error;

      const typedCommissions = (commissionsData || []).map((c: any) => ({
        ...c,
        business: c.business
      })) as BusinessCommission[];

      setCommissions(typedCommissions);

      // Calculate stats
      const currentMonth = format(new Date(), 'yyyy-MM');
      const pendingCommissions = typedCommissions.filter(c => c.status === 'pending');
      const awaitingCommissions = typedCommissions.filter(c => c.status === 'awaiting_confirmation');
      const paidCommissions = typedCommissions.filter(c => c.status === 'paid');
      const thisMonthCommissions = typedCommissions.filter(c => c.month_year === currentMonth);

      // Get unique businesses
      const { count: businessCount } = await supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalPending: pendingCommissions.reduce((acc, c) => acc + c.commission_amount, 0),
        totalAwaitingConfirmation: awaitingCommissions.reduce((acc, c) => acc + c.commission_amount, 0),
        totalPaid: paidCommissions.reduce((acc, c) => acc + c.commission_amount, 0),
        totalBusinesses: businessCount || 0,
        totalCommissionThisMonth: thisMonthCommissions.reduce((acc, c) => acc + c.commission_amount, 0)
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

  const handleConfirmPayment = async () => {
    if (!selectedCommission) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('platform_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          confirmed_by: user!.id
        })
        .eq('id', selectedCommission.id);

      if (error) throw error;

      toast({
        title: 'Pagamento confirmado!',
        description: `Comissão de ${selectedCommission.business.business_name} marcada como paga.`
      });

      setShowConfirmDialog(false);
      setSelectedCommission(null);
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
    return format(date, "MMM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
      case 'awaiting_confirmation':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Aguardando</Badge>;
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Pago</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = c.business.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'awaiting' && c.status === 'awaiting_confirmation') ||
      (activeTab === 'pending' && c.status === 'pending') ||
      (activeTab === 'paid' && c.status === 'paid');
    return matchesSearch && matchesTab;
  });

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
              Gerencie todas as comissões das empresas cadastradas
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            Voltar ao Painel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-xs text-muted-foreground">Recebido (Total)</p>
                  <p className="text-lg font-bold text-green-600">R$ {stats.totalPaid.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Lista de Comissões</CardTitle>
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
              <TabsList className="mb-4">
                <TabsTrigger value="awaiting" className="relative">
                  Aguardando Confirmação
                  {commissions.filter(c => c.status === 'awaiting_confirmation').length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                      {commissions.filter(c => c.status === 'awaiting_confirmation').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="paid">Pagos</TabsTrigger>
                <TabsTrigger value="all">Todos</TabsTrigger>
              </TabsList>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Comissão (7%)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comprovante</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma comissão encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {commission.business.logo_url ? (
                              <img 
                                src={commission.business.logo_url} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{commission.business.business_name}</p>
                              <p className="text-xs text-muted-foreground">/{commission.business.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {formatMonthYear(commission.month_year)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {commission.total_sales.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {commission.commission_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell>
                          {commission.receipt_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCommission(commission);
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
                          {commission.status === 'awaiting_confirmation' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCommission(commission);
                                setShowConfirmDialog(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirmar Pago
                            </Button>
                          )}
                          {commission.status === 'paid' && commission.paid_at && (
                            <span className="text-xs text-muted-foreground">
                              Pago em {format(new Date(commission.paid_at), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              {selectedCommission?.business.business_name} - {selectedCommission && formatMonthYear(selectedCommission.month_year)}
            </DialogDescription>
          </DialogHeader>

          {selectedCommission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Valor da Comissão</p>
                  <p className="text-xl font-bold">R$ {selectedCommission.commission_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enviado em</p>
                  <p className="font-medium">
                    {selectedCommission.receipt_uploaded_at && 
                      format(new Date(selectedCommission.receipt_uploaded_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
              </div>

              {selectedCommission.receipt_url && (
                <div className="border rounded-lg overflow-hidden">
                  {selectedCommission.receipt_url.endsWith('.pdf') ? (
                    <div className="p-8 text-center">
                      <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">Arquivo PDF</p>
                      <Button onClick={() => window.open(selectedCommission.receipt_url!, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir PDF
                      </Button>
                    </div>
                  ) : (
                    <img 
                      src={selectedCommission.receipt_url} 
                      alt="Comprovante" 
                      className="w-full max-h-96 object-contain"
                    />
                  )}
                </div>
              )}

              {selectedCommission.status === 'awaiting_confirmation' && (
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
              Confirmar que a empresa <strong>{selectedCommission?.business.business_name}</strong> pagou a comissão de{' '}
              <strong>R$ {selectedCommission?.commission_amount.toFixed(2)}</strong> referente a{' '}
              <strong>{selectedCommission && formatMonthYear(selectedCommission.month_year)}</strong>?
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
