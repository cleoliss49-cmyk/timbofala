import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, LogOut, Shield, Bell, User, Trash2 } from 'lucide-react';
import { EditProfileDialog } from '@/components/dialogs/EditProfileDialog';
import { DeleteAccountDialog } from '@/components/dialogs/DeleteAccountDialog';

export default function Settings() {
  const { signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const handleSignOut = async () => {
    try {
      await signOut();
      // Force clear any remaining state
      window.localStorage.removeItem('supabase.auth.token');
      // Navigate to auth page
      navigate('/auth', { replace: true });
      // Force reload to clear any cached state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Erro ao sair',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Configurações</h1>
              <p className="text-muted-foreground">Gerencie sua conta</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <button
            onClick={() => setShowEditProfile(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Editar Perfil</p>
              <p className="text-sm text-muted-foreground">Altere seu nome, bio e foto</p>
            </div>
          </button>

          <div className="border-t border-border" />

          <button
            onClick={() => navigate('/notifications')}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium">Notificações</p>
              <p className="text-sm text-muted-foreground">Configure suas preferências</p>
            </div>
          </button>

          <div className="border-t border-border" />

          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium">Privacidade</p>
              <p className="text-sm text-muted-foreground">Gerencie suas configurações de privacidade</p>
            </div>
          </button>

          <div className="border-t border-border" />

          <button
            onClick={() => setShowDeleteAccount(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-destructive/10 transition-colors text-left text-destructive"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Excluir conta</p>
              <p className="text-sm opacity-80">Excluir permanentemente sua conta</p>
            </div>
          </button>

          <div className="border-t border-border" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 p-4 hover:bg-destructive/10 transition-colors text-left text-destructive"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Sair da conta</p>
              <p className="text-sm opacity-80">Encerrar sessão</p>
            </div>
          </button>
        </div>

        {/* About */}
        <div className="mt-6 bg-card rounded-2xl shadow-card p-6 border border-border">
          <h2 className="font-display font-bold mb-3">Sobre o Timbó Fala</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Timbó Fala é uma plataforma independente desenvolvida por uma pessoa física.
            Não é uma empresa registrada.
          </p>
          <p className="text-sm text-muted-foreground">
            Nosso objetivo é conectar os moradores de Timbó e região, criando uma 
            comunidade digital acolhedora e segura para todos.
          </p>
        </div>
      </div>

      <EditProfileDialog
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        onUpdate={refreshProfile}
      />

      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
      />
    </MainLayout>
  );
}
