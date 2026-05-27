import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, Sparkles, ShieldAlert, Award, HelpCircle, 
  RotateCw, Eye, Star, Gift, Volume2, Trophy, Trash2, 
  ChevronRight, RefreshCw, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "../components/ui/button";

interface GachaReward {
  id: number;
  name: string;
  type: "coins" | "points" | "item" | "custom_badge";
  value: string;
  tier: "mythic" | "legendary" | "epic" | "rare" | "common";
  chance: string;
  image: string;
  isActive: boolean;
  eventType?: "mystery" | "royale" | "faded";
}

const TIER_COLORS = {
  mythic:    { text: "text-red-400 font-extrabold shadow-red-500/20", border: "border-red-500/50", glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]", bg: "from-red-950/80 to-stone-900/90", label: "MYTHIC" },
  legendary: { text: "text-amber-400 font-extrabold shadow-amber-500/20", border: "border-amber-500/50", glow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]", bg: "from-amber-950/80 to-stone-900/90", label: "LEGENDARY" },
  epic:      { text: "text-fuchsia-400 font-bold", border: "border-fuchsia-500/30", glow: "shadow-[0_0_15px_rgba(217,70,239,0.3)]", bg: "from-fuchsia-950/40 to-stone-900/90", label: "EPIC" },
  rare:      { text: "text-cyan-400 font-semibold", border: "border-cyan-500/30", glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]", bg: "from-cyan-950/40 to-stone-900/90", label: "RARE" },
  common:    { text: "text-slate-300", border: "border-slate-500/20", glow: "shadow-none", bg: "from-slate-900/40 to-stone-900/90", label: "COMMON" },
};

