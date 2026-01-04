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
import { Heart, MessageCircle, User, Sparkles, MapPin, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

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
    city?: string;
    profiles: {
      full_name: string;
      username: string;
      birth_date?: string | null;
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
        .select('id, photo_url, user_id, city')
        .in('id', matchedIds);

      // Get user IDs
      const userIds = paqueraProfiles?.map(p => p.user_id) || [];
      
      // Fetch user profiles
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, birth_date')
        .in('id', userIds);

      // Merge the data
      const profiles = paqueraProfiles?.map(p => ({
        ...p,
        profiles: userProfiles?.find(up => up.id === p.user_id),
      }));

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

      // Sort by most recent
      enrichedMatches.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

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

  const calculateAge = (birthDate: string | null | undefined) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatMatchDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana(s) atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl">Seus Pares</span>
              {matches.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                  {matches.length}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum par ainda</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Quando você e outra pessoa se curtirem mutuamente, aparecerão aqui! Continue explorando.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border border-pink-200/50 dark:border-pink-800/30 hover:border-pink-300 dark:hover:border-pink-700 transition-all"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Photo */}
                    <div className="relative">
                      <Avatar className="w-16 h-16 ring-2 ring-pink-300 dark:ring-pink-700">
                        <AvatarImage src={match.matchedProfile.photo_url} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-600 text-white text-lg">
                          {match.matchedProfile.profiles?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                        <Heart className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {match.matchedProfile.profiles?.full_name}
                        </h3>
                        {match.matchedProfile.profiles?.birth_date && (
                          <span className="text-muted-foreground">
                            {calculateAge(match.matchedProfile.profiles.birth_date)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {match.matchedProfile.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {match.matchedProfile.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatMatchDate(match.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex border-t border-pink-200/50 dark:border-pink-800/30">
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-none rounded-bl-2xl h-12 gap-2 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                      onClick={() => handleViewProfile(match.matchedProfile.profiles?.username)}
                    >
                      <User className="w-4 h-4" />
                      Ver Perfil
                    </Button>
                    <div className="w-px bg-pink-200/50 dark:bg-pink-800/30" />
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-none rounded-br-2xl h-12 gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                      onClick={() => handleMessage(match.matchedProfile.user_id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar Mensagem
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
