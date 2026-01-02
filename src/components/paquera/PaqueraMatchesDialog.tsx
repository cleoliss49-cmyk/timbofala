import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, User, Sparkles } from 'lucide-react';

interface PaqueraMatchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myProfileId?: string;
}

interface Match {
  id: string;
  created_at: string;
  matchedProfile: {
    id: string;
    photo_url: string;
    user_id: string;
    profiles: {
      full_name: string;
      username: string;
    };
  };
}

export function PaqueraMatchesDialog({
  open,
  onOpenChange,
  myProfileId,
}: PaqueraMatchesDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (open && myProfileId) {
      fetchMatches();
    }
  }, [open, myProfileId]);

  const fetchMatches = async () => {
    if (!myProfileId) return;
    setLoading(true);

    try {
      // Fetch matches where I'm user1
      const { data: matches1 } = await supabase
        .from('paquera_matches')
        .select(`
          id,
          created_at,
          user2_id
        `)
        .eq('user1_id', myProfileId);

      // Fetch matches where I'm user2
      const { data: matches2 } = await supabase
        .from('paquera_matches')
        .select(`
          id,
          created_at,
          user1_id
        `)
        .eq('user2_id', myProfileId);

      // Get all matched profile IDs
      const matchedIds = [
        ...(matches1?.map(m => m.user2_id) || []),
        ...(matches2?.map(m => m.user1_id) || []),
      ];

      if (matchedIds.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Fetch paquera profile details
      const { data: paqueraProfiles } = await supabase
        .from('paquera_profiles')
        .select('id, photo_url, user_id')
        .in('id', matchedIds);

      // Get user IDs
      const userIds = paqueraProfiles?.map(p => p.user_id) || [];
      
      // Fetch user profiles
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      // Merge the data
      const profiles = paqueraProfiles?.map(p => ({
        ...p,
        profiles: userProfiles?.find(up => up.id === p.user_id),
      }));

      // This is a placeholder for the old select statement
      const _ = await supabase
        .from('paquera_profiles')
        .select('id')
        .in('id', matchedIds)
        .limit(0);

      const allMatches = [
        ...(matches1?.map(m => ({
          id: m.id,
          created_at: m.created_at,
          matchedProfileId: m.user2_id,
        })) || []),
        ...(matches2?.map(m => ({
          id: m.id,
          created_at: m.created_at,
          matchedProfileId: m.user1_id,
        })) || []),
      ];

      const enrichedMatches = allMatches.map(m => {
        const profile = profiles?.find(p => p.id === m.matchedProfileId);
        return {
          id: m.id,
          created_at: m.created_at,
          matchedProfile: profile,
        };
      }).filter(m => m.matchedProfile) as Match[];

      setMatches(enrichedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }

    setLoading(false);
  };

  const handleViewProfile = (username: string) => {
    onOpenChange(false);
    navigate(`/profile/${username}`);
  };

  const handleMessage = (userId: string) => {
    onOpenChange(false);
    navigate(`/messages/${userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            Seus Matches
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Você ainda não tem matches. Continue explorando!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={match.matchedProfile.photo_url} />
                    <AvatarFallback className="gradient-primary text-primary-foreground">
                      {match.matchedProfile.profiles?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {match.matchedProfile.profiles?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{match.matchedProfile.profiles?.username}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleViewProfile(match.matchedProfile.profiles?.username)}
                    >
                      <User className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => handleMessage(match.matchedProfile.user_id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
