import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, Calendar, Upload, CheckCircle, Clock, 
  AlertTriangle, QrCode, Loader2, Receipt, Eye, Copy, Check,
  FileText, Printer, ChevronLeft, ChevronRight, History
} from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixCode } from '@/lib/pixGenerator';

interface Commission {
  id: string;
  month_year: string;
  total_sales: number;
  commission_amount: number;
  status: 'pending' | 'awaiting_confirmation' | 'paid';
  created_at: string;
}

interface CommissionPayment {
  id: string;
  amount: number;
  confirmed_at: string;
  notes: string | null;
}

interface CommissionReceipt {
  id: string;
  receipt_url: string;
  reference_month: string | null;
  notes: string | null;
  uploaded_at: string;
  status: string;
  amount_claimed: number | null;
}

interface BalanceData {
  total_commission: number;
  total_paid: number;
  current_balance: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

interface PlatformCommissionPanelProps {
  businessId: string;
  businessName: string;
}

export function PlatformCommissionPanel({ businessId, businessName }: PlatformCommissionPanelProps) {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [receipts, setReceipts] = useState<CommissionReceipt[]>([]);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Month navigation
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'total'>('total');
  const [monthlyOrders, setMonthlyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Dialogs
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showPaymentsHistory, setShowPaymentsHistory] = useState(false);
  const [showReceiptsHistory, setShowReceiptsHistory] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  
  // Upload
  const [uploading, setUploading] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState('');
  
  // PIX
  const [copied, setCopied] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    setupRealtime();
  }, [businessId]);

  useEffect(() => {
    if (viewMode === 'month') {
      fetchMonthlyOrders();
    }
  }, [selectedMonth, viewMode]);

  const setupRealtime = () => {
    const channels = [
      supabase.channel('commissions-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'platform_commissions', filter: `business_id=eq.${businessId}` }, () => fetchData()).subscribe(),
      supabase.channel('payments-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'commission_payments', filter: `business_id=eq.${businessId}` }, () => fetchData()).subscribe(),
      supabase.channel('receipts-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'commission_receipts', filter: `business_id=eq.${businessId}` }, () => fetchData()).subscribe(),
    ];

    return () => channels.forEach(ch => supabase.removeChannel(ch));
  };

  const fetchData = async () => {
    try {
      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from('platform_commissions')
        .select('*')
        .eq('business_id', businessId)
        .order('month_year', { ascending: false });

      // Fetch confirmed payments
      const { data: paymentsData } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('business_id', businessId)
        .not('confirmed_at', 'is', null)
        .order('confirmed_at', { ascending: false });

      // Fetch all receipts
      const { data: receiptsData } = await supabase
        .from('commission_receipts')
        .select('*')
        .eq('business_id', businessId)
        .order('uploaded_at', { ascending: false });

      setCommissions((commissionsData as unknown as Commission[]) || []);
      setPayments(paymentsData || []);
      setReceipts(receiptsData || []);

      // Calculate real balance
      const totalCommission = (commissionsData || []).reduce((sum, c: any) => sum + (c.commission_amount || 0), 0);
      const totalPaid = (paymentsData || []).reduce((sum, p: any) => sum + (p.amount || 0), 0);
      
      setBalance({
        total_commission: totalCommission,
        total_paid: totalPaid,
        current_balance: Math.max(0, totalCommission - totalPaid)
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyOrders = async () => {
    setLoadingOrders(true);
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      const { data } = await supabase
        .from('business_orders')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: false });

      setMonthlyOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getTotalPendingAmount = () => {
    return balance?.current_balance || 0;
  };

  const handleUploadReceipt = async (file: File) => {
    if (!balance || balance.current_balance <= 0) {
      toast({ title: 'Não há saldo pendente', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `commissions/${businessId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const amount = parseFloat(receiptAmount.replace(',', '.')) || balance.current_balance;

      // Insert into commission_receipts table (never overwrites!)
      const { error: insertError } = await supabase
        .from('commission_receipts')
        .insert({
          business_id: businessId,
          receipt_url: urlData.publicUrl,
          reference_month: format(new Date(), 'yyyy-MM'),
          amount_claimed: amount,
          notes: `Comprovante enviado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`
        });

      if (insertError) throw insertError;

      toast({
        title: '✅ Comprovante enviado!',
        description: 'Aguarde a confirmação do administrador (até 48h).'
      });

      setShowPaymentDialog(false);
      setReceiptAmount('');
      fetchData();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Erro ao enviar comprovante',
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const generatePixPayload = (amount: number) => {
    return generatePixCode({
      pixKey: '09607890906',
      pixKeyType: 'cpf',
      merchantName: 'Bruno Eduardo Ochner',
      merchantCity: 'Timbo',
      amount: amount,
      description: 'Comissao Plataforma Timbo Fala'
    });
  };

  const handleCopyPix = async (amount: number) => {
    const pixCode = generatePixPayload(amount);
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({ title: 'PIX copiado!', description: 'Cole no seu app de banco' });
    setTimeout(() => setCopied(false), 3000);
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
      case 'awaiting_confirmation':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Aguardando</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReceiptStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 border-0">Confirmado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-0">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-0">Pendente</Badge>;
    }
  };

  const handleExportPDF = () => {
    const deliveredOrders = monthlyOrders.filter(o => o.status === 'delivered');
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const commission = totalSales * 0.07;

    const ordersHtml = monthlyOrders.map(order => `
      <tr>
        <td>${order.order_number}</td>
        <td>${format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</td>
        <td class="${order.status === 'delivered' ? 'delivered' : order.status === 'cancelled' || order.status === 'rejected' ? 'cancelled' : ''}">${order.status === 'delivered' ? 'Entregue' : order.status === 'cancelled' ? 'Cancelado' : order.status}</td>
        <td style="text-align: right">R$ ${order.total.toFixed(2)}</td>
        <td style="text-align: right">${order.status === 'delivered' ? 'R$ ' + (order.total * 0.07).toFixed(2) : '-'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório - ${businessName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
          .balance-box { padding: 20px; background: #fff3e0; border: 2px solid #e65100; border-radius: 8px; margin: 20px 0; }
          .balance-value { font-size: 28px; font-weight: bold; color: #e65100; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .delivered { color: green; }
          .cancelled { color: red; }
        </style>
      </head>
      <body>
        <h1>${businessName}</h1>
        <p><strong>Período:</strong> ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}</p>
        
        <div class="balance-box">
          <p>SALDO DEVEDOR ATUAL</p>
          <div class="balance-value">R$ ${balance?.current_balance.toFixed(2)}</div>
          <p>Comissões: R$ ${balance?.total_commission.toFixed(2)} | Pago: R$ ${balance?.total_paid.toFixed(2)}</p>
        </div>

        <h2>Pedidos do Mês</h2>
        <table>
          <thead>
            <tr><th>Pedido</th><th>Data</th><th>Status</th><th style="text-align: right">Valor</th><th style="text-align: right">Comissão</th></tr>
          </thead>
          <tbody>${ordersHtml}</tbody>
        </table>
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

  const totalPending = getTotalPendingAmount();
  const pendingReceipts = receipts.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Main Commission Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Comissões da Plataforma</CardTitle>
                <CardDescription>Taxa de 7% sobre pedidos entregues</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {payments.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowPaymentsHistory(true)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pagamentos ({payments.length})
                </Button>
              )}
              {receipts.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowReceiptsHistory(true)}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Comprovantes ({receipts.length})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowHistoryDialog(true)}>
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Summary */}
          {balance && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Total Comissões</p>
                <p className="text-xl font-bold">R$ {balance.total_commission.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-700 mb-1">Total Pago</p>
                <p className="text-xl font-bold text-green-700">R$ {balance.total_paid.toFixed(2)}</p>
              </div>
              <div className={`p-4 rounded-xl border ${balance.current_balance > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/20'}`}>
                <p className={`text-xs mb-1 ${balance.current_balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>Saldo Devedor</p>
                <p className={`text-xl font-bold ${balance.current_balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  R$ {balance.current_balance.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Pending Balance Alert */}
          {totalPending > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-700">Saldo Devedor</p>
                    <p className="text-sm text-muted-foreground">
                      Prazo: até dia 05 do mês
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <p className="text-3xl font-bold text-amber-700">
                    R$ {totalPending.toFixed(2)}
                  </p>
                  <Button size="sm" onClick={() => setShowPaymentDialog(true)}>
                    Pagar Agora
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Receipts Alert */}
          {pendingReceipts.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                <div>
                  <p className="font-semibold text-blue-700">
                    {pendingReceipts.length} comprovante(s) aguardando confirmação
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Análise em até 48 horas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Balance Paid */}
          {balance && balance.current_balance === 0 && balance.total_commission > 0 && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700">Saldo Quitado! ✅</p>
                  <p className="text-sm text-muted-foreground">
                    Todas as comissões estão pagas. Obrigado!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1">📌 Importante:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Apenas pedidos <strong>entregues</strong> contam para comissão</li>
              <li>Pedidos cancelados ou rejeitados <strong>não</strong> são cobrados</li>
              <li>Pagamento via PIX até o <strong>dia 05</strong> de cada mês</li>
              <li>Seu saldo é atualizado automaticamente após cada pagamento confirmado</li>
              <li>Todos os comprovantes enviados ficam salvos no histórico</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Payments History Dialog */}
      <Dialog open={showPaymentsHistory} onOpenChange={setShowPaymentsHistory}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Histórico de Pagamentos Confirmados
            </DialogTitle>
            <DialogDescription>
              Pagamentos registrados e confirmados pelo administrador
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 max-h-[50vh]">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum pagamento registrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-3 rounded-lg border bg-green-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-700">R$ {payment.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.confirmed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Confirmado
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {balance && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
              <div className="flex justify-between text-sm">
                <span>Total Pago:</span>
                <span className="font-bold text-green-700">R$ {balance.total_paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Saldo Devedor:</span>
                <span className={`font-bold ${balance.current_balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  R$ {balance.current_balance.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipts History Dialog */}
      <Dialog open={showReceiptsHistory} onOpenChange={setShowReceiptsHistory}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Histórico de Comprovantes
            </DialogTitle>
            <DialogDescription>
              Todos os comprovantes enviados
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 max-h-[60vh]">
            {receipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum comprovante enviado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="p-3 rounded-lg border bg-card">
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
                          <p className="text-sm font-medium mt-1">
                            Valor: R$ {receipt.amount_claimed.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getReceiptStatusBadge(receipt.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(receipt.receipt_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Pagar Comissão via PIX
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="text-center p-4 bg-primary/10 rounded-xl">
              <p className="text-sm text-muted-foreground">Saldo Devedor:</p>
              <p className="text-4xl font-bold text-primary">R$ {totalPending.toFixed(2)}</p>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-xl border">
              <QRCodeSVG
                value={generatePixPayload(totalPending)}
                size={180}
                level="M"
                includeMargin
              />
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleCopyPix(totalPending)}
            >
              {copied ? (
                <><Check className="w-4 h-4 text-green-500" /> Copiado!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar Código PIX</>
              )}
            </Button>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor do pagamento (opcional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="text"
                  placeholder={totalPending.toFixed(2).replace('.', ',')}
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe em branco para pagar o valor total
              </p>
            </div>

            <label className="block">
              <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm">Enviar Comprovante</span>
                    <span className="text-xs text-muted-foreground">
                      Cada comprovante é salvo no histórico
                    </span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadReceipt(file);
                }}
                disabled={uploading}
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Comissões
                </DialogTitle>
                <DialogDescription>
                  Todas as comissões de {businessName}
                </DialogDescription>
              </div>
              {viewMode === 'month' && (
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Printer className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Month Navigation */}
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'total' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('total')}
              >
                Total Geral
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setViewMode('month'); fetchMonthlyOrders(); }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Por Mês
              </Button>
            </div>

            {viewMode === 'month' && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium px-4 capitalize min-w-[160px] text-center">
                  {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 pr-4">
            {viewMode === 'total' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma comissão registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="font-medium capitalize">
                          {formatMonthYear(commission.month_year)}
                        </TableCell>
                        <TableCell className="text-right">R$ {commission.total_sales.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          R$ {commission.commission_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(commission.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{monthlyOrders.length}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-100 text-center">
                        <p className="text-2xl font-bold text-green-700">
                          {monthlyOrders.filter(o => o.status === 'delivered').length}
                        </p>
                        <p className="text-xs text-green-700">Entregues</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10 text-center">
                        <p className="text-2xl font-bold">
                          R$ {monthlyOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Vendas</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-100 text-center">
                        <p className="text-2xl font-bold text-orange-700">
                          R$ {(monthlyOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0) * 0.07).toFixed(2)}
                        </p>
                        <p className="text-xs text-orange-700">Comissão</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Comissão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              Nenhum pedido neste mês
                            </TableCell>
                          </TableRow>
                        ) : (
                          monthlyOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                              <TableCell>{format(new Date(order.created_at), "dd/MM HH:mm")}</TableCell>
                              <TableCell>
                                <Badge className={`${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                } border-0`}>
                                  {order.status === 'delivered' ? 'Entregue' :
                                   order.status === 'cancelled' ? 'Cancelado' :
                                   order.status === 'rejected' ? 'Rejeitado' : order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">R$ {order.total.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                {order.status === 'delivered' ? (
                                  <span className="text-orange-600 font-medium">R$ {(order.total * 0.07).toFixed(2)}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
              </>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
