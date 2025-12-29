import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search as SearchIcon, UserPlus, UserMinus, MapPin } from 'lucide-react';

interface UserResult {
  id: string;
  username: string;
  full_name: string;
  neighborhood: string;
  city: string;
  avatar_url: string | null;
  bio: string | null;
  isFollowing: boolean;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (q: string) => {
    if (!q.trim() || !user) return;

    setLoading(true);

    // Search by username or full_name
    const searchTerm = q.startsWith('@') ? q.slice(1) : q;
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .limit(20);

    if (error) {
      setLoading(false);
      return;
    }

    // Check follow status
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = new Set(follows?.map(f => f.following_id) || []);

    const resultsWithFollow = profiles.map(profile => ({
      ...profile,
      isFollowing: followingIds.has(profile.id),
    }));

    setResults(resultsWithFollow);
    setLoading(false);
  };

  useEffect(() => {
    if (query) {
      searchUsers(query);
    }
  }, [query, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

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

      setResults(prev =>
        prev.map(r =>
          r.id === userId ? { ...r, isFollowing: !isFollowing } : r
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

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
          <h1 className="text-2xl font-display font-bold mb-4">Buscar pessoas</h1>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou @username..."
                className="pl-10"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-card rounded-2xl p-8 shadow-card text-center border border-border">
              <p className="text-muted-foreground">Buscando...</p>
            </div>
          ) : results.length === 0 && query ? (
            <div className="bg-card rounded-2xl p-8 shadow-card text-center border border-border">
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para "{query}"
              </p>
            </div>
          ) : (
            results.map((result) => (
              <div
                key={result.id}
                className="bg-card rounded-2xl shadow-card p-4 border border-border flex items-center justify-between gap-4 animate-fade-in"
              >
                <Link
                  to={`/profile/${result.username}`}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={result.avatar_url || undefined} />
                    <AvatarFallback className="gradient-secondary text-secondary-foreground">
                      {result.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{result.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{result.username}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {result.neighborhood}, {result.city}
                    </p>
                  </div>
                </Link>

                <Button
                  variant={result.isFollowing ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleFollow(result.id, result.isFollowing)}
                >
                  {result.isFollowing ? (
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
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
