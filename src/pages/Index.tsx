import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  ArrowRight, 
  Smartphone, 
  Apple, 
  Monitor,
  Users,
  ShieldCheck,
  Zap,
  Heart,
  Store,
  Calendar,
  MapPin,
  ChevronDown,
  Sparkles,
  Globe,
  MessageSquare,
  CheckCircle
} from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      navigate('/feed');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center animate-pulse shadow-2xl">
            <MessageCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="h-1 w-32 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Users,
      title: 'Comunidade',
      description: 'Conecte-se com vizinhos e amigos da sua cidade.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Store,
      title: 'Comércios',
      description: 'Descubra e apoie os negócios locais de Timbó.',
      color: 'from-emerald-500 to-green-500'
    },
    {
      icon: Calendar,
      title: 'Eventos',
      description: 'Fique por dentro de tudo que acontece na cidade.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: Heart,
      title: 'Paquera',
      description: 'Encontre pessoas especiais perto de você.',
      color: 'from-rose-500 to-pink-500'
    },
  ];

  const stats = [
    { value: '10K+', label: 'Usuários' },
    { value: '500+', label: 'Comércios' },
    { value: '2K+', label: 'Eventos' },
    { value: '100%', label: 'Timbó' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            top: '-20%',
            right: '-10%',
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)',
            bottom: '-10%',
            left: '-10%',
            transform: `translateY(${-scrollY * 0.05}px)`
          }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>
      
      <div className="relative z-10">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold">Timbó Fala</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                  Começar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div className="text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">A rede social de Timbó</span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight">
                  Conecte-se
                  <br />
                  <span className="relative">
                    <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                      com Timbó
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                      <path d="M2 8 Q 100 2 198 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
                    </svg>
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Compartilhe momentos, descubra eventos, apoie o comércio local e conheça pessoas. 
                  Tudo em um só lugar, feito para nossa comunidade.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link to="/auth">
                    <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 group">
                      Criar minha conta
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-border/50 hover:bg-muted/50">
                      Já tenho conta
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="pt-8 grid grid-cols-4 gap-4 max-w-md mx-auto lg:mx-0">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Phone mockup */}
              <div className="hidden lg:flex justify-center items-center">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-[3rem] blur-3xl scale-75" />
                  
                  {/* Phone frame */}
                  <div className="relative w-[280px] h-[560px] bg-gradient-to-b from-foreground/10 to-foreground/5 rounded-[3rem] p-3 border border-border/50 shadow-2xl">
                    <div className="w-full h-full bg-background rounded-[2.25rem] overflow-hidden relative">
                      {/* Phone notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground/90 rounded-b-2xl z-10" />
                      
                      {/* App content */}
                      <div className="pt-10 px-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                              <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-sm">Timbó Fala</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-muted" />
                        </div>
                        
                        {/* Mock posts */}
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-muted/50 rounded-2xl p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50" />
                              <div className="flex-1">
                                <div className="h-2.5 w-20 bg-foreground/20 rounded" />
                                <div className="h-2 w-12 bg-foreground/10 rounded mt-1" />
                              </div>
                            </div>
                            <div className="h-20 bg-gradient-to-br from-muted to-muted/50 rounded-xl" />
                            <div className="flex gap-4">
                              <div className="h-2 w-8 bg-foreground/10 rounded" />
                              <div className="h-2 w-8 bg-foreground/10 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating elements */}
                  <div className="absolute -right-8 top-20 bg-background border border-border rounded-2xl p-3 shadow-xl animate-float">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-rose-500/10 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="text-sm font-medium">Novo match!</div>
                    </div>
                  </div>
                  
                  <div className="absolute -left-8 bottom-32 bg-background border border-border rounded-2xl p-3 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <Store className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-sm font-medium">Pedido pronto</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scroll indicator */}
            <div className="flex justify-center mt-16 animate-bounce">
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
                Tudo que você precisa
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Uma plataforma completa pensada para conectar e fortalecer nossa comunidade
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group relative bg-card hover:bg-card/80 border border-border/50 rounded-3xl p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Timbó Section */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
          <div className="container mx-auto max-w-6xl relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">Nossa cidade</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
                  Feito para
                  <br />
                  <span className="text-primary">Timbó, SC</span>
                </h2>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Uma rede social exclusiva para os moradores de Timbó e região. 
                  Aqui você encontra seus vizinhos, descobre o que está acontecendo 
                  na cidade e apoia os negócios locais.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  {['Comunidade', 'Segurança', 'Local', 'Gratuito'].map((tag) => (
                    <span key={tag} className="px-4 py-2 bg-muted rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-card border border-border/50 rounded-3xl p-6 h-40 flex flex-col justify-end">
                    <Globe className="w-8 h-8 text-primary mb-2" />
                    <div className="font-bold">100% Local</div>
                    <div className="text-sm text-muted-foreground">Feito para nossa região</div>
                  </div>
                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-3xl p-6 h-48 flex flex-col justify-end">
                    <ShieldCheck className="w-8 h-8 text-primary mb-2" />
                    <div className="font-bold">Seguro</div>
                    <div className="text-sm text-muted-foreground">Seus dados protegidos</div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 rounded-3xl p-6 h-48 flex flex-col justify-end">
                    <MessageSquare className="w-8 h-8 text-primary mb-2" />
                    <div className="font-bold">Conectado</div>
                    <div className="text-sm text-muted-foreground">Chat em tempo real</div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-3xl p-6 h-40 flex flex-col justify-end">
                    <Zap className="w-8 h-8 text-primary mb-2" />
                    <div className="font-bold">Rápido</div>
                    <div className="text-sm text-muted-foreground">Experiência fluida</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-border/50 rounded-[2rem] p-8 sm:p-12 text-center overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/25">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                  Baixe o App
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Disponível em breve para todos os seus dispositivos. 
                  Use agora pelo navegador!
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button variant="outline" size="lg" className="h-14 px-6 gap-3" disabled>
                    <Smartphone className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-[10px] text-muted-foreground leading-none">Em breve</div>
                      <div className="font-semibold">Android</div>
                    </div>
                  </Button>

                  <Button variant="outline" size="lg" className="h-14 px-6 gap-3" disabled>
                    <Apple className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-[10px] text-muted-foreground leading-none">Em breve</div>
                      <div className="font-semibold">iOS</div>
                    </div>
                  </Button>

                  <Button variant="outline" size="lg" className="h-14 px-6 gap-3" disabled>
                    <Monitor className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-[10px] text-muted-foreground leading-none">Em breve</div>
                      <div className="font-semibold">Windows</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-background to-emerald-500/5">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Para Empresas</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
                  Leve seu negócio
                  <br />
                  <span className="text-emerald-600">para o digital</span>
                </h2>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Crie sua loja virtual gratuita, receba pedidos online e aumente suas vendas. 
                  Sem taxas, sem comissões - você fica com 100% do valor!
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>100% Gratuito</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Sem Taxas</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Pedidos em Tempo Real</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/conhecer-empresas">
                    <Button size="lg" className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 group">
                      <Store className="w-5 h-5 mr-2" />
                      Conhecer para Empresas
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/conhecer">
                    <Button size="lg" variant="outline" className="h-12 px-6">
                      Conhecer Plataforma
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-3xl blur-3xl" />
                  <div className="relative bg-card border border-border/50 rounded-3xl p-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <Store className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Sua Loja Aqui</h3>
                        <p className="text-sm text-muted-foreground">Categoria • Timbó, SC</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square bg-muted rounded-xl" />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                        Fazer Pedido
                      </div>
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6">
              Pronto para fazer parte?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Junte-se a milhares de timboenses que já estão conectados. É grátis!
            </p>
            <Link to="/auth">
              <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 group">
                Criar minha conta grátis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">Timbó Fala</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link to="/conhecer" className="hover:text-foreground transition-colors">
                  Conhecer Plataforma
                </Link>
                <Link to="/conhecer-empresas" className="hover:text-foreground transition-colors">
                  Para Empresas
                </Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacidade
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Timbó Fala
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
