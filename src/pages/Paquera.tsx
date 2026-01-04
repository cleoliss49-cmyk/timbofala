import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, X, MessageCircle, User, Sparkles, Users, 
  MapPin, Calendar, Flame, Star, Eye, RefreshCw,
  ThumbsUp, Shield, Zap, Clock, Filter, ChevronDown
} from 'lucide-react';
import { PaqueraSetupDialog } from '@/components/paquera/PaqueraSetupDialog';
import { PaqueraMatchesDialog } from '@/components/paquera/PaqueraMatchesDialog';
import { PaqueraPaymentDialog } from '@/components/paquera/PaqueraPaymentDialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  sexual_orientation: string;
  is_active: boolean;
  created_at: string;
  user_profile?: {
    full_name: string;
    username: string;
    birth_date: string | null;
    avatar_url: string | null;
  };
  compatibility_score?: number;
  mutual_hobbies?: string[];
}

interface Stats {
  totalLikes: number;
  totalMatches: number;
  profileViews: number;
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
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [stats, setStats] = useState<Stats>({ totalLikes: 0, totalMatches: 0, profileViews: 0 });
  const [filterMode, setFilterMode] = useState<'all' | 'nearby' | 'new'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [superLikeAvailable, setSuperLikeAvailable] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [accessInfo, setAccessInfo] = useState<{
    canInteract: boolean;
    interactionsRemaining: number;
    needsPayment: boolean;
    status: string;
  } | null>(null);

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
      await Promise.all([
        fetchProfiles(data),
        fetchMyLikes(data.id),
        fetchStats(data.id),
        checkAccessStatus(data.id)
      ]);
    } else {
      setShowSetup(true);
    }
    setLoading(false);
  };

  const checkAccessStatus = async (profileId: string) => {
    // First check subscription expiry
    const { data: subscription } = await supabase
      .from('paquera_subscriptions')
      .select('*')
      .eq('paquera_profile_id', profileId)
      .maybeSingle();

    // If subscription exists and is expired, update status and show payment dialog
    if (subscription && subscription.status === 'active' && subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      if (expiresAt < new Date()) {
        // Subscription expired - update status to expired
        await supabase
          .from('paquera_subscriptions')
          .update({ status: 'expired', interactions_count: 0 })
          .eq('id', subscription.id);

        setAccessInfo({
          canInteract: false,
          interactionsRemaining: 0,
          needsPayment: true,
          status: 'expired'
        });

        toast({
          title: 'Assinatura expirada',
          description: 'Sua assinatura do Paquera expirou. Renove para continuar usando!',
          variant: 'destructive',
        });

        setShowPaymentDialog(true);
        return;
      }
    }

    const { data, error } = await supabase.rpc('check_paquera_access', {
      p_profile_id: profileId
    });

    if (data && data.length > 0) {
      const result = data[0];
      setAccessInfo({
        canInteract: result.can_interact,
        interactionsRemaining: result.interactions_remaining,
        needsPayment: result.needs_payment,
        status: result.subscription_status
      });
      
      if (result.needs_payment) {
        setShowPaymentDialog(true);
      }
    }
  };

  const fetchStats = async (myProfileId: string) => {
    // Count likes received (REAL data)
    const { count: likesReceived } = await supabase
      .from('paquera_likes')
      .select('*', { count: 'exact', head: true })
      .eq('liked_id', myProfileId);

    // Count matches (REAL data)
    const { count: matches1 } = await supabase
      .from('paquera_matches')
      .select('*', { count: 'exact', head: true })
      .eq('user1_id', myProfileId);

    const { count: matches2 } = await supabase
      .from('paquera_matches')
      .select('*', { count: 'exact', head: true })
      .eq('user2_id', myProfileId);

    // Profile views = likes received (real metric based on actual interactions)
    // Each like represents at least one view, so we use likes as a proxy for views
    const actualViews = (likesReceived || 0);

    setStats({
      totalLikes: likesReceived || 0,
      totalMatches: (matches1 || 0) + (matches2 || 0),
      profileViews: actualViews,
    });
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
    console.log('Fetching profiles for:', myProfile.id, 'user:', user?.id);
    
    // Fetch ALL active profiles except the current user
    let query = supabase
      .from('paquera_profiles')
      .select('*')
      .neq('user_id', user?.id)
      .eq('is_active', true);

    if (filterMode === 'new') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('created_at', sevenDaysAgo.toISOString());
    }
    
    const { data, error } = await query;

    console.log('Paquera profiles fetched:', data?.length, 'error:', error);

    if (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Erro ao carregar perfis',
        description: 'Não foi possível carregar os perfis. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    if (!data || data.length === 0) {
      console.log('No other profiles found in database');
      setProfiles([]);
      return;
    }

    // Get user profiles info
    const userIds = data.map(p => p.user_id);
    
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, birth_date, avatar_url')
      .in('id', userIds);

    const { data: myLikes } = await supabase
      .from('paquera_likes')
      .select('liked_id')
      .eq('liker_id', myProfile.id);

    const likedSet = new Set(myLikes?.map(l => l.liked_id) || []);

    // Enrich all profiles without mutual preference filtering (show all profiles)
    const enrichedData = data
      .filter(p => !likedSet.has(p.id)) // Only filter already liked profiles
      .map(p => {
        const userProfile = userProfiles?.find(up => up.id === p.user_id);
        
        // Calculate compatibility score
        const myHobbies = new Set(myProfile.hobbies || []);
        const theirHobbies = p.hobbies || [];
        const mutualHobbies = theirHobbies.filter(h => myHobbies.has(h));
        
        let compatibilityScore = 50; // Base score
        compatibilityScore += mutualHobbies.length * 10; // +10 per mutual hobby
        if (p.city === myProfile.city) compatibilityScore += 15; // Same neighborhood
        
        // Bonus for mutual preference match
        const iAmInterestedInThem = 
          myProfile.looking_for_gender === 'other' || 
          myProfile.looking_for_gender === p.gender;
        const theyAreInterestedInMe = 
          p.looking_for_gender === 'other' || 
          p.looking_for_gender === myProfile.gender;
        
        if (iAmInterestedInThem && theyAreInterestedInMe) {
          compatibilityScore += 20; // Both interested in each other
        }
        
        compatibilityScore = Math.min(99, compatibilityScore);

        return {
          ...p,
          user_profile: userProfile,
          compatibility_score: compatibilityScore,
          mutual_hobbies: mutualHobbies,
        };
      }) as PaqueraProfile[];

    // Sort by compatibility score
    const sorted = enrichedData.sort((a, b) => 
      (b.compatibility_score || 0) - (a.compatibility_score || 0)
    );

    // Filter by mode
    let filtered = sorted;
    if (filterMode === 'nearby' && myProfile.city) {
      filtered = sorted.filter(p => p.city === myProfile.city);
    }

    console.log('Final profiles count:', filtered.length);
    setProfiles(filtered);
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

  const handleLike = async (isSuperLike = false) => {
    if (!myPaqueraProfile || currentIndex >= profiles.length) return;

    // Check if user needs to pay
    if (accessInfo?.needsPayment) {
      setShowPaymentDialog(true);
      return;
    }

    const targetProfile = profiles[currentIndex];
    setSwipeDirection('right');

    if (isSuperLike) {
      setSuperLikeAvailable(false);
      toast({
        title: '⭐ Super Like enviado!',
        description: `${targetProfile.user_profile?.full_name} vai ver que você curtiu especialmente!`,
      });
    }

    // Increment interaction count
    const { data: interactionResult } = await supabase.rpc('increment_paquera_interaction', {
      p_profile_id: myPaqueraProfile.id
    });

    if (interactionResult && interactionResult.length > 0) {
      const result = interactionResult[0];
      if (result.limit_reached) {
        setAccessInfo(prev => prev ? { ...prev, needsPayment: true, canInteract: false } : null);
        setShowPaymentDialog(true);
        setSwipeDirection(null);
        return;
      }
      
      // Update remaining interactions
      if (accessInfo) {
        setAccessInfo(prev => prev ? {
          ...prev,
          interactionsRemaining: Math.max(0, (prev.interactionsRemaining || 10) - 1)
        } : null);
      }
    }

    try {
      const { error } = await supabase
        .from('paquera_likes')
        .insert({
          liker_id: myPaqueraProfile.id,
          liked_id: targetProfile.id,
        });

      if (error) throw error;

      setLikedIds(prev => new Set([...prev, targetProfile.id]));
      
      // Check for match
      const { data: mutualLike } = await supabase
        .from('paquera_likes')
        .select('id')
        .eq('liker_id', targetProfile.id)
        .eq('liked_id', myPaqueraProfile.id)
        .maybeSingle();

      if (mutualLike) {
        toast({
          title: '🎉 É um Match!',
          description: `Você e ${targetProfile.user_profile?.full_name} se curtiram! Comece uma conversa!`,
        });
        
        // The match is created by database trigger
        setStats(prev => ({ ...prev, totalMatches: prev.totalMatches + 1 }));
      }

      setTimeout(() => {
        setSwipeDirection(null);
        if (currentIndex < profiles.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setProfiles(prev => prev.filter(p => p.id !== targetProfile.id));
          setCurrentIndex(0);
        }
      }, 300);
    } catch (error: any) {
      setSwipeDirection(null);
      if (error.code === '23505') {
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
    setSwipeDirection('left');
    setTimeout(() => {
      setSwipeDirection(null);
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setProfiles(prev => prev.slice(0, -1));
        setCurrentIndex(0);
      }
    }, 300);
  };

  const handleRefresh = async () => {
    if (!myPaqueraProfile) return;
    setIsRefreshing(true);
    setCurrentIndex(0);
    await fetchProfiles(myPaqueraProfile);
    setIsRefreshing(false);
    toast({
      title: 'Perfis atualizados!',
      description: 'Novos perfis foram carregados.',
    });
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-[500px] rounded-2xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                Paquera
              </h1>
              <p className="text-muted-foreground text-sm">Encontre sua conexão</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="relative"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowMatches(true)}
              className="relative"
            >
              <Users className="w-5 h-5" />
              {stats.totalMatches > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">
                  {stats.totalMatches > 9 ? '9+' : stats.totalMatches}
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowSetup(true)}>
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {myPaqueraProfile && (
          <Card className="mb-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-200 dark:border-pink-800">
            <CardContent className="py-3 px-4">
              <div className="flex justify-around">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-pink-600 dark:text-pink-400">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="font-bold">{stats.totalLikes}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Curtidas</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400">
                    <Heart className="w-4 h-4" />
                    <span className="font-bold">{stats.totalMatches}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Matches</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                    <Eye className="w-4 h-4" />
                    <span className="font-bold">{stats.profileViews}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Interações</p>
                </div>
                {accessInfo && accessInfo.status !== 'active' && (
                  <div className="text-center">
                    <div className={`flex items-center justify-center gap-1 ${
                      accessInfo.interactionsRemaining <= 3 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      <Zap className="w-4 h-4" />
                      <span className="font-bold">{accessInfo.interactionsRemaining}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Restantes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        {myPaqueraProfile && profiles.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {filterMode === 'all' ? 'Todos' : filterMode === 'nearby' ? 'Próximos' : 'Novos'}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  setFilterMode('all');
                  myPaqueraProfile && fetchProfiles(myPaqueraProfile);
                }}>
                  <Users className="w-4 h-4 mr-2" />
                  Todos os perfis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setFilterMode('nearby');
                  myPaqueraProfile && fetchProfiles(myPaqueraProfile);
                }}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Mesmo bairro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setFilterMode('new');
                  myPaqueraProfile && fetchProfiles(myPaqueraProfile);
                }}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Novos (última semana)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} de {profiles.length}
            </p>
          </div>
        )}

        {!myPaqueraProfile ? (
          <Card className="p-8 text-center bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-pink-200 dark:border-pink-800">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Bem-vindo ao Paquera!</h2>
            <p className="text-muted-foreground mb-6">
              Crie seu perfil exclusivo e comece a conhecer pessoas incríveis na sua região.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
              onClick={() => setShowSetup(true)}
            >
              <Heart className="w-5 h-5 mr-2" />
              Criar meu perfil
            </Button>
          </Card>
        ) : profiles.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-pink-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Aguardando novos perfis</h2>
            <p className="text-muted-foreground mb-4">
              {likedIds.size > 0 
                ? 'Você já curtiu todos os perfis disponíveis! Volte mais tarde para ver novos usuários.'
                : 'Ainda não há outros usuários no Paquera. Seja paciente, novos perfis aparecerão em breve!'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" onClick={() => setShowMatches(true)}>
                <Users className="w-4 h-4 mr-2" />
                Ver Matches
              </Button>
            </div>
          </Card>
        ) : currentProfile ? (
          <div className="space-y-4">
            {/* Profile Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProfile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: swipeDirection === 'left' ? -300 : swipeDirection === 'right' ? 300 : 0,
                  rotate: swipeDirection === 'left' ? -15 : swipeDirection === 'right' ? 15 : 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden relative">
                  {/* Compatibility Badge */}
                  {currentProfile.compatibility_score && currentProfile.compatibility_score > 70 && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1 shadow-lg">
                        <Flame className="w-3 h-3" />
                        {currentProfile.compatibility_score}% compatível
                      </Badge>
                    </div>
                  )}

                  <div className="relative aspect-[3/4]">
                    <img
                      src={currentProfile.photo_url}
                      alt="Foto do perfil"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold">
                          {currentProfile.user_profile?.full_name}
                        </h2>
                        {currentProfile.user_profile?.birth_date && (
                          <span className="text-xl font-light">
                            {calculateAge(currentProfile.user_profile.birth_date)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-white/80 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{currentProfile.city}</span>
                      </div>
                      
                      {currentProfile.bio && (
                        <p className="text-white/90 mb-4 line-clamp-3">{currentProfile.bio}</p>
                      )}
                      
                      {/* Hobbies with mutual highlight */}
                      {currentProfile.hobbies && currentProfile.hobbies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentProfile.hobbies.map((hobby, i) => {
                            const isMutual = currentProfile.mutual_hobbies?.includes(hobby);
                            return (
                              <Badge 
                                key={i} 
                                variant="secondary" 
                                className={isMutual 
                                  ? 'bg-pink-500/30 text-white border border-pink-400' 
                                  : 'bg-white/20 text-white'
                                }
                              >
                                {isMutual && <Star className="w-3 h-3 mr-1" />}
                                {hobby}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                className="w-14 h-14 rounded-full border-2 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all"
                onClick={handlePass}
              >
                <X className="w-7 h-7 text-red-500" />
              </Button>
              
              <Button
                size="lg"
                className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-lg transition-all disabled:opacity-50"
                onClick={() => handleLike(true)}
                disabled={!superLikeAvailable}
              >
                <Star className="w-7 h-7 text-white" />
              </Button>
              
              <Button
                size="lg"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg transition-all"
                onClick={() => handleLike(false)}
              >
                <Heart className="w-8 h-8 text-white" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-14 h-14 rounded-full border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all"
                onClick={() => {
                  if (currentProfile.user_profile?.username) {
                    navigate(`/profile/${currentProfile.user_profile.username}`);
                  }
                }}
              >
                <User className="w-7 h-7 text-blue-500" />
              </Button>
            </div>

            {/* Action hints */}
            <div className="flex justify-center gap-6 text-xs text-muted-foreground">
              <span>Passar</span>
              <span className={!superLikeAvailable ? 'opacity-50' : ''}>Super Like</span>
              <span>Curtir</span>
              <span>Ver Perfil</span>
            </div>
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

      {myPaqueraProfile && user && (
        <PaqueraPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          paqueraProfileId={myPaqueraProfile.id}
          userId={user.id}
          interactionsUsed={10 - (accessInfo?.interactionsRemaining || 0)}
          interactionsLimit={10}
        />
      )}
    </MainLayout>
  );
}