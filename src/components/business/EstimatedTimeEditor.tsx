import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Check, Loader2 } from 'lucide-react';

interface EstimatedTimeEditorProps {
  businessId: string;
  initialTime: number | null;
  onSave: () => void;
}

const TIME_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '1h30', value: 90 },
  { label: '2 horas', value: 120 },
];

export function EstimatedTimeEditor({ businessId, initialTime, onSave }: EstimatedTimeEditorProps) {
  const [time, setTime] = useState(initialTime || 30);
  const [customTime, setCustomTime] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ estimated_prep_time_minutes: time })
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: '✅ Tempo atualizado!',
        description: `Tempo estimado definido para ${formatTime(time)}`
      });
      onSave();
    } catch (error) {
      console.error('Error saving time:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o tempo estimado',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    return `${hours}h${mins}`;
  };

  const handleCustomTime = () => {
    const parsed = parseInt(customTime);
    if (parsed > 0 && parsed <= 480) {
      setTime(parsed);
      setCustomTime('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-lg">{formatTime(time)}</p>
          <p className="text-sm text-muted-foreground">Tempo médio atual</p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Selecione o tempo estimado</Label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant={time === preset.value ? 'default' : 'outline'}
              className="h-12"
              onClick={() => setTime(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            placeholder="Tempo personalizado (minutos)"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            min={1}
            max={480}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleCustomTime}
          disabled={!customTime}
        >
          Aplicar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Este tempo será exibido para o cliente durante o pedido e após a confirmação, 
        com um cronômetro de contagem regressiva.
      </p>

      <Button 
        onClick={handleSave} 
        disabled={saving || time === initialTime}
        className="w-full gap-2"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        Salvar Tempo Estimado
      </Button>
    </div>
  );
}
