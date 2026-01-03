import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { X, ChevronLeft, ChevronRight, Eye, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  view_count?: number;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function StoryViewer({ stories, initialIndex, open, onOpenChange, isAdmin = false }: StoryViewerProps) {
  const { user, profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.media_type === 'video' ? 30000 : 5000; // 30s for video, 5s for image

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!open || !currentStory) return;

    // Register view
    const registerView = async () => {
      if (!user || !profile) return;

      try {
        await supabase.from('story_views').upsert({
          story_id: currentStory.id,
          user_id: user.id,
          user_gender: profile.gender,
          user_city: profile.city,
          viewed_at: new Date().toISOString(),
        }, { onConflict: 'story_id,user_id' });
      } catch (error) {
        console.error('Error registering view:', error);
      }
    };

    registerView();

    // Fetch view count for admin
    if (isAdmin) {
      const fetchViewCount = async () => {
        const { count } = await supabase
          .from('story_views')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', currentStory.id);
        setViewCount(count || 0);
      };
      fetchViewCount();

      // Subscribe to realtime updates
      const channel = supabase
        .channel(`story-views-${currentStory.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'story_views',
          filter: `story_id=eq.${currentStory.id}`,
        }, () => {
          setViewCount(prev => prev + 1);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, currentStory, user, profile, isAdmin]);

  useEffect(() => {
    if (!open) return;

    setProgress(0);
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100));
        if (newProgress >= 100) {
          goToNext();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [open, currentIndex, duration]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  };

  if (!currentStory) return null;

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'women': return 'Apenas mulheres';
      case 'men': return 'Apenas homens';
      default: return 'Todos';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-black border-0 overflow-hidden">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={currentStory.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                {currentStory.profiles?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">
                @{currentStory.profiles?.username || 'admin'}
              </p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
          <button
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Media */}
        <div className="relative aspect-[9/16] bg-black flex items-center justify-center">
          {currentStory.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt={currentStory.title || 'Story'}
              className="w-full h-full object-contain"
            />
          )}

          {/* Navigation areas */}
          <button
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            onClick={goToPrevious}
          />
          <button
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            onClick={goToNext}
          />

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
              onClick={goToNext}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {currentStory.title && (
            <h3 className="text-white font-bold text-lg mb-1">{currentStory.title}</h3>
          )}
          {currentStory.caption && (
            <p className="text-white/90 text-sm">{currentStory.caption}</p>
          )}
          
          {isAdmin && (
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <Eye className="w-4 h-4" />
                <span>{viewCount} visualizações</span>
              </div>
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <Users className="w-4 h-4" />
                <span>{getAudienceLabel(currentStory.target_audience)}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
