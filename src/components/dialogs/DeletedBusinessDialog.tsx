import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Plus, Loader2, Building2, ShoppingCart } from 'lucide-react';

interface DeletedBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'business' | 'company';
}

export function DeletedBusinessDialog({ open, onOpenChange, type }: DeletedBusinessDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restoring, setRestoring] = useState(false);

  const typeName = type === 'business' ? 'comércio' : 'empresa';
  const TypeIcon = type === 'business' ? ShoppingCart : Building2;
  const createPath = type === 'business' ? '/empresa/criar' : '/empresa/cadastrar';
  const managePath = type === 'business' ? '/empresa/gerenciar' : '/empresa/painel';
  const tableName = type === 'business' ? 'business_profiles' : 'companies';

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from(tableName)
        .update({ is_active: true })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Restaurado!',
        description: `Seu ${typeName} foi restaurado com sucesso.`,
      });

      onOpenChange(false);
      navigate(managePath);
    } catch (error) {
      console.error('Error restoring:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível restaurar o ${typeName}.`,
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    navigate(createPath);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            Ops! Você excluiu seu {typeName}
          </DialogTitle>
          <DialogDescription className="text-center">
            Você pode restaurar o {typeName} anterior ou criar um novo do zero.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleRestore} 
            disabled={restoring}
            variant="outline"
            className="gap-2 h-12"
          >
            {restoring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Restaurar {typeName}
          </Button>
          
          <Button 
            onClick={handleCreateNew}
            className="gap-2 h-12"
          >
            <Plus className="w-4 h-4" />
            Criar novo {typeName}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}