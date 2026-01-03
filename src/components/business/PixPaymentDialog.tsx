import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Copy, CheckCircle, Clock, Upload, MessageCircle, 
  ArrowRight, Loader2, AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generatePixCode, formatPixKeyForDisplay } from '@/lib/pixGenerator';

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  total: number;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  holderName: string;
  businessName: string;
  businessWhatsapp?: string;
  customerName: string;
  productNames: string[];
  onSuccess: () => void;
}

const PIX_TIMEOUT_MINUTES = 15;

export function PixPaymentDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  total,
  pixKey,
  pixKeyType,
  holderName,
  businessName,
  businessWhatsapp,
  customerName,
  productNames,
  onSuccess
}: PixPaymentDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'qrcode' | 'uploading' | 'confirm'>('qrcode');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PIX_TIMEOUT_MINUTES * 60);
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Generate PIX code (defensivo para evitar tela branca)
  const pixDescription = `${customerName.substring(0, 20)} Ped#${orderNumber.slice(-6)}`;
  let pixCode = '';
  try {
    pixCode = generatePixCode({
      pixKey,
      pixKeyType,
      merchantName: holderName || businessName,
      merchantCity: 'TIMBO',
      amount: total,
      txid: orderNumber.replace(/\D/g, '').slice(-10) || '***',
      description: pixDescription,
    });
  } catch (e) {
    console.error('Error generating PIX code:', e);
    pixCode = '';
  }

  // Timer countdown
  useEffect(() => {
    if (!open || step !== 'qrcode') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast({
        title: 'Código PIX copiado!',
        description: 'Cole em seu app de pagamento',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O comprovante deve ter no máximo 5MB',
          variant: 'destructive'
        });
        return;
      }
      setReceiptFile(file);
      setStep('confirm');
    }
  };

  const uploadReceipt = async () => {
    if (!receiptFile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload to storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${orderId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Use the secure RPC function to update the order
      const { error: updateError } = await supabase.rpc('submit_pix_receipt', {
        _order_id: orderId,
        _receipt_url: publicUrl
      });

      if (updateError) throw updateError;

      toast({
        title: '✅ Comprovante enviado!',
        description: 'Aguarde a confirmação do pagamento'
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar o comprovante. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const openWhatsApp = () => {
    if (businessWhatsapp) {
      const message = encodeURIComponent(
        `Olá! Acabei de fazer o pagamento PIX do pedido ${orderNumber}.\n` +
        `Valor: R$ ${total.toFixed(2)}\n` +
        `Estou enviando o comprovante.`
      );
      window.open(`https://wa.me/55${businessWhatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  if (step === 'confirm') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Confirmar Comprovante
            </DialogTitle>
            <DialogDescription>
              Verifique se está enviando o comprovante correto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Confirme que está enviando o comprovante correto!</p>
                  <p className="mt-1">Pedido: <strong>{orderNumber}</strong></p>
                  <p>Valor: <strong>R$ {total.toFixed(2)}</strong></p>
                </div>
              </CardContent>
            </Card>

            {receiptFile && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Arquivo selecionado:</p>
                <p className="text-sm text-muted-foreground truncate">{receiptFile.name}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setReceiptFile(null);
                  setStep('qrcode');
                }}
              >
                Voltar
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={uploadReceipt}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar Comprovante
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            💰 Pagamento PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código para pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                Tempo restante
              </span>
              <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Progress value={(timeLeft / (PIX_TIMEOUT_MINUTES * 60)) * 100} className="h-2" />
          </div>

          {/* Amount */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-green-100 text-sm">Valor a pagar</p>
              <p className="text-4xl font-bold">R$ {total.toFixed(2)}</p>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-xl border">
            {pixCode ? (
              <QRCodeSVG value={pixCode} size={200} level="M" includeMargin />
            ) : (
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Não foi possível gerar o QR Code</p>
                <p className="text-xs text-muted-foreground">
                  Verifique a chave PIX da loja e tente novamente.
                </p>
              </div>
            )}
          </div>

          {/* PIX Key Info */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chave PIX</span>
                <span className="font-mono text-sm">{formatPixKeyForDisplay(pixKey, pixKeyType)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recebedor</span>
                <span className="text-sm font-medium">{holderName || businessName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedido</span>
                <span className="font-mono text-sm">{orderNumber}</span>
              </div>
            </CardContent>
          </Card>

          {/* Copy Button */}
          <Button 
            onClick={copyPixCode}
            className="w-full gap-2"
            variant={copied ? "secondary" : "default"}
            size="lg"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Código Copiado!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Código PIX
              </>
            )}
          </Button>

          {/* Upload Receipt */}
          <label className="block">
            <div className="w-full p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Enviar Comprovante</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, PDF ou outros formatos (máx. 5MB)
              </p>
            </div>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.heic,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {/* WhatsApp Option */}
          {businessWhatsapp && (
            <Button 
              variant="outline"
              className="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50"
              onClick={openWhatsApp}
            >
              <MessageCircle className="w-4 h-4" />
              Enviar comprovante via WhatsApp
            </Button>
          )}

          {/* Skip to orders */}
          <Button 
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => {
              onSuccess();
              onOpenChange(false);
            }}
          >
            Enviar comprovante depois
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
