import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, ArrowLeft, Store, Building2, Briefcase, 
  Users, MapPin, Globe, Rocket, Award, TrendingUp,
  CheckCircle, Shield, Zap, Star, ArrowRight,
  Sparkles, BarChart3, Clock, Heart, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { COMPANY_CATEGORIES } from '@/lib/companyCategories';

const benefits = [
  {
    icon: Globe,
    title: 'Presença Digital Gratuita',
    description: 'Crie seu perfil empresarial completo sem nenhum custo. 100% gratuito, sempre.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Users,
    title: 'Alcance Milhares',
    description: 'Conecte-se com toda a comunidade de Timbó que usa o app diariamente.',
    gradient: 'from-emerald-500 to-green-500'
  },
  {
    icon: Briefcase,
    title: 'Publique Vagas',
    description: 'Encontre os melhores talentos locais. Publique vagas e receba candidaturas.',
    gradient: 'from-purple-500 to-violet-500'
  },
  {
    icon: Award,
    title: 'Destaque-se',
    description: 'Mostre seus serviços, portfólio e diferenciais para toda a cidade.',
    gradient: 'from-amber-500 to-orange-500'
  }
];

const features = [
  {
    icon: Building2,
    title: 'Perfil Empresarial',
    description: 'Página completa com logo, descrição, contatos, redes sociais e localização.',
  },
  {
    icon: Briefcase,
    title: 'Gestão de Vagas',
    description: 'Publique vagas, gerencie candidaturas e encontre talentos da região.',
  },
  {
    icon: Star,
    title: 'Portfólio',
    description: 'Mostre seus melhores trabalhos e projetos em uma galeria profissional.',
  },
  {
    icon: BarChart3,
    title: 'Serviços',
    description: 'Liste todos os serviços que sua empresa oferece com descrições detalhadas.',
  },
  {
    icon: MapPin,
    title: 'Localização',
    description: 'Apareça para quem busca empresas no seu bairro ou categoria.',
  },
  {
    icon: Heart,
    title: 'Engajamento',
    description: 'Receba contatos, mensagens e interesse diretamente pelo app.',
  }
];

const steps = [
  { number: '01', title: 'Crie sua Conta', description: 'Cadastre-se gratuitamente em poucos segundos.' },
  { number: '02', title: 'Configure o Perfil', description: 'Adicione informações, logo e contatos.' },
  { number: '03', title: 'Publique Vagas', description: 'Se precisar, encontre talentos locais.' },
  { number: '04', title: 'Conecte-se', description: 'Receba contatos e cresça na comunidade.' },
];

export default function ConhecerEmpresas() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-[1000px] h-[1000px] rounded-full blur-[150px] opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(142 76% 36%) 0%, transparent 70%)',
            top: '-30%',
            right: '-20%',
          }}
        />
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(262 83% 58%) 0%, transparent 70%)',
            bottom: '-20%',
            left: '-15%',
          }}
        />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
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
          <div className="flex gap-2">
            <Link to="/conhecer">
              <Button variant="ghost" size="sm">
                <Store className="w-4 h-4 mr-1" />
                Comércios
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[90vh] flex items-center justify-center px-4 py-20">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">Para Empresas e Prestadores de Serviço</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight">
                Sua empresa em
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 bg-clip-text text-transparent">
                    destaque
                  </span>
                  <motion.div 
                    className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-full blur-sm"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Crie seu perfil empresarial <strong className="text-foreground">100% gratuito</strong>, 
                publique vagas, mostre seus serviços e conecte-se com toda Timbó.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4">
                <Link to="/auth">
                  <Button size="lg" className="h-16 px-10 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-500/30 group">
                    <Rocket className="w-5 h-5 mr-2" />
                    Cadastrar Minha Empresa
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/companies">
                  <Button size="lg" variant="outline" className="h-16 px-10 text-lg border-2">
                    Ver Empresas
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 pt-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">100% Gratuito</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">Sem Taxas</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">Cadastro em 2 min</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
                Por que estar aqui?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Benefícios exclusivos para empresas e prestadores de serviço
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-card hover:bg-card/80 border border-border/50 rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-sm mb-6">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="text-purple-600 font-semibold">+20 Categorias</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
                Para todo tipo de empresa
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Independente do seu segmento, temos espaço para você
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3">
              {COMPANY_CATEGORIES.slice(0, 16).map((category, index) => (
                <motion.div
                  key={category.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  className="px-5 py-3 rounded-full bg-muted/50 border border-border/50 text-sm font-medium hover:bg-muted hover:border-primary/30 transition-all cursor-default"
                >
                  {category.label}
                </motion.div>
              ))}
              <div className="px-5 py-3 rounded-full bg-primary/10 border border-primary/30 text-sm font-medium text-primary">
                E muito mais...
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4 flex items-center justify-center gap-3">
                <Sparkles className="w-10 h-10 text-primary" />
                Recursos Completos
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para destacar sua empresa
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-card border border-border/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
                Comece em minutos
              </h2>
              <p className="text-lg text-muted-foreground">
                Processo simples e rápido para cadastrar sua empresa
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative text-center"
                >
                  <div className="text-6xl font-display font-bold text-primary/20 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-br from-emerald-500/10 via-background to-green-500/10 border-2 border-emerald-500/30 rounded-[2.5rem] p-12 sm:p-16 text-center overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
              
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-display font-bold mb-6">
                  Pronto para começar?
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                  Cadastre sua empresa gratuitamente e faça parte da maior comunidade de Timbó!
                </p>
                
                <Link to="/auth">
                  <Button size="lg" className="h-16 px-12 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-500/30">
                    <Building2 className="w-5 h-5 mr-2" />
                    Cadastrar Empresa Grátis
                  </Button>
                </Link>

                <p className="mt-6 text-sm text-muted-foreground">
                  Sem taxas • Sem mensalidades • 100% gratuito para sempre
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Timbó Fala - A rede social de Timbó, SC
        </div>
      </footer>
    </div>
  );
}