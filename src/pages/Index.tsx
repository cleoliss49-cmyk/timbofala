import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Heart, Sparkles, ArrowRight } from 'lucide-react';

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
        <div className="animate-pulse-soft text-primary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F97316' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        <div className="relative container mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-gradient">Timbó Fala</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero">Criar conta</Button>
              </Link>
            </div>
          </header>

          {/* Hero content */}
          <div className="max-w-4xl mx-auto text-center py-20 md:py-32">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              A rede social da nossa cidade
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6 animate-slide-up">
              Conecte-se com{' '}
              <span className="text-gradient">Timbó</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Uma comunidade digital onde moradores de Timbó e região se encontram para 
              compartilhar momentos, fazer amizades e fortalecer nossa cidade.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth">
                <Button variant="hero" size="xl">
                  Começar agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para você se conectar com sua comunidade
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border animate-fade-in">
              <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-soft">
                <Users className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Comunidade Local</h3>
              <p className="text-muted-foreground">
                Encontre vizinhos, faça novos amigos e fortaleça os laços com sua comunidade.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card border border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 gradient-secondary rounded-2xl flex items-center justify-center mb-4 shadow-soft">
                <MessageCircle className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Chat e Chamadas</h3>
              <p className="text-muted-foreground">
                Converse por mensagens, faça chamadas de voz ou vídeo com seus amigos.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mb-4 shadow-soft">
                <Heart className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Compartilhe Momentos</h3>
              <p className="text-muted-foreground">
                Publique fotos, textos e interaja com as publicações da comunidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-card rounded-3xl p-8 md:p-12 shadow-hover border border-border">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Pronto para fazer parte?
            </h2>
            <p className="text-muted-foreground mb-8">
              Junte-se a milhares de timboenses que já estão conectados.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Criar minha conta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">Timbó Fala</span>
            </div>
            <p>
              Desenvolvido com ❤️ para a comunidade de Timbó
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
