import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  MessageCircle, 
  Calendar, 
  Store, 
  Settings,
  Compass,
  Bookmark,
  X,
  PlusCircle,
  Heart,
  Building2,
  ShoppingBag,
  ShoppingCart,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

interface DeletedBusinessState {
  business: boolean;
  company: boolean;
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);
  const [deletedState, setDeletedState] = useState<DeletedBusinessState>({
    business: false,
    company: false
  });

  useEffect(() => {
    if (user) {
      checkProfiles();
    }
  }, [user]);

  const checkProfiles = async () => {
    if (!user) return;

    // Check business profile (comércios) - including deleted ones
    const { data: businessData } = await supabase
      .from('business_profiles')
      .select('id, is_active')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (businessData) {
      setHasBusinessProfile(businessData.is_active !== false);
      setDeletedState(prev => ({ ...prev, business: businessData.is_active === false }));
    } else {
      setHasBusinessProfile(false);
      setDeletedState(prev => ({ ...prev, business: false }));
    }

    // Check company profile (empresas) - including deleted ones
    const { data: companyData } = await supabase
      .from('companies')
      .select('id, is_active')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (companyData) {
      setHasCompanyProfile(companyData.is_active !== false);
      setDeletedState(prev => ({ ...prev, company: companyData.is_active === false }));
    } else {
      setHasCompanyProfile(false);
      setDeletedState(prev => ({ ...prev, company: false }));
    }
  };

  // Menu items organized by the new order
  const mainMenuItems = [
    { icon: Home, label: 'Feed', path: '/feed' },
    { icon: Heart, label: 'Paquera', path: '/paquera' },
    { icon: Users, label: 'Comunidade', path: '/community' },
    { icon: Building2, label: 'Empresas', path: '/companies' },
    { icon: ShoppingCart, label: 'Comércios', path: '/empresas' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: Compass, label: 'Explorar', path: '/explore' },
    { icon: Calendar, label: 'Eventos', path: '/events' },
    { icon: MessageCircle, label: 'Mensagens', path: '/messages', badge: true },
  ];

  const personalMenuItems = [
    { icon: Bookmark, label: 'Salvos', path: '/saved' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

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

  // Deleted business/company recovery card
  const renderDeletedCard = (type: 'business' | 'company') => {
    const isDeleted = type === 'business' ? deletedState.business : deletedState.company;
    if (!isDeleted) return null;

    const typeName = type === 'business' ? 'comércio' : 'empresa';
    const TypeIcon = type === 'business' ? ShoppingCart : Building2;
    const createPath = type === 'business' ? '/empresa/criar' : '/empresa/cadastrar';
    const restorePath = type === 'business' ? '/empresa/restaurar' : '/empresa/restaurar-empresa';

    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium text-sm">
            Ops! Você excluiu seu {typeName}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Você pode restaurar ou criar um novo.
        </p>
        <div className="flex gap-2">
          <Link to={restorePath} onClick={onClose} className="flex-1">
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar
            </Button>
          </Link>
          <Link to={createPath} onClick={onClose} className="flex-1">
            <Button size="sm" className="w-full gap-1.5 text-xs">
              <TypeIcon className="w-3.5 h-3.5" />
              Criar Novo
            </Button>
          </Link>
        </div>
      </div>
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

          {/* Personal section */}
          <div>
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Pessoal
            </h3>
            <nav className="space-y-1">
              {personalMenuItems.map(renderMenuItem)}
            </nav>
          </div>

          {/* My Business section */}
          {user && (
            <div>
              <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Meus Negócios
              </h3>
              <nav className="space-y-2">
                {/* Deleted business recovery */}
                {renderDeletedCard('business')}
                
                {/* Deleted company recovery */}
                {renderDeletedCard('company')}

                {/* Comércios (existing system) - only show if not deleted */}
                {!deletedState.business && (
                  <Link
                    to={hasBusinessProfile ? '/empresa/gerenciar' : '/empresa/criar'}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                      (location.pathname === '/empresa/gerenciar' || location.pathname === '/empresa/criar')
                        ? 'gradient-primary text-primary-foreground shadow-soft'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="flex-1">
                      {hasBusinessProfile ? 'Meu Comércio' : 'Criar Comércio'}
                    </span>
                  </Link>
                )}

                {/* Empresas (new system) - only show if not deleted */}
                {!deletedState.company && (
                  <Link
                    to={hasCompanyProfile ? '/empresa/painel' : '/empresa/cadastrar'}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                      (location.pathname === '/empresa/painel' || location.pathname === '/empresa/cadastrar')
                        ? 'gradient-primary text-primary-foreground shadow-soft'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Building2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="flex-1">
                      {hasCompanyProfile ? 'Minha Empresa' : 'Cadastrar Empresa'}
                    </span>
                  </Link>
                )}
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