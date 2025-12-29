import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, MapPin, UserMinus } from 'lucide-react';

interface CommunityMember {
  id: string;
  username: string;
  full_name: string;
  neighborhood: string;
  city: string;
  avatar_url: string | null;
  bio: string | null;
  isFollowing: boolean;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

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

    const membersWithFollow = profiles.map(profile => ({
      ...profile,
      isFollowing: followingIds.has(profile.id),
    }));

    setMembers(membersWithFollow);
    setLoading(false);
  };

  useEffect(() => {
    fetchCommunity();
  }, [user]);

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

  // Group by neighborhood
  const membersByNeighborhood = members.reduce((acc, member) => {
    if (!acc[member.neighborhood]) {
      acc[member.neighborhood] = [];
    }
    acc[member.neighborhood].push(member);
    return acc;
  }, {} as Record<string, CommunityMember[]>);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
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

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : Object.keys(membersByNeighborhood).length === 0 ? (
          <div className="bg-card rounded-2xl p-8 shadow-card text-center border border-border">
            <p className="text-muted-foreground">
              Seja o primeiro da sua comunidade!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(membersByNeighborhood).map(([neighborhood, neighborhoodMembers]) => (
              <div key={neighborhood}>
                <div className="flex items-center gap-2 mb-3 px-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-muted-foreground">{neighborhood}</h2>
                  <span className="text-sm text-muted-foreground">
                    ({neighborhoodMembers.length})
                  </span>
                </div>

                <div className="grid gap-3">
                  {neighborhoodMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-card rounded-2xl shadow-card p-4 border border-border flex items-center justify-between gap-4 animate-fade-in"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
