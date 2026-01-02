import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmText !== 'EXCLUIR') return;

    setLoading(true);
    try {
      // Delete user data from profiles (cascade will handle related data)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Delete profile (which cascades to related data)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sign out
      await supabase.auth.signOut();

      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída permanentemente.',
      });

      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir conta',
        description: error.message || 'Não foi possível excluir sua conta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Excluir conta permanentemente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Esta ação é <strong>irreversível</strong>. Todos os seus dados serão 
              excluídos permanentemente, incluindo:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Seu perfil e informações pessoais</li>
              <li>Todas as suas publicações</li>
              <li>Todas as suas mensagens</li>
              <li>Seus seguidores e quem você segue</li>
              <li>Seu perfil do Paquera (se houver)</li>
            </ul>
            <p className="font-medium">
              Digite <span className="text-destructive">EXCLUIR</span> para confirmar:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="border-destructive/50"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== 'EXCLUIR' || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir minha conta'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
