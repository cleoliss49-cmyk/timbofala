import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, Store, PlusSquare, ShoppingBag, User } from 'lucide-react';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const navItems = [
    { icon: Home, path: '/feed', label: 'Feed' },
    { icon: Store, path: '/empresas', label: 'Comércio' },
    { icon: PlusSquare, path: 'create', label: 'Criar', isAction: true },
    { icon: ShoppingBag, path: '/meus-pedidos', label: 'Pedidos' },
    { icon: User, path: `/profile/${profile?.username}`, label: 'Perfil' },
  ];

  const handlePostCreated = () => {
    // Navigate to feed if not already there
    if (location.pathname !== '/feed') {
      navigate('/feed');
    } else {
      // Refresh the page to show new post
      window.location.reload();
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path.startsWith('/profile') && location.pathname.startsWith('/profile/'));
            
            if (item.isAction) {
              return (
                <button
                  key={item.path}
                  onClick={() => setShowCreateDialog(true)}
                  className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-muted-foreground hover:text-primary"
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-2xs font-medium">{item.label}</span>
                </button>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} />
                <span className="text-2xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <CreatePostDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onPostCreated={handlePostCreated}
      />
    </>
  );
}
