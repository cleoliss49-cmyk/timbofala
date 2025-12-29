import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Users, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe,
  CheckCircle,
  Star
} from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/feed');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <div className="relative">
        {/* Background effects */}
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative container mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-16 md:mb-24">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-glow animate-float">
                <MessageCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-gradient">Timbó Fala</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="lg">Entrar</Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" size="lg">Criar conta</Button>
              </Link>
            </div>
          </header>

          {/* Hero content */}
          <div className="max-w-5xl mx-auto text-center py-12 md:py-20">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8 animate-fade-in border border-primary/20">
              <Sparkles className="w-4 h-4" />
              A rede social da nossa cidade
              <Star className="w-4 h-4 fill-primary" />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] mb-8 animate-slide-up">
              Conecte-se com{' '}
              <span className="text-gradient-premium">Timbó</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
              Uma comunidade digital vibrante onde moradores se encontram para 
              compartilhar momentos, fazer amizades e fortalecer nossa cidade.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth">
                <Button variant="hero" size="xl" className="group">
                  Começar agora
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="glass" size="xl">
                  Já tenho conta
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">1.2K+</p>
                <p className="text-muted-foreground">Usuários</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-display font-bold text-secondary">5K+</p>
                <p className="text-muted-foreground">Publicações</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-display font-bold text-accent">50+</p>
                <p className="text-muted-foreground">Eventos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-24 bg-muted/30 relative">
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para conectar você à sua comunidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                title: 'Comunidade Local',
                description: 'Encontre vizinhos, faça amizades e conecte-se com pessoas da sua cidade.',
                gradient: 'gradient-primary',
              },
              {
                icon: MessageCircle,
                title: 'Chat & Chamadas',
                description: 'Converse por mensagens, faça chamadas de voz ou vídeo.',
                gradient: 'gradient-secondary',
              },
              {
                icon: Heart,
                title: 'Compartilhe Momentos',
                description: 'Publique fotos, textos e interaja com a comunidade.',
                gradient: 'gradient-premium',
              },
              {
                icon: Globe,
                title: 'Eventos Locais',
                description: 'Descubra e participe de eventos na sua cidade.',
                gradient: 'gradient-primary',
              },
              {
                icon: Zap,
                title: 'Marketplace',
                description: 'Compre e venda produtos na sua comunidade.',
                gradient: 'gradient-secondary',
              },
              {
                icon: Shield,
                title: 'Seguro & Privado',
                description: 'Seus dados protegidos com as melhores práticas.',
                gradient: 'gradient-premium',
              },
            ].map((feature, i) => (
              <div 
                key={feature.title}
                className="bg-card rounded-3xl p-8 shadow-card border border-border hover-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-16 h-16 ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-soft`}>
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Por que escolher o{' '}
                <span className="text-gradient">Timbó Fala</span>?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Desenvolvido especialmente para a nossa comunidade, com foco em conexões reais e interações significativas.
              </p>

              <div className="space-y-4">
                {[
                  'Focado na comunidade local',
                  'Interface intuitiva e moderna',
                  'Segurança e privacidade garantidas',
                  'Eventos e marketplace integrados',
                  'Chat e chamadas de vídeo',
                  'Suporte a denúncias e moderação',
                ].map((benefit, i) => (
                  <div 
                    key={benefit} 
                    className="flex items-center gap-3 animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20" />
              <div className="relative bg-card rounded-3xl p-8 shadow-premium border border-border">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 gradient-hero rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-float">
                    <MessageCircle className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-display font-bold">Junte-se agora</h3>
                  <p className="text-muted-foreground">É gratuito e sempre será</p>
                </div>

                <Link to="/auth" className="block">
                  <Button variant="hero" size="xl" className="w-full mb-4">
                    Criar minha conta
                  </Button>
                </Link>

                <p className="text-center text-sm text-muted-foreground">
                  Ao criar uma conta, você concorda com nossos termos de uso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-gradient">Timbó Fala</span>
            </div>
            <p className="text-muted-foreground text-center">
              Desenvolvido com ❤️ para a comunidade de Timbó
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Timbó Fala
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
