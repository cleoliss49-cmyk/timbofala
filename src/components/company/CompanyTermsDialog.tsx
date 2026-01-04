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
import { FileText, CheckCircle, Shield, Users, Briefcase, Heart } from 'lucide-react';

interface CompanyTermsDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function CompanyTermsDialog({ open, onAccept, onDecline }: CompanyTermsDialogProps) {
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
                Cadastro gratuito na plataforma Timbó Fala
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 max-h-[50vh]">
          <div className="space-y-6 py-4">
            {/* Highlight Box - Free */}
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-600 dark:text-green-400">
                    100% Gratuito
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O cadastro de empresas na plataforma Timbó Fala é <strong>totalmente gratuito</strong>. Não há taxas de cadastro, mensalidades ou comissões sobre suas atividades.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms Sections */}
            <div className="space-y-4">
              <section>
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  1. Sobre o Cadastro
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  1.1. O cadastro de empresas é <strong>gratuito</strong> e destina-se a empresas e profissionais que desejam divulgar seus serviços, publicar vagas de emprego e construir seu portfólio na comunidade de Timbó.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  1.2. A empresa deve fornecer informações verdadeiras e manter seus dados atualizados.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  1.3. Cada usuário pode cadastrar apenas uma empresa.
                </p>
              </section>

              <section>
                <h4 className="font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  2. Publicação de Vagas
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  2.1. Empresas podem publicar vagas de emprego <strong>gratuitamente</strong>.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  2.2. As vagas devem conter informações precisas sobre a posição, requisitos e benefícios.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  2.3. É proibido publicar vagas falsas ou com informações enganosas.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  2.4. Os currículos recebidos são de responsabilidade da empresa contratante.
                </p>
              </section>

              <section>
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  3. Portfólio e Serviços
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  3.1. Empresas podem cadastrar seus serviços e projetos no portfólio <strong>sem custos</strong>.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  3.2. As imagens e descrições devem ser de propriedade da empresa ou com devida autorização.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  3.3. Conteúdos inapropriados ou ofensivos serão removidos.
                </p>
              </section>

              <section>
                <h4 className="font-semibold flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  4. Código de Conduta
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  4.1. Respeite os candidatos e outros usuários da plataforma.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  4.2. Não é permitido discriminação de qualquer natureza.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  4.3. Mantenha uma comunicação profissional e respeitosa.
                </p>
              </section>

              <section>
                <h4 className="font-semibold">5. Responsabilidades</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  5.1. A plataforma Timbó Fala atua apenas como intermediária entre empresas e candidatos.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  5.2. A empresa é responsável pelo processo seletivo e contratação.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  5.3. Informações falsas podem resultar na exclusão da conta.
                </p>
              </section>

              <section>
                <h4 className="font-semibold">6. Disposições Gerais</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  6.1. A plataforma se reserva o direito de atualizar estes termos a qualquer momento.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  6.2. Este é um projeto pessoal criado por Bruno Eduardo Ochner para a comunidade de Timbó.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  6.3. Ao aceitar, você concorda em seguir as diretrizes estabelecidas.
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
              Li e aceito os <strong>Termos de Uso para Empresas</strong> da plataforma Timbó Fala.
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onDecline}>
              Cancelar
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
