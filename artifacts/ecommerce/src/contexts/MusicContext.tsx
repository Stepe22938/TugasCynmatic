import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface MusicContextType {
  videoId: string | null;
  isPlaying: boolean;
  setVideoId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const togglePlay = () => setIsPlaying(prev => !prev);

  // Persistence (opsional) - biar kalau direfresh lagunya tetep ada
  useEffect(() => {
    const saved = localStorage.getItem("mymusic_video_id");
    if (saved) {
      setVideoId(saved);
      // sengaja tidak isPlaying = true kalau refresh biar gak kaget atau kena block autoplay
    }
  }, []);

  useEffect(() => {
    if (videoId) {
      localStorage.setItem("mymusic_video_id", videoId);
    } else {
      localStorage.removeItem("mymusic_video_id");
    }
  }, [videoId]);

  return (
    <MusicContext.Provider value={{ videoId, isPlaying, setVideoId, setIsPlaying, togglePlay }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
