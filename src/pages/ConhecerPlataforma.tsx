import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, ArrowLeft, Home, Users, Store, Calendar, 
  Heart, ShoppingBag, MapPin, ArrowRight,
  Sparkles, ShoppingCart, Building2, Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

const mainFeatures = [
  {
    icon: Home,
    title: 'Feed',
    description: 'Publicações da comunidade',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Heart,
    title: 'Paquera',
    description: 'Encontre pessoas especiais',
    gradient: 'from-rose-500 to-pink-500'
  },
  {
    icon: Users,
    title: 'Comunidade',
    description: 'Grupos e discussões',
    gradient: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Building2,
    title: 'Empresas',
    description: 'Serviços e vagas',
    gradient: 'from-purple-500 to-violet-500'
  },
  {
    icon: ShoppingCart,
    title: 'Comércios',
    description: 'Compre de lojas locais',
    gradient: 'from-emerald-500 to-green-500'
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Compra e venda',
    gradient: 'from-orange-500 to-amber-500'
  },
  {
    icon: Compass,
    title: 'Explorar',
    description: 'Descubra novidades',
    gradient: 'from-teal-500 to-cyan-500'
  },
  {
    icon: Calendar,
    title: 'Eventos',
    description: 'O que rola na cidade',
    gradient: 'from-violet-500 to-purple-500'
  }
];

export default function ConhecerPlataforma() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-25"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            top: '-20%',
            right: '-10%',
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(262 83% 58%) 0%, transparent 70%)',
            bottom: '-10%',
            left: '-10%',
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
        {/* Hero Section - Compact */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">Timbó, SC</span>
              </div>
              
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

        {/* Features Grid */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3 flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                Tudo em um só lugar
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {mainFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card hover:bg-card/80 border border-border/50 rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Business CTAs */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl p-8"
              >
                <Store className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Tem um Comércio?</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Venda seus produtos online para toda a cidade.
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
                className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-2xl p-8"
              >
                <Building2 className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Tem uma Empresa?</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Cadastre gratuitamente e publique vagas.
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

        {/* Final CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center py-12 px-8 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/50"
            >
              <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
              <p className="text-muted-foreground mb-6">
                Crie sua conta gratuita e faça parte da comunidade!
              </p>
              <Link to="/auth">
                <Button size="lg" className="h-12 px-8">
                  Criar minha conta grátis
                </Button>
              </Link>
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