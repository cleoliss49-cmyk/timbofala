import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, ArrowLeft, Building2, Briefcase, 
  Users, Globe, Rocket, ArrowRight,
  CheckCircle, Shield, Zap, Star
} from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  { icon: Globe, title: 'Presença Digital Gratuita', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Users, title: 'Alcance Milhares', gradient: 'from-emerald-500 to-green-500' },
  { icon: Briefcase, title: 'Publique Vagas', gradient: 'from-purple-500 to-violet-500' },
  { icon: Star, title: 'Destaque-se', gradient: 'from-amber-500 to-orange-500' },
];

const steps = [
  { number: '01', title: 'Crie sua Conta' },
  { number: '02', title: 'Configure o Perfil' },
  { number: '03', title: 'Publique Vagas' },
  { number: '04', title: 'Conecte-se' },
];

export default function ConhecerEmpresas() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(142 76% 36%) 0%, transparent 70%)',
            top: '-30%',
            right: '-20%',
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
          <Link to="/auth">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Começar Agora
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">Para Empresas</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl font-display font-bold leading-[1.1]">
                Sua empresa em
                <br />
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                  destaque
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Crie seu perfil empresarial <strong className="text-foreground">100% gratuito</strong>, 
                publique vagas e conecte-se com toda Timbó.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="h-14 px-10 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 group">
                    <Rocket className="w-5 h-5 mr-2" />
                    Cadastrar Minha Empresa
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/companies">
                  <Button size="lg" variant="outline" className="h-14 px-10">
                    Ver Empresas
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 pt-4">
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

        {/* Benefits */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold">Por que estar aqui?</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border/50 rounded-2xl p-6 text-center hover:shadow-xl transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mx-auto mb-4`}>
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold">{benefit.title}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold">Comece em minutos</h2>
            </div>

            <div className="grid sm:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl font-display font-bold text-primary/20 mb-2">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-sm">{step.title}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center py-12 px-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Pronto para começar?</h2>
              <p className="text-muted-foreground mb-6">
                Cadastre sua empresa gratuitamente!
              </p>
              
              <Link to="/auth">
                <Button size="lg" className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 shadow-xl">
                  <Building2 className="w-5 h-5 mr-2" />
                  Cadastrar Empresa Grátis
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t border-border/50 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Timbó Fala
      </footer>
    </div>
  );
}