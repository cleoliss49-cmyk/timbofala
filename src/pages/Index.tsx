import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  ArrowRight, 
  Sparkles,
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
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center animate-pulse shadow-2xl">
            <MessageCircle className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-25"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            top: '-30%',
            right: '-20%',
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(262 83% 58%) 0%, transparent 70%)',
            bottom: '-20%',
            left: '-15%',
          }}
        />
      </div>

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
            <Link to="/conhecer">
              <Button variant="ghost" size="sm">
                Conhecer
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="shadow-lg shadow-primary/25">
                Entrar
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Single Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-16 relative z-10">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium">A rede social de Timbó</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight mb-6">
            Conecte-se
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              com Timbó
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Compartilhe momentos, descubra eventos, apoie o comércio local e conheça pessoas. 
            Tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/25 group">
                Criar minha conta
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/conhecer">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg">
                Saiba mais
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link to="/conhecer-empresas">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                🏢 Cadastrar Empresa Grátis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            100% gratuito • Feito para nossa comunidade
          </p>
        </div>
      </section>
    </div>
  );
}