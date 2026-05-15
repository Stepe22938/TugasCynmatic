import React, { useState, useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, Palette, Save, CheckCircle2, Type, Sparkles, Video, Youtube, Image as ImageIcon, Upload, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

const THEME_OPTIONS = [
  { id: "from-primary to-orange-600", label: "Sunset", preview: "bg-gradient-to-r from-primary to-orange-600" },
  { id: "from-violet-600 to-purple-600", label: "Violet", preview: "bg-gradient-to-r from-violet-600 to-purple-600" },
  { id: "from-blue-600 to-cyan-500", label: "Ocean", preview: "bg-gradient-to-r from-blue-600 to-cyan-500" },
  { id: "from-emerald-600 to-teal-500", label: "Forest", preview: "bg-gradient-to-r from-emerald-600 to-teal-500" },
  { id: "from-rose-600 to-pink-500", label: "Rose", preview: "bg-gradient-to-r from-rose-600 to-pink-500" },
  { id: "from-amber-500 to-yellow-400", label: "Gold", preview: "bg-gradient-to-r from-amber-500 to-yellow-400" },
  { id: "from-gray-800 to-gray-600", label: "Dark", preview: "bg-gradient-to-r from-gray-800 to-gray-600" },
  { id: "from-indigo-600 to-blue-500", label: "Indigo", preview: "bg-gradient-to-r from-indigo-600 to-blue-500" },
  { id: "from-red-600 to-orange-500", label: "Fire", preview: "bg-gradient-to-r from-red-600 to-orange-500" },
  { id: "from-fuchsia-600 to-pink-500", label: "Neon", preview: "bg-gradient-to-r from-fuchsia-600 to-pink-500" },
  { id: "from-sky-500 to-indigo-600", label: "Sky", preview: "bg-gradient-to-r from-sky-500 to-indigo-600" },
  { id: "from-lime-500 to-green-600", label: "Lime", preview: "bg-gradient-to-r from-lime-500 to-green-600" },
];

export function ProfileCustomizePage() {
  const { user, updateCustomization } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(user?.bio || "");
  const [theme, setTheme] = useState(user?.theme || "from-primary to-orange-600");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [youtubeUrl, setYoutubeUrl] = useState(user?.youtubeId ? `https://www.youtube.com/watch?v=${user.youtubeId}` : "");
  const [useAnimation, setUseAnimation] = useState(user?.useAnimation || false);
  const [saved, setSaved] = useState(false);

  if (!user) return <div className="p-8 text-center">Harap login terlebih dahulu.</div>;

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File Terlalu Besar", description: "Maksimal ukuran foto adalah 2MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const youtubeId = extractYoutubeId(youtubeUrl);
    updateCustomization({
      bio: bio.trim(),
      theme,
      avatar,
      youtubeId,
      useAnimation
    });
    setSaved(true);
    toast({ title: "Profil Diperbarui!", description: "Kustomisasi profil kamu sudah disimpan." });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-24">
      <div className="max-w-4xl mx-auto px-6 space-y-10">
        
        {/* Elite Customization Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[3rem] p-10 relative overflow-hidden border-white/5 shadow-2xl bg-gradient-to-br from-indigo-600/10 via-background to-background"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Palette className="h-32 w-32 text-indigo-500" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <Link href="/profile">
                <button className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5 group">
                  <ChevronLeft className="h-5 w-5 text-white/40 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                </button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white drop-shadow-xl">
                  Identity Forge
                </h1>
                <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-2">
                  Customize your digital presence
                </p>
              </div>
            </div>
            
            <div className="flex -space-x-4">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-500/20 rotate-6">
                <Sparkles className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="w-16 h-16 bg-orange-600/20 rounded-2xl flex items-center justify-center shadow-lg border border-orange-500/20 -rotate-6">
                <Palette className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Preview Console */}
        <div className="glass-card rounded-[3rem] overflow-hidden border-white/10 shadow-2xl relative group">
          <div className="relative h-72 overflow-hidden">
            {useAnimation && extractYoutubeId(youtubeUrl).length === 11 ? (
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <iframe
                  className="absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 aspect-video object-cover brightness-[0.6] blur-[1px]"
                  src={`https://www.youtube.com/embed/${extractYoutubeId(youtubeUrl)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${extractYoutubeId(youtubeUrl)}&showinfo=0&rel=0`}
                  allow="autoplay; encrypted-media"
                />
              </div>
            ) : (
              <div className={`absolute inset-0 z-0 bg-gradient-to-br ${theme} transition-all duration-700`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-black/20" />
          </div>

          <div className="relative px-10 pb-10 -mt-20 z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative group/avatar">
              <div className="absolute -inset-4 bg-white/10 rounded-[2.5rem] blur-xl opacity-0 group-hover/avatar:opacity-100 transition-all duration-700" />
              <img
                src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=ffffff&fontColor=6d28d9&fontSize=40`}
                alt={user.name}
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-4 border-white/20 shadow-2xl object-cover bg-slate-900 group-hover/avatar:scale-105 transition-transform duration-500"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer z-20"
              >
                <Upload className="h-8 w-8 text-white animate-bounce" />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left pb-4">
              <h2 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-2xl">{user.name}</h2>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                  Live Preview Mode
                </span>
                {bio && <p className="text-sm font-medium italic text-white/60">"{bio}"</p>}
              </div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
        </div>

        {/* Configuration Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Visual Identity */}
          <div className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-orange-500" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 italic">Visual Identity</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                <img 
                  src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=ffffff&fontColor=6d28d9&fontSize=40`} 
                  className="w-14 h-14 rounded-xl object-cover bg-white/5 border border-white/10"
                  alt=""
                />
                <div className="flex-1 space-y-2">
                  <Button onClick={() => fileInputRef.current?.click()} variant="ghost" className="h-10 w-full rounded-xl border border-dashed border-white/20 text-[9px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all">
                    Update Imagery
                  </Button>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">*Max 2MB — JPG/PNG</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Asset Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Define your digital signature..."
                  maxLength={150}
                  rows={3}
                  className="w-full px-6 py-4 text-xs bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-orange-500 transition-all font-bold uppercase tracking-widest placeholder:text-white/10 resize-none"
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-[8px] font-black text-white/10 uppercase italic">Signature Protocol</p>
                  <p className="text-[9px] font-black text-white/20">{bio.length}/150</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Background */}
          <div className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
                  <Video className="h-4 w-4 text-orange-500" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 italic">Dynamic Engine</h3>
              </div>
              <button onClick={() => setUseAnimation(!useAnimation)} className="transition-transform active:scale-90">
                {useAnimation ? <ToggleRight className="h-8 w-8 text-orange-500" /> : <ToggleLeft className="h-8 w-8 text-white/10" />}
              </button>
            </div>

            <div className="space-y-6">
              <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${useAnimation ? "bg-orange-600/5 border-orange-500/20" : "bg-white/5 border-white/5 opacity-40"}`}>
                <div className="space-y-4">
                  <div className="relative">
                    <Youtube className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${useAnimation ? "text-red-500" : "text-white/10"}`} />
                    <input
                      disabled={!useAnimation}
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      placeholder="YouTube Protocol Link..."
                      className="w-full pl-12 pr-6 py-4 text-[10px] bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-orange-500 transition-all font-bold uppercase tracking-widest placeholder:text-white/10 disabled:cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[9px] font-medium text-white/20 italic leading-relaxed px-1">
                    *Select 16:9 cinematic visuals for optimal atmospheric integration.
                  </p>
                </div>
              </div>

              {!useAnimation && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Static Core Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEME_OPTIONS.slice(0, 12).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`group relative h-10 rounded-xl overflow-hidden transition-all ${theme === t.id ? "ring-2 ring-orange-500 scale-105" : "opacity-40 hover:opacity-100"}`}
                      >
                        <div className={`${t.preview} h-full w-full`} />
                        {theme === t.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Execution Protocol */}
        <div className="pt-6">
          <Button
            onClick={handleSave}
            disabled={saved}
            className={`w-full h-20 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.4em] italic transition-all duration-500 shadow-2xl ${
              saved 
                ? "bg-emerald-600 text-white shadow-emerald-600/20" 
                : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {saved ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6" />
                <span>Protocol Synchronized</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Save className="h-6 w-6" />
                <span>Execute Modifications</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
