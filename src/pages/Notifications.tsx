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
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  AtSign,
  Calendar,
  Gavel,
  Mail,
  Smartphone,
  Loader2,
  Save
} from 'lucide-react';

interface NotificationSettings {
  notify_likes: boolean;
  notify_comments: boolean;
  notify_follows: boolean;
  notify_messages: boolean;
  notify_mentions: boolean;
  notify_events: boolean;
  notify_auctions: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    notify_likes: true,
    notify_comments: true,
    notify_follows: true,
    notify_messages: true,
    notify_mentions: true,
    notify_events: true,
    notify_auctions: true,
    email_notifications: false,
    push_notifications: true,
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
          notify_likes: data.notify_likes,
          notify_comments: data.notify_comments,
          notify_follows: data.notify_follows,
          notify_messages: data.notify_messages,
          notify_mentions: data.notify_mentions,
          notify_events: data.notify_events,
          notify_auctions: data.notify_auctions,
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
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

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
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

  const activityNotifications = [
    {
      key: 'notify_likes' as const,
      icon: Heart,
      title: 'Curtidas',
      description: 'Quando alguém curtir suas publicações',
    },
    {
      key: 'notify_comments' as const,
      icon: MessageCircle,
      title: 'Comentários',
      description: 'Quando alguém comentar em suas publicações',
    },
    {
      key: 'notify_follows' as const,
      icon: UserPlus,
      title: 'Novos Seguidores',
      description: 'Quando alguém começar a seguir você',
    },
    {
      key: 'notify_messages' as const,
      icon: MessageCircle,
      title: 'Mensagens',
      description: 'Quando você receber novas mensagens',
    },
    {
      key: 'notify_mentions' as const,
      icon: AtSign,
      title: 'Menções',
      description: 'Quando você for mencionado em publicações',
    },
    {
      key: 'notify_events' as const,
      icon: Calendar,
      title: 'Eventos',
      description: 'Notificações sobre eventos que você confirmou presença',
    },
    {
      key: 'notify_auctions' as const,
      icon: Gavel,
      title: 'Leilões',
      description: 'Novos lances e atualizações de leilões',
    },
  ];

  const deliveryOptions = [
    {
      key: 'push_notifications' as const,
      icon: Smartphone,
      title: 'Notificações Push',
      description: 'Receber notificações no dispositivo',
    },
    {
      key: 'email_notifications' as const,
      icon: Mail,
      title: 'Notificações por E-mail',
      description: 'Receber resumo de atividades por e-mail',
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Notificações</h1>
            <p className="text-muted-foreground">Gerencie como você recebe notificações</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atividades</CardTitle>
            <CardDescription>
              Escolha quais atividades você deseja ser notificado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activityNotifications.map((option, index) => (
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
                {index < activityNotifications.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forma de Entrega</CardTitle>
            <CardDescription>
              Como você deseja receber as notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {deliveryOptions.map((option, index) => (
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
                {index < deliveryOptions.length - 1 && <Separator className="mt-4" />}
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
