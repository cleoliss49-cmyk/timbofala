import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';

export function MobileNav() {
  const location = useLocation();
  const { profile } = useAuth();

  const navItems = [
    { icon: Home, path: '/feed', label: 'Feed' },
    { icon: Search, path: '/explore', label: 'Explorar' },
    { icon: PlusSquare, path: '/create', label: 'Criar' },
    { icon: MessageCircle, path: '/messages', label: 'Chat' },
    { icon: User, path: `/profile/${profile?.username}`, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path.startsWith('/profile') && location.pathname.startsWith('/profile/'));
          
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
  );
}
