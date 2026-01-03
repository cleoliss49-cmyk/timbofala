import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Loader2, Store, ShieldAlert } from 'lucide-react';

interface DeleteBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteBusinessDialog({
  open,
  onOpenChange,
  businessName,
  onConfirmDelete
}: DeleteBusinessDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setStep(1);
    setConfirmText('');
    onOpenChange(false);
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleFinalDelete = async () => {
    if (confirmText !== 'EXCLUIR') return;
    
    setDeleting(true);
    try {
      await onConfirmDelete();
      handleClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setDeleting(false);
    }
  };

  const isConfirmValid = confirmText === 'EXCLUIR';

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <AlertDialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Excluir Comércio?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Você está prestes a excluir <strong className="text-foreground">{businessName}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">O que acontece ao excluir:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Sua loja não aparecerá mais para outros usuários</li>
                    <li>Novos pedidos não poderão ser feitos</li>
                    <li>Produtos ficarão indisponíveis</li>
                    <li>Pedidos anteriores continuarão no histórico dos clientes</li>
                  </ul>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleFirstConfirm}
                className="flex-1 gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Continuar Exclusão
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 ring-4 ring-red-50">
                <Store className="w-8 h-8 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl text-destructive">
                Confirmação Final
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Esta ação <strong className="text-destructive">não pode ser desfeita</strong>. 
                Digite <strong className="font-mono bg-muted px-1.5 py-0.5 rounded">EXCLUIR</strong> para confirmar.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border flex items-center gap-3">
                <Store className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Loja a ser excluída:</p>
                  <p className="font-semibold">{businessName}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-sm text-muted-foreground">
                  Digite EXCLUIR para confirmar:
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="EXCLUIR"
                  className={`font-mono text-center text-lg tracking-wider ${
                    confirmText && !isConfirmValid ? 'border-destructive' : ''
                  }`}
                  autoComplete="off"
                />
              </div>
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                disabled={deleting}
              >
                Voltar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleFinalDelete}
                disabled={!isConfirmValid || deleting}
                className="gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir Permanentemente
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
