import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DollarSign, AlertTriangle, QrCode, Copy, Check, Loader2, Upload, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixCode } from '@/lib/pixGenerator';

interface Commission {
  id: string;
  month_year: string;
  total_sales: number;
  commission_amount: number;
  status: 'pending' | 'awaiting_confirmation' | 'paid';
  receipt_url: string | null;
}

interface CommissionAlertButtonProps {
  businessId: string;
  businessName: string;
}

export function CommissionAlertButton({ businessId, businessName }: CommissionAlertButtonProps) {
  const { toast } = useToast();
  const [pendingCommission, setPendingCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPendingCommission();
    const channel = supabase
      .channel('commission-alert')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'platform_commissions',
        filter: `business_id=eq.${businessId}`
      }, () => fetchPendingCommission())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId]);

  const fetchPendingCommission = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_commissions')
        .select('*')
        .eq('business_id', businessId)
        .in('status', ['pending', 'awaiting_confirmation'])
        .order('month_year', { ascending: false });

      if (error) throw error;

      // Get total pending amount
      const pendingTotal = (data || [])
        .filter((c: any) => c.status === 'pending')
        .reduce((sum: number, c: any) => sum + c.commission_amount, 0);

      if (pendingTotal > 0) {
        const mostRecent = (data || []).find((c: any) => c.status === 'pending');
        if (mostRecent) {
          setPendingCommission({
            ...mostRecent,
            commission_amount: pendingTotal
          } as Commission);
        }
      } else {
        setPendingCommission(null);
      }
    } catch (error) {
      console.error('Error fetching pending commission:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePixPayload = (amount: number) => {
    return generatePixCode({
      pixKey: '09607890906',
      pixKeyType: 'cpf',
      merchantName: 'Bruno Eduardo Ochner',
      merchantCity: 'Timbo',
      amount: amount,
      description: 'Comissao Timbo Fala'
    });
  };

  const handleCopyPix = async () => {
    if (!pendingCommission) return;
    const pixCode = generatePixPayload(pendingCommission.commission_amount);
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({ title: 'PIX copiado!', description: 'Cole no seu app de banco' });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleUploadReceipt = async (file: File) => {
    if (!pendingCommission) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `commissions/${businessId}/${pendingCommission.month_year}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Update all pending commissions for this business
      const { error: updateError } = await supabase
        .from('platform_commissions')
        .update({
          receipt_url: urlData.publicUrl,
          receipt_uploaded_at: new Date().toISOString(),
          status: 'awaiting_confirmation'
        })
        .eq('business_id', businessId)
        .eq('status', 'pending');

      if (updateError) throw updateError;

      toast({
        title: 'Comprovante enviado!',
        description: 'Aguarde a confirmação do administrador.'
      });

      setShowPaymentDialog(false);
      fetchPendingCommission();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    return format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
  };

  if (loading) return null;
  if (!pendingCommission) return null;

  return (
    <>
      {/* Alert Button - Highly Visible */}
      <Button
        variant="destructive"
        size="lg"
        className="gap-2 shadow-lg animate-pulse hover:animate-none"
        onClick={() => setShowPaymentDialog(true)}
      >
        <AlertTriangle className="w-5 h-5" />
        Comissão a Pagar: R$ {pendingCommission.commission_amount.toFixed(2)}
      </Button>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Pagar Comissão da Plataforma
            </DialogTitle>
            <DialogDescription>
              Taxa de 7% sobre pedidos concluídos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Amount Display */}
            <div className="text-center p-4 bg-primary/10 rounded-xl">
              <p className="text-sm text-muted-foreground">Total a pagar:</p>
              <p className="text-4xl font-bold text-primary">
                R$ {pendingCommission.commission_amount.toFixed(2)}
              </p>
              <Badge variant="outline" className="mt-2">
                Referente a {formatMonthYear(pendingCommission.month_year)}
              </Badge>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-xl border">
              <QRCodeSVG
                value={generatePixPayload(pendingCommission.commission_amount)}
                size={180}
                level="M"
                includeMargin
              />
            </div>

            {/* PIX Info - Hidden for privacy */}
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm font-medium text-green-700">✓ QR Code pronto para pagamento</p>
              <p className="text-xs text-muted-foreground mt-1">Escaneie ou copie o código abaixo</p>
            </div>

            {/* Copy Button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopyPix}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Código PIX
                </>
              )}
            </Button>

            {/* Upload Receipt */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2 text-center">
                Após o pagamento, envie o comprovante:
              </p>
              <label className="block">
                <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Clique para enviar comprovante
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Imagem ou PDF
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
              <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Confirmação em até 48 horas úteis
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
