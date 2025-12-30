import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Eye, 
  MessageCircle, 
  Users, 
  Clock, 
  UserCheck,
  Loader2,
  Save
} from 'lucide-react';

interface PrivacySettings {
  is_profile_public: boolean;
  show_online_status: boolean;
  allow_messages_from_all: boolean;
  show_activity_status: boolean;
  allow_tagging: boolean;
  show_last_seen: boolean;
}

export default function Privacy() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    is_profile_public: true,
    show_online_status: true,
    allow_messages_from_all: true,
    show_activity_status: true,
    allow_tagging: true,
    show_last_seen: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          is_profile_public: data.is_profile_public,
          show_online_status: data.show_online_status,
          allow_messages_from_all: data.allow_messages_from_all,
          show_activity_status: data.show_activity_status,
          allow_tagging: data.allow_tagging,
          show_last_seen: data.show_last_seen,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({ title: 'Configurações salvas com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const privacyOptions = [
    {
      key: 'is_profile_public' as const,
      icon: Eye,
      title: 'Perfil Público',
      description: 'Quando desativado, apenas seus seguidores podem ver seu perfil completo',
    },
    {
      key: 'show_online_status' as const,
      icon: Users,
      title: 'Mostrar Status Online',
      description: 'Exibir quando você está online para outros usuários',
    },
    {
      key: 'allow_messages_from_all' as const,
      icon: MessageCircle,
      title: 'Mensagens de Todos',
      description: 'Permitir que qualquer pessoa envie mensagens. Quando desativado, apenas seguidores podem enviar',
    },
    {
      key: 'show_activity_status' as const,
      icon: Clock,
      title: 'Mostrar Atividade',
      description: 'Permitir que outros vejam sua atividade recente como curtidas e comentários',
    },
    {
      key: 'allow_tagging' as const,
      icon: UserCheck,
      title: 'Permitir Marcações',
      description: 'Permitir que outros usuários marquem você em publicações',
    },
    {
      key: 'show_last_seen' as const,
      icon: Clock,
      title: 'Mostrar Última Vez Online',
      description: 'Exibir quando você esteve online pela última vez',
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Privacidade</h1>
            <p className="text-muted-foreground">Controle quem pode ver suas informações</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Privacidade</CardTitle>
            <CardDescription>
              Personalize como outros usuários podem interagir com você e ver suas informações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {privacyOptions.map((option, index) => (
              <div key={option.key}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <option.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">{option.title}</Label>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[option.key]}
                    onCheckedChange={(checked) => updateSetting(option.key, checked)}
                  />
                </div>
                {index < privacyOptions.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-white">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
