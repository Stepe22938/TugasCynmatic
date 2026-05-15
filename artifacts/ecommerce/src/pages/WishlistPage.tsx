/**
 * WishlistPage.tsx
 * Menampilkan daftar produk yang disimpan oleh user.
 */
import React from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import { useWishlist } from "../contexts/WishlistContext";
import { ProductCard } from "../components/ProductCard";
import { Button } from "../components/ui/button";

export function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-6xl space-y-10">
        
        {/* Elite Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[3rem] p-10 relative overflow-hidden border-white/5 shadow-2xl bg-gradient-to-br from-red-600/10 via-background to-background"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Heart className="h-32 w-32 text-red-500" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <Link href="/profile">
                <button className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5 group">
                  <ArrowLeft className="h-5 w-5 text-white/40 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                </button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white drop-shadow-xl">
                  Private Wishlist
                </h1>
                <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-2">
                  {wishlist.length} Curated Assets Secured
                </p>
              </div>
            </div>
            
            <div className="w-20 h-20 bg-red-600/10 rounded-[2rem] flex items-center justify-center shadow-lg shadow-red-600/5 border border-red-500/20">
              <Heart className="h-10 w-10 text-red-500 fill-red-500 animate-pulse" />
            </div>
          </div>
        </motion.div>

        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card border-white/5 bg-white/5 rounded-[4rem] p-24 text-center border-dashed relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
                <Heart className="h-10 w-10 text-white/10" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-3">Portfolio Empty</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-10 max-w-xs mx-auto leading-relaxed">
                Secure your future acquisitions by pinning assets to your private portfolio.
              </p>
              <Link href="/">
                <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-white/90 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-[10px] shadow-2xl">
                  Browse Global Catalog
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {wishlist.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Intelligence Report Section */}
        {wishlist.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 border-orange-500/20 bg-orange-600/5 rounded-[3rem] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <ShoppingBag className="h-24 w-24 text-orange-500" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20 flex-shrink-0 rotate-3">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-lg font-black text-orange-500 uppercase italic tracking-widest mb-2">Protocol Intelligence</h3>
                <p className="text-xs font-medium text-white/50 leading-relaxed max-w-2xl italic">
                  Assets within your private wishlist are <strong className="text-white">Encrypted</strong>. 
                  Automated protocols will trigger priority notifications for <strong className="text-white">Valuation Drops</strong> or <strong className="text-white">Inventory Scarcity</strong>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
