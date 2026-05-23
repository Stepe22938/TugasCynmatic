import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Store, Star, CheckCircle2, ShieldCheck, Package, Calendar, TrendingUp } from "lucide-react";
import { User } from "../contexts/AuthContext";
import { useSellerStats } from "../hooks/useSellerStats";
import { formatPrice } from "../utils/formatPrice";

interface SellerInfoModalProps {
  seller: User;
  onClose: () => void;
}

export function SellerInfoModal({ seller, onClose }: SellerInfoModalProps) {
  const { averageRating, totalReviews, totalProducts, products } = useSellerStats(seller.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-card border border-border/50 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-br from-primary/20 via-orange-500/10 to-transparent relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-[2rem] border-4 border-card overflow-hidden shadow-xl bg-muted">
              <img 
                src={seller.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seller.name)}&backgroundColor=f97316`} 
                alt={seller.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 px-8 pb-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tighter">{seller.name}</h2>
              <div className="flex gap-2">
                {seller.isVerifiedSeller && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">True Seller</span>
                  </div>
                )}
                {seller.isVerifiedReseller && (
                  <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full border border-blue-500/20 shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">True Reseller</span>
                  </div>
                )}
            </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
              <Store className="h-3 w-3" /> {seller.role}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/30 p-4 rounded-3xl border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-lg font-black tracking-tighter">{averageRating || "-"}</span>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rating Toko</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-3xl border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1 text-primary">
                <Package className="h-4 w-4" />
                <span className="text-lg font-black tracking-tighter">{totalProducts}</span>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Produk</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-3xl border border-border/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1 text-blue-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg font-black tracking-tighter">{totalReviews}</span>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ulasan</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Bergabung Sejak</p>
                <p className="font-bold">{new Date(seller.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {seller.bio && (
              <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border italic text-sm text-muted-foreground">
                "{seller.bio}"
              </div>
            )}
          </div>

          {/* Quick View Products */}
          {products.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Beberapa Produk</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {products.slice(0, 5).map(p => (
                  <div key={p.id} className="flex-shrink-0 w-20 space-y-1">
                    <div className="aspect-square rounded-xl overflow-hidden border bg-muted">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] font-bold truncate">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
