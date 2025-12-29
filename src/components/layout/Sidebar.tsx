import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Home, Users, MessageCircle, User, Search, Flag } from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Feed', path: '/feed' },
  { icon: Search, label: 'Explorar', path: '/explore' },
  { icon: Users, label: 'Comunidade', path: '/community' },
  { icon: MessageCircle, label: 'Mensagens', path: '/messages' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export function Sidebar() {
  const location = useLocation();
  const { profile } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-card border-r border-border p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const path = item.path === '/profile' ? `/profile/${profile?.username}` : item.path;
          const isActive = location.pathname === path || 
            (item.path === '/profile' && location.pathname.startsWith('/profile/'));

          return (
            <Link
              key={item.path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'gradient-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      {profile && (
        <div className="mt-auto pt-4 border-t border-border">
          <Link 
            to={`/profile/${profile.username}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
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
  );
}
