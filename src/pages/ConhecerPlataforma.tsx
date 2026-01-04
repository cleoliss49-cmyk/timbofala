import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, ArrowLeft, Home, Users, Store, Calendar, 
  Heart, ShoppingBag, ArrowRight,
  Sparkles, ShoppingCart, Building2, Compass, Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Home, title: 'Feed', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Heart, title: 'Paquera', gradient: 'from-rose-500 to-pink-500' },
  { icon: Users, title: 'Comunidade', gradient: 'from-indigo-500 to-blue-500' },
  { icon: Building2, title: 'Empresas', gradient: 'from-purple-500 to-violet-500' },
  { icon: ShoppingCart, title: 'Comércios', gradient: 'from-emerald-500 to-green-500' },
  { icon: Briefcase, title: 'Vagas', gradient: 'from-amber-500 to-orange-500' },
  { icon: ShoppingBag, title: 'Marketplace', gradient: 'from-teal-500 to-cyan-500' },
  { icon: Calendar, title: 'Eventos', gradient: 'from-violet-500 to-purple-500' },
];

export default function ConhecerPlataforma() {
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
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
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
            <Button>Criar Conta</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-5xl sm:text-6xl font-display font-bold leading-[1.1]">
                A rede social
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  da nossa cidade
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                Conecte-se com vizinhos, descubra eventos, apoie o comércio local e muito mais.
              </p>

              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/25 group">
                  Criar minha conta grátis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                Tudo em um só lugar
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card border border-border/50 rounded-2xl p-5 text-center hover:shadow-xl transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mx-auto mb-3`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-sm">{feature.title}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Business CTAs */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl p-6"
              >
                <Store className="w-10 h-10 text-emerald-600 mb-3" />
                <h3 className="text-lg font-bold mb-2">Tem um Comércio?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Venda seus produtos online.
                </p>
                <Link to="/conhecer-empresas">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Saiba mais
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-2xl p-6"
              >
                <Building2 className="w-10 h-10 text-purple-600 mb-3" />
                <h3 className="text-lg font-bold mb-2">Tem uma Empresa?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cadastre grátis e publique vagas.
                </p>
                <Link to="/conhecer-empresas">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Saiba mais
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="py-12 px-8 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/50"
            >
              <h2 className="text-2xl font-bold mb-4">Pronto para começar?</h2>
              <Link to="/auth">
                <Button size="lg" className="h-12 px-8">
                  Criar minha conta grátis
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