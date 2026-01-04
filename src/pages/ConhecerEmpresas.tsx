import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  Building2, 
  Briefcase, 
  Users, 
  Image, 
  FileText,
  Share2,
  BadgeCheck,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  MessageCircle,
  Star,
  CheckCircle2,
  Sparkles,
  Rocket,
  Target,
  Award,
  BarChart3,
  Clock,
  Heart
} from 'lucide-react';
import { ParticlesBackground } from '@/components/ui/particles';
import { COMPANY_CATEGORIES } from '@/lib/companyCategories';

export default function ConhecerEmpresas() {
  const features = [
    {
      icon: Building2,
      title: "Página Exclusiva",
      description: "Crie uma página profissional completa com logo, descrição, portfólio e todas as informações da sua empresa.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Briefcase,
      title: "Vagas de Emprego",
      description: "Publique vagas ilimitadas e encontre os melhores talentos da região para sua equipe.",
      gradient: "from-violet-500 to-purple-500"
    },
    {
      icon: FileText,
      title: "Publicações",
      description: "Compartilhe novidades, projetos e conquistas. Engaje com a comunidade através de posts.",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      icon: Image,
      title: "Portfólio Visual",
      description: "Exiba seus melhores trabalhos e projetos em uma galeria profissional e organizada.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Users,
      title: "Gestão de Candidaturas",
      description: "Receba e gerencie candidaturas diretamente pela plataforma de forma organizada.",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: Share2,
      title: "Compartilhamento",
      description: "Divulgue sua empresa e vagas facilmente nas redes sociais com links diretos.",
      gradient: "from-indigo-500 to-blue-500"
    }
  ];

  const benefits = [
    { icon: Zap, text: "100% Gratuito, sem taxas ocultas" },
    { icon: Clock, text: "Cadastro em menos de 5 minutos" },
    { icon: Shield, text: "Seus dados protegidos e seguros" },
    { icon: Globe, text: "Visibilidade para toda a região" },
    { icon: TrendingUp, text: "Aumente seu alcance local" },
    { icon: Heart, text: "Apoie a economia da cidade" },
  ];

  const steps = [
    {
      number: "01",
      title: "Crie sua conta",
      description: "Faça login ou cadastre-se na plataforma"
    },
    {
      number: "02",
      title: "Cadastre sua empresa",
      description: "Preencha as informações básicas"
    },
    {
      number: "03",
      title: "Personalize",
      description: "Adicione logo, descrição e portfólio"
    },
    {
      number: "04",
      title: "Publique vagas",
      description: "Comece a encontrar talentos"
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Particles Background */}
      <ParticlesBackground className="fixed inset-0 z-0" />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute w-[1000px] h-[1000px] rounded-full blur-[200px] opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            top: '-20%',
            right: '-30%',
          }}
        />
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(262 83% 58%) 0%, transparent 70%)',
            bottom: '-10%',
            left: '-20%',
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(180 70% 50%) 0%, transparent 70%)',
            top: '40%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">Timbó Fala</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button size="sm" className="shadow-lg shadow-primary/25 gap-2">
                <Sparkles className="w-4 h-4" />
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-20 pb-16 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-sm mb-8 backdrop-blur-sm">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Cadastre sua Empresa</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">100% GRÁTIS</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight mb-6">
              Sua empresa no
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                coração de Timbó
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Crie sua página empresarial, publique vagas, exiba seu portfólio e conecte-se com a comunidade local. 
              Tudo em uma única plataforma, completamente gratuita.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-12">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/25 group">
                  <Rocket className="w-5 h-5 mr-2" />
                  Cadastrar Minha Empresa
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/companies">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg backdrop-blur-sm">
                  Ver Empresas Cadastradas
                </Button>
              </Link>
            </div>

            {/* Benefits Pills */}
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm"
                >
                  <benefit.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-6">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Recursos Completos</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
              Tudo que sua empresa precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas profissionais para destacar sua empresa e encontrar os melhores talentos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-6">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Setores</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
              Todos os segmentos
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sua empresa se encaixa em qualquer categoria
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {COMPANY_CATEGORIES.map((category) => (
              <div
                key={category.value}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl">
                  {category.icon}
                </div>
                <span className="text-sm font-medium text-center">{category.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-4 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Simples e Rápido</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Em apenas 4 passos sua empresa estará online
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/25">
                    <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra Benefits */}
      <section className="py-24 px-4 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-6">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">Diferenciais</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
                Por que escolher nossa plataforma?
              </h2>
              <div className="space-y-4">
                {[
                  { icon: BadgeCheck, text: "Selo de verificação para empresas confirmadas" },
                  { icon: BarChart3, text: "Estatísticas de visualizações e candidaturas" },
                  { icon: MessageCircle, text: "Comunicação direta com candidatos" },
                  { icon: Shield, text: "Ambiente seguro e moderado" },
                  { icon: Globe, text: "Integração com redes sociais" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
                    <Building2 className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">100% Gratuito</h3>
                  <p className="text-muted-foreground">
                    Sem mensalidades, sem comissões, sem surpresas.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-primary">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Para sempre</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mb-6">
                <Rocket className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">Comece Agora</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                Pronto para destacar sua empresa?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Junte-se às empresas que já estão conectadas com a comunidade de Timbó. 
                Cadastro gratuito e em menos de 5 minutos.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/25 group">
                    Cadastrar Minha Empresa
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              <p className="mt-8 text-sm text-muted-foreground">
                Já tem uma conta? <Link to="/auth" className="text-primary hover:underline">Faça login</Link>
              </p>
            </CardContent>
            
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Timbó Fala</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Timbó Fala. Feito com ❤️ para nossa comunidade.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
