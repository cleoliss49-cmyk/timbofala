import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, ArrowLeft, Shield, FileText, AlertTriangle, 
  User, Store, Heart, Scale, Clock, Ban
} from 'lucide-react';

export default function TermsOfService() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Timbó Fala</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-6">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium">Documento Legal</span>
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">
            Termos de Uso
          </h1>
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-2 border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              AVISO IMPORTANTE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-bold text-lg">
              A PLATAFORMA "TIMBÓ FALA" É CRIADA E MANTIDA POR UMA PESSOA FÍSICA, NÃO UMA EMPRESA.
            </p>
            <p className="text-muted-foreground">
              O Timbó Fala é um projeto pessoal desenvolvido e mantido por <strong className="text-foreground">Bruno Eduardo Ochner</strong>, 
              pessoa física, CPF: 096.078.909-06, residente em Timbó, Santa Catarina, Brasil.
            </p>
            <p className="text-muted-foreground">
              Por ser um projeto de pessoa física, a plataforma opera sob as regras do Código Civil Brasileiro 
              e do Marco Civil da Internet (Lei 12.965/2014). O desenvolvedor não possui CNPJ e não é constituído 
              como empresa.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Section 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                1. Aceitação dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Ao criar uma conta ou utilizar o Timbó Fala, você concorda integralmente com estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não utilize a plataforma.
              </p>
              <p>
                Estes termos constituem um contrato vinculante entre você (usuário) e Bruno Eduardo Ochner (desenvolvedor), 
                regido pelas leis brasileiras.
              </p>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                2. Elegibilidade e Cadastro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p><strong className="text-foreground">2.1.</strong> Para utilizar o Timbó Fala, você deve:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ter no mínimo 18 (dezoito) anos de idade completos;</li>
                <li>Fornecer informações verdadeiras, precisas e atualizadas;</li>
                <li>Ser residente ou ter vínculo com a cidade de Timbó e região;</li>
                <li>Não ter sido previamente banido da plataforma;</li>
                <li>Aceitar receber comunicações relacionadas ao serviço.</li>
              </ul>
              <p><strong className="text-foreground">2.2.</strong> Você é responsável por:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter a confidencialidade de sua senha;</li>
                <li>Todas as atividades realizadas com sua conta;</li>
                <li>Notificar imediatamente qualquer uso não autorizado.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-primary" />
                3. Condutas Proibidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>É expressamente PROIBIDO:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Publicar conteúdo ilegal, ofensivo, difamatório, obsceno ou que viole direitos de terceiros;</li>
                <li>Assediar, ameaçar ou intimidar outros usuários;</li>
                <li>Criar perfis falsos ou se passar por outra pessoa;</li>
                <li>Utilizar a plataforma para spam, phishing ou golpes;</li>
                <li>Compartilhar conteúdo sexual envolvendo menores (crime inafiançável);</li>
                <li>Promover violência, discriminação ou discurso de ódio;</li>
                <li>Vender produtos ilegais ou falsificados;</li>
                <li>Manipular avaliações ou sistemas de reputação;</li>
                <li>Tentar burlar sistemas de segurança ou pagamento;</li>
                <li>Usar robôs, scrapers ou automação não autorizada.</li>
              </ul>
              <p className="font-bold text-destructive">
                Violações graves serão reportadas às autoridades competentes.
              </p>
            </CardContent>
          </Card>

          {/* Section 4 - Businesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                4. Termos para Empresas (Marketplace)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p><strong className="text-foreground">4.1. Comissão:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>A plataforma cobra <strong className="text-foreground">7% de comissão</strong> sobre o valor total de cada pedido concluído;</li>
                <li>A comissão é calculada sobre produtos + taxa de entrega;</li>
                <li>O pagamento da comissão deve ser realizado mensalmente;</li>
                <li>O não pagamento pode resultar em suspensão da loja.</li>
              </ul>
              <p><strong className="text-foreground">4.2. Responsabilidades da Empresa:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter informações de produtos atualizadas e verdadeiras;</li>
                <li>Cumprir prazos de entrega informados;</li>
                <li>Responder mensagens de clientes em tempo hábil;</li>
                <li>Emitir nota fiscal quando exigido por lei;</li>
                <li>Resolver disputas diretamente com clientes.</li>
              </ul>
              <p><strong className="text-foreground">4.3.</strong> O Timbó Fala NÃO é responsável por:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Qualidade dos produtos ou serviços oferecidos;</li>
                <li>Atrasos ou falhas na entrega;</li>
                <li>Disputas entre empresas e clientes;</li>
                <li>Problemas com pagamentos diretos (PIX, cartão, dinheiro).</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 5 - Paquera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                5. Termos do Paquera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p><strong className="text-foreground">5.1. Modelo de Cobrança:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Os primeiros <strong className="text-foreground">10 matches/interações são gratuitos</strong>;</li>
                <li>Após atingir o limite, o acesso ilimitado custa <strong className="text-foreground">R$ 29,90 por mês</strong>;</li>
                <li>O pagamento é realizado via PIX com envio de comprovante;</li>
                <li>A liberação ocorre em até 24 horas após confirmação do pagamento;</li>
                <li>A assinatura tem validade de 30 dias corridos.</li>
              </ul>
              <p><strong className="text-foreground">5.2. Regras de Uso:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>É obrigatório ter 18 anos ou mais;</li>
                <li>Fotos devem ser reais e recentes;</li>
                <li>Comportamento respeitoso é obrigatório;</li>
                <li>Matches não garantem encontros pessoais;</li>
                <li>Encontros presenciais são de responsabilidade dos usuários.</li>
              </ul>
              <p className="font-bold text-amber-600">
                O Timbó Fala NÃO realiza verificação de antecedentes criminais. Encontre-se sempre em locais públicos.
              </p>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                6. Limitação de Responsabilidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>O Timbó Fala é fornecido "COMO ESTÁ" e "CONFORME DISPONÍVEL".</p>
              <p><strong className="text-foreground">6.1.</strong> O desenvolvedor NÃO se responsabiliza por:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Interrupções, erros ou falhas no serviço;</li>
                <li>Perda de dados ou conteúdo;</li>
                <li>Danos diretos, indiretos, incidentais ou consequenciais;</li>
                <li>Ações de terceiros ou outros usuários;</li>
                <li>Conteúdo publicado por usuários;</li>
                <li>Transações comerciais entre usuários e empresas;</li>
                <li>Encontros ou interações presenciais entre usuários.</li>
              </ul>
              <p><strong className="text-foreground">6.2.</strong> A responsabilidade máxima do desenvolvedor, em qualquer hipótese, 
              está limitada ao valor pago pelo usuário nos últimos 12 meses.</p>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                7. Suspensão e Encerramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p><strong className="text-foreground">7.1.</strong> O desenvolvedor pode, a seu exclusivo critério:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Suspender ou banir contas que violem estes termos;</li>
                <li>Remover conteúdo inadequado sem aviso prévio;</li>
                <li>Encerrar o serviço com 30 dias de antecedência;</li>
                <li>Modificar funcionalidades a qualquer momento.</li>
              </ul>
              <p><strong className="text-foreground">7.2.</strong> O usuário pode:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encerrar sua conta a qualquer momento;</li>
                <li>Solicitar exclusão de seus dados conforme LGPD;</li>
                <li>Não há reembolso de valores pagos em caso de banimento por violação.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                8. Disposições Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p><strong className="text-foreground">8.1. Lei Aplicável:</strong> Estes termos são regidos pelas leis da República Federativa do Brasil.</p>
              <p><strong className="text-foreground">8.2. Foro:</strong> Fica eleito o foro da Comarca de Timbó, SC, para dirimir quaisquer controvérsias.</p>
              <p><strong className="text-foreground">8.3. Alterações:</strong> Estes termos podem ser alterados a qualquer momento. 
              Alterações significativas serão comunicadas com 15 dias de antecedência.</p>
              <p><strong className="text-foreground">8.4. Contato:</strong> Para dúvidas sobre estes termos, entre em contato através do 
              perfil @admin na plataforma.</p>
            </CardContent>
          </Card>

          {/* Final Notice */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-lg font-medium mb-4">
                Ao utilizar o Timbó Fala, você declara ter lido, compreendido e concordado com todos os termos acima.
              </p>
              <p className="text-sm text-muted-foreground">
                Desenvolvedor: Bruno Eduardo Ochner | CPF: 096.078.909-06 | Timbó, SC
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Link to="/">
            <Button size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Timbó Fala - Desenvolvido por Bruno Eduardo Ochner
        </div>
      </footer>
    </div>
  );
}
