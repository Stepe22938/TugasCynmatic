import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Crown, CheckCircle2, Zap, Clock, Ticket, 
  ArrowLeft, ShieldCheck, Wallet, Activity, 
  ArrowRight, Sparkles, Gem
} from "lucide-react";
import { useSultan } from "../contexts/MySultanContext";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";

export function MySultanPage() {
  const { isSultan, sultanExpiry, config, buySultan, vouchers } = useSultan();
  const { user, updateUser } = useAuth();
  const { balance } = useWallet();
  const [, setLocation] = useLocation();
  const [selectedMonths, setSelectedMonths] = useState(1);

  const handleBuy = () => {
    if (buySultan(selectedMonths)) {
      // Success handled in buySultan
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" /> MySultan
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        {/* Status Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${isSultan ? "from-yellow-600 to-amber-800" : "from-slate-800 to-slate-950"}`} />
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Crown className="h-32 w-32 rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <Crown className={`h-8 w-8 ${isSultan ? "text-yellow-300" : "text-slate-400"}`} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter">
                  {isSultan ? "Anda Adalah Sultan" : "Daftar MySultan"}
                </h2>
                <p className="text-sm opacity-80 font-bold uppercase tracking-widest">
                  {isSultan ? "Tier Premium Aktif" : "Buka Akses Tanpa Batas"}
                </p>
              </div>
            </div>

            {isSultan ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10 inline-block">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-bold">Aktif hingga: {new Date(sultanExpiry!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <p className="text-sm opacity-70">Terima kasih telah menjadi bagian dari elit MySultan. Nikmati semua keuntungan eksklusif Anda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm opacity-80 leading-relaxed max-w-md font-medium">
                  Bergabunglah dengan ribuan user eksklusif lainnya dan nikmati akses early-bird, voucher spesial, dan badge prestisius.
                </p>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-black">Saldo MyDompet: {formatPrice(balance)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { 
              icon: Zap, 
              title: "Early Access 30 Menit", 
              desc: "Beli produk live, flash sale, dan lelang 30 menit sebelum user biasa.",
              color: "text-amber-500", bg: "bg-amber-100"
            },
            { 
              icon: Ticket, 
              title: "Voucher Eksklusif", 
              desc: "Dapatkan voucher belanja, music, dan lelang yang hanya bisa dipakai Sultan.",
              color: "text-purple-500", bg: "bg-purple-100"
            },
            { 
              icon: ShieldCheck, 
              title: "Badge Sultan", 
              desc: "Tunjukkan status Anda di profil dan etalase dengan badge eksklusif.",
              color: "text-blue-500", bg: "bg-blue-100"
            },
            { 
              icon: Activity, 
              title: "Prioritas Layanan", 
              desc: "Support tiket dan pengiriman mendapatkan prioritas lebih tinggi.",
              color: "text-rose-500", bg: "bg-rose-100"
            }
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <div className={`w-12 h-12 ${item.bg} dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <h3 className="font-black text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Sultan Customization Section (ELITE ONLY) */}
        {isSultan && (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border-2 border-yellow-500/30 space-y-8 relative overflow-hidden group">
            {/* Animated Background for Section */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              {/* Controls */}
              <div className="flex-1 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" /> Kustomisasi Elit Sultan
                  </h3>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-[0.1em]">Personalisasi Identitas Premium Anda</p>
                </div>

                {/* Badge Color Picker */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Warna Badge Eksklusif</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: "Gold", color: "from-yellow-400 to-amber-600", value: "yellow" },
                      { name: "Diamond", color: "from-cyan-400 to-blue-600", value: "cyan" },
                      { name: "Emerald", color: "from-emerald-400 to-green-600", value: "emerald" },
                      { name: "Ruby", color: "from-rose-400 to-red-600", value: "rose" },
                      { name: "Obsidian", color: "from-slate-700 to-black", value: "slate" },
                    ].map((c) => (
                      <button
                        key={c.value}
                        onClick={() => updateUser({ ...user!, sultanBadgeColor: c.value })}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} border-2 transition-all hover:scale-110 ${user?.sultanBadgeColor === c.value ? "border-white scale-110 shadow-lg shadow-white/20" : "border-transparent opacity-60 hover:opacity-100"}`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Aura Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div>
                    <p className="text-sm font-black text-white">Sultan Aura Glow</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase">Efek Cahaya di Profil</p>
                  </div>
                  <button 
                    onClick={() => updateUser({ ...user!, sultanGlowEffect: !user?.sultanGlowEffect })}
                    className={`w-12 h-6 rounded-full transition-all relative ${user?.sultanGlowEffect ? "bg-yellow-500" : "bg-white/10"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user?.sultanGlowEffect ? "right-1" : "left-1"}`} />
                  </button>
                </div>

                {/* Custom Tag */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Gelar Sultan (Custom Tag)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      maxLength={15}
                      placeholder="Contoh: RAJA MOGUL"
                      value={user?.sultanCustomTag || ""}
                      onChange={(e) => updateUser({ ...user!, sultanCustomTag: e.target.value.toUpperCase() })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white focus:border-yellow-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="w-full md:w-64 space-y-4">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block text-center">Live Preview</label>
                 <div className="bg-slate-800 rounded-[2.5rem] p-6 border-2 border-white/5 relative overflow-hidden">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        {user?.sultanGlowEffect && (
                          <div className={`absolute -inset-4 bg-${user?.sultanBadgeColor || 'yellow'}-500/30 rounded-full blur-xl animate-pulse`} />
                        )}
                        <img 
                          src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} 
                          className="w-24 h-24 rounded-[2rem] border-4 border-white/10 relative z-10 shadow-2xl object-cover" 
                        />
                        <div className={`absolute -bottom-2 -right-2 bg-gradient-to-br from-${user?.sultanBadgeColor || 'yellow'}-400 to-${user?.sultanBadgeColor || 'yellow'}-600 p-2 rounded-xl shadow-lg border-2 border-slate-800 z-20`}>
                          <Crown className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-black text-lg leading-none">{user?.name}</p>
                        {user?.sultanCustomTag && (
                          <p className={`text-[10px] font-black text-${user?.sultanBadgeColor || 'yellow'}-400 tracking-[0.2em] mt-1 uppercase`}>
                            {user.sultanCustomTag}
                          </p>
                        )}
                      </div>
                    </div>
                 </div>
                 <p className="text-[9px] text-white/30 text-center font-bold italic">Pratinjau tampilan Anda di Profile & Teman</p>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <h3 className="text-lg font-black tracking-tighter flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" /> {isSultan ? "Perpanjang Masa Sultan" : "Pilih Paket Sultan"}
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {config.durations.map((d) => (
              <button
                key={d.months}
                onClick={() => setSelectedMonths(d.months)}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-1 ${selectedMonths === d.months ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800 hover:border-primary/30"}`}
              >
                <span className="text-sm font-black">{d.label}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">{formatPrice(config.price * d.months)}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Pembayaran</p>
              <p className="text-xl font-black text-primary">{formatPrice(config.price * selectedMonths)}</p>
            </div>
            <Button 
              onClick={handleBuy}
              size="lg" 
              className="rounded-2xl px-8 font-black gap-2 h-12 shadow-lg shadow-primary/20"
            >
              BAYAR SEKARANG <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Voucher Preview */}
        {isSultan && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <h3 className="text-lg font-black tracking-tighter flex items-center gap-2">
              <Ticket className="h-5 w-5 text-purple-500" /> Voucher Sultan Anda
            </h3>
            <div className="grid gap-3">
              {vouchers.map((v) => (
                <div key={v.id} className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/50">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-purple-900 dark:text-purple-300 tracking-wider uppercase">{v.code}</p>
                    <p className="text-xs text-purple-700 dark:text-purple-400">Potongan {v.type === "percent" ? `${v.discount}%` : formatPrice(v.discount)}</p>
                  </div>
                  <div className="text-[10px] font-black bg-purple-200 dark:bg-purple-800 px-3 py-1 rounded-full text-purple-700 dark:text-purple-300">
                    SULTAN ONLY
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
