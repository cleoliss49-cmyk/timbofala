import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, Calendar, Upload, CheckCircle, Clock, 
  AlertTriangle, QrCode, Loader2, Receipt, Eye
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';
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

  const getCurrentMonthCommission = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    return commissions.find(c => c.month_year === currentMonth);
  };

  const getPendingPaymentCommission = () => {
    // Find the most recent commission that needs payment
    // (previous month, pending status, and we're in the payment period 1st-5th)
    const today = new Date();
    const dayOfMonth = today.getDate();
    const previousMonth = format(new Date(today.getFullYear(), today.getMonth() - 1, 1), 'yyyy-MM');
    
    return commissions.find(c => 
      c.month_year === previousMonth && 
      c.status === 'pending' &&
      c.commission_amount > 0
    );
  };

  const isInPaymentPeriod = () => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth >= 1 && dayOfMonth <= 5;
  };

  const handleUploadReceipt = async (file: File) => {
    if (!selectedCommission) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `commissions/${businessId}/${selectedCommission.month_year}/${Date.now()}.${fileExt}`;

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
        .eq('id', selectedCommission.id);

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
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Aguardando Confirmação</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCommission = getPendingPaymentCommission();
  const currentMonthCommission = getCurrentMonthCommission();

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
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Comissão da Plataforma</CardTitle>
                <CardDescription>Taxa de 7% sobre vendas realizadas</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowHistoryDialog(true)}>
              <Receipt className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Alert */}
          {pendingCommission && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                    Pagamento Pendente
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Referente a {formatMonthYear(pendingCommission.month_year)}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor a pagar:</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {pendingCommission.commission_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (7% de R$ {pendingCommission.total_sales.toFixed(2)} em vendas)
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedCommission(pendingCommission);
                        setShowPaymentDialog(true);
                      }}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Efetuar Pagamento
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Prazo: até dia 05 do mês
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Awaiting Confirmation */}
          {commissions.some(c => c.status === 'awaiting_confirmation') && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                    Aguardando Confirmação
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Seu comprovante está sendo analisado. Prazo: até 48 horas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Month Stats */}
          {currentMonthCommission && (
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground">
                Mês Atual ({formatMonthYear(currentMonthCommission.month_year)})
              </h4>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Vendas Realizadas</p>
                  <p className="text-lg font-semibold">
                    R$ {currentMonthCommission.total_sales.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comissão Acumulada</p>
                  <p className="text-lg font-semibold text-primary">
                    R$ {currentMonthCommission.commission_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!currentMonthCommission && !pendingCommission && (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Sem comissões pendentes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar Comissão da Plataforma</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code para pagar via PIX
            </DialogDescription>
          </DialogHeader>

          {selectedCommission && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Valor a pagar:</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {selectedCommission.commission_amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Referente a {formatMonthYear(selectedCommission.month_year)}
                </p>
              </div>

              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={generatePixPayload(selectedCommission.commission_amount)}
                  size={200}
                  level="M"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">Chave PIX (CPF):</p>
                <p className="font-mono text-sm">096.078.909-06</p>
                <p className="text-xs text-muted-foreground">Bruno Eduardo Ochner</p>
              </div>

              <div className="border-t pt-4">
                <label className="block">
                  <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Clique para anexar o comprovante
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
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Após enviar, aguarde confirmação em até 48 horas
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Comissões</DialogTitle>
            <DialogDescription>
              Todas as comissões da sua empresa
            </DialogDescription>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Comissão (7%)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comprovante</TableHead>
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
                          onClick={() => window.open(commission.receipt_url!, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
