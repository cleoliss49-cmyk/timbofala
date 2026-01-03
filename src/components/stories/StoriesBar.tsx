import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StoryViewer } from './StoryViewer';
import { Plus } from 'lucide-react';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  title: string | null;
  target_audience: string;
  duration_hours: number;
  expires_at: string;
  created_at: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface StoriesBarProps {
  onCreateStory?: () => void;
  isAdmin?: boolean;
}

export function StoriesBar({ onCreateStory, isAdmin = false }: StoriesBarProps) {
  const { user, profile } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const [showViewer, setShowViewer] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetchStories();

    // Subscribe to new stories
    const channel = supabase
      .channel('stories-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
      }, () => {
        fetchStories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchStories = async () => {
    try {
      // Fetch stories
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for each story
      const storiesWithProfiles: Story[] = [];
      for (const story of storiesData || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', story.user_id)
          .single();
        
        storiesWithProfiles.push({
          ...story,
          profiles: profileData || undefined,
        });
      }
      
      setStories(storiesWithProfiles);

      // Check which stories user has viewed
      if (user && storiesWithProfiles.length > 0) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('user_id', user.id)
          .in('story_id', storiesWithProfiles.map(s => s.id));

        if (views) {
          setViewedStories(new Set(views.map(v => v.story_id)));
        }
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const openStory = (index: number) => {
    setSelectedIndex(index);
    setShowViewer(true);
  };

  if (stories.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <>
      <div className="bg-card rounded-2xl shadow-card p-4 mb-4 border border-border">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Create story button for admin */}
          {isAdmin && onCreateStory && (
            <button
              onClick={onCreateStory}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Novo</span>
            </button>
          )}

          {/* Stories */}
          {stories.map((story, index) => {
            const isViewed = viewedStories.has(story.id);
            
            return (
              <button
                key={story.id}
                onClick={() => openStory(index)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full p-0.5 ${
                    isViewed 
                      ? 'bg-muted' 
                      : 'bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500'
                  }`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-card p-0.5">
                      {story.media_type === 'video' ? (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white text-xs">▶</span>
                        </div>
                      ) : (
                        <img
                          src={story.media_url}
                          alt={story.title || 'Story'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[64px]">
                  @{story.profiles?.username || 'admin'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <StoryViewer
        stories={stories}
        initialIndex={selectedIndex}
        open={showViewer}
        onOpenChange={setShowViewer}
        isAdmin={isAdmin}
      />
    </>
  );
}
