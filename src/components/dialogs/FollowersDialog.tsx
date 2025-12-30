import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialTab?: 'followers' | 'following';
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export function FollowersDialog({
  open,
  onOpenChange,
  userId,
  initialTab = 'followers',
}: FollowersDialogProps) {
  const [tab, setTab] = useState(initialTab);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, userId]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch followers
    const { data: followersData } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    if (followersData && followersData.length > 0) {
      const followerIds = followersData.map(f => f.follower_id);
      const { data: followerProfiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', followerIds);
      
      setFollowers(followerProfiles || []);
    } else {
      setFollowers([]);
    }

    // Fetch following
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followingData && followingData.length > 0) {
      const followingIds = followingData.map(f => f.following_id);
      const { data: followingProfiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', followingIds);
      
      setFollowing(followingProfiles || []);
    } else {
      setFollowing([]);
    }

    setLoading(false);
  };

  const renderUserList = (users: UserProfile[]) => {
    if (loading) {
      return Array(3).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
      ));
    }

    if (users.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          Nenhum usuário encontrado.
        </p>
      );
    }

    return users.map((user) => (
      <Link
        key={user.id}
        to={`/profile/${user.username}`}
        onClick={() => onOpenChange(false)}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
      >
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="gradient-primary text-primary-foreground">
            {user.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </Link>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conexões</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'followers' | 'following')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">Seguidores</TabsTrigger>
            <TabsTrigger value="following">Seguindo</TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4 max-h-80 overflow-y-auto">
            {renderUserList(followers)}
          </TabsContent>

          <TabsContent value="following" className="mt-4 max-h-80 overflow-y-auto">
            {renderUserList(following)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
