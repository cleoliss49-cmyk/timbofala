import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { FileText, AlertTriangle, DollarSign, Calendar, CheckCircle } from 'lucide-react';

interface PlatformTermsDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function PlatformTermsDialog({ open, onAccept, onDecline }: PlatformTermsDialogProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDecline(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Termos de Uso para Empresas</DialogTitle>
              <DialogDescription>
                Leia atentamente os termos antes de criar sua conta empresarial
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 max-h-[50vh]">
          <div className="space-y-6 py-4">
            {/* Highlight Box */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-600 dark:text-amber-400">
                    Comissão da Plataforma: 7%
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A plataforma Timbó Fala cobra uma comissão de <strong>7% sobre o valor total de cada pedido</strong> realizado através da plataforma. Este valor é acumulado mensalmente e deve ser pago até o dia 05 de cada mês.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms Sections */}
            <div className="space-y-4">
              <section>
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  1. Comissão sobre Vendas
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  1.1. A plataforma Timbó Fala cobra uma taxa de <strong>7% (sete por cento)</strong> sobre o valor total de cada pedido realizado.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  1.2. O cálculo é feito sobre o valor total do pedido, incluindo produtos e serviços, mas excluindo taxas de entrega quando aplicável.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  1.3. A comissão é acumulada ao longo do mês e consolidada no primeiro dia do mês seguinte.
                </p>
              </section>

              <section>
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  2. Ciclo de Pagamento
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  2.1. O período de apuração é mensal, do primeiro ao último dia de cada mês.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  2.2. No dia 1º de cada mês, a empresa receberá uma notificação com o valor total da comissão a ser paga.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  2.3. O pagamento deve ser realizado <strong>até o dia 05 do mês</strong> (período de carência).
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  2.4. O pagamento é feito exclusivamente via PIX para a chave informada no painel.
                </p>
              </section>

              <section>
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  3. Processo de Pagamento
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  3.1. A empresa deve efetuar o pagamento através do QR Code PIX disponível no painel.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  3.2. Após o pagamento, a empresa deve anexar o comprovante no sistema.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  3.3. A confirmação do pagamento será feita em até 48 horas úteis.
                </p>
              </section>

              <section>
                <h4 className="font-semibold">4. Inadimplência</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  4.1. O não pagamento da comissão dentro do prazo poderá resultar em suspensão temporária da conta empresarial.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  4.2. A empresa será notificada antes de qualquer suspensão.
                </p>
              </section>

              <section>
                <h4 className="font-semibold">5. Exemplo Prático</h4>
                <div className="mt-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Se sua empresa vendeu <strong>R$ 1.000,00</strong> em um mês através da plataforma:
                  </p>
                  <p className="text-sm font-semibold text-primary mt-2">
                    Comissão = R$ 1.000,00 × 7% = <strong>R$ 70,00</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este valor deve ser pago até o dia 05 do mês seguinte.
                  </p>
                </div>
              </section>

              <section>
                <h4 className="font-semibold">6. Disposições Gerais</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  6.1. A plataforma se reserva o direito de alterar os termos com aviso prévio de 30 dias.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  6.2. Ao aceitar estes termos, a empresa declara estar ciente e de acordo com todas as condições aqui estabelecidas.
                </p>
              </section>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <Label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer">
              Li e aceito os <strong>Termos de Uso para Empresas</strong>, incluindo a taxa de <strong>7% de comissão</strong> sobre vendas realizadas pela plataforma Timbó Fala.
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onDecline}>
              Não aceito
            </Button>
            <Button type="button" onClick={handleAccept} disabled={!accepted}>
              Aceitar e Continuar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
