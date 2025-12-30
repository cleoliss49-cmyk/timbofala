import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2, MessageCircle } from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'brunoochner55@gmail.com';

export default function AdminAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Você não é um administrador.');
      }

      toast({ title: 'Login realizado com sucesso!' });
      navigate('/admin');
    } catch (error: any) {
      toast({ 
        title: 'Erro no login', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow super admin email to signup
    if (signupEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      toast({ 
        title: 'Acesso negado', 
        description: 'Apenas o administrador principal pode criar conta aqui.', 
        variant: 'destructive' 
      });
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({ 
        title: 'Erro', 
        description: 'As senhas não coincidem.', 
        variant: 'destructive' 
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({ 
        title: 'Erro', 
        description: 'A senha deve ter pelo menos 6 caracteres.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            username: 'admin',
            full_name: 'Administrador',
            neighborhood: 'Centro',
            city: 'Timbó',
            accepted_terms: true,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create admin user record with super_admin role
        const { error: adminError } = await supabase
          .from('admin_users')
          .insert({
            user_id: data.user.id,
            email: signupEmail.toLowerCase(),
            role: 'super_admin',
            can_delete_posts: true,
            can_delete_users: true,
            can_manage_admins: true,
            can_pin_posts: true,
          });

        if (adminError) {
          console.error('Error creating admin:', adminError);
        }
      }

      toast({ 
        title: 'Conta criada!', 
        description: 'Você pode fazer login agora.' 
      });
      setTab('login');
    } catch (error: any) {
      toast({ 
        title: 'Erro no cadastro', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto gradient-primary rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Painel Administrativo</CardTitle>
          <CardDescription>Acesso restrito a administradores</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground mb-4">
                  <p>Apenas o e-mail <strong>{SUPER_ADMIN_EMAIL}</strong> pode criar conta nesta página.</p>
                </div>
                <div>
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder={SUPER_ADMIN_EMAIL}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Conta Admin'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Voltar para Timbó Fala
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
