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
    <div className="min-h-screen bg-[#050505] pb-32">
      {/* ── Premium Sultan Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/profile">
              <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 group">
                <ArrowLeft className="h-5 w-5 text-white group-hover:-translate-x-1 transition-transform" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 italic text-white uppercase">
                <Crown className="h-7 w-7 text-yellow-500" /> MySultan <span className="text-yellow-500/50 not-italic">Elite</span>
              </h1>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Sovereign Identity Protocol</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Available Credit</p>
                <p className="text-sm font-black text-emerald-500 italic">{formatPrice(balance)}</p>
             </div>
             <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-500" />
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-12 mt-12">
        {/* ── Sovereign Status Card ───────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[3.5rem] p-12 border border-white/5 shadow-[0_0_100px_rgba(234,179,8,0.1)] group">
          <div className={`absolute inset-0 transition-all duration-1000 ${isSultan ? "bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-950/40 via-background to-background" : "bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-background to-background"}`} />
          
          <div className="absolute -right-20 -top-20 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-1000">
            <Crown className="h-96 w-96 rotate-12 text-yellow-500" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-xl">
                  <div className={`h-3 w-3 rounded-full animate-pulse ${isSultan ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]" : "bg-white/20"}`} />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{isSultan ? "Frequency Locked" : "Disconnected"}</span>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-6xl font-black tracking-tighter text-white italic uppercase leading-none">
                    {isSultan ? "Sultan Identified" : "Ascend to Elite"}
                  </h2>
                  <p className="text-lg font-bold text-white/40 uppercase tracking-[0.1em]">
                    {isSultan ? "Elite Tier Authority Active" : "Initialize Sovereign Access Protocol"}
                  </p>
                </div>

                {isSultan ? (
                  <div className="flex flex-wrap gap-4">
                    <div className="glass-card bg-yellow-500/10 border border-yellow-500/20 px-8 py-4 rounded-2xl flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-[9px] font-black text-yellow-500/40 uppercase tracking-widest">Expiration cycle</p>
                        <p className="text-sm font-black text-white italic">{new Date(sultanExpiry!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/40 font-bold italic max-w-xl text-lg leading-relaxed">
                    Unlock the ultimate administrative privileges. Command the market with early access nodes and exclusive credit frequencies.
                  </p>
                )}
              </div>

              {isSultan && (
                <div className="relative group/badge">
                   <div className="absolute -inset-8 bg-yellow-500/20 rounded-full blur-3xl opacity-50 group-hover/badge:opacity-100 transition-opacity animate-pulse" />
                   <div className="w-48 h-48 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center relative z-10 backdrop-blur-2xl">
                      <Crown className="h-24 w-24 text-yellow-500 filter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Matrix Privileges ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: Zap, 
              title: "Early Access Nodes", 
              desc: "Deploy purchase protocols 30 minutes before standard users.",
              color: "text-amber-500", bg: "bg-amber-500/10"
            },
            { 
              icon: Ticket, 
              title: "Elite Vouchers", 
              desc: "Synthesize high-reduction credit matrices for all transactions.",
              color: "text-purple-500", bg: "bg-purple-500/10"
            },
            { 
              icon: ShieldCheck, 
              title: "Sovereign Badge", 
              desc: "Broadcast your elite status across the global identity network.",
              color: "text-blue-500", bg: "bg-blue-500/10"
            },
            { 
              icon: Activity, 
              title: "Signal Priority", 
              desc: "Support and logistics protocols receive ultimate priority.",
              color: "text-rose-500", bg: "bg-rose-500/10"
            }
          ].map((item, i) => (
            <div key={i} className="glass-card p-10 rounded-[3rem] border border-white/5 hover:border-white/10 transition-all duration-500 group/item">
              <div className={`w-16 h-16 ${item.bg} rounded-[1.5rem] flex items-center justify-center mb-8 group-hover/item:scale-110 transition-transform`}>
                <item.icon className={`h-8 w-8 ${item.color}`} />
              </div>
              <h3 className="font-black text-white uppercase italic tracking-widest text-sm mb-3">{item.title}</h3>
              <p className="text-[11px] text-white/30 font-bold italic leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Sovereign Customization (ELITE ONLY) ─────────────────── */}
        {isSultan && (
          <div className="glass-card rounded-[3.5rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5" />
            
            <div className="relative z-10 flex flex-col lg:flex-row gap-16">
              <div className="flex-1 space-y-10">
                <div className="space-y-3">
                  <h3 className="text-3xl font-black tracking-tighter text-white italic uppercase flex items-center gap-4">
                    <Sparkles className="h-8 w-8 text-yellow-500" /> Identity Synthesis
                  </h3>
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] ml-1">Customize Your Sovereign Signal</p>
                </div>

                <div className="space-y-6">
                  {/* Badge Color Picker */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Spectral Hue Configuration</label>
                    <div className="flex flex-wrap gap-4">
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
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} border-2 transition-all hover:scale-110 active:scale-95 ${user?.sultanBadgeColor === c.value ? "border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "border-transparent opacity-40 hover:opacity-100"}`}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Aura Toggle */}
                  <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-sm font-black text-white uppercase italic tracking-widest">Radiance Aura</p>
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">Initialize Photon Glow Effect</p>
                    </div>
                    <button 
                      onClick={() => updateUser({ ...user!, sultanGlowEffect: !user?.sultanGlowEffect })}
                      className={`w-16 h-8 rounded-full transition-all relative p-1 ${user?.sultanGlowEffect ? "bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]" : "bg-white/5"}`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-white transition-all shadow-xl ${user?.sultanGlowEffect ? "translate-x-8" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Custom Tag */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Title Designation Matrix</label>
                    <div className="relative group">
                       <input 
                        type="text"
                        maxLength={15}
                        placeholder="ENTER SOVEREIGN TITLE"
                        value={user?.sultanCustomTag || ""}
                        onChange={(e) => updateUser({ ...user!, sultanCustomTag: e.target.value.toUpperCase() })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-8 py-5 text-sm font-black text-white uppercase tracking-widest focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/5"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                         <Activity className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Live Preview Matrix ────────────────────────────── */}
              <div className="w-full lg:w-80 flex flex-col items-center">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-8">Signal Preview</p>
                 <div className="w-full aspect-[3/4] glass-card rounded-[3.5rem] p-8 border border-white/5 relative overflow-hidden flex flex-col items-center justify-center text-center space-y-8 bg-[#0a0a0b]">
                    <div className="relative">
                      {user?.sultanGlowEffect && (
                        <div className="absolute -inset-10 bg-yellow-500/30 rounded-full blur-[40px] animate-pulse" />
                      )}
                      <div className="relative z-10 w-32 h-32 rounded-[3rem] border-4 border-white/10 overflow-hidden shadow-2xl">
                        <img 
                          src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className={`absolute -bottom-4 -right-4 bg-gradient-to-br from-yellow-400 to-amber-600 p-4 rounded-2xl shadow-2xl border-2 border-[#0a0a0b] z-20`}>
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-2xl font-black text-white italic uppercase tracking-tighter">{user?.name}</p>
                      {user?.sultanCustomTag && (
                        <p className="text-[10px] font-black text-yellow-500 tracking-[0.3em] uppercase bg-yellow-500/10 px-4 py-1 rounded-full border border-yellow-500/20">
                          {user.sultanCustomTag}
                        </p>
                      )}
                    </div>

                    <div className="pt-8 w-full border-t border-white/5">
                       <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                          <span>Verified Elite</span>
                          <span>Node Active</span>
                       </div>
                    </div>
                 </div>
                 <p className="text-[10px] text-white/20 font-bold italic mt-6">Frequency Output Verification</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Subscription Protocol ───────────────────────────────── */}
        <div className="glass-card rounded-[3.5rem] p-12 border border-white/5 shadow-2xl space-y-12 bg-[#0a0a0b]">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tighter flex items-center gap-4 text-white italic uppercase">
              <Gem className="h-7 w-7 text-emerald-500" /> {isSultan ? "Extend Access" : "Acquisition Protocol"}
            </h3>
            <div className="bg-emerald-500/10 px-6 py-2 rounded-xl border border-emerald-500/20">
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Elite Pricing</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {config.durations.map((d) => (
              <button
                key={d.months}
                onClick={() => setSelectedMonths(d.months)}
                className={`p-10 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden group/opt ${selectedMonths === d.months ? "bg-emerald-500/10 border-emerald-500 shadow-2xl shadow-emerald-500/20" : "bg-white/5 border-white/5 hover:border-emerald-500/30"}`}
              >
                <span className="text-2xl font-black text-white italic uppercase tracking-tighter">{d.label}</span>
                <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{formatPrice(config.price * d.months)}</span>
                {selectedMonths === d.months && (
                   <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                   </div>
                )}
              </button>
            ))}
          </div>

          <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-10 border-t border-white/5">
            <div className="text-center md:text-left">
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] mb-2">Total Credit Requirement</p>
              <p className="text-4xl font-black text-emerald-500 italic tracking-tighter">{formatPrice(config.price * selectedMonths)}</p>
            </div>
            <Button 
              onClick={handleBuy}
              size="lg" 
              className="rounded-[1.5rem] px-16 h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black italic uppercase tracking-[0.2em] text-sm shadow-2xl shadow-emerald-600/40 w-full md:w-auto"
            >
              EXECUTE ACQUISITION <ArrowRight className="ml-4 h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* ── Voucher Frequency Matrix ────────────────────────────── */}
        {isSultan && (
          <div className="glass-card rounded-[3.5rem] p-12 border border-white/5 shadow-2xl space-y-10">
            <div className="flex items-center gap-4">
              <Ticket className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-white italic uppercase">Voucher Matrix</h3>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mt-1">Sultan Exclusive Credit Reductions</p>
              </div>
            </div>
            
            <div className="grid gap-6">
              {vouchers.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all group/v">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover/v:scale-110 transition-transform">
                      <Sparkles className="h-8 w-8 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white italic tracking-[0.2em] uppercase group-hover/v:text-purple-400 transition-colors">{v.code}</p>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Reduction Value: <span className="text-purple-500">{v.type === "percent" ? `${v.discount}%` : formatPrice(v.discount)}</span></p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                     <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] italic group-hover/v:text-purple-500/20 transition-colors">Sovereign Asset</span>
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
