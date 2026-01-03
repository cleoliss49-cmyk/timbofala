import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  MessageCircle, ArrowLeft, Home, Users, Store, Calendar, 
  Heart, ShoppingBag, Gavel, BarChart3, MessageSquare, Bell,
  Search, Bookmark, Settings, Shield, MapPin, Sparkles,
  Package, Star, Clock, CreditCard, Truck
} from 'lucide-react';

const features = [
  {
    icon: Home,
    title: 'Feed',
    description: 'Veja publicações de toda a comunidade de Timbó. Compartilhe momentos, fotos e textos com seus vizinhos.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: MessageSquare,
    title: 'Mensagens',
    description: 'Converse em tempo real com outros usuários. Chat privado com envio de texto e áudio.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Search,
    title: 'Explorar',
    description: 'Descubra novos perfis, posts e conteúdos. Encontre pessoas e negócios da sua cidade.',
    color: 'from-purple-500 to-violet-500'
  },
  {
    icon: Store,
    title: 'Comércios',
    description: 'Encontre lojas e negócios locais. Veja produtos, faça pedidos e apoie o comércio de Timbó.',
    color: 'from-emerald-500 to-green-500'
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Compre e venda produtos usados ou novos. Negocie diretamente com outros moradores.',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: Calendar,
    title: 'Eventos',
    description: 'Fique por dentro de tudo que acontece na cidade. Shows, festas, eventos culturais e mais.',
    color: 'from-rose-500 to-pink-500'
  },
  {
    icon: Heart,
    title: 'Paquera',
    description: 'Encontre pessoas especiais perto de você. Dê likes, receba matches e comece conversas.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Users,
    title: 'Comunidade',
    description: 'Grupos e discussões sobre temas da cidade. Participe de debates e conheça pessoas.',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Gavel,
    title: 'Leilões',
    description: 'Crie leilões para vender itens. Defina valor inicial e deixe a comunidade dar lances.',
    color: 'from-amber-500 to-yellow-500'
  },
  {
    icon: BarChart3,
    title: 'Enquetes',
    description: 'Crie enquetes e descubra a opinião da comunidade sobre qualquer assunto.',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Bell,
    title: 'Notificações',
    description: 'Receba alertas de curtidas, comentários, mensagens, matches e pedidos.',
    color: 'from-red-500 to-rose-500'
  },
  {
    icon: Bookmark,
    title: 'Salvos',
    description: 'Salve posts para ver depois. Organize seu conteúdo favorito.',
    color: 'from-teal-500 to-cyan-500'
  },
  {
    icon: Settings,
    title: 'Configurações',
    description: 'Personalize sua experiência. Privacidade, notificações e preferências.',
    color: 'from-gray-500 to-slate-500'
  },
  {
    icon: Shield,
    title: 'Segurança',
    description: 'Sistema de denúncias, moderação e proteção. Sua segurança é prioridade.',
    color: 'from-green-600 to-emerald-600'
  }
];

const howToOrder = [
  {
    icon: Store,
    title: '1. Escolha a Loja',
    description: 'Navegue pelos comércios de Timbó e escolha onde comprar.'
  },
  {
    icon: Package,
    title: '2. Adicione ao Carrinho',
    description: 'Selecione os produtos desejados e adicione ao seu carrinho.'
  },
  {
    icon: Truck,
    title: '3. Entrega ou Retirada',
    description: 'Escolha se quer receber em casa ou retirar na loja.'
  },
  {
    icon: CreditCard,
    title: '4. Pagamento',
    description: 'Pague via PIX, cartão ou dinheiro na entrega/retirada.'
  },
  {
    icon: Clock,
    title: '5. Acompanhe',
    description: 'Veja o status do pedido e tempo estimado em tempo real.'
  },
  {
    icon: Star,
    title: '6. Avalie',
    description: 'Após receber, avalie a loja e ajude outros usuários.'
  }
];

export default function ConhecerPlataforma() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium">Guia Completo</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Conheça o <span className="text-primary">Timbó Fala</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa saber sobre a rede social da nossa cidade. 
            Explore todas as funcionalidades e aproveite ao máximo!
          </p>
        </div>

        {/* All Features Grid */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Funcionalidades
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

        {/* How to Order */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Como Fazer Pedidos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {howToOrder.map((step, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/50">
          <h2 className="text-2xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crie sua conta gratuita e faça parte da maior comunidade de Timbó!
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-12 px-8">
              Criar minha conta grátis
            </Button>
          </Link>
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
