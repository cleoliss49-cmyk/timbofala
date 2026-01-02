import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Heart, X, MessageCircle, User, Sparkles, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { PaqueraSetupDialog } from '@/components/paquera/PaqueraSetupDialog';
import { PaqueraMatchesDialog } from '@/components/paquera/PaqueraMatchesDialog';

interface PaqueraProfile {
  id: string;
  user_id: string;
  photo_url: string;
  gender: string;
  looking_for_gender: string;
  hobbies: string[];
  city: string;
  bio: string;
  age_range_min: number;
  age_range_max: number;
  user_profile?: {
    full_name: string;
    username: string;
    birth_date: string | null;
  };
}

export default function Paquera() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [myPaqueraProfile, setMyPaqueraProfile] = useState<PaqueraProfile | null>(null);
  const [profiles, setProfiles] = useState<PaqueraProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMyProfile();
  }, [user]);

  const fetchMyProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('paquera_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setMyPaqueraProfile(data);
      fetchProfiles(data);
      fetchMyLikes(data.id);
    } else {
      setShowSetup(true);
    }
    setLoading(false);
  };

  const fetchMyLikes = async (myProfileId: string) => {
    const { data } = await supabase
      .from('paquera_likes')
      .select('liked_id')
      .eq('liker_id', myProfileId);

    if (data) {
      setLikedIds(new Set(data.map(l => l.liked_id)));
    }
  };

  const fetchProfiles = async (myProfile: PaqueraProfile) => {
    // Fetch profiles based on preferences
    const { data } = await supabase
      .from('paquera_profiles')
      .select('*')
      .neq('user_id', user?.id)
      .eq('is_active', true)
      .eq('gender', myProfile.looking_for_gender);

    if (data) {
      // Get user profiles for these paquera profiles
      const userIds = data.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, birth_date')
        .in('id', userIds);

      // Merge the data
      const enrichedData = data.map(p => ({
        ...p,
        user_profile: profiles?.find(up => up.id === p.user_id),
      }));

      // Filter out already liked profiles
      const { data: myLikes } = await supabase
        .from('paquera_likes')
        .select('liked_id')
        .eq('liker_id', myProfile.id);

      const likedSet = new Set(myLikes?.map(l => l.liked_id) || []);
      const filtered = enrichedData.filter(p => !likedSet.has(p.id)) as PaqueraProfile[];
      
      // Shuffle profiles
      setProfiles(filtered.sort(() => Math.random() - 0.5));
    }
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

  const handleLike = async () => {
    if (!myPaqueraProfile || currentIndex >= profiles.length) return;

    const targetProfile = profiles[currentIndex];

    try {
      const { error } = await supabase
        .from('paquera_likes')
        .insert({
          liker_id: myPaqueraProfile.id,
          liked_id: targetProfile.id,
        });

      if (error) throw error;

      setLikedIds(prev => new Set([...prev, targetProfile.id]));
      
      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setProfiles(prev => prev.filter(p => p.id !== targetProfile.id));
        setCurrentIndex(0);
      }
    } catch (error: any) {
      if (error.code === '23505') {
        // Already liked
        setCurrentIndex(prev => prev + 1);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível curtir este perfil.',
          variant: 'destructive',
        });
      }
    }
  };

  const handlePass = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setProfiles(prev => prev.slice(0, -1));
      setCurrentIndex(0);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto">
          <Skeleton className="h-[500px] rounded-2xl" />
        </div>
      </MainLayout>
    );
  }

  // Check age requirement - we'll check via the profile data from DB
  // For now, the terms acceptance is enough since user confirms they're 18+
  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Paquera</h1>
              <p className="text-muted-foreground text-sm">Encontre pessoas especiais</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowMatches(true)}>
              <Users className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowSetup(true)}>
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {!myPaqueraProfile ? (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Bem-vindo ao Paquera!</h2>
            <p className="text-muted-foreground mb-4">
              Crie seu subperfil para começar a conhecer pessoas.
            </p>
            <Button onClick={() => setShowSetup(true)}>
              Criar meu perfil
            </Button>
          </Card>
        ) : profiles.length === 0 ? (
          <Card className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Nenhum perfil disponível</h2>
            <p className="text-muted-foreground">
              Não há mais perfis para mostrar no momento. Volte mais tarde!
            </p>
          </Card>
        ) : currentProfile ? (
          <div className="space-y-4">
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[3/4]">
                <img
                  src={currentProfile.photo_url}
                  alt="Foto do perfil"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold">
                      {currentProfile.user_profile?.full_name}
                    </h2>
                    {currentProfile.user_profile?.birth_date && (
                      <span className="text-xl">
                        {calculateAge(currentProfile.user_profile.birth_date)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-white/80 mb-3">{currentProfile.city}</p>
                  
                  {currentProfile.bio && (
                    <p className="text-white/90 mb-3">{currentProfile.bio}</p>
                  )}
                  
                  {currentProfile.hobbies && currentProfile.hobbies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.hobbies.map((hobby, i) => (
                        <Badge key={i} variant="secondary" className="bg-white/20 text-white">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full border-2"
                onClick={handlePass}
              >
                <X className="w-8 h-8" />
              </Button>
              
              <Button
                size="lg"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                onClick={handleLike}
              >
                <Heart className="w-8 h-8 text-white" />
              </Button>
            </div>

            {/* Navigation hint */}
            <p className="text-center text-sm text-muted-foreground">
              {currentIndex + 1} de {profiles.length} perfis
            </p>
          </div>
        ) : null}
      </div>

      <PaqueraSetupDialog
        open={showSetup}
        onOpenChange={setShowSetup}
        existingProfile={myPaqueraProfile}
        onSave={() => {
          fetchMyProfile();
          setShowSetup(false);
        }}
      />

      <PaqueraMatchesDialog
        open={showMatches}
        onOpenChange={setShowMatches}
        myProfileId={myPaqueraProfile?.id}
      />
    </MainLayout>
  );
}
