import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { OrdersBadge } from '@/components/orders/OrdersBadge';
import { BusinessOrdersBadge } from '@/components/orders/BusinessOrdersBadge';
import { MessageCircle, Search, User, LogOut, Settings, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-lg border-b border-border z-50">
      <div className="h-full px-4 flex items-center justify-between gap-4 max-w-[1800px] mx-auto">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-hover transition-shadow">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-display font-bold text-gradient">Timbó Fala</span>
            </div>
          </Link>
        </div>

        {/* Center - Search */}
        <form 
          onSubmit={handleSearch} 
          className={`flex-1 max-w-lg hidden md:block transition-all duration-300 ${
            searchFocused ? 'max-w-xl' : ''
          }`}
        >
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              searchFocused ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Buscar pessoas, posts, eventos..."
              className={`pl-11 bg-muted/50 border-transparent focus:bg-card transition-all ${
                searchFocused ? 'shadow-soft border-primary/50' : ''
              }`}
            />
            {searchFocused && searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <kbd className="text-xs bg-muted px-2 py-1 rounded font-mono">Enter</kbd>
              </div>
            )}
          </div>
        </form>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => navigate('/search')}
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Customer Orders Badge */}
          <OrdersBadge />

          {/* Business Orders Badge */}
          <BusinessOrdersBadge />

          {/* Messages */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/messages')}
            className="relative"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <NotificationsPanel />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 rounded-full">
                <Avatar className="w-9 h-9 ring-2 ring-transparent hover:ring-primary/50 transition-all">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-semibold">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">@{profile?.username}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/profile/${profile?.username}`)}>
                <User className="w-4 h-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
