import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Users, Heart, Sparkles } from 'lucide-react';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIMBO_NEIGHBORHOODS } from '@/lib/neighborhoods';
import { HoldCaptcha } from '@/components/ui/hold-captcha';

const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'Username só pode ter letras, números e _'),
  full_name: z.string().min(2, 'Nome completo é obrigatório'),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  accepted_terms: z.literal(true, { errorMap: () => ({ message: 'Você deve aceitar os termos' }) }),
  captcha_verified: z.literal(true, { errorMap: () => ({ message: 'Complete a verificação de segurança' }) }),
});

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    neighborhood: '',
    city: 'Timbó',
    accepted_terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: 'Erro ao entrar',
            description: error.message === 'Invalid login credentials' 
              ? 'Email ou senha incorretos' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Bem-vindo de volta!',
            description: 'Login realizado com sucesso.',
          });
        }
      } else {
        const result = signUpSchema.safeParse({ ...formData, captcha_verified: captchaVerified });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          username: formData.username,
          full_name: formData.full_name,
          neighborhood: formData.neighborhood,
          city: formData.city,
          accepted_terms: formData.accepted_terms,
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Email já cadastrado',
              description: 'Este email já está em uso. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao criar conta',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Bem-vindo ao Timbó Fala!',
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        <div className="relative z-10 text-center text-primary-foreground max-w-md">
          <div className="mb-8 animate-float">
            <div className="w-24 h-24 mx-auto bg-primary-foreground/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-glow">
              <MessageCircle className="w-12 h-12" />
            </div>
          </div>
          
          <h1 className="text-5xl font-display font-bold mb-4">Timbó Fala</h1>
          <p className="text-xl opacity-90 mb-8">
            A rede social da nossa cidade. Conecte-se, compartilhe e faça parte da comunidade.
          </p>
          
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Comunidade</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
              <Heart className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Conexões</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
              <Sparkles className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Momentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-soft">
              <MessageCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gradient">Timbó Fala</h1>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              {isLogin ? 'Entrar' : 'Criar conta'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLogin 
                ? 'Entre para continuar conectado' 
                : 'Junte-se à comunidade de Timbó'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">@Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="seu_usuario"
                        className={errors.username ? 'border-destructive' : ''}
                      />
                      {errors.username && (
                        <p className="text-sm text-destructive mt-1">{errors.username}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Seu nome"
                        className={errors.full_name ? 'border-destructive' : ''}
                      />
                      {errors.full_name && (
                        <p className="text-sm text-destructive mt-1">{errors.full_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Select
                        value={formData.neighborhood}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, neighborhood: value }));
                          setErrors(prev => ({ ...prev, neighborhood: '' }));
                        }}
                      >
                        <SelectTrigger className={errors.neighborhood ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Selecione seu bairro" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMBO_NEIGHBORHOODS.map((neighborhood) => (
                            <SelectItem key={neighborhood} value={neighborhood}>
                              {neighborhood}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.neighborhood && (
                        <p className="text-sm text-destructive mt-1">{errors.neighborhood}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Sua cidade"
                        className={errors.city ? 'border-destructive' : ''}
                        disabled
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1">{errors.city}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="accepted_terms"
                      checked={formData.accepted_terms}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, accepted_terms: checked === true }))
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="accepted_terms"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Aceito os{' '}
                        <button 
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="text-primary hover:underline"
                        >
                          Termos de Uso e Boas Práticas
                        </button>
                      </label>
                      {errors.accepted_terms && (
                        <p className="text-sm text-destructive">{errors.accepted_terms}</p>
                      )}
                    </div>
                  </div>
                  
                  <HoldCaptcha 
                    onVerified={() => {
                      setCaptchaVerified(true);
                      setErrors(prev => ({ ...prev, captcha_verified: '' }));
                    }}
                  />
                  {errors.captcha_verified && (
                    <p className="text-sm text-destructive text-center">{errors.captcha_verified}</p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar conta')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin 
                  ? 'Não tem conta? Criar agora' 
                  : 'Já tem conta? Entrar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl shadow-hover max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 animate-scale-in">
            <h2 className="text-2xl font-display font-bold mb-4">Termos de Uso e Boas Práticas</h2>
            
            <div className="prose prose-sm text-muted-foreground space-y-4">
              <p>
                <strong>Timbó Fala</strong> é uma plataforma independente desenvolvida por uma pessoa física, 
                não sendo uma empresa registrada.
              </p>

              <h3 className="text-foreground font-semibold">1. Uso Responsável</h3>
              <p>
                Ao utilizar a plataforma, você concorda em:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Não publicar conteúdo ilegal, ofensivo ou difamatório</li>
                <li>Respeitar os demais usuários da comunidade</li>
                <li>Não compartilhar informações falsas</li>
                <li>Não fazer spam ou propaganda sem autorização</li>
              </ul>

              <h3 className="text-foreground font-semibold">2. Privacidade</h3>
              <p>
                Suas informações pessoais serão tratadas com respeito. Não compartilhamos 
                seus dados com terceiros sem seu consentimento.
              </p>

              <h3 className="text-foreground font-semibold">3. Conteúdo</h3>
              <p>
                Você é responsável pelo conteúdo que publica. A plataforma pode remover 
                conteúdo que viole estes termos sem aviso prévio.
              </p>

              <h3 className="text-foreground font-semibold">4. Denúncias</h3>
              <p>
                Utilize o sistema de denúncias para reportar comportamentos inadequados. 
                Todas as denúncias serão analisadas.
              </p>

              <h3 className="text-foreground font-semibold">5. Isenção de Responsabilidade</h3>
              <p>
                A plataforma é fornecida "como está". O desenvolvedor não se responsabiliza 
                por conteúdos publicados por usuários ou por eventuais problemas técnicos.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowTerms(false)}>
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
