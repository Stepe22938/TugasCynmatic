import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, CheckCheck, Trash2, ShoppingBag, 
  UserPlus, Gift, Sparkles, AlertCircle, 
  ChevronLeft, ArrowRight, Clock
} from "lucide-react";
import { useNotifications, NotifType, AppNotification } from "../contexts/NotificationContext";
import { Button } from "../components/ui/button";
import { formatDate } from "../utils/formatDate";

export function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [filter, setFilter] = useState<"all" | "orders" | "social" | "system">("all");

  const filteredNotifs = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "orders") return n.type.includes("order");
    if (filter === "social") return n.type.includes("friend") || n.type === "gift_received";
    if (filter === "system") return n.type === "system" || n.type === "promo" || n.type === "points_earned";
    return true;
  });

  const getIcon = (type: NotifType) => {
    if (type.includes("order")) return <ShoppingBag className="h-5 w-5 text-blue-400" />;
    if (type.includes("friend")) return <UserPlus className="h-5 w-5 text-violet-400" />;
    if (type === "gift_received") return <Gift className="h-5 w-5 text-pink-400" />;
    if (type === "points_earned") return <Sparkles className="h-5 w-5 text-amber-400" />;
    return <Bell className="h-5 w-5 text-white/70" />;
  };

  const getBadgeColor = (type: NotifType) => {
    if (type.includes("order")) return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    if (type.includes("friend")) return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
    if (type === "gift_received") return "bg-pink-500/10 text-pink-400 border border-pink-500/20";
    if (type === "points_earned") return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-white/5 text-white/55 border border-white/10";
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f5f5] pt-28 pb-20">
      {/* Header */}
      <div className="bg-[#080808]/80 backdrop-blur-md border-b border-white/5 sticky top-16 z-30 py-4">
        <div className="max-w-3xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link href="/">
               <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
                 <ChevronLeft className="h-6 w-6" />
               </Button>
             </Link>
             <div>
               <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 text-white">
                 Pusat Notifikasi
                 {unreadCount > 0 && (
                   <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-600/30">
                     {unreadCount} BARU
                   </span>
                 )}
               </h1>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5">Informasi & Aktivitas Akun</p>
             </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={markAllRead} className="text-xs font-black uppercase tracking-widest text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-white/5 gap-2">
              <CheckCheck className="h-4 w-4" /> Baca Semua
            </Button>
            <Button variant="ghost" onClick={clearAll} className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-white/5 gap-2">
              <Trash2 className="h-4 w-4" /> Bersihkan
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 py-2 flex gap-2">
          {["all", "orders", "social", "system"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                filter === t 
                  ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20" 
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              {t === "all" ? "Semua" : t === "orders" ? "Pesanan" : t === "social" ? "Sosial" : "Sistem"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="max-w-3xl mx-auto p-4 space-y-4 mt-6">
        <AnimatePresence mode="popLayout">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border transition-all hover:border-[#D4AF37]/30 shadow-xl flex items-start gap-5 cursor-pointer ${
                  !n.read 
                    ? "border-[#D4AF37]/20 bg-[#D4AF37]/5 shadow-[#D4AF37]/5" 
                    : "border-white/5"
                }`}
                onClick={() => markRead(n.id)}
              >
                {!n.read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#D4AF37] rounded-r-full" />
                )}

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${getBadgeColor(n.type)}`}>
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">{n.type.replace("_", " ")}</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 uppercase">
                        <Clock className="h-3 w-3" /> {formatDate(n.createdAt)}
                      </div>
                   </div>
                   <h3 className="text-base font-black tracking-tight mb-1 text-white group-hover:text-[#D4AF37] transition-colors">{n.title}</h3>
                   <p className="text-sm text-white/60 leading-relaxed font-medium">{n.message}</p>
                   
                   {n.orderId && (
                     <Link href={`/orders`}>
                       <Button variant="link" className="p-0 h-auto text-[#D4AF37] hover:text-[#D4AF37]/80 text-xs font-black uppercase tracking-widest mt-4">
                         Lihat Detail <ArrowRight className="h-3.5 w-3.5 ml-1" />
                       </Button>
                     </Link>
                   )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-[3rem] border border-dashed border-white/10 shadow-2xl">
               <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                 <Bell className="h-8 w-8 text-white/20" />
               </div>
               <h3 className="text-xl font-black tracking-tight text-white/40 uppercase">Tidak ada notifikasi</h3>
               <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-1">Inbox kamu sedang kosong</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
