import { useCallback, useRef, useEffect } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Pre-load the notification sound
    audioRef.current = new Audio('/ringtone.mp3');
    audioRef.current.volume = 0.6;
    audioRef.current.load();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log('Could not play notification sound:', error);
      });
    }
  }, []);

  const playOrderSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      // Play notification sound twice for orders
      audioRef.current.play().then(() => {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }, 1000);
      }).catch((error) => {
        console.log('Could not play order sound:', error);
      });
    }
  }, []);

  return { playNotificationSound, playOrderSound };
}
