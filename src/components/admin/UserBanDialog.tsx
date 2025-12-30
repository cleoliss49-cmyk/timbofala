import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ban, Clock, AlertTriangle } from 'lucide-react';

interface UserBanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export function UserBanDialog({ open, onOpenChange, userId, userName, onSuccess }: UserBanDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [durationType, setDurationType] = useState<'hours' | 'days'>('hours');
  const [durationValue, setDurationValue] = useState('24');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBan = async () => {
    if (!user || !durationValue) return;
    
    setLoading(true);

    try {
      const hours = durationType === 'hours' ? parseInt(durationValue) : parseInt(durationValue) * 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);

      const { error } = await supabase.from('user_bans').insert({
        user_id: userId,
        banned_by: user.id,
        reason: reason || 'Violação das diretrizes da comunidade',
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      // Notify the user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'admin_action',
        title: 'Conta suspensa temporariamente',
        message: `Sua conta foi suspensa por ${durationValue} ${durationType === 'hours' ? 'hora(s)' : 'dia(s)'}. Motivo: ${reason || 'Violação das diretrizes da comunidade'}`,
      });

      toast({ title: 'Usuário banido com sucesso' });
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setDurationValue('24');
      setDurationType('hours');
      setReason('');
    } catch (error: any) {
      toast({ title: 'Erro ao banir usuário', description: error.message, variant: 'destructive' });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Banir Usuário Temporariamente
          </DialogTitle>
          <DialogDescription>
            Defina a duração da suspensão para <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">
              O usuário não poderá publicar, curtir ou comentar durante o período de suspensão.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duração</Label>
              <Input
                type="number"
                min="1"
                max={durationType === 'hours' ? '168' : '30'}
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                placeholder="24"
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={durationType} onValueChange={(v) => setDurationType(v as 'hours' | 'days')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo do banimento..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Expira em: {new Date(Date.now() + (durationType === 'hours' ? parseInt(durationValue || '0') * 3600000 : parseInt(durationValue || '0') * 86400000)).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleBan} 
            disabled={loading || !durationValue || parseInt(durationValue) < 1}
          >
            {loading ? 'Banindo...' : 'Confirmar Banimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
