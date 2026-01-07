import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Heart, AlertTriangle, Shield, CreditCard, Bug, Trash2, Settings, Scale, User } from 'lucide-react';
import { useState } from 'react';

interface PaqueraTermsDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function PaqueraTermsDialog({ open, onAccept, onDecline }: PaqueraTermsDialogProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <DialogTitle className="text-xl">Termos de Uso do Paquera</DialogTitle>
              <DialogDescription>
                Leia e aceite os termos para criar seu perfil
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Important Notice */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">
                    O Paquera é uma funcionalidade da plataforma Timbó Fala (O Seu Desenvolvedor), desenvolvida, mantida e operada por pessoa física, não constituindo empresa, não possuindo CNPJ, e não oferecendo garantias comerciais, legais, profissionais ou pessoais.
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    O uso do Paquera implica que o usuário leu, compreendeu, aceita integralmente todos os termos abaixo, e declara possuir <strong className="text-foreground">18 anos ou mais</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <User className="w-4 h-4 text-primary" />
                1. Idade e Responsabilidade Legal
              </h4>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>O Paquera é exclusivo para usuários maiores de 18 anos.</li>
                <li>O usuário declara assumir total responsabilidade por qualquer informação falsa, fornecimento de dados incorretos ou uso indevido da plataforma.</li>
                <li>Timbó Fala (O Seu Desenvolvedor) não se responsabiliza por infrações legais, crimes ou condutas ilícitas cometidas por usuários, incluindo menores de idade que falsifiquem cadastro.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <Heart className="w-4 h-4 text-primary" />
                2. Natureza da Funcionalidade e Limitação Absoluta
              </h4>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>O Paquera é uma ferramenta de interação social digital, sem qualquer garantia de compatibilidade, afinidade, matches, encontros, relacionamentos ou resultados afetivos.</li>
                <li>Todas as interações, dentro ou fora da plataforma, são de total responsabilidade do usuário, incluindo conteúdos enviados, respostas, comportamentos ou ações resultantes de contatos.</li>
                <li>Timbó Fala (O Seu Desenvolvedor) não garante integridade, funcionamento contínuo, segurança ou disponibilidade da plataforma, das mensagens, matches, perfis ou interações.</li>
                <li>Qualquer expectativa de resultado, vínculo ou relacionamento é expressamente negada.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                3. Conduta do Usuário
              </h4>
              <p className="mt-2 text-muted-foreground">O usuário concorda em:</p>
              <ul className="mt-1 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>Manter comportamento ético, respeitoso e consensual</li>
                <li>Não praticar assédio, intimidação, perseguição ou qualquer forma de violência</li>
                <li>Não enviar conteúdo ilegal, difamatório, pornográfico, ameaçador ou não solicitado</li>
                <li>Não criar perfis falsos ou manipular dados para enganar outros usuários</li>
                <li>Respeitar recusas, bloqueios e limites impostos por outros usuários</li>
              </ul>
              <p className="mt-2 text-destructive font-medium">
                Violação sujeita o usuário à suspensão, banimento, denúncia a autoridades competentes ou ações legais cabíveis, sem aviso prévio.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <CreditCard className="w-4 h-4 text-primary" />
                4. Pagamentos e Recursos Pagos
              </h4>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>Os <strong className="text-foreground">10 primeiros matches são gratuitos</strong>.</li>
                <li>Após esse limite, o Paquera passa a ser pago (<strong className="text-foreground">R$ 29,90/mês</strong>), garantindo apenas acesso à ferramenta, não matches, resultados ou interações.</li>
                <li>Timbó Fala (O Seu Desenvolvedor) pode alterar preços, planos, funcionalidades e limites a qualquer momento, inclusive para usuários já ativos.</li>
                <li>Pagamentos não geram direito a reembolso por falhas, perda de dados, bugs ou indisponibilidade, salvo exigido por lei.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <Bug className="w-4 h-4 text-primary" />
                5. Projeto BETA e Falhas Técnicas
              </h4>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>O Paquera é um projeto BETA, sujeito a falhas, instabilidades, interrupções, alterações de funcionalidades ou remoção total de recursos.</li>
                <li>Timbó Fala (O Seu Desenvolvedor) não garante proteção contra bugs, ataques de terceiros, invasões, perda de dados, vazamentos ou indisponibilidade.</li>
                <li>O usuário reconhece que qualquer dado, mensagem, match ou conteúdo pode ser perdido permanentemente, e assume responsabilidade por backups ou cópias.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                6. Isenção de Responsabilidade Total
              </h4>
              <p className="mt-2 text-muted-foreground">
                Timbó Fala (O Seu Desenvolvedor) não se responsabiliza, sob qualquer hipótese, por qualquer dano, perda, prejuízo, conflito, evento, expectativa frustrada ou consequência legal, incluindo, mas não limitado a:
              </p>
              <ul className="mt-1 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>Danos físicos, emocionais, psicológicos, morais ou materiais</li>
                <li>Perdas financeiras, oportunidades comerciais ou receitas</li>
                <li>Interações, mensagens, matches, fotos, vídeos ou qualquer conteúdo enviado por usuários</li>
                <li>Conflitos entre usuários, assédio, perseguição, bullying, fraude ou manipulação</li>
                <li>Eventos ocorridos dentro ou fora da plataforma, presenciais ou digitais</li>
                <li>Problemas relacionados a menores de idade, engenharia social, hackers ou invasões</li>
                <li>Resultados de decisões individuais baseadas em interações ou informações obtidas no Paquera</li>
              </ul>
              <p className="mt-2 text-foreground font-medium">
                O usuário indeniza e isenta integralmente Timbó Fala (O Seu Desenvolvedor) de todas as reclamações, ações judiciais, demandas, custas, multas ou qualquer consequência legal.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <Trash2 className="w-4 h-4 text-primary" />
                7. Moderação e Remoção
              </h4>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>Perfis, mensagens, matches, conteúdos e funcionalidades podem ser limitados, removidos ou excluídos a qualquer momento, sem aviso prévio e sem necessidade de justificativa.</li>
                <li>Decisões da plataforma são definitivas e irrevogáveis.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <Settings className="w-4 h-4 text-primary" />
                8. Alterações dos Termos
              </h4>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>Estes termos podem ser modificados a qualquer momento.</li>
                <li>O uso contínuo da plataforma após alterações implica aceitação automática e irrevogável da versão vigente.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <Scale className="w-4 h-4 text-primary" />
                9. Reconhecimento Absoluto do Usuário
              </h4>
              <p className="mt-2 text-muted-foreground">O usuário declara que:</p>
              <ul className="mt-1 space-y-1 text-muted-foreground list-disc list-inside ml-2">
                <li>Compreende que Timbó Fala é projeto independente, BETA, mantido por pessoa física</li>
                <li>Reconhece que não é empresa, não possui CNPJ e não oferece garantias comerciais ou profissionais</li>
                <li>Aceita todos os riscos e responsabilidades exclusivamente seus</li>
                <li>Declara que nenhuma expectativa de resultado ou responsabilidade judicial poderá ser exigida contra Timbó Fala (O Seu Desenvolvedor)</li>
              </ul>
            </section>
          </div>
        </ScrollArea>

        {/* Accept checkbox */}
        <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-xl mt-4">
          <Checkbox
            id="accept-paquera-terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <Label htmlFor="accept-paquera-terms" className="text-sm leading-relaxed cursor-pointer">
            Li e aceito os <strong>Termos de Uso do Paquera</strong>. Declaro ter <strong>18 anos ou mais</strong> e compreendo que Timbó Fala é um projeto independente sem garantias comerciais ou legais.
          </Label>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onDecline}>
            Cancelar
          </Button>
          <Button onClick={handleAccept} disabled={!accepted}>
            Aceitar e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
