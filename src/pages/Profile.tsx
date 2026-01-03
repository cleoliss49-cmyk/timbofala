import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Calendar, Settings, MessageCircle, UserPlus, UserMinus, Facebook, Instagram, Twitter, Camera, ImagePlus, Info, Video, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditProfileDialog } from '@/components/dialogs/EditProfileDialog';
import { FollowersDialog } from '@/components/dialogs/FollowersDialog';
import { ProfileDetailsDialog } from '@/components/dialogs/ProfileDetailsDialog';
import { CreateStoryDialog } from '@/components/stories/CreateStoryDialog';
import { StoryMetricsDialog } from '@/components/stories/StoryMetricsDialog';
import { StoriesBar } from '@/components/stories/StoriesBar';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  neighborhood: string;
  city: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  kwai_url: string | null;
  created_at: string;
  gender: string | null;
  relationship_status: string | null;
  birth_date: string | null;
  languages: string[] | null;
  education: string | null;
  profession: string | null;
  show_relationship_status: boolean | null;
  show_birth_date: boolean | null;
  show_languages: boolean | null;
  show_education: boolean | null;
  show_profession: boolean | null;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [followersTab, setFollowersTab] = useState<'followers' | 'following'>('followers');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryMetrics, setShowStoryMetrics] = useState(false);
  const [adminStories, setAdminStories] = useState<any[]>([]);
  const isOwnProfile = currentUserProfile?.username === username;
  const isAdminProfile = username === 'admin';
  const isCurrentUserAdmin = currentUserProfile?.username === 'admin';

  const fetchProfile = async () => {
    if (!username) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !profile) {
      navigate('/feed');
      return;
    }

    setProfileData(profile);

    // Fetch posts
    const { data: userPosts } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        reactions (user_id),
        comments (id)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (userPosts) {
      setPosts(userPosts);
    }

    // Fetch followers count
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id);

    setFollowersCount(followers || 0);

    // Fetch following count
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id);

    setFollowingCount(following || 0);

    // Check if current user is following
    if (user && user.id !== profile.id) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .maybeSingle();

      setIsFollowing(!!followData);
    }

    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [username, user]);

  // Fetch admin stories for metrics
  const fetchAdminStories = async () => {
    if (!isCurrentUserAdmin) return;
    
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setAdminStories(data || []);
  };

  useEffect(() => {
    if (isCurrentUserAdmin && isOwnProfile) {
      fetchAdminStories();
    }
  }, [isCurrentUserAdmin, isOwnProfile, user]);

  const handleDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);
      
      if (error) throw error;
      
      toast({ title: 'Story excluído!' });
      fetchAdminStories();
    } catch (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const handleFollow = async () => {
    if (!user || !profileData) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id);

        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast({
          title: 'Deixou de seguir',
          description: `Você deixou de seguir ${profileData.full_name}`,
        });
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: profileData.id,
        });

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast({
          title: 'Seguindo!',
          description: `Você agora segue ${profileData.full_name}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível completar a ação.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-48 rounded-2xl mb-4" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </MainLayout>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Stories bar for admin profile */}
        {isAdminProfile && (
          <StoriesBar 
            onCreateStory={isCurrentUserAdmin ? () => setShowCreateStory(true) : undefined}
            isAdmin={isCurrentUserAdmin && isOwnProfile}
          />
        )}

        {/* Admin story controls */}
        {isCurrentUserAdmin && isOwnProfile && (
          <div className="flex gap-2 mb-4">
            <Button onClick={() => setShowCreateStory(true)} className="flex-1">
              <Video className="w-4 h-4 mr-2" />
              Publicar Story Premium
            </Button>
            <Button variant="outline" onClick={() => setShowStoryMetrics(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Métricas
            </Button>
          </div>
        )}

        {/* Cover & Avatar */}
        <div className="relative mb-16">
          <div 
            className={`h-48 rounded-2xl overflow-hidden ${isOwnProfile ? 'cursor-pointer group' : ''}`}
            onClick={() => isOwnProfile && setShowEditDialog(true)}
          >
            {profileData.cover_url ? (
              <img 
                src={profileData.cover_url} 
                alt="Capa do perfil"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full gradient-hero" />
            )}
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          <div 
            className={`absolute -bottom-12 left-6 ${isOwnProfile ? 'cursor-pointer group' : ''}`}
            onClick={() => isOwnProfile && setShowEditDialog(true)}
          >
            <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
              <AvatarImage src={profileData.avatar_url || undefined} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-2xl">
                {profileData.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-card rounded-2xl shadow-card p-6 mb-6 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">{profileData.full_name}</h1>
              <p className="text-muted-foreground">@{profileData.username}</p>
              
              {profileData.bio && (
                <p className="mt-3 text-foreground">{profileData.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profileData.neighborhood}, {profileData.city}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Entrou em {format(new Date(profileData.created_at), 'MMMM yyyy', { locale: ptBR })}
                </span>
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  className="text-sm hover:underline"
                  onClick={() => { setFollowersTab('following'); setShowFollowersDialog(true); }}
                >
                  <strong className="text-foreground">{followingCount}</strong>{' '}
                  <span className="text-muted-foreground">seguindo</span>
                </button>
                <button 
                  className="text-sm hover:underline"
                  onClick={() => { setFollowersTab('followers'); setShowFollowersDialog(true); }}
                >
                  <strong className="text-foreground">{followersCount}</strong>{' '}
                  <span className="text-muted-foreground">seguidores</span>
                </button>
              </div>

              {/* Social Media Links */}
              {(profileData.facebook_url || profileData.instagram_url || profileData.twitter_url || profileData.tiktok_url || profileData.kwai_url) && (
                <div className="flex items-center gap-3 mt-4">
                  {profileData.facebook_url && (
                    <a 
                      href={profileData.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {profileData.instagram_url && (
                    <a 
                      href={profileData.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {profileData.twitter_url && (
                    <a 
                      href={profileData.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="X (Twitter)"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profileData.tiktok_url && (
                    <a 
                      href={profileData.tiktok_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="TikTok"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                  )}
                  {profileData.kwai_url && (
                    <a 
                      href={profileData.kwai_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Kwai"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" onClick={() => setShowDetailsDialog(true)}>
                    <Info className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Editar perfil
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsDialog(true)}
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </Button>
                  <Button
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Deixar de seguir
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Seguir
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/messages/${profileData.id}`)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-2">Publicações</h2>
          {posts.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 shadow-card text-center border border-border">
              <p className="text-muted-foreground">
                {isOwnProfile
                  ? 'Você ainda não fez nenhuma publicação.'
                  : 'Este usuário ainda não fez nenhuma publicação.'}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={fetchProfile} />
            ))
          )}
        </div>
      </div>

      <EditProfileDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdate={() => {
          refreshProfile();
          fetchProfile();
        }}
      />

      <ProfileDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        profile={profileData}
      />

      {/* Story dialogs for admin */}
      {isCurrentUserAdmin && (
        <>
          <CreateStoryDialog
            open={showCreateStory}
            onOpenChange={setShowCreateStory}
            onStoryCreated={fetchAdminStories}
          />
          <StoryMetricsDialog
            open={showStoryMetrics}
            onOpenChange={setShowStoryMetrics}
            stories={adminStories}
            onDeleteStory={handleDeleteStory}
          />
        </>
      )}

      <FollowersDialog
        open={showFollowersDialog}
        onOpenChange={setShowFollowersDialog}
        userId={profileData?.id || ''}
        initialTab={followersTab}
      />
    </MainLayout>
  );
}
