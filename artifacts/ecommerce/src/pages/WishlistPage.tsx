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
  const { wishlist, toggleWishlist } = useWishlist();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <button className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Wishlist Saya</h1>
            <p className="text-muted-foreground text-sm">{wishlist.length} produk tersimpan</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-2xl flex items-center justify-center">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        </div>
      </div>

      {wishlist.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-dashed rounded-[3rem] p-16 text-center"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-muted-foreground opacity-20" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Wishlist kamu masih kosong</h2>
          <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
            Simpan produk yang kamu incar agar tidak ketinggalan saat ada promo menarik!
          </p>
          <Link href="/">
            <Button size="lg" className="rounded-2xl px-8 font-bold">
              Cari Produk
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {wishlist.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative group">
                   <ProductCard product={product} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info Section */}
      {wishlist.length > 0 && (
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-[2rem] flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-200">Tips Wishlist</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300/80 leading-relaxed">
              Produk di wishlist kamu bersifat <strong>Private</strong>. Hanya kamu yang bisa melihat daftar ini. 
              Kami akan mengirimkan notifikasi jika produk di wishlist kamu mengalami <strong>Penurunan Harga</strong> atau <strong>Stok Hampir Habis</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
