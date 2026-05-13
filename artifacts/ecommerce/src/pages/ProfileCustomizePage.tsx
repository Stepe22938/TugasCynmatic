/**
 * ProfileCustomizePage.tsx
 * Halaman kustomisasi profil — ubah bio, tema banner, dll.
 */
import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, Palette, Save, CheckCircle2, Type, Sparkles } from "lucide-react";
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

  const [bio, setBio] = useState(user?.bio || "");
  const [theme, setTheme] = useState(user?.theme || "from-primary to-orange-600");
  const [saved, setSaved] = useState(false);

  if (!user) return <div className="p-8 text-center">Harap login terlebih dahulu.</div>;

  const handleSave = () => {
    updateCustomization(bio.trim(), theme);
    setSaved(true);
    toast({ title: "Profil Diperbarui!", description: "Kustomisasi profil kamu sudah disimpan." });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f9fafb] pb-24">
      {/* Live Preview Banner */}
      <div className={`bg-gradient-to-br ${theme} text-white pb-20 pt-8 px-4 transition-all duration-500`}>
        <div className="max-w-3xl mx-auto">
          <Link href="/profile" className="inline-flex items-center text-white/70 hover:text-white transition-colors mb-6 font-medium text-sm">
            <ChevronLeft className="h-5 w-5 mr-1" /> Kembali ke Profil
          </Link>
          <div className="flex items-center gap-4">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=ffffff&fontColor=6d28d9&fontSize=40`}
              alt={user.name}
              className="w-20 h-20 rounded-2xl border-4 border-white/30 shadow-xl"
            />
            <div>
              <h1 className="text-3xl font-extrabold mb-1">{user.name}</h1>
              {bio ? (
                <p className="text-white/80 text-sm italic">"{bio}"</p>
              ) : (
                <p className="text-white/50 text-sm">Belum ada bio...</p>
              )}
            </div>
          </div>
          <p className="text-white/50 text-xs mt-4 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Preview langsung — ubah pengaturan di bawah
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        {/* Bio Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
            className="w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-gray-50"
          />
          <p className="text-[11px] text-muted-foreground text-right mt-1">{bio.length}/150 karakter</p>
        </div>

        {/* Theme Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" /> Tema Banner
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Pilih warna gradien untuk banner profil kamu.</p>
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
                  <div className="absolute top-1.5 right-1.5 bg-white rounded-full p-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className={`w-full h-12 text-base font-bold transition-all ${saved ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"} text-white`}
        >
          {saved ? <><CheckCircle2 className="h-5 w-5 mr-2" /> Tersimpan!</> : <><Save className="h-5 w-5 mr-2" /> Simpan Perubahan</>}
        </Button>
      </div>
    </div>
  );
}
