import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function NotificationsPanel() {
  const { toast } = useToast();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => toast({ title: 'Em breve!', description: 'Notificações em desenvolvimento.' })}
    >
      <Bell className="w-5 h-5" />
    </Button>
  );
}
