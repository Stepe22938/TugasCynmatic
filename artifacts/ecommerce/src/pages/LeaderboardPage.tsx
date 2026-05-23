import React, { useMemo } from "react";
import { Link } from "wouter";
import { 
  Trophy, TrendingUp, ShoppingBag, Wallet, 
  ArrowLeft, Crown, Medal, User, Store, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductsContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";

interface SellerStats {
  id: string;
  name: string;
  totalRevenue: number;
  totalItemsSold: number;
}

interface BuyerStats {
  id: string;
  name: string;
  totalSpent: number;
  totalItemsBought: number;
}

export function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const { allStoreProducts } = useProducts();
  const { getAllOrders } = useOrderHistory();
  const allOrders = getAllOrders();

  const { topSellers, topBuyers } = useMemo(() => {
    const sellers: Record<string, SellerStats> = {};
    const buyers: Record<string, BuyerStats> = {};

    allOrders.forEach(order => {
      // Buyer stats
      const buyerId = order.userId;
      let bName = order.userName;
      
      // Better name resolution for buyers
      if (!bName) {
        if (currentUser && buyerId === currentUser.id) bName = currentUser.name;
        else bName = "Pelanggan Setia";
      }
      
      if (!buyers[buyerId]) {
        buyers[buyerId] = { id: buyerId, name: bName, totalSpent: 0, totalItemsBought: 0 };
      }
      buyers[buyerId].totalSpent += order.grandTotal;
      
      order.items.forEach(item => {
        const qty = item.quantity || 1;
        buyers[buyerId].totalItemsBought += qty;

        // Seller stats
        const sellerId = item.sellerId || "unknown";
        let sName = item.sellerName;
        
        // Better name resolution for sellers
        if (!sName) {
          const productRef = allStoreProducts.find(p => p.sellerId === sellerId);
          if (productRef) sName = productRef.sellerName;
          else if (sellerId === "admin-001") sName = "Admin Toko";
          else sName = "Seller Toko";
        }
        
        if (!sellers[sellerId]) {
          sellers[sellerId] = { id: sellerId, name: sName, totalRevenue: 0, totalItemsSold: 0 };
        }
        sellers[sellerId].totalRevenue += item.price * qty;
        sellers[sellerId].totalItemsSold += qty;
      });
    });

    return {
      topSellers: Object.values(sellers).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10),
      topBuyers: Object.values(buyers).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10)
    };
  }, [allOrders]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 sticky top-20 z-20">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/profile">
              <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 group">
                <ArrowLeft className="h-5 w-5 text-white group-hover:-translate-x-1 transition-transform" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 italic text-white uppercase">
                <Trophy className="h-7 w-7 text-yellow-500" /> Hall of Fame
              </h1>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Global Sovereignty rankings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-2xl border border-red-500/20">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Live Stream
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-16 mt-12 relative z-10">
        {/* Top Sellers Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-3 uppercase italic text-white">
                <Store className="h-5 w-5 text-yellow-500" /> Top Sellers
              </h2>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-wider">Ascended Retail Merchants</p>
            </div>
            <span className="text-[10px] font-black text-yellow-500/50 uppercase tracking-[0.2em] bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/10">Berdasarkan Omzet</span>
          </div>
          
          {topSellers.length === 0 ? (
            <div className="glass-card rounded-[2.5rem] p-16 text-center border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <TrendingUp className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold italic">No merchant transactions mapped yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {topSellers.map((seller, index) => {
                  const isTop3 = index < 3;
                  const rankColors = [
                    "from-yellow-400 to-amber-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] border-yellow-400/30",
                    "from-slate-300 to-slate-500 shadow-[0_0_30px_rgba(203,213,225,0.1)] border-slate-400/30",
                    "from-amber-600 to-amber-800 shadow-[0_0_30px_rgba(180,83,9,0.1)] border-amber-700/30"
                  ];
                  return (
                    <motion.div 
                      layout
                      key={seller.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className={`glass-card p-5 rounded-[2rem] border flex items-center gap-5 hover:border-white/15 transition-all group ${
                        index === 0 ? "border-yellow-500/20 bg-yellow-500/[0.02]" : "border-white/5 bg-[#0a0a0c]/20"
                      }`}
                    >
                      {/* Rank Container */}
                      <div className="shrink-0">
                        {isTop3 ? (
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankColors[index]} flex items-center justify-center border text-white font-black italic shadow-lg`}>
                            {index === 0 ? <Crown className="h-6 w-6 text-white" /> : index + 1}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/30 font-mono font-black text-sm">
                            #{index + 1}
                          </div>
                        )}
                      </div>

                      {/* Merchant Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-base sm:text-lg tracking-tight group-hover:text-yellow-400 transition-colors">{seller.name}</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">{seller.totalItemsSold} Unit Disalurkan</p>
                      </div>

                      {/* Revenue Badge */}
                      <div className="text-right shrink-0">
                        <p className="text-yellow-500 font-black text-base sm:text-xl italic tracking-tight">{formatPrice(seller.totalRevenue)}</p>
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">Total Revenue</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Top Buyers Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-3 uppercase italic text-white">
                <ShoppingBag className="h-5 w-5 text-indigo-500" /> Top Buyers
              </h2>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-wider">Premium Sovereign Consumers</p>
            </div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10">Berdasarkan Belanja</span>
          </div>

          {topBuyers.length === 0 ? (
            <div className="glass-card rounded-[2.5rem] p-16 text-center border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <User className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold italic">No consumer records found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {topBuyers.map((buyer, index) => {
                  const isTop3 = index < 3;
                  const rankColors = [
                    "from-yellow-400 to-amber-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] border-yellow-400/30",
                    "from-slate-300 to-slate-500 shadow-[0_0_30px_rgba(203,213,225,0.1)] border-slate-400/30",
                    "from-amber-600 to-amber-800 shadow-[0_0_30px_rgba(180,83,9,0.1)] border-amber-700/30"
                  ];
                  return (
                    <motion.div 
                      layout
                      key={buyer.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className={`glass-card p-5 rounded-[2rem] border flex items-center gap-5 hover:border-white/15 transition-all group ${
                        index === 0 ? "border-indigo-500/20 bg-indigo-500/[0.02]" : "border-white/5 bg-[#0a0a0c]/20"
                      }`}
                    >
                      {/* Rank Container */}
                      <div className="shrink-0">
                        {isTop3 ? (
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankColors[index]} flex items-center justify-center border text-white font-black italic shadow-lg`}>
                            {index === 0 ? <Crown className="h-6 w-6 text-white" /> : index + 1}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/30 font-mono font-black text-sm">
                            #{index + 1}
                          </div>
                        )}
                      </div>

                      {/* Buyer Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-base sm:text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{buyer.name}</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">{buyer.totalItemsBought} Item Terakuisisi</p>
                      </div>

                      {/* Spent Badge */}
                      <div className="text-right shrink-0">
                        <p className="text-indigo-400 font-black text-base sm:text-xl italic tracking-tight">{formatPrice(buyer.totalSpent)}</p>
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">Total Acquisition</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