export function GachaPage() {
  const { user, addCoins, fetchFreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"mystery" | "royale" | "faded">("mystery");
  const [rewards, setRewards] = useState<GachaReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<GachaReward | GachaReward[] | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  // --- Mystery Draw State ---
  const [mysteryPity, setMysteryPity] = useState<number>(() => {
    return Number(localStorage.getItem(`gacha_mystery_pity_${user?.id}`) || 22);
  });

  // --- Faded Wheel State ---
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [spunIds, setSpunIds] = useState<number[]>([]);
  const [currentlyHighlighting, setCurrentlyHighlighting] = useState<number | null>(null);

  // Fetch active rewards
  const fetchRewards = async () => {
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/gacha/rewards`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (err) {
      console.error("Failed to load rewards:", err);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleStandardSpin = async (count: number) => {
    if (!user || isSpinning || loading) return;
    const cost = count === 5 ? 45 : 10;
    if ((user.coins || 0) < cost) {
      toast({
        variant: "destructive",
        title: "Koin Tidak Cukup!",
        description: `Dibutuhkan ${cost} Koin Toko untuk melakukan spin ini.`,
      });
      return;
    }

    setLoading(true);
    setIsSpinning(true);

    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/gacha/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, type: "standard", count, eventType: activeTab }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan spin.");

      // Success
      setWonReward(data.won);
      setShowPrizeModal(true);

      // Pity increment (for mystery)
      if (activeTab === "mystery") {
        const nextPity = (mysteryPity + count) % 48;
        setMysteryPity(nextPity);
        localStorage.setItem(`gacha_mystery_pity_${user.id}`, nextPity.toString());
      }

      // Sync user context
      await fetchFreshUser();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal Gacha",
        description: e.message || "Koneksi terganggu.",
      });
    } finally {
      setLoading(false);
      setIsSpinning(false);
    }
  };

  const handleFadedWheelSpin = async (itemPool: GachaReward[]) => {
    if (!user || isSpinning || loading) return;
    if (excludedIds.length !== 2) {
      toast({
        variant: "destructive",
        title: "Pilih 2 Hadiah untuk Dihapus!",
        description: "Kamu harus menghapus 2 hadiah yang paling tidak kamu inginkan terlebih dahulu.",
      });
      return;
    }

    const fadedCosts = [19, 39, 99, 199, 399, 599, 799, 999];
    const cost = fadedCosts[Math.min(spunIds.length, fadedCosts.length - 1)];

    if ((user.coins || 0) < cost) {
      toast({
        variant: "destructive",
        title: "Koin Tidak Cukup!",
        description: `Dibutuhkan ${cost} Koin Toko untuk spin Faded Wheel berikutnya.`,
      });
      return;
    }

    setLoading(true);
    setIsSpinning(true);

    // Simulate grid rotation animation
    const spinItems = itemPool.filter(r => !excludedIds.includes(r.id) && !spunIds.includes(r.id));
    let highlightIndex = 0;
    const duration = 2500; // 2.5s animation
    const intervalTime = 120;
    const timer = setInterval(() => {
      const activeItem = spinItems[highlightIndex % spinItems.length];
      setCurrentlyHighlighting(activeItem.id);
      highlightIndex++;
    }, intervalTime);

    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/gacha/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: "faded",
          excludedItemIds: excludedIds,
          spunItemIds: spunIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan spin.");

      // Wait for animation to finish
      setTimeout(async () => {
        clearInterval(timer);
        setCurrentlyHighlighting(null);

        // Highlight the won item specifically
        const wonItem = data.won as GachaReward;
        setCurrentlyHighlighting(wonItem.id);

        setTimeout(async () => {
          setCurrentlyHighlighting(null);
          setWonReward(wonItem);
          setSpunIds(prev => [...prev, wonItem.id]);
          setShowPrizeModal(true);
          await fetchFreshUser();
          setIsSpinning(false);
          setLoading(false);
        }, 500);
      }, duration);

    } catch (e: any) {
      clearInterval(timer);
      setCurrentlyHighlighting(null);
      setIsSpinning(false);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Gagal Spin",
        description: e.message || "Terjadi kesalahan.",
      });
    }
  };

  const toggleExclude = (id: number) => {
    if (spunIds.includes(id)) return;
    setExcludedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) {
        toast({ title: "Maksimal 2 Hadiah", description: "Hapus hadiah yang sudah ada untuk memilih hadiah lainnya." });
        return prev;
      }
      return [...prev, id];
    });
  };

  const resetFadedWheel = () => {
    setExcludedIds([]);
    setSpunIds([]);
    setCurrentlyHighlighting(null);
  };

  if (!user) return null;

  // Categorized rewards and grand prizes
  const mysteryRewards = rewards.filter(r => r.eventType === "mystery");
  const royaleRewards = rewards.filter(r => r.eventType === "royale");
  const fadedRewards = rewards.filter(r => r.eventType === "faded");

  const mysteryGrandPrize = mysteryRewards.find(r => r.tier === "mythic") || mysteryRewards[0] || rewards.find(r => r.tier === "mythic") || rewards[0];
  const royaleGrandPrize = royaleRewards.find(r => r.tier === "mythic" || r.tier === "legendary") || royaleRewards[0] || rewards.find(r => r.tier === "mythic") || rewards[0];
  
  // Filter for Faded wheel (grid wants exactly 10 items, padded with other categories if short)
  const fadedWheelItems = [...fadedRewards, ...rewards.filter(r => r.eventType !== "faded")].slice(0, 10);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0c051a] text-white overflow-x-hidden font-sans">
      {/* Glow effects */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <div className="border-b border-purple-500/10 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-purple-400 animate-pulse" />
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">LUCK ROYALE</h1>
            <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">UID: {user.systemId || "2317257668"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Coins balance display */}
          <div className="bg-purple-950/40 border border-purple-500/20 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-inner">
            <Coins className="h-4 w-4 text-amber-400 fill-amber-400 animate-bounce" />
            <div className="text-right">
              <span className="block text-xs text-purple-300 font-bold uppercase leading-none">Saldo Koin</span>
              <span className="text-base font-black text-white">{(user.coins || 0).toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Navigation Sidebar */}
        <div className="space-y-2 md:col-span-1">
          <p className="text-[10px] font-black text-purple-400/60 uppercase tracking-widest px-3 mb-2">PILIH EVENT GACHA</p>
          {[
            { id: "mystery", label: "MYSTERY DRAW", badge: "HOT" },
            { id: "royale", label: "LUCK ROYALE", badge: "NEW" },
            { id: "faded", label: "FADED WHEEL", badge: "LIMITED" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setWonReward(null);
              }}
              className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all border font-bold ${
                activeTab === t.id
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400/40 text-white shadow-lg shadow-purple-900/30 scale-102"
                  : "bg-purple-950/10 border-purple-500/5 hover:bg-purple-950/20 text-purple-300/80 hover:text-white"
              }`}
            >
              <span className="text-sm tracking-wide">{t.label}</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                activeTab === t.id ? "bg-white text-purple-700" : "bg-purple-500/20 text-purple-300"
              }`}>{t.badge}</span>
            </button>
          ))}
          
          {/* Helper Rules */}
          <div className="bg-purple-950/10 border border-purple-500/5 p-4 rounded-2xl text-[11px] text-purple-300/70 space-y-2.5 mt-6">
            <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" /> ATURAN LUCK ROYALE
            </h4>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Setiap spin standard berharga 10 Koin Toko.</li>
              <li>Paket 5x spin diskon menjadi hanya 45 Koin.</li>
              <li>Faded wheel menjamin tidak ada hadiah ganda.</li>
              <li>Admin dapat memperbarui kolam hadiah kapan saja!</li>
            </ul>
          </div>
        </div>

        {/* Center / Right Content Panel */}
        <div className="md:col-span-3 min-h-[500px] bg-purple-950/5 border border-purple-500/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden relative">
          
          {/* TAB 1: MYSTERY DRAW */}
          {activeTab === "mystery" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center h-full">
              
              {/* Central Card Pack Area */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-6 text-center space-y-6">
                <div className="relative">
                  {/* Card pack glow */}
                  <div className="absolute inset-0 bg-purple-500/30 rounded-[2rem] blur-[30px] animate-pulse" />
                  
                  {/* Glowing Pack container */}
                  <motion.div 
                    animate={isSpinning ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.05, 0.95, 1.05, 1] } : {}}
                    transition={{ duration: 1.5, repeat: isSpinning ? Infinity : 0 }}
                    className="relative w-56 h-80 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 rounded-[2rem] p-0.5 border border-white/20 shadow-2xl shadow-purple-500/20 overflow-hidden select-none cursor-pointer"
                  >
                    {/* Inner pack graphics */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                    <div className="h-full w-full rounded-[1.9rem] bg-gradient-to-b from-purple-900 via-indigo-950 to-purple-900 border border-black/40 p-6 flex flex-col items-center justify-between text-white">
                      
                      {/* Top label */}
                      <span className="border border-white/10 bg-white/5 rounded-full px-3 py-1 text-[9px] font-black tracking-widest uppercase">MYSTERY PACK</span>
                      
                      {/* Pack Silhouette */}
                      <div className="relative my-4 flex items-center justify-center">
                        <div className="w-24 h-24 bg-black/40 rounded-full flex items-center justify-center border-2 border-dashed border-white/10">
                          <span className="text-5xl font-black text-white/20 animate-pulse">?</span>
                        </div>
                      </div>

                      {/* Footer label */}
                      <div className="text-center">
                        <p className="text-sm font-extrabold tracking-tight">MYSTERY DRAW</p>
                        <p className="text-[10px] text-white/50">Buka & Temukan Hadiahmu!</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-3 w-full max-w-xs">
                  <div className="flex items-center justify-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="text-lg font-black tracking-tight">10 Koin</span>
                  </div>
                  
                  <Button
                    size="lg"
                    disabled={isSpinning || loading}
                    onClick={() => handleStandardSpin(1)}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl font-black text-white shadow-lg shadow-purple-600/30 uppercase tracking-widest text-xs"
                  >
                    {isSpinning ? "Membuka Pack..." : "BUKA PACK"}
                  </Button>
                </div>
              </div>

              {/* Right Side Grand Prize showcase */}
              <div className="lg:col-span-1 bg-black/40 border border-purple-500/10 p-5 rounded-3xl flex flex-col items-center justify-between h-full text-center min-h-[400px]">
                <div>
                  <span className="border border-red-500/50 bg-red-500/10 text-red-400 text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase mb-4 inline-block">MYTHIC BUNDLE</span>
                  <h3 className="text-base font-black tracking-tight text-white uppercase">{mysteryGrandPrize?.name || "FLAMING BUNDLE"}</h3>
                </div>

                <div className="my-6 relative w-full h-44 rounded-2xl border border-red-500/20 overflow-hidden shadow-2xl shadow-red-500/10">
                  <img 
                    src={mysteryGrandPrize?.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500"} 
                    alt="Grand Prize" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </div>

                <div className="w-full space-y-4">
                  <div className="bg-purple-950/20 border border-purple-500/10 px-3 py-2.5 rounded-xl text-left">
                    <div className="flex justify-between text-[10px] font-bold text-purple-300 uppercase leading-none mb-1.5">
                      <span>Progres Pity</span>
                      <span>{mysteryPity}/48 PACK</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(mysteryPity / 48) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-purple-300/60 leading-tight uppercase font-medium">Hadiah utama dipastikan didapat setiap 48 pack kartu.</p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LUCK ROYALE (Spin Wheel Showcase) */}
          {activeTab === "royale" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center h-full">
              
              {/* Left Showcase character */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative w-full max-w-sm h-72 rounded-[2rem] border border-purple-500/10 overflow-hidden shadow-2xl">
                  {/* Glowing energy background */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-indigo-900/50 to-pink-900/30" />
                  <img 
                    src={royaleGrandPrize?.image || "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500"} 
                    alt="Bundle Legendary" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c051a] via-transparent to-transparent" />
                  
                  {/* Title and stats overlay */}
                  <div className="absolute bottom-6 left-6 right-6 text-left">
                    <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> BUNDLE LEGENDARY ECLIPSE
                    </p>
                    <h2 className="text-xl font-black uppercase text-white tracking-tighter">BUKA SEKARANG & DAPATKAN ITEM LEVEL SULTAN!</h2>
                  </div>
                </div>

                {/* Spin actions */}
                <div className="flex gap-4 w-full max-w-sm">
                  <Button
                    size="lg"
                    disabled={isSpinning || loading}
                    onClick={() => handleStandardSpin(1)}
                    className="flex-1 h-14 bg-purple-900/40 border border-purple-500/30 hover:bg-purple-800/40 rounded-2xl font-black text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
                  >
                    <span className="text-[10px] text-purple-300 font-semibold tracking-wider">1 SPIN</span>
                    <span className="text-sm font-black tracking-tight flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 10 Koin
                    </span>
                  </Button>

                  <Button
                    size="lg"
                    disabled={isSpinning || loading}
                    onClick={() => handleStandardSpin(5)}
                    className="flex-1 h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-2xl font-black text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform shadow-lg shadow-amber-500/20"
                  >
                    <span className="text-[10px] text-amber-100 font-extrabold tracking-wider">5 SPIN (DISKON)</span>
                    <span className="text-sm font-black tracking-tight flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-white fill-white animate-bounce" /> 45 Koin
                    </span>
                  </Button>
                </div>
              </div>

              {/* Right Side Prize Pool List */}
              <div className="lg:col-span-1 bg-black/40 border border-purple-500/10 p-5 rounded-3xl flex flex-col justify-between h-full text-left min-h-[400px]">
                <div>
                  <h3 className="text-xs font-black tracking-wider text-purple-300 uppercase mb-4">DAFTAR HADIAH AKTIF</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {royaleRewards.map(r => (
                      <div key={r.id} className="flex items-center gap-3 bg-purple-950/20 border border-purple-500/5 p-2 rounded-xl">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-950 shrink-0 border border-white/5">
                          <img src={r.image || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100"} alt={r.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-white truncate leading-tight">{r.name}</p>
                          <span className={`text-[8px] font-black px-1 rounded uppercase tracking-wider ${TIER_COLORS[r.tier]?.text}`}>
                            {TIER_COLORS[r.tier]?.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-purple-300">{r.chance}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-[9px] text-purple-300/40 text-center uppercase tracking-wide mt-4">Dapatkan item acak berdasarkan probabilitas masing-masing.</p>
              </div>

            </div>
          )}

          {/* TAB 3: FADED WHEEL (Grid spin) */}
          {activeTab === "faded" && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-black uppercase text-purple-300">FADED WHEEL LUCK</h3>
                <p className="text-[10px] text-purple-300/70 uppercase tracking-wide">
                  {excludedIds.length < 2 
                    ? `Pilih ${2 - excludedIds.length} hadiah yang tidak diinginkan untuk dihapus`
                    : "Tekan tombol SPIN di tengah untuk memulai!"}
                </p>
              </div>

              {/* Grid Wheel (exactly 8 or 10 items) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-w-4xl mx-auto items-center">
                
                {/* Board grid items */}
                {fadedWheelItems.map((r, i) => {
                  const isExcluded = excludedIds.includes(r.id);
                  const isSpun = spunIds.includes(r.id);
                  const isHighlighted = currentlyHighlighting === r.id;

                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleExclude(r.id)}
                      className={`relative aspect-square rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden p-2.5 flex flex-col justify-between select-none ${
                        isExcluded 
                          ? "bg-stone-950 border-purple-500/5 opacity-30 cursor-not-allowed scale-95" 
                          : isSpun 
                            ? "bg-purple-950/20 border-green-500/30 opacity-60 scale-95"
                            : isHighlighted
                              ? "bg-amber-500/20 border-amber-400 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10"
                              : "bg-purple-950/10 border-purple-500/10 hover:border-purple-400/30 hover:bg-purple-950/30"
                      }`}
                    >
                      {/* Badge if won or excluded */}
                      {isExcluded && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 text-[8px] font-black tracking-widest text-red-500 uppercase">
                          DIHAPUS
                        </div>
                      )}
                      {isSpun && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 text-[8px] font-black tracking-widest text-green-400 uppercase">
                          DIDAPAT
                        </div>
                      )}

                      {/* Image */}
                      <div className="h-16 w-full rounded-lg overflow-hidden border border-white/5 mb-1.5">
                        <img src={r.image || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100"} alt={r.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Footer Info */}
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate leading-tight text-white mb-0.5">{r.name}</p>
                        <span className={`text-[7px] font-black uppercase tracking-wider block ${TIER_COLORS[r.tier]?.text}`}>
                          {TIER_COLORS[r.tier]?.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Faded Wheel Spin Trigger */}
              <div className="flex flex-col items-center justify-center pt-4 space-y-4">
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    disabled={excludedIds.length !== 2 || isSpinning || loading || fadedWheelItems.filter(r => !excludedIds.includes(r.id) && !spunIds.includes(r.id)).length === 0}
                    onClick={() => handleFadedWheelSpin(fadedWheelItems)}
                    className="h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black px-12 rounded-2xl shadow-xl shadow-amber-500/20 text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-0.5"
                  >
                    <span>SPIN SEKARANG</span>
                    <span className="text-[10px] opacity-90 flex items-center gap-1 leading-none font-bold">
                      <Coins className="h-3 w-3 text-white fill-white" /> 
                      {(() => {
                        const fadedCosts = [19, 39, 99, 199, 399, 599, 799, 999];
                        return fadedCosts[Math.min(spunIds.length, fadedCosts.length - 1)];
                      })()} Koin
                    </span>
                  </Button>

                  {(spunIds.length > 0 || excludedIds.length > 0) && (
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={isSpinning || loading}
                      onClick={resetFadedWheel}
                      className="h-14 border border-purple-500/30 bg-purple-950/20 text-purple-300 px-6 rounded-2xl hover:bg-purple-950/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-4 w-4" /> Reset
                    </Button>
                  )}
                </div>
                
                <p className="text-[9px] text-purple-300/40 leading-none uppercase font-semibold">Hadiah yang sudah didapat tidak akan diulang. Koin yang dibutuhkan meningkat setiap spin.</p>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* PRIZE UNBOXING MODAL / DRAWER */}
      <AnimatePresence>
        {showPrizeModal && wonReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            {/* Ambient flash lights */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_60%)] animate-pulse pointer-events-none" />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-stone-900 border border-purple-500/20 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl overflow-hidden"
            >
              {/* Top particles */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />
              
              <div className="space-y-1">
                <Trophy className="h-12 w-12 text-amber-400 fill-amber-400 mx-auto animate-bounce mb-2" />
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">SELAMAT!</h2>
                <p className="text-[10px] text-purple-300 font-black uppercase tracking-wider">Kamu Memenangkan Hadiah!</p>
              </div>

              {/* Reward list / single reward card */}
              <div className="py-4 space-y-3">
                {Array.isArray(wonReward) ? (
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {wonReward.map((r, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className={`border rounded-2xl p-3 bg-gradient-to-b ${TIER_COLORS[r.tier]?.bg} ${TIER_COLORS[r.tier]?.border} ${TIER_COLORS[r.tier]?.glow} flex flex-col items-center justify-center`}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 mb-2 shrink-0">
                          <img src={r.image || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100"} alt={r.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] font-extrabold text-white truncate max-w-full leading-tight">{r.name}</p>
                        <span className={`text-[7px] font-black uppercase tracking-wider block mt-1 ${TIER_COLORS[r.tier]?.text}`}>
                          {TIER_COLORS[r.tier]?.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className={`relative max-w-xs mx-auto border rounded-[2rem] p-5 bg-gradient-to-b ${TIER_COLORS[wonReward.tier]?.bg} ${TIER_COLORS[wonReward.tier]?.border} ${TIER_COLORS[wonReward.tier]?.glow} flex flex-col items-center`}>
                    
                    {/* Glowing effect inside card */}
                    <div className="absolute inset-0 bg-white/[0.01] pointer-events-none rounded-[1.9rem]" />
                    
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/15 shadow-2xl mb-4">
                      <img src={wonReward.image || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=200"} alt={wonReward.name} className="w-full h-full object-cover" />
                    </div>

                    <h3 className="text-base font-black uppercase text-white tracking-tight">{wonReward.name}</h3>
                    
                    <span className={`text-[9px] font-black uppercase tracking-widest border border-current/30 px-3 py-1 rounded-full mt-2.5 ${TIER_COLORS[wonReward.tier]?.text}`}>
                      {TIER_COLORS[wonReward.tier]?.label}
                    </span>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                onClick={() => {
                  setShowPrizeModal(false);
                  setWonReward(null);
                }}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-600/30"
              >
                KONFIRMASI
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
