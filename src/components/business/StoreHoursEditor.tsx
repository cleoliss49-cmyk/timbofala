import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Clock, Save, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

interface OpeningHours {
  [key: string]: DaySchedule;
}

const DAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const DEFAULT_HOURS: OpeningHours = {
  monday: { enabled: true, open: '08:00', close: '18:00' },
  tuesday: { enabled: true, open: '08:00', close: '18:00' },
  wednesday: { enabled: true, open: '08:00', close: '18:00' },
  thursday: { enabled: true, open: '08:00', close: '18:00' },
  friday: { enabled: true, open: '08:00', close: '18:00' },
  saturday: { enabled: true, open: '08:00', close: '12:00' },
  sunday: { enabled: false, open: '08:00', close: '12:00' },
};

interface StoreHoursEditorProps {
  businessId: string;
  initialHours?: OpeningHours | null;
  onSave?: () => void;
}

export function StoreHoursEditor({ businessId, initialHours, onSave }: StoreHoursEditorProps) {
  const { toast } = useToast();
  const [hours, setHours] = useState<OpeningHours>(initialHours || DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialHours) {
      setHours({ ...DEFAULT_HOURS, ...initialHours });
    }
  }, [initialHours]);

  const updateDay = (day: string, field: keyof DaySchedule, value: boolean | string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const copyToAll = (sourceDay: string) => {
    const source = hours[sourceDay];
    const newHours = { ...hours };
    DAYS.forEach(day => {
      newHours[day.key] = { ...source };
    });
    setHours(newHours);
    toast({ title: 'Horário copiado para todos os dias!' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ opening_hours: JSON.parse(JSON.stringify(hours)) })
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: '✅ Horários salvos!',
        description: 'Seu horário de funcionamento foi atualizado'
      });
      onSave?.();
    } catch (error) {
      console.error('Error saving hours:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os horários',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Horário de Funcionamento
        </CardTitle>
        <CardDescription>
          Defina quando sua loja está aberta. Aparecerá uma bolinha verde (Aberto) ou vermelha (Fechado) para os clientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-muted-foreground">
            Clique em "Copiar" para aplicar o mesmo horário em todos os dias
          </p>
        </div>

        <div className="space-y-3">
          {DAYS.map((day) => (
            <div 
              key={day.key} 
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border transition-colors ${
                hours[day.key].enabled 
                  ? 'bg-green-50/50 border-green-200' 
                  : 'bg-muted/30 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-[140px]">
                <Switch
                  checked={hours[day.key].enabled}
                  onCheckedChange={(checked) => updateDay(day.key, 'enabled', checked)}
                />
                <Label className="font-medium">{day.label}</Label>
              </div>

              {hours[day.key].enabled && (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={hours[day.key].open}
                      onChange={(e) => updateDay(day.key, 'open', e.target.value)}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={hours[day.key].close}
                      onChange={(e) => updateDay(day.key, 'close', e.target.value)}
                      className="w-28"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToAll(day.key)}
                    className="text-xs"
                  >
                    Copiar para todos
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Horários
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
