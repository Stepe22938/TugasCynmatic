import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Search, Ban, Clock, History, ChevronLeft, UserX, AlertTriangle, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatPrice";

export function BanLeaderboardPage() {
  const { allUsers } = useAuth();
  const [search, setSearch] = useState("");
  
  const bannedUsers = allUsers
    .filter(u => u.isBanned)
    .filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.banReason?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-rose-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="bg-gradient-to-br from-red-950/80 to-red-900/40 pt-16 pb-28 px-6 border-b border-red-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors group bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-xs uppercase tracking-widest">Beranda</span>
            </button>
          </Link>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-red-500/10 backdrop-blur-md rounded-2xl border border-red-500/20 shadow-xl">
              <ShieldAlert className="h-9 w-9 text-red-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Ban Leaderboard</h1>
              <p className="text-red-300/60 font-bold uppercase tracking-wider text-[10px] mt-1">Daftar pengguna yang ditindak tegas demi keamanan ekosistem.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-14 space-y-8 relative z-10">
        {/* Search Bar - More Prominent */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#0a0a0c]/80 backdrop-blur-xl border border-red-500/20 rounded-[2.5rem] p-2 shadow-2xl flex items-center gap-4">
            <div className="pl-6">
              <Search className="h-6 w-6 text-red-500" />
            </div>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari User Bermasalah (Nama, ID, atau Alasan)..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white font-bold h-14 placeholder:text-white/20 outline-none text-base"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="mr-4 p-2 hover:bg-white/5 rounded-full transition-colors text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Banned List */}
        <div className="space-y-5">
          {bannedUsers.length === 0 ? (
            <div className="glass-card rounded-[2.5rem] py-24 text-center border border-white/5 bg-[#0a0a0c]/20">
               <UserX className="h-16 w-16 text-white/10 mx-auto mb-4" />
               <p className="text-white/40 font-black uppercase tracking-widest text-xs italic">Tidak ada catatan pelanggaran ditemukan</p>
            </div>
          ) : (
            bannedUsers.map((u, idx) => (
              <motion.div 
                key={u.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card border border-white/5 bg-[#0a0a0c]/20 rounded-[2.5rem] p-6 hover:border-red-500/20 transition-all group overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.4)]"
              >
                {/* Status Badge */}
                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] shadow-lg ${
                  u.banType === 'permanent' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-amber-500 text-white'
                }`}>
                  {u.banType === 'permanent' ? 'Permanent' : 'Trial'}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 border-2 border-white/10 shadow-inner flex items-center justify-center">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} alt={u.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-80 transition-opacity" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-black text-xl tracking-tight text-white group-hover:text-red-400 transition-colors">{u.name}</h3>
                      <span className="text-[9px] font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5 text-white/40 font-mono">ID: {u.id}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-wider text-white/40">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-white/20" />
                        <span>Registered: {new Date(u.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/10">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-red-400">Kasus: {u.banReason || 'Pelanggaran Aturan'}</span>
                      </div>
                    </div>
                    
                    <div className="pt-1 border-t border-white/5">
                       <p className="text-xs text-white/30 leading-relaxed italic">
                         "Tindakan preventif & penegakan hukum demi menjaga keadilan di ekosistem TokoArthur."
                       </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
