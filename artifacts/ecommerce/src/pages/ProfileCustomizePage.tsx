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
    <div className="min-h-[calc(100vh-80px)] bg-background pb-24">
      {/* Live Preview Banner */}
      <div className="relative overflow-hidden">
        {/* YouTube Background Layer */}
        {useAnimation && extractYoutubeId(youtubeUrl).length === 11 ? (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <iframe
              className="absolute top-1/2 left-1/2 w-[110%] h-[110%] -translate-x-1/2 -translate-y-1/2 aspect-video object-cover brightness-[0.6] blur-[2px]"
              src={`https://www.youtube.com/embed/${extractYoutubeId(youtubeUrl)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${extractYoutubeId(youtubeUrl)}&showinfo=0&rel=0`}
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : (
          <div className={`absolute inset-0 z-0 bg-gradient-to-br ${theme} transition-all duration-500`} />
        )}

        <div className="relative z-10 text-white pb-24 pt-10 px-6 transition-all duration-500 min-h-[300px] flex items-end bg-gradient-to-t from-black/60 to-transparent">
          <div className="max-w-3xl mx-auto w-full">
            <Link href="/profile" className="inline-flex items-center text-white/70 hover:text-white transition-colors mb-8 font-medium text-sm">
              <ChevronLeft className="h-5 w-5 mr-1" /> Kembali ke Profil
            </Link>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <img
                  src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=ffffff&fontColor=6d28d9&fontSize=40`}
                  alt={user.name}
                  className="w-24 h-24 rounded-3xl border-4 border-white/40 shadow-xl object-cover bg-white"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-white" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="drop-shadow-lg">
                <h1 className="text-3xl font-extrabold mb-1 text-white">{user.name}</h1>
                {bio ? (
                  <p className="text-white/90 text-sm italic font-medium">"{bio}"</p>
                ) : (
                  <p className="text-white/70 text-sm">Belum ada bio...</p>
                )}
              </div>
            </div>
            <p className="text-white/50 text-xs mt-4 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Preview langsung — ubah pengaturan di bawah
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        {/* Avatar Section */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-500" /> Foto Profil
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Unggah foto profil kustom dari komputer/laptop kamu.</p>
          <div className="flex items-center gap-4">
            <img 
              src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=ffffff&fontColor=6d28d9&fontSize=40`} 
              className="w-16 h-16 rounded-xl border border-border object-cover bg-white"
              alt="Preview"
            />
            <div className="flex-1">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-10 text-xs gap-2 border-dashed border-2">
                <Upload className="h-4 w-4" /> Pilih File Gambar
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2 italic">*Format: JPG, PNG. Maks: 2MB.</p>
            </div>
            {avatar && (
              <button onClick={() => setAvatar("")} className="text-[10px] font-bold text-red-500 hover:underline">Hapus Foto</button>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Type className="h-5 w-5 text-purple-500" /> Bio Profil
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Tulis sesuatu tentang dirimu yang bisa dilihat teman-temanmu.</p>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Contoh: Penggemar tech gadget & sneakers lover 🔥"
            maxLength={150}
            rows={3}
            className="w-full px-4 py-3 text-sm border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-background text-foreground"
          />
          <p className="text-[11px] text-muted-foreground text-right mt-1">{bio.length}/150 karakter</p>
        </div>

        {/* Animated Background Section */}
        <div className={`bg-card rounded-2xl shadow-sm border p-6 transition-all ${useAnimation ? "border-amber-400 ring-1 ring-amber-100" : "border-border"}`}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Video className="h-5 w-5 text-amber-500" /> Custom Animated Background
              </h2>
              <p className="text-sm text-muted-foreground">Aktifkan latar belakang bergerak menggunakan video YouTube.</p>
            </div>
            <button onClick={() => setUseAnimation(!useAnimation)}>
              {useAnimation ? <ToggleRight className="h-10 w-10 text-amber-500" /> : <ToggleLeft className="h-10 w-10 text-muted-foreground" />}
            </button>
          </div>

          {useAnimation && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                <input
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  placeholder="Paste URL YouTube: https://www.youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-background text-foreground"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic px-2">
                Tips: Gunakan video dengan resolusi landscape (16:9) seperti video "Lo-fi Hip Hop" atau "Nature Relaxing" untuk hasil terbaik.
              </p>
            </div>
          )}
        </div>

        {/* Theme Section */}
        {!useAnimation && (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 animate-in fade-in duration-500">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" /> Tema Banner Statis
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Pilih warna gradien jika animasi dimatikan.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {THEME_OPTIONS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`group relative rounded-xl overflow-hidden transition-all ${theme === t.id ? "ring-3 ring-purple-500 ring-offset-2 scale-105" : "hover:scale-105"}`}
                >
                  <div className={`${t.preview} h-16 w-full`} />
                  <div className="absolute inset-0 flex items-end justify-center pb-1.5">
                    <span className="text-[10px] font-bold text-white drop-shadow-md bg-black/20 px-1.5 py-0.5 rounded">
                      {t.label}
                    </span>
                  </div>
                  {theme === t.id && (
                    <div className="absolute top-1.5 right-1.5 bg-card rounded-full p-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className={`w-full h-12 text-base font-bold transition-all ${saved ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"} text-white shadow-lg`}
        >
          {saved ? <><CheckCircle2 className="h-5 w-5 mr-2" /> Tersimpan!</> : <><Save className="h-5 w-5 mr-2" /> Simpan Perubahan</>}
        </Button>
      </div>
    </div>
  );
}
