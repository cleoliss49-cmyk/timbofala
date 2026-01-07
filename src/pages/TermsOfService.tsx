import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, ArrowLeft, Shield, FileText, AlertTriangle, 
  User, CreditCard, Bug, Scale, Trash2, Settings
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
              O Timbó Fala (O Seu Desenvolvedor) é uma plataforma digital independente, idealizada, desenvolvida e mantida por pessoa física, não constituindo empresa, não possuindo CNPJ e não oferecendo garantias comerciais, legais, profissionais ou pessoais.
            </p>
            <p className="text-muted-foreground">
              Alguns recursos da plataforma podem ser oferecidos de forma paga, com pagamentos realizados diretamente via PIX, utilizando a chave de e-mail fornecida pelo desenvolvedor.
            </p>
            <p className="text-muted-foreground">
              A plataforma encontra-se em fase <strong className="text-foreground">BETA</strong>, podendo sofrer alterações, instabilidades, falhas técnicas, interrupções temporárias ou permanentes, ou remoção de qualquer funcionalidade sem aviso prévio.
            </p>
            <p className="font-semibold text-foreground">
              Ao acessar ou utilizar o Timbó Fala, o usuário declara que leu, compreendeu, aceita integralmente estes termos e reconhece todos os riscos decorrentes do uso da plataforma.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Section 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                1. Uso Responsável da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>O usuário concorda em:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Não publicar conteúdo ilegal, ofensivo, discriminatório, difamatório ou que viole direitos de terceiros</li>
                <li>Manter comportamento ético, respeitoso e consensual</li>
                <li>Não praticar assédio, intimidação, perseguição ou qualquer forma de violência</li>
                <li>Não divulgar informações falsas, enganosas ou que causem desinformação</li>
                <li>Não praticar spam, autopromoção ou propaganda sem autorização expressa</li>
                <li>Não explorar falhas técnicas ou comprometer a segurança da plataforma</li>
              </ul>
              <p className="font-bold text-destructive">
                Qualquer violação pode resultar em suspensão, exclusão de conteúdos ou contas, relato às autoridades competentes, e eventual ação judicial contra o usuário, sem aviso prévio.
              </p>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                2. Conteúdo Gerado por Usuários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Todo conteúdo publicado é de responsabilidade exclusiva do usuário</li>
                <li>Timbó Fala (O Seu Desenvolvedor) não se responsabiliza por opiniões, comentários, dados ou informações publicadas por usuários</li>
                <li>A plataforma pode remover conteúdos, limitar funcionalidades ou excluir contas a qualquer momento, sem aviso prévio</li>
                <li>O usuário reconhece que qualquer expectativa de revisão, recuperação ou reparação de conteúdo perdido é nula</li>
                <li>Mensagens, fotos, vídeos, textos, perfis e interações são responsabilidade total do usuário, mesmo que envolvam terceiros</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                3. Serviços Pagos e Cobranças
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Alguns recursos podem exigir pagamento; valores e condições serão informados claramente antes da contratação</li>
                <li>O pagamento garante apenas acesso à funcionalidade, não garantindo resultados, matches, interações, continuidade ou funcionamento perfeito</li>
                <li>Timbó Fala (O Seu Desenvolvedor) pode alterar preços, planos, funcionalidades, limites e condições de pagamento a qualquer momento, inclusive para usuários existentes</li>
                <li>O usuário entende que pagamentos não criam direito a reembolso por falhas técnicas, perda de dados, bugs ou indisponibilidade, salvo exigido por lei</li>
                <li>Cobranças futuras, alterações de valores ou inclusão de funcionalidades pagas não geram obrigação de aviso prévio ou ressarcimento</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-primary" />
                4. Projeto BETA, Falhas e Limitações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>O Paquera e demais funcionalidades estão em fase BETA</li>
                <li>A plataforma pode apresentar erros, lentidão, instabilidade, falhas técnicas, indisponibilidade temporária ou permanente</li>
                <li>Funcionalidades podem ser modificadas, adicionadas ou removidas a qualquer momento</li>
                <li>Dados, conteúdos ou contas podem ser perdidos ou corrompidos permanentemente</li>
                <li>O usuário reconhece que não há garantia de operação contínua ou segura</li>
                <li>O usuário assume responsabilidade total por backups ou preservação de dados</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                5. Isenção de Responsabilidade Absoluta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Timbó Fala (O Seu Desenvolvedor) não se responsabiliza, sob qualquer hipótese, por qualquer dano, perda, prejuízo, conflito, evento, expectativa frustrada ou consequência legal, incluindo, mas não limitado a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Danos físicos, emocionais, psicológicos, morais, materiais ou financeiros</li>
                <li>Perdas de oportunidades comerciais, receitas ou ganhos</li>
                <li>Conflitos, assédio, perseguição, bullying, fraude ou manipulação de terceiros</li>
                <li>Mensagens, perfis, matches, fotos, vídeos ou qualquer conteúdo enviado por usuários</li>
                <li>Eventos ocorridos dentro ou fora da plataforma, presenciais ou digitais</li>
                <li>Problemas relacionados a menores de idade, engenharia social, hackers, invasões ou falhas técnicas</li>
                <li>Expectativas de resultados, relacionamentos, encontros ou correspondências</li>
              </ul>
              <p className="font-bold text-foreground mt-4">
                O usuário indeniza e isenta integralmente Timbó Fala (O Seu Desenvolvedor) de todas as reclamações, ações judiciais, demandas, custas, multas ou consequências legais.
              </p>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-primary" />
                6. Moderação, Remoção e Exclusão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Perfis, mensagens, matches, conteúdos, contas e funcionalidades podem ser limitados, removidos ou excluídos a qualquer momento, sem aviso prévio</li>
                <li>Decisões da plataforma são definitivas, irrevogáveis e não contestáveis</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                7. Alterações dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Estes termos podem ser modificados a qualquer momento, sem aviso prévio</li>
                <li>O uso contínuo da plataforma após alterações implica aceitação automática e irrevogável da versão vigente</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                8. Reconhecimento Absoluto do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>O usuário confirma que:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Compreende que Timbó Fala é projeto independente, BETA, mantido por pessoa física (O Seu Desenvolvedor)</li>
                <li>Reconhece que não é empresa, não possui CNPJ, não oferece garantias comerciais ou legais</li>
                <li>Aceita que todos os riscos e responsabilidades são exclusivamente seus</li>
                <li>Declara que nenhuma expectativa de resultado, match, relacionamento ou responsabilidade judicial poderá ser exigida contra Timbó Fala (O Seu Desenvolvedor)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Final Notice */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-lg font-medium mb-4">
                Ao se cadastrar, o usuário declara ter lido, compreendido e concordado com todos os termos acima.
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
          © {new Date().getFullYear()} Timbó Fala - O Seu Desenvolvedor
        </div>
      </footer>
    </div>
  );
}
