import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  MessageCircle, 
  Search, 
  Calendar, 
  Store, 
  Settings,
  Compass,
  Bookmark,
  X,
  PlusCircle,
  Heart,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const mainMenuItems = [
  { icon: Home, label: 'Feed', path: '/feed' },
  { icon: Compass, label: 'Explorar', path: '/explore' },
  { icon: Search, label: 'Buscar', path: '/search' },
  { icon: MessageCircle, label: 'Mensagens', path: '/messages', badge: true },
];

const communityMenuItems = [
  { icon: Users, label: 'Comunidade', path: '/community' },
  { icon: Calendar, label: 'Eventos', path: '/events' },
  { icon: Store, label: 'Marketplace', path: '/marketplace' },
  { icon: Building2, label: 'Empresas', path: '/empresas' },
  { icon: Heart, label: 'Paquera', path: '/paquera' },
];

const personalMenuItems = [
  { icon: Bookmark, label: 'Salvos', path: '/saved' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Sidebar({ className, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);

  useEffect(() => {
    if (user) {
      checkBusinessProfile();
    }
  }, [user]);

  const checkBusinessProfile = async () => {
    const { data } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    setHasBusinessProfile(!!data);
  };

  const renderMenuItem = (item: typeof mainMenuItems[0]) => {
    const path = item.path === '/profile' ? `/profile/${profile?.username}` : item.path;
    const isActive = location.pathname === path || 
      (item.path === '/profile' && location.pathname.startsWith('/profile/')) ||
      (item.path === '/messages' && location.pathname.startsWith('/messages/'));

    return (
      <Link
        key={item.path}
        to={path}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'gradient-primary text-primary-foreground shadow-soft'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <item.icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', isActive && 'scale-110')} />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </Link>
    );
  };

  return (
    <>
      <aside className={cn(
        'flex flex-col fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-card border-r border-border',
        className
      )}>
        {/* Close button for mobile */}
        {onClose && (
          <div className="flex justify-end p-2 lg:hidden">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Create button */}
          <Button 
            className="w-full gradient-primary text-white shadow-soft hover:shadow-hover"
            onClick={() => {
              setShowCreateDialog(true);
              onClose?.();
            }}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Criar Publicação
          </Button>

          {/* Main navigation */}
          <nav className="space-y-1">
            {mainMenuItems.map(renderMenuItem)}
          </nav>

          {/* Community section */}
          <div>
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Comunidade
            </h3>
            <nav className="space-y-1">
              {communityMenuItems.map(renderMenuItem)}
            </nav>
          </div>

          {/* Personal section */}
          <div>
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Pessoal
            </h3>
            <nav className="space-y-1">
              {personalMenuItems.map(renderMenuItem)}
            </nav>
          </div>

          {/* Business section */}
          {user && (
            <div>
              <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Empresarial
              </h3>
              <nav className="space-y-1">
                <Link
                  to={hasBusinessProfile ? '/empresa/gerenciar' : '/empresa/criar'}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                    location.pathname.startsWith('/empresa')
                      ? 'gradient-primary text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Building2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="flex-1">
                    {hasBusinessProfile ? 'Minha Empresa' : 'Criar Conta Empresarial'}
                  </span>
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* User card */}
        {profile && (
          <div className="p-4 border-t border-border">
            <Link 
              to={`/profile/${profile.username}`}
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
            >
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold group-hover:scale-105 transition-transform">
                {profile.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      <CreatePostDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
