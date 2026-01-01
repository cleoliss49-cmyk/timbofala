import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, MapPin, UserMinus, Search, Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface CommunityMember {
  id: string;
  username: string;
  full_name: string;
  neighborhood: string;
  city: string;
  avatar_url: string | null;
  bio: string | null;
  gender: string | null;
  isFollowing: boolean;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterNeighborhood, setFilterNeighborhood] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  
  // Get unique values for filters
  const cities = [...new Set(members.map(m => m.city))].filter(Boolean);
  const neighborhoods = [...new Set(members.map(m => m.neighborhood))].filter(Boolean);

  const fetchCommunity = async () => {
    if (!user) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .order('created_at', { ascending: false });

    if (!profiles) {
      setLoading(false);
      return;
    }

    // Check follow status
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = new Set(follows?.map(f => f.following_id) || []);

    // Shuffle the array for random order
    const shuffled = [...profiles].sort(() => Math.random() - 0.5);

    const membersWithFollow = shuffled.map(profile => ({
      ...profile,
      isFollowing: followingIds.has(profile.id),
    }));

    setMembers(membersWithFollow);
    setFilteredMembers(membersWithFollow);
    setLoading(false);
  };

  useEffect(() => {
    fetchCommunity();
  }, [user]);

  useEffect(() => {
    let result = [...members];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.full_name.toLowerCase().includes(query) ||
        m.username.toLowerCase().includes(query) ||
        m.bio?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filterCity !== 'all') {
      result = result.filter(m => m.city === filterCity);
    }
    if (filterNeighborhood !== 'all') {
      result = result.filter(m => m.neighborhood === filterNeighborhood);
    }
    if (filterGender !== 'all') {
      result = result.filter(m => m.gender === filterGender);
    }

    setFilteredMembers(result);
  }, [members, searchQuery, filterCity, filterNeighborhood, filterGender]);

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    if (!user) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: userId,
        });
      }

      setMembers(prev =>
        prev.map(m =>
          m.id === userId ? { ...m, isFollowing: !isFollowing } : m
        )
      );

      toast({
        title: isFollowing ? 'Deixou de seguir' : 'Seguindo!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível completar a ação.',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCity('all');
    setFilterNeighborhood('all');
    setFilterGender('all');
  };

  const hasActiveFilters = searchQuery || filterCity !== 'all' || filterNeighborhood !== 'all' || filterGender !== 'all';

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Comunidade</h1>
                <p className="text-muted-foreground">Conheça os moradores da cidade</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou usuário..."
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas cidades</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterNeighborhood} onValueChange={setFilterNeighborhood}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos bairros</SelectItem>
                  {neighborhoods.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-3">
              {filteredMembers.length} pessoa{filteredMembers.length !== 1 ? 's' : ''} encontrada{filteredMembers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 shadow-card text-center border border-border">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? 'Nenhuma pessoa encontrada com esses filtros' : 'Seja o primeiro da sua comunidade!'}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-card rounded-2xl shadow-card p-4 border border-border flex items-center justify-between gap-4 animate-fade-in hover:shadow-lg transition-shadow"
              >
                <Link
                  to={`/profile/${member.username}`}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="gradient-secondary text-secondary-foreground">
                      {member.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{member.username}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{member.neighborhood}, {member.city}</span>
                    </div>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </Link>

                <Button
                  variant={member.isFollowing ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleFollow(member.id, member.isFollowing)}
                  className="shrink-0"
                >
                  {member.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-1" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Seguir
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}