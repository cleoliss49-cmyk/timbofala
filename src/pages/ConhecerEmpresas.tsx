import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  MessageCircle, ArrowLeft, Store, Package, CreditCard, 
  Truck, Clock, Star, Settings, BarChart3, Tag, Users,
  Wallet, MapPin, Bell, MessageSquare, Camera, Sparkles,
  CheckCircle, TrendingUp, Shield, Zap, DollarSign, Percent
} from 'lucide-react';

const benefits = [
  {
    icon: Users,
    title: 'Alcance Local',
    description: 'Conecte-se com milhares de moradores de Timbó que usam o app diariamente.'
  },
  {
    icon: DollarSign,
    title: '100% Gratuito',
    description: 'Sem taxas de adesão, mensalidade ou comissão sobre vendas. Você fica com tudo!'
  },
  {
    icon: Zap,
    title: 'Pedidos em Tempo Real',
    description: 'Receba notificações instantâneas quando um cliente fizer um pedido.'
  },
  {
    icon: Shield,
    title: 'Pagamento Direto',
    description: 'O cliente paga diretamente para você. Não intermediamos pagamentos.'
  }
];

const features = [
  {
    icon: Store,
    title: 'Perfil da Loja',
    description: 'Crie uma vitrine completa com logo, capa, descrição, horários de funcionamento e informações de contato.',
    color: 'from-emerald-500 to-green-500'
  },
  {
    icon: Package,
    title: 'Catálogo de Produtos',
    description: 'Adicione produtos ilimitados com fotos, descrição, preço e promoções. Organize por categorias.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: CreditCard,
    title: 'Métodos de Pagamento',
    description: 'Aceite PIX (direto na sua conta), cartão de débito/crédito e dinheiro na entrega ou retirada.',
    color: 'from-purple-500 to-violet-500'
  },
  {
    icon: Truck,
    title: 'Entregas e Retirada',
    description: 'Configure taxas de entrega por bairro ou ofereça retirada no local. Você escolhe!',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: Clock,
    title: 'Tempo de Preparo',
    description: 'Defina o tempo médio de preparo. O cliente verá um cronômetro após o pedido ser aceito.',
    color: 'from-rose-500 to-pink-500'
  },
  {
    icon: Bell,
    title: 'Notificações',
    description: 'Receba alertas em tempo real de novos pedidos, mensagens de clientes e avaliações.',
    color: 'from-red-500 to-rose-500'
  },
  {
    icon: MessageSquare,
    title: 'Chat com Cliente',
    description: 'Converse com seus clientes pelo chat integrado ao pedido. Tire dúvidas e informe sobre o pedido.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Star,
    title: 'Avaliações',
    description: 'Receba avaliações dos clientes e construa sua reputação. Responda aos comentários.',
    color: 'from-amber-500 to-yellow-500'
  },
  {
    icon: Percent,
    title: 'Cupons de Desconto',
    description: 'Crie cupons promocionais para atrair novos clientes e fidelizar os antigos.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: MapPin,
    title: 'Zonas de Entrega',
    description: 'Configure taxas de entrega diferentes para cada bairro de Timbó.',
    color: 'from-teal-500 to-cyan-500'
  },
  {
    icon: BarChart3,
    title: 'Gestão de Pedidos',
    description: 'Acompanhe todos os pedidos: pendentes, em preparo, prontos, entregues e rejeitados.',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Camera,
    title: 'Galeria de Produtos',
    description: 'Adicione múltiplas fotos por produto para mostrar todos os ângulos e detalhes.',
    color: 'from-violet-500 to-purple-500'
  }
];

const steps = [
  {
    number: '1',
    title: 'Crie sua Conta',
    description: 'Cadastre-se gratuitamente no Timbó Fala com seu e-mail.'
  },
  {
    number: '2',
    title: 'Configure sua Loja',
    description: 'Adicione informações, logo, horários e configure pagamentos.'
  },
  {
    number: '3',
    title: 'Adicione Produtos',
    description: 'Crie seu catálogo com fotos, preços e descrições.'
  },
  {
    number: '4',
    title: 'Comece a Vender',
    description: 'Receba pedidos e gerencie tudo pelo app!'
  }
];

export default function ConhecerEmpresas() {
  // Scroll to top on mount
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
          <Link to="/auth">
            <Button>Criar Conta</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm mb-6">
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-600 font-medium">Para Empresas</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Venda para toda <span className="text-primary">Timbó</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Crie sua loja virtual gratuita, receba pedidos online e aumente suas vendas. 
            Sem taxas, sem comissões - você fica com 100% do valor!
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-700">
              <Store className="w-5 h-5 mr-2" />
              Criar Minha Loja Grátis
            </Button>
          </Link>
        </div>

        {/* Benefits */}
        <section className="mb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-muted/50 border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Como Funciona</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Recursos para sua Loja
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Payment Methods */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Formas de Pagamento
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Card className="border-2 border-green-500/30 bg-green-500/5">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>PIX</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Receba instantaneamente direto na sua conta. Sem intermediários, sem taxas!
                </p>
                <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Recomendado
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>Cartão</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Aceite débito e crédito. Cliente paga na entrega ou retirada com sua maquininha.
                </p>
                <div className="text-xs text-muted-foreground">
                  Débito e Crédito
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-amber-600" />
                </div>
                <CardTitle>Dinheiro</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Cliente paga em espécie na entrega ou retirada do pedido.
                </p>
                <div className="text-xs text-muted-foreground">
                  Na entrega ou retirada
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
          <Store className="w-16 h-16 mx-auto mb-6 text-emerald-600" />
          <h2 className="text-2xl font-bold mb-4">Pronto para vender mais?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crie sua loja virtual gratuita em minutos e comece a receber pedidos de toda Timbó!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700">
                <Store className="w-5 h-5 mr-2" />
                Criar Minha Loja Grátis
              </Button>
            </Link>
            <Link to="/empresas">
              <Button size="lg" variant="outline" className="h-12 px-8">
                Ver Lojas de Exemplo
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Timbó Fala - A rede social de Timbó, SC
        </div>
      </footer>
    </div>
  );
}
