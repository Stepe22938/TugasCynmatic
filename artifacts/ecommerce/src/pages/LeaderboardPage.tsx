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
        const sellerId = item.sellerId;
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" /> Leaderboard
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/50">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1">
              <Activity className="h-3 w-3" /> Live Updates
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8 mt-4">
        {/* Top Sellers Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" /> Top Sellers
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Berdasarkan Omzet</span>
          </div>
          
          {topSellers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <TrendingUp className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold">Belum ada data penjualan.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence mode="popLayout">
                {topSellers.map((seller, index) => (
                  <motion.div 
                    layout
                    key={seller.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-10 h-10 flex items-center justify-center font-black text-lg italic shrink-0">
                      {index === 0 ? <Crown className="h-6 w-6 text-yellow-500" /> : 
                       index === 1 ? <Medal className="h-6 w-6 text-slate-400" /> :
                       index === 2 ? <Medal className="h-6 w-6 text-amber-600" /> :
                       `#${index + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-sm sm:text-base">{seller.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-tight">{seller.totalItemsSold} Barang Terjual</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-primary font-black text-sm sm:text-base">{formatPrice(seller.totalRevenue)}</p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Total Pendapatan</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Top Buyers Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-indigo-500" /> Top Buyers
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Berdasarkan Belanja</span>
          </div>

          {topBuyers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <User className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold">Belum ada data pembelian.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence mode="popLayout">
                {topBuyers.map((buyer, index) => (
                  <motion.div 
                    layout
                    key={buyer.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="w-10 h-10 flex items-center justify-center font-black text-lg italic shrink-0">
                      {index === 0 ? <Crown className="h-6 w-6 text-yellow-500" /> : 
                       index === 1 ? <Medal className="h-6 w-6 text-slate-400" /> :
                       index === 2 ? <Medal className="h-6 w-6 text-amber-600" /> :
                       `#${index + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-sm sm:text-base">{buyer.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-tight">{buyer.totalItemsBought} Barang Dibeli</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-indigo-600 dark:text-indigo-400 font-black text-sm sm:text-base">{formatPrice(buyer.totalSpent)}</p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Total Belanja</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
