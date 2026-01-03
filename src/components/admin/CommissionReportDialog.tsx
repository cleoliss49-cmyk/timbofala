import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ChevronLeft, ChevronRight, Calendar, DollarSign, 
  Building2, Receipt, Eye, CheckCircle, Clock, 
  AlertTriangle, Loader2, Printer, TrendingUp, 
  Package, FileText, History, X, Plus
} from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommissionPayment {
  id: string;
  amount: number;
  confirmed_at: string;
  notes: string | null;
  reference_month: string | null;
  receipt_url: string | null;
}

interface CommissionReceipt {
  id: string;
  receipt_url: string;
  reference_month: string | null;
  notes: string | null;
  uploaded_at: string;
  status: string;
  amount_claimed: number | null;
  reviewed_at: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

interface Commission {
  id: string;
  month_year: string;
  total_sales: number;
  commission_amount: number;
  status: string;
  receipt_url: string | null;
}

interface BusinessData {
  id: string;
  business_name: string;
  logo_url: string | null;
  slug: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: BusinessData;
  onPaymentRegistered: () => void;
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  confirmed: { label: 'Confirmado', color: 'text-green-700', bgColor: 'bg-green-100' },
  preparing: { label: 'Em Preparo', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  ready: { label: 'Pronto', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  delivered: { label: 'Entregue', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  rejected: { label: 'Rejeitado', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' }
};

export function CommissionReportDialog({ open, onOpenChange, business, onPaymentRegistered }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'total'>('month');
  
  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [receipts, setReceipts] = useState<CommissionReceipt[]>([]);
  
  // Calculated
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  // Payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Receipts dialog
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && business) {
      fetchData();
    }
  }, [open, business, selectedMonth, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthYear = format(selectedMonth, 'yyyy-MM');
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      // Fetch all commissions for this business
      const { data: commissionsData } = await supabase
        .from('platform_commissions')
        .select('*')
        .eq('business_id', business.id)
        .order('month_year', { ascending: false });

      // Fetch all confirmed payments
      const { data: paymentsData } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('business_id', business.id)
        .not('confirmed_at', 'is', null)
        .order('confirmed_at', { ascending: false });

      // Fetch all receipts
      const { data: receiptsData } = await supabase
        .from('commission_receipts')
        .select('*')
        .eq('business_id', business.id)
        .order('uploaded_at', { ascending: false });

      setCommissions(commissionsData || []);
      setPayments(paymentsData || []);
      setReceipts(receiptsData || []);

      // Calculate totals
      const totalComm = (commissionsData || []).reduce((sum, c) => sum + (c.commission_amount || 0), 0);
      const totalPaidAmount = (paymentsData || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      setTotalCommission(totalComm);
      setTotalPaid(totalPaidAmount);
      setCurrentBalance(Math.max(0, totalComm - totalPaidAmount));

      // Fetch orders for selected month
      if (viewMode === 'month') {
        const { data: ordersData } = await supabase
          .from('business_orders')
          .select('*')
          .eq('business_id', business.id)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
          .order('created_at', { ascending: false });

        setOrders(ordersData || []);
      } else {
        const { data: ordersData } = await supabase
          .from('business_orders')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false });

        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  const handleRegisterPayment = async () => {
    const amount = parseFloat(paymentAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('register_commission_payment', {
        p_business_id: business.id,
        p_amount: amount,
        p_notes: paymentNotes || `Pagamento registrado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`
      });

      if (error) throw error;

      const newBalance = currentBalance - amount;
      toast({
        title: '✅ Pagamento Registrado!',
        description: newBalance <= 0 
          ? 'Saldo quitado!' 
          : `Saldo restante: R$ ${newBalance.toFixed(2)}`
      });

      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchData();
      onPaymentRegistered();
    } catch (error: any) {
      toast({ title: 'Erro ao registrar pagamento', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportPDF = () => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const commission = totalSales * 0.07;

    const ordersHtml = orders.map(order => {
      const statusLabel = ORDER_STATUS_CONFIG[order.status]?.label || order.status;
      const statusClass = order.status === 'delivered' ? 'delivered' : 
                          (order.status === 'cancelled' || order.status === 'rejected') ? 'cancelled' : '';
      const commissionValue = order.status === 'delivered' ? 'R$ ' + (order.total * 0.07).toFixed(2) : '-';
      
      return `<tr>
        <td>${order.order_number}</td>
        <td>${format(new Date(order.created_at), "dd/MM HH:mm")}</td>
        <td class="${statusClass}">${statusLabel}</td>
        <td style="text-align: right">R$ ${order.total.toFixed(2)}</td>
        <td style="text-align: right">${commissionValue}</td>
      </tr>`;
    }).join('');

    const paymentsHtml = payments.map(p => `
      <tr>
        <td>${format(new Date(p.confirmed_at), "dd/MM/yyyy HH:mm")}</td>
        <td style="text-align: right; color: green;">R$ ${p.amount.toFixed(2)}</td>
        <td>${p.notes || '-'}</td>
      </tr>
    `).join('');

    const periodLabel = viewMode === 'month' 
      ? format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })
      : 'Histórico Completo';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Financeiro - ${business.business_name}</title>
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
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório Financeiro - ${business.business_name}</h1>
          <p><strong>Período:</strong> ${periodLabel}</p>
          <p><strong>Gerado em:</strong> ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
        </div>

        <div class="balance-box">
          <p style="margin: 0 0 10px 0; font-size: 12px;">SALDO DEVEDOR ATUAL</p>
          <div class="balance-value">R$ ${currentBalance.toFixed(2)}</div>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #666;">
            Comissões Totais: R$ ${totalCommission.toFixed(2)} | 
            Total Pago: R$ ${totalPaid.toFixed(2)}
          </p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <div class="stat-value">${orders.length}</div>
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

        ${payments.length > 0 ? `
          <h2>Histórico de Pagamentos (${payments.length})</h2>
          <table>
            <thead><tr><th>Data</th><th style="text-align: right">Valor</th><th>Observações</th></tr></thead>
            <tbody>${paymentsHtml}</tbody>
          </table>
        ` : ''}

        <h2>Pedidos do Período</h2>
        <table>
          <thead>
            <tr><th>Pedido</th><th>Data</th><th>Status</th><th style="text-align: right">Valor</th><th style="text-align: right">Comissão</th></tr>
          </thead>
          <tbody>${ordersHtml}</tbody>
        </table>

        <div class="footer">
          <p><strong>Timbó Fala</strong> - Plataforma de Comércio Local</p>
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

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const monthlyCommission = deliveredOrders.reduce((sum, o) => sum + o.total * 0.07, 0);
  const monthlySales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
          {/* Header */}
          <div className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={business.logo_url || ''} />
                  <AvatarFallback className="bg-primary/10">
                    <Building2 className="w-6 h-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl">{business.business_name}</DialogTitle>
                  <DialogDescription>Relatório Financeiro Completo</DialogDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowReceiptsDialog(true)}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Comprovantes ({receipts.length})
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Printer className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-orange-50 border-b">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/80 border text-center">
                <p className="text-xs text-muted-foreground">Comissões Totais</p>
                <p className="text-2xl font-bold">R$ {totalCommission.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                <p className="text-xs text-green-700">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">R$ {totalPaid.toFixed(2)}</p>
              </div>
              <div className={`p-4 rounded-xl border text-center ${currentBalance > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <p className={`text-xs ${currentBalance > 0 ? 'text-orange-700' : 'text-green-700'}`}>Saldo Devedor</p>
                <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  R$ {currentBalance.toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/80 border text-center">
                <p className="text-xs text-muted-foreground">Pagamentos</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
            </div>

            {currentBalance > 0 && (
              <div className="mt-4 flex justify-end">
                <Button onClick={() => {
                  setPaymentAmount(currentBalance.toFixed(2).replace('.', ','));
                  setShowPaymentDialog(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Pagamento
                </Button>
              </div>
            )}
          </div>

          {/* Month Navigation */}
          <div className="px-6 py-3 border-b flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Por Mês
              </Button>
              <Button
                variant={viewMode === 'total' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('total')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Total Geral
              </Button>
            </div>

            {viewMode === 'month' && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium px-4 capitalize min-w-[160px] text-center">
                  {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Monthly Stats */}
          {viewMode === 'month' && (
            <div className="px-6 py-3 border-b bg-muted/30">
              <div className="flex gap-6 text-sm">
                <div><span className="text-muted-foreground">Pedidos:</span> <strong>{orders.length}</strong></div>
                <div><span className="text-muted-foreground">Entregues:</span> <strong className="text-green-600">{deliveredOrders.length}</strong></div>
                <div><span className="text-muted-foreground">Vendas:</span> <strong>R$ {monthlySales.toFixed(2)}</strong></div>
                <div><span className="text-muted-foreground">Comissão:</span> <strong className="text-orange-600">R$ {monthlyCommission.toFixed(2)}</strong></div>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <ScrollArea className="flex-1 px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Comissão (7%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell>{format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">R$ {order.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {order.status === 'delivered' ? (
                            <span className="text-orange-600 font-medium">R$ {(order.total * 0.07).toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {/* Payments History */}
          {payments.length > 0 && (
            <div className="px-6 py-4 border-t bg-muted/30">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico de Pagamentos ({payments.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-2 rounded bg-green-50 border border-green-200 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-700">R$ {payment.amount.toFixed(2)}</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.confirmed_at), "dd/MM/yy")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Register Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Registrar Pagamento
            </DialogTitle>
            <DialogDescription>{business.business_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Saldo Devedor Atual</p>
                  <p className="text-3xl font-bold text-orange-600">R$ {currentBalance.toFixed(2)}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Recebido</label>
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
                const newBalance = currentBalance - amount;
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

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipts Dialog */}
      <Dialog open={showReceiptsDialog} onOpenChange={setShowReceiptsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Comprovantes Enviados
            </DialogTitle>
            <DialogDescription>
              Todos os comprovantes enviados por {business.business_name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh]">
            {receipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum comprovante enviado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {receipt.reference_month 
                            ? format(new Date(receipt.reference_month + '-01'), "MMMM/yyyy", { locale: ptBR })
                            : 'Sem mês específico'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enviado em {format(new Date(receipt.uploaded_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                        {receipt.amount_claimed && (
                          <p className="text-sm mt-1">Valor informado: R$ {receipt.amount_claimed.toFixed(2)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={
                            receipt.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                            receipt.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }
                        >
                          {receipt.status === 'confirmed' ? 'Confirmado' : 
                           receipt.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(receipt.receipt_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {receipt.notes && (
                      <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">{receipt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
