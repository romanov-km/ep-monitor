import { useRef } from "react";

export const useSound = (file: string, volume = 1) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(file);
      audioRef.current.volume = volume;
    }
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((error) => {
      console.error("Failed to play sound:", error);
    });
  };

  return play;
};
