import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';

interface DeletedBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'business' | 'company';
}

export function DeletedBusinessDialog({ open, onOpenChange, type }: DeletedBusinessDialogProps) {
  const navigate = useNavigate();

  const typeName = type === 'business' ? 'comércio' : 'empresa';
  const createPath = type === 'business' ? '/empresa/criar' : '/empresa/cadastrar';

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
            Você pode criar um novo {typeName} a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
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