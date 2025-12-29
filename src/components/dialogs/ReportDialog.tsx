import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const reportReasons = [
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'hate', label: 'Discurso de ódio' },
  { value: 'violence', label: 'Violência ou ameaças' },
  { value: 'harassment', label: 'Assédio ou bullying' },
  { value: 'fake', label: 'Informação falsa' },
  { value: 'inappropriate', label: 'Conteúdo impróprio' },
  { value: 'other', label: 'Outro' },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedPostId?: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedPostId,
}: ReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId || null,
        reported_post_id: reportedPostId || null,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Denúncia enviada',
        description: 'Obrigado por nos ajudar a manter a comunidade segura.',
      });

      setReason('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a denúncia. Tente novamente.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar</DialogTitle>
          <DialogDescription>
            Selecione o motivo da denúncia. Todas as denúncias são analisadas pela equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {reportReasons.map((r) => (
              <div key={r.value} className="flex items-center space-x-3">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div>
            <Label htmlFor="description">Detalhes (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema com mais detalhes..."
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!reason || loading}>
            {loading ? 'Enviando...' : 'Enviar denúncia'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
