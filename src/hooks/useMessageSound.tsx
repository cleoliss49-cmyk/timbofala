import { useCallback, useRef } from 'react';

export function useMessageSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/message-notification.mp3');
      audioRef.current.volume = 0.5;
    }

    // Play the sound
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // Ignore errors (e.g., if user hasn't interacted with page yet)
    });
  }, []);

  return { playSound };
}