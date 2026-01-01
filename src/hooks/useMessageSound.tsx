import { useCallback, useRef } from 'react';

export function useMessageSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Use a simple notification sound - base64 encoded short beep
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQkRS7Dx6Y9fBAtVvO/wm2sOFmXH8fKgdRMZau/t6pZpDhVy9+3omV8JDnjx8eiNVgQHefX18INCAAp//vz8fjIACoX++/99LQALif/9/n0sAAqM//3+fC4AC4z//f57MAAPkP/8/XguABKU//v9eC4AFZX/+/13LwAXl//7/XYuABmZ//r9dS4AGpn/+v10LgAbmv/6/XQuABua//r9dC4AG5r/+v10LgAbmv/6/XQuABqa//r9dC4AGpr/+v10LgAamv/6/XQuABqa//r9dC4AGpn/+v10LwAZmf/6/XUvABiY//v9di4AFpf/+/13LgAUlf/7/XguABOT//z9eC8AEI//+/15MAANC//+/XsvAAsI//7+fTEACYX//v9+NAAIgP79/38+AAZ8/Pr6g08ABIT88/GIYwACj/bn4JB/AAGl9OTPmoYA/8D57r+djAD8y/r7vJGQAPnO+P7CkY4A99T3+8iQjAD61/f7zI+LAP7b9/vQjooAAd73+9SMigAE4ff71ouKAAXj9/vZiooAB+T3+9qKigAI5ff724mJAArl9/vbiYkAC+b3+9yIiAAL5vf73IiIAAvm9/vciIgAC+b3+9yIiAAL5vf73IiIAAvm9/vciIgAC+b3+9yJiAAL5vf73ImJAAvl9/vciYkACuX3+9uJiQAK5ff724mKAAnk9/vaiYoACOP3+9qKigAH4vf72YqKAAXh9/vYiooABOD3+9eLigAC3vf71ouKAAHc9/vVjIoA/9r3+9SMigD+2Pf70o6LAP3W9/vQj4wA+9T3+8+QjAD62ff7zJGNAPjU9/vIko8A99P3+8WTkQD21Pf7wZWTAPXa9/q8l5YA9N/3+7eamQDz4vb7s5ybAPLl9vyxnp0A8uf1/K+fnwDx6fX8raCgAO/r9fyro6IA7u31/Kqkow==';
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