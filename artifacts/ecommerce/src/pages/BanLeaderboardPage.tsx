import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Search, Ban, Clock, History, ChevronLeft, UserX, AlertTriangle, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatPrice";

export function BanLeaderboardPage() {
  const { getAllUsers } = useAuth();
  const [search, setSearch] = useState("");
  
  const bannedUsers = getAllUsers()
    .filter(u => u.isBanned)
    .filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.banReason?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-rose-700 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group">
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-widest">Kembali ke Beranda</span>
            </button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter">Ban Leaderboard</h1>
              <p className="text-red-100 font-medium">Daftar pengguna yang melanggar hukum Cynmatic.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 space-y-6">
        {/* Search Bar - More Prominent */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-card border-2 border-red-200 dark:border-red-900/50 rounded-[2rem] p-1.5 shadow-2xl flex items-center gap-3">
            <div className="pl-5">
              <Search className="h-6 w-6 text-red-500" />
            </div>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari User Bermasalah (Nama, ID, atau Alasan)..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-base font-black h-14 placeholder:text-muted-foreground/50 placeholder:font-bold"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="mr-3 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Banned List */}
        <div className="space-y-4">
          {bannedUsers.length === 0 ? (
            <div className="bg-card border rounded-[2.5rem] py-20 text-center shadow-sm">
               <UserX className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
               <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">Tidak ada buronan ditemukan</p>
            </div>
          ) : (
            bannedUsers.map((u, idx) => (
              <motion.div 
                key={u.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative"
              >
                {/* Status Badge */}
                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-sm ${
                  u.banType === 'permanent' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {u.banType === 'permanent' ? 'Permanent' : 'Trial'}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border-4 border-white dark:border-slate-800 shadow-inner">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} alt={u.name} className="w-full h-full object-cover grayscale" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl tracking-tight">{u.name}</h3>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-muted-foreground">ID: {u.id}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Join: {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-red-500">Alasan: {u.banReason || 'Tidak disebutkan'}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                       <p className="text-xs text-muted-foreground leading-relaxed italic">
                         "Tindakan tegas diambil untuk menjaga integritas komunitas Cynmatic."
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
