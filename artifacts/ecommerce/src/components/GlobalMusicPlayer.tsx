import React from "react";
import { useMusic } from "../contexts/MusicContext";
import { Music, Play, Pause, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalMusicPlayer() {
  const { videoId, isPlaying, togglePlay, setVideoId } = useMusic();

  if (!videoId) return null;

  return (
    <>
      {/* Hidden YouTube iframe */}
      <div className="fixed bottom-0 right-0 w-1 h-1 overflow-hidden opacity-0 pointer-events-none z-[-1]">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&controls=0&loop=1&playlist=${videoId}`}
          title="YouTube global player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>

      {/* Floating mini-player UI */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] bg-card/90 backdrop-blur-xl border border-rose-500/20 shadow-2xl rounded-2xl p-3 flex items-center gap-3 w-[260px]"
        >
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
             {isPlaying && (
                <div className="absolute inset-0 rounded-xl border-2 border-rose-500 border-t-transparent animate-spin opacity-40" style={{ animationDuration: "2s" }} />
             )}
             <Music className={`w-5 h-5 text-rose-500 relative z-10 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-foreground">MyMusic Player</p>
            <p className="text-[10px] text-muted-foreground truncate">{isPlaying ? "Sedang diputar..." : "Dijeda"}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              onClick={togglePlay} 
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button 
              onClick={() => { setVideoId(null); }} 
              className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
