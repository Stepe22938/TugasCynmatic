import React, { useState } from "react";
import { Music, Search, Play, Pause, Loader2, Youtube } from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";
import { useMusic } from "../contexts/MusicContext";

export function MyMusicPage() {
  const { toast } = useToast();
  const { setVideoId, setIsPlaying, videoId: globalVideoId } = useMusic();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const extractVideoId = (link: string) => {
    try {
      const urlObj = new URL(link);
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v");
      } else if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.slice(1);
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleConvert = () => {
    if (!url.trim()) {
      toast({ title: "Masukkan link YouTube!", variant: "destructive" });
      return;
    }

    const id = extractVideoId(url.trim());
    if (!id) {
      toast({ title: "Link YouTube tidak valid", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Simulate conversion process
    setTimeout(() => {
      setVideoId(id);
      setIsPlaying(true);
      setLoading(false);
      toast({ title: "Berhasil dikonversi ke MP3! Selamat mendengarkan." });
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center">
          <Music className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black">MyMusic</h1>
          <p className="text-muted-foreground text-sm">Convert & dengarkan YouTube MP3 khusus di website ini!</p>
        </div>
      </div>

      <div className="bg-card border rounded-[2rem] p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Youtube className="w-48 h-48" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Tempel link YouTube di sini..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 bg-background focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all font-medium"
            />
          </div>
          
          <Button 
            className="w-full h-14 rounded-2xl text-lg font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 gap-2"
            onClick={handleConvert}
            disabled={loading || !url.trim()}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
            {loading ? "Mengonversi..." : "Convert ke MP3"}
          </Button>
        </div>
      </div>

      {globalVideoId && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-[2rem] overflow-hidden shadow-xl"
        >
          <div className="bg-rose-50 p-6 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-rose-200 rounded-full flex items-center justify-center mb-4 relative shadow-inner">
              <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin opacity-20" style={{ animationDuration: "3s" }} />
              <Music className="w-10 h-10 text-rose-600 animate-pulse" />
            </div>
            <h3 className="font-bold text-lg text-center mb-1">Berhasil Terhubung!</h3>
            <p className="text-sm text-center text-rose-700 mb-4">Lagu sedang diputar di background player (pojok kanan bawah).</p>
            <p className="text-xs text-rose-600 font-semibold uppercase tracking-widest bg-rose-100 px-3 py-1 rounded-full">Global Web Player</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
