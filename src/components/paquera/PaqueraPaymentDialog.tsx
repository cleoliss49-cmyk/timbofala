import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Heart,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { generatePixCode } from '@/lib/pixGenerator';

interface PaqueraPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paqueraProfileId: string;
  userId: string;
  interactionsUsed: number;
  interactionsLimit: number;
}

export function PaqueraPaymentDialog({
  open,
  onOpenChange,
  paqueraProfileId,
  userId,
  interactionsUsed,
  interactionsLimit,
}: PaqueraPaymentDialogProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'submitted' | 'approved' | 'rejected'>('pending');
  const [existingPayment, setExistingPayment] = useState<any>(null);

  // PIX details
  const pixKey = '09607890906';
  const pixKeyType = 'cpf';
  const pixHolderName = 'Bruno Eduardo Ochner';
  const amount = 19.90;
  
  // Generate unique PIX identifier using profile ID
  const pixIdentifier = `PAQ-${paqueraProfileId.slice(0, 8).toUpperCase()}`;
  
  // Generate PIX code
  const pixCode = generatePixCode({
    pixKey,
    pixKeyType: pixKeyType as 'cpf' | 'email' | 'phone' | 'random',
    merchantName: pixHolderName,
    merchantCity: 'Timbó',
    amount,
    description: `Paquera ${pixIdentifier}`,
  });

  useEffect(() => {
    if (open) {
      checkExistingPayment();
    }
  }, [open, paqueraProfileId]);

  const checkExistingPayment = async () => {
    const { data } = await supabase
      .from('paquera_payments')
      .select('*')
      .eq('paquera_profile_id', paqueraProfileId)
      .eq('status', 'pending')
      .maybeSingle();

    if (data) {
      setExistingPayment(data);
      setPaymentStatus('submitted');
      setReceiptUrl(data.receipt_url);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O comprovante deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${paqueraProfileId}-${Date.now()}.${fileExt}`;
      const filePath = `paquera-receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);

      setReceiptUrl(urlData.publicUrl);
      toast({
        title: 'Upload concluído!',
        description: 'Comprovante carregado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    }

    setUploading(false);
  };

  const handleSubmitPayment = async () => {
    if (!receiptUrl) {
      toast({
        title: 'Comprovante obrigatório',
        description: 'Envie o comprovante de pagamento.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Get or create subscription
      let subscriptionId: string;
      
      const { data: existingSub } = await supabase
        .from('paquera_subscriptions')
        .select('id')
        .eq('paquera_profile_id', paqueraProfileId)
        .maybeSingle();

      if (existingSub) {
        subscriptionId = existingSub.id;
      } else {
        const { data: newSub, error: subError } = await supabase
          .from('paquera_subscriptions')
          .insert({
            paquera_profile_id: paqueraProfileId,
            user_id: userId,
            status: 'pending',
            interactions_count: interactionsUsed,
          })
          .select('id')
          .single();

        if (subError) throw subError;
        subscriptionId = newSub.id;
      }

      // Create payment record
      const { error: paymentError } = await supabase.from('paquera_payments').insert({
        subscription_id: subscriptionId,
        paquera_profile_id: paqueraProfileId,
        user_id: userId,
        amount,
        receipt_url: receiptUrl,
        pix_identifier: pixIdentifier,
        status: 'pending',
      });

      if (paymentError) throw paymentError;

      setPaymentStatus('submitted');
      toast({
        title: 'Comprovante enviado!',
        description: 'Aguarde a liberação pelo administrador.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    }

    setSubmitting(false);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: 'Código copiado!',
      description: 'Cole no app do seu banco.',
    });
  };

  const progressPercent = (interactionsUsed / interactionsLimit) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Continuar no Paquera
          </DialogTitle>
          <DialogDescription>
            Desbloqueie interações ilimitadas por 30 dias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Usage Progress */}
          <div className="p-4 bg-muted rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span>Interações utilizadas</span>
              <span className="font-bold">
                {interactionsUsed}/{interactionsLimit}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Você atingiu o limite gratuito de interações
            </p>
          </div>

          {paymentStatus === 'submitted' ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Aguardando aprovação</h3>
                <p className="text-muted-foreground text-sm">
                  Seu comprovante foi enviado e está sendo analisado.
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                ID: {pixIdentifier}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Guarde este ID para referência
              </p>
            </div>
          ) : (
            <>
              {/* Benefits */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  Benefícios Premium
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Interações ilimitadas por 30 dias</li>
                  <li>✓ Matches sem limite</li>
                  <li>✓ Mensagens ilimitadas</li>
                  <li>✓ Destaque no perfil</li>
                </ul>
              </div>

              {/* Price */}
              <div className="text-center p-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl">
                <p className="text-sm text-muted-foreground">Por apenas</p>
                <p className="text-3xl font-bold text-pink-500">
                  R$ {amount.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-muted-foreground">por 30 dias</p>
              </div>

              {/* PIX QR Code */}
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl">
                  <QRCodeSVG value={pixCode} size={180} level="M" />
                  <p className="text-xs text-muted-foreground text-center">
                    Escaneie o QR Code com seu app de banco
                  </p>
                </div>

                {/* PIX Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Chave PIX (CPF):</span>
                    <span className="font-mono">{pixKey}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Nome:</span>
                    <span>{pixHolderName}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Seu ID:</span>
                    <span className="font-mono font-bold text-primary">{pixIdentifier}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={copyPixCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar código PIX
                </Button>
              </div>

              {/* Upload Receipt */}
              <div className="space-y-3">
                <Label>Anexar comprovante</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </div>
                )}
                {receiptUrl && !uploading && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Comprovante carregado
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
                size="lg"
                onClick={handleSubmitPayment}
                disabled={!receiptUrl || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar comprovante
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Após o envio, seu acesso será liberado em até 24 horas
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
