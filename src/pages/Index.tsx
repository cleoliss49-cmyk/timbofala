import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ParticlesBackground } from '@/components/ui/particles';
import { 
  MessageCircle, 
  ArrowRight, 
  Smartphone, 
  Apple, 
  Monitor,
  Users,
  ShieldCheck,
  Zap,
  Heart
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
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Users,
      title: 'Comunidade Local',
      description: 'Conecte-se com vizinhos, amigos e comerciantes de Timbó.',
    },
    {
      icon: ShieldCheck,
      title: 'Seguro e Privado',
      description: 'Seus dados protegidos com as melhores práticas de segurança.',
    },
    {
      icon: Zap,
      title: 'Rápido e Moderno',
      description: 'Experiência fluida e instantânea em qualquer dispositivo.',
    },
    {
      icon: Heart,
      title: 'Paquera',
      description: 'Encontre pessoas especiais na sua cidade com nosso recurso de paquera.',
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <ParticlesBackground className="fixed inset-0 pointer-events-none z-0" />
      
      <div className="relative z-10">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
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

          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center py-16 md:py-24">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] mb-8 animate-slide-up">
              Conecte-se com{' '}
              <span className="text-gradient-premium">Timbó</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
              A rede social da nossa cidade. Compartilhe momentos, encontre eventos, faça negócios e conheça pessoas.
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
          </div>

          {/* Features Section */}
          <div className="py-16 md:py-24">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12 animate-slide-up">
              Por que usar o <span className="text-gradient">Timbó Fala</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:bg-card/80 transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Download Section */}
          <div className="py-16 md:py-24">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-8 md:p-12 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Baixe o <span className="text-gradient">Timbó Fala</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Disponível para todos os seus dispositivos. Baixe agora e comece a se conectar com Timbó.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Android Button */}
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto gap-3 h-14 px-6"
                  onClick={() => window.open('#', '_blank')}
                >
                  <Smartphone className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Baixar para</div>
                    <div className="font-semibold">Android</div>
                  </div>
                </Button>

                {/* iOS Button */}
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto gap-3 h-14 px-6"
                  onClick={() => window.open('#', '_blank')}
                >
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Baixar para</div>
                    <div className="font-semibold">iOS</div>
                  </div>
                </Button>

                {/* Windows Button */}
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto gap-3 h-14 px-6"
                  onClick={() => window.open('#', '_blank')}
                >
                  <Monitor className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Baixar para</div>
                    <div className="font-semibold">Windows</div>
                  </div>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                * Apps em breve disponíveis nas lojas oficiais
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-gradient">Timbó Fala</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Timbó Fala. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
