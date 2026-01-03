import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, Calendar, Upload, CheckCircle, Clock, 
  AlertTriangle, QrCode, Loader2, Receipt, Eye, Copy, Check,
  Download, FileText, Printer
} from 'lucide-react';
import { format } from 'date-fns';
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
  receipt_url: string | null;
  receipt_uploaded_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  customer_id: string;
}

interface PlatformCommissionPanelProps {
  businessId: string;
  businessName: string;
}

export function PlatformCommissionPanel({ businessId, businessName }: PlatformCommissionPanelProps) {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOrdersReport, setShowOrdersReport] = useState(false);
  const [reportOrders, setReportOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [reportMonth, setReportMonth] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCommissions();
    setupRealtime();
  }, [businessId]);

  const setupRealtime = () => {
    const channel = supabase
      .channel('commissions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_commissions',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchCommissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_commissions')
        .select('*')
        .eq('business_id', businessId)
        .order('month_year', { ascending: false });

      if (error) throw error;
      setCommissions((data as unknown as Commission[]) || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersForMonth = async (monthYear: string) => {
    setLoadingOrders(true);
    setReportMonth(monthYear);
    try {
      const [year, month] = monthYear.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('business_orders')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReportOrders(data || []);
      setShowOrdersReport(true);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: 'Erro ao carregar pedidos', variant: 'destructive' });
    } finally {
      setLoadingOrders(false);
    }
  };

  const getCurrentMonthCommission = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    return commissions.find(c => c.month_year === currentMonth);
  };

  const getTotalPendingAmount = () => {
    return commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commission_amount, 0);
  };

  const handleUploadReceipt = async (file: File, commissionId?: string) => {
    const targetCommission = commissionId 
      ? commissions.find(c => c.id === commissionId) 
      : selectedCommission;
    
    if (!targetCommission) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `commissions/${businessId}/${targetCommission.month_year}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('platform_commissions')
        .update({
          receipt_url: urlData.publicUrl,
          receipt_uploaded_at: new Date().toISOString(),
          status: 'awaiting_confirmation'
        })
        .eq('id', targetCommission.id);

      if (updateError) throw updateError;

      toast({
        title: 'Comprovante enviado!',
        description: 'Aguarde a confirmação em até 48 horas.'
      });

      setShowPaymentDialog(false);
      setSelectedCommission(null);
      fetchCommissions();
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

  const getOrderStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Entregue' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
      rejected: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Rejeitado' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmado' },
      preparing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Preparando' },
      ready: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Pronto' }
    };
    const config = configs[status] || configs.pending;
    return <Badge className={`${config.bg} ${config.text} border-0`}>{config.label}</Badge>;
  };

  const handleExportPDF = () => {
    // Create printable version
    if (reportRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const deliveredOrders = reportOrders.filter(o => o.status === 'delivered');
        const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
        const commission = totalSales * 0.07;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Relatório de Pedidos - ${formatMonthYear(reportMonth)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .header { margin-bottom: 20px; }
              .stats { display: flex; gap: 20px; margin-bottom: 20px; }
              .stat-box { padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; flex: 1; }
              .stat-value { font-size: 24px; font-weight: bold; color: #333; }
              .stat-label { font-size: 12px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f5f5f5; font-weight: bold; }
              .delivered { color: green; }
              .cancelled, .rejected { color: red; }
              .total-row { font-weight: bold; background: #e8f5e9; }
              .commission-row { font-weight: bold; background: #fff3e0; color: #e65100; }
              .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Relatório de Pedidos - ${businessName}</h1>
              <p>Período: ${formatMonthYear(reportMonth)}</p>
              <p>Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
            </div>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-value">${reportOrders.length}</div>
                <div class="stat-label">Total de Pedidos</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${deliveredOrders.length}</div>
                <div class="stat-label">Entregues</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">R$ ${totalSales.toFixed(2)}</div>
                <div class="stat-label">Total em Vendas</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">R$ ${commission.toFixed(2)}</div>
                <div class="stat-label">Comissão (7%)</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th style="text-align: right">Valor</th>
                  <th style="text-align: right">Comissão</th>
                </tr>
              </thead>
              <tbody>
                ${reportOrders.map(order => `
                  <tr>
                    <td>${order.order_number}</td>
                    <td>${format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</td>
                    <td class="${order.status === 'delivered' ? 'delivered' : order.status === 'cancelled' || order.status === 'rejected' ? 'cancelled' : ''}">${order.status === 'delivered' ? 'Entregue' : order.status === 'cancelled' ? 'Cancelado' : order.status === 'rejected' ? 'Rejeitado' : order.status}</td>
                    <td style="text-align: right">R$ ${order.total.toFixed(2)}</td>
                    <td style="text-align: right">${order.status === 'delivered' ? 'R$ ' + (order.total * 0.07).toFixed(2) : '-'}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3">Total em Vendas (apenas entregues)</td>
                  <td style="text-align: right">R$ ${totalSales.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr class="commission-row">
                  <td colspan="4">Comissão da Plataforma (7%)</td>
                  <td style="text-align: right">R$ ${commission.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <p>Timbó Fala - Plataforma de Comércio Local</p>
              <p>Este relatório é gerado automaticamente e serve como comprovante de vendas.</p>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const currentMonthCommission = getCurrentMonthCommission();
  const totalPending = getTotalPendingAmount();

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
                <CardDescription>Taxa de 7% sobre pedidos concluídos</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowHistoryDialog(true)}>
              <Receipt className="w-4 h-4 mr-2" />
              Histórico Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Month Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Este Mês</span>
              </div>
              <p className="text-2xl font-bold">
                R$ {(currentMonthCommission?.total_sales || 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">em vendas concluídas</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Comissão (7%)</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                R$ {(currentMonthCommission?.commission_amount || 0).toFixed(2)}
              </p>
              {currentMonthCommission && getStatusBadge(currentMonthCommission.status)}
            </div>
          </div>

          {/* Pending Alert */}
          {totalPending > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-700">Comissão Pendente</p>
                    <p className="text-sm text-muted-foreground">
                      Prazo: até dia 05 do mês
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-700">
                    R$ {totalPending.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Awaiting Confirmation */}
          {commissions.some(c => c.status === 'awaiting_confirmation') && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                <div>
                  <p className="font-semibold text-blue-700">Aguardando Confirmação</p>
                  <p className="text-sm text-muted-foreground">
                    Seu comprovante está sendo analisado (até 48h).
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
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Pagar Comissão via PIX
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código
            </DialogDescription>
          </DialogHeader>

          {selectedCommission && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-xl">
                <p className="text-sm text-muted-foreground">Valor:</p>
                <p className="text-4xl font-bold text-primary">
                  R$ {selectedCommission.commission_amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {formatMonthYear(selectedCommission.month_year)}
                </p>
              </div>

              <div className="flex justify-center p-4 bg-white rounded-xl border">
                <QRCodeSVG
                  value={generatePixPayload(selectedCommission.commission_amount)}
                  size={180}
                  level="M"
                  includeMargin
                />
              </div>

              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm font-medium text-green-700">✓ QR Code pronto para pagamento</p>
                <p className="text-xs text-muted-foreground mt-1">Escaneie ou copie o código abaixo</p>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleCopyPix(selectedCommission.commission_amount)}
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-500" /> Copiado!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar Código PIX</>
                )}
              </Button>

              <Separator />

              <label className="block">
                <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm">Enviar Comprovante</span>
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
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Histórico de Comissões
            </DialogTitle>
            <DialogDescription>
              Todas as comissões de {businessName}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma comissão registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium capitalize">
                        {formatMonthYear(commission.month_year)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {commission.total_sales.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        R$ {commission.commission_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(commission.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchOrdersForMonth(commission.month_year)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          
                          {commission.status === 'pending' && commission.commission_amount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCommission(commission);
                                setShowPaymentDialog(true);
                              }}
                            >
                              <QrCode className="w-4 h-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                          
                          {commission.receipt_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(commission.receipt_url!, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Orders Report Dialog */}
      <Dialog open={showOrdersReport} onOpenChange={setShowOrdersReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Relatório de Pedidos
                </DialogTitle>
                <DialogDescription className="capitalize">
                  {reportMonth && formatMonthYear(reportMonth)} - {businessName}
                </DialogDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Printer className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </DialogHeader>

          {loadingOrders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{reportOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {reportOrders.filter(o => o.status === 'delivered').length}
                  </p>
                  <p className="text-xs text-green-700">Entregues</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="text-2xl font-bold">
                    R$ {reportOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-100 text-center">
                  <p className="text-2xl font-bold text-orange-700">
                    R$ {(reportOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0) * 0.07).toFixed(2)}
                  </p>
                  <p className="text-xs text-orange-700">Comissão</p>
                </div>
              </div>

              <Separator />

              {/* Orders List */}
              <ScrollArea className="flex-1" ref={reportRef}>
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
                    {reportOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum pedido neste período
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {getOrderStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {order.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {order.status === 'delivered' ? (
                              <span className="font-medium text-orange-600">
                                R$ {(order.total * 0.07).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Summary */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">Total em Vendas (entregues)</span>
                  <span className="font-bold text-xl text-green-700">
                    R$ {reportOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg mt-2">
                  <span className="font-medium text-orange-800">Comissão (7%)</span>
                  <span className="font-bold text-xl text-orange-700">
                    R$ {(reportOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0) * 0.07).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
