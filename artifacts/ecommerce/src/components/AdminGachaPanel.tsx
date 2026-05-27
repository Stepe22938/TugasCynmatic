import React, { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import { 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, 
  Coins, Sparkles, Award, Image, RefreshCw, Eye, EyeOff, Trophy 
} from "lucide-react";
import { Button } from "./ui/button";

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

const TIER_BADGES = {
  mythic:    "bg-red-500/10 border border-red-500/30 text-red-400",
  legendary: "bg-amber-500/10 border border-amber-500/30 text-amber-400",
  epic:      "bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400",
  rare:      "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400",
  common:    "bg-slate-500/10 border border-slate-500/30 text-slate-300",
};

export function AdminGachaPanel() {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<GachaReward[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"coins" | "points" | "item" | "custom_badge">("coins");
  const [value, setValue] = useState("");
  const [tier, setTier] = useState<"mythic" | "legendary" | "epic" | "rare" | "common">("common");
  const [chance, setChance] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [eventType, setEventType] = useState<"mystery" | "royale" | "faded">("royale");

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/gacha/admin/rewards`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal memuat hadiah", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value.trim() || !chance.trim()) {
      toast({ variant: "destructive", title: "Kolom Wajib Diisi", description: "Nama, Nilai, dan Chance wajib diisi!" });
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      value: value.trim(),
      tier,
      chance: parseFloat(chance),
      image: image.trim() || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500",
      isActive,
      eventType
    };

    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const url = editingId 
        ? `${base}/api/gacha/admin/rewards/${editingId}`
        : `${base}/api/gacha/admin/rewards`;
      
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: editingId ? "Hadiah Diperbarui!" : "Hadiah Ditambahkan!" });
        resetForm();
        fetchRewards();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan data.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal menyimpan hadiah", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (r: GachaReward) => {
    setEditingId(r.id);
    setName(r.name);
    setType(r.type);
    setValue(r.value);
    setTier(r.tier);
    setChance(r.chance);
    setImage(r.image);
    setIsActive(r.isActive);
    setEventType(r.eventType || "royale");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah kamu yakin ingin menghapus hadiah gacha ini?")) return;
    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/gacha/admin/rewards/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Hadiah berhasil dihapus!" });
        fetchRewards();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (r: GachaReward) => {
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/gacha/admin/rewards/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !r.isActive }),
      });
      if (res.ok) {
        toast({ title: `Hadiah ${!r.isActive ? "diaktifkan" : "dinonaktifkan"}!` });
        fetchRewards();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal mengubah status", description: err.message });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setType("coins");
    setValue("");
    setTier("common");
    setChance("");
    setImage("");
    setIsActive(true);
    setEventType("royale");
  };

  // Calculate sum of active chances
  const totalActiveChance = rewards
    .filter(r => r.isActive)
    .reduce((sum, r) => sum + parseFloat(r.chance), 0);

  return (
    <div className="space-y-6 text-white">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111115] border border-white/5 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5">Total Hadiah Gacha</p>
            <p className="text-2xl font-black">{rewards.length}</p>
          </div>
          <Award className="h-8 w-8 text-purple-500 opacity-60" />
        </div>

        <div className="bg-[#111115] border border-white/5 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5">Hadiah Aktif</p>
            <p className="text-2xl font-black text-green-400">{rewards.filter(r => r.isActive).length}</p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-green-500 opacity-60" />
        </div>

        <div className="bg-[#111115] border border-white/5 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5">Total Probabilitas Aktif</p>
            <p className={`text-2xl font-black ${Math.abs(totalActiveChance - 100) < 0.01 ? "text-green-400" : "text-amber-400"}`}>
              {totalActiveChance.toFixed(2)}%
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-amber-500 opacity-60 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Save / Edit form card */}
        <div className="lg:col-span-1 bg-[#111115] border border-white/5 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
          <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {editingId ? "EDIT HADIAH GACHA" : "TAMBAH HADIAH BARU"}
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nama Hadiah</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: FLAMING BUNDLE" 
                className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tipe Hadiah</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-sm bg-[#080808] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white font-bold"
                >
                  <option value="coins">Koin</option>
                  <option value="points">Point</option>
                  <option value="custom_badge">Badge</option>
                  <option value="item">Item</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Rarity Tier</label>
                <select 
                  value={tier} 
                  onChange={e => setTier(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-sm bg-[#080808] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white font-bold"
                >
                  <option value="mythic">Mythic (Merah)</option>
                  <option value="legendary">Legendary (Emas)</option>
                  <option value="epic">Epic (Ungu)</option>
                  <option value="rare">Rare (Biru)</option>
                  <option value="common">Common (Abu)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nilai Reward</label>
                <input 
                  type="text" 
                  value={value} 
                  onChange={e => setValue(e.target.value)}
                  placeholder="e.g. 5000 or sultan_gold" 
                  className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Chance (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={chance} 
                  onChange={e => setChance(e.target.value)}
                  placeholder="e.g. 1.50" 
                  className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Kategori Event Gacha</label>
              <select 
                value={eventType} 
                onChange={e => setEventType(e.target.value as any)}
                className="w-full px-3 py-2.5 text-sm bg-[#080808] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white font-bold"
              >
                <option value="mystery">Mystery Draw (Buka Pack)</option>
                <option value="royale">Luck Royale (Spin Roda)</option>
                <option value="faded">Faded Wheel (Grid Spin)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Image URL</label>
              <input 
                type="text" 
                value={image} 
                onChange={e => setImage(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/..." 
                className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="flex-shrink-0"
              >
                {isActive ? <Eye className="h-6 w-6 text-green-500" /> : <EyeOff className="h-6 w-6 text-white/30" />}
              </button>
              <div>
                <p className="text-xs font-bold leading-none">Aktifkan Hadiah</p>
                <p className="text-[10px] text-white/40 mt-1">Jika mati, hadiah tidak masuk spin pool.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white rounded-xl h-11 font-bold shadow-lg shadow-orange-500/10 text-xs uppercase tracking-widest"
              >
                {loading ? "Menyimpan..." : "SIMPAN"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl px-5 h-11 text-xs font-bold uppercase tracking-wider"
                >
                  BATAL
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Rewards List Panel */}
        <div className="lg:col-span-2 bg-[#111115] border border-white/5 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-orange-500" />
              DAFTAR HADIAH LUCK ROYALE
            </h3>
            <button 
              onClick={fetchRewards}
              className="text-white/40 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading && rewards.length === 0 ? (
            <div className="text-center py-20 text-white/40">Loading rewards...</div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-20 bg-black/25 rounded-3xl border border-dashed border-white/5 text-white/40">
              <Trophy className="h-10 w-10 text-white/10 mx-auto mb-3" />
              Tidak ada hadiah gacha ditemukan.
            </div>
          ) : (
            <div className="border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
              {rewards.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.01] transition-colors">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
                    <img src={r.image || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100"} alt={r.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-white truncate leading-none">{r.name}</p>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${TIER_BADGES[r.tier]}`}>
                        {r.tier}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-1.5 font-bold uppercase tracking-wider">
                      Tipe: {r.type} • Value: <code className="bg-white/5 px-1 rounded font-mono">{r.value}</code> • Event: <span className="text-purple-400 font-extrabold">{r.eventType === 'mystery' ? 'Mystery Draw' : r.eventType === 'faded' ? 'Faded Wheel' : 'Luck Royale'}</span>
                    </p>
                  </div>

                  {/* Chance */}
                  <div className="text-right shrink-0 pr-2">
                    <p className="text-sm font-black text-white">{r.chance}%</p>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Probabilitas</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleActiveStatus(r)}
                      className={`p-2 rounded-xl border transition-colors ${
                        r.isActive 
                          ? "bg-green-500/10 border-green-500/20 text-green-400" 
                          : "bg-white/5 border-white/5 text-white/30"
                      }`}
                      title={r.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {r.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    <button 
                      onClick={() => handleEdit(r)}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button 
                      onClick={() => handleDelete(r.id)}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
