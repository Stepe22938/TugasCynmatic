/**
 * ProductCard.tsx
 * Kartu produk di halaman beranda.
 *
 * Klik gambar atau nama → navigasi ke halaman detail produk (/product/:id).
 * Tombol "Tambah" langsung menambah ke keranjang tanpa pindah halaman.
 * Rating bintang ditampilkan otomatis dari ulasan yang sudah ada.
 */
import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, ShoppingCart, ArrowRight, Zap, Clock, ShieldCheck, Heart, Store, CheckCircle2 } from "lucide-react";
import { useSultan } from "../contexts/MySultanContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { SellerInfoModal } from "./SellerInfoModal";
import { AnimatePresence } from "framer-motion";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../hooks/use-toast";
import { useProductRatings } from "../hooks/useProductRatings";
import { Button } from "./ui/button";
import type { Product } from "../data/products";

interface ProductCardProps {
  product: Product;
}

/**
 * Badge rating kecil yang ditampilkan di kartu jika sudah ada ulasan.
 */
function RatingBadge({ average, count }: { average: number; count: number }) {
  return (
    <div className="flex items-center gap-1" data-testid="rating-display">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      <span className="text-xs font-semibold text-foreground">{average.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();
  const allRatings = useProductRatings();
  const { isSultan } = useSultan();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { allUsers } = useAuth();
  const [showSellerModal, setShowSellerModal] = React.useState(false);

  const rating = allRatings[product.id];
  const sellerUser = allUsers.find(u => u.id === product.sellerId);

  const inWishlist = isInWishlist(product.id);

  const isPreOrder = product.isPreOrder && product.releaseDate;
  const releaseDate = isPreOrder ? new Date(product.releaseDate!) : null;
  const now = new Date();
  
  // Calculate if we are in the 30-min window before release
  const timeToRelease = releaseDate ? releaseDate.getTime() - now.getTime() : 0;
  const isWithinEarlyAccess = timeToRelease > 0 && timeToRelease <= 30 * 60 * 1000;
  const isReleased = releaseDate ? timeToRelease <= 0 : true;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0) {
      toast({ title: "Stok Habis", description: "Maaf, produk ini sudah habis terjual.", variant: "destructive" });
      return;
    }

    if (isPreOrder && !isReleased) {
      if (!isWithinEarlyAccess) {
        toast({ 
          title: "Pre-Order Belum Dibuka", 
          description: `Akses dibuka ${isSultan ? "30 menit sebelum" : ""} ${releaseDate?.toLocaleString("id-ID")}`,
          variant: "destructive" 
        });
        return;
      }
      // If within 30 mins, both can buy but Sultan gets immediate, regular gets pending
    }

    const discount = product.isFlashSale ? (product.discountPercent || 0) : 0;
    const finalPrice = product.price * (1 - discount / 100);

    dispatch({
      type: "ADD_ITEM",
      payload: { 
        id: product.id, 
        name: product.name, 
        price: finalPrice, 
        image: product.image,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        stock: product.stock,
        isPreOrder: isPreOrder && !isReleased,
        releaseDate: product.releaseDate
      },
    });
    
    if (isPreOrder && !isReleased) {
      if (isSultan) {
        toast({ title: "Early Access Sultan!", description: "Anda mendapatkan barang langsung saat rilis." });
      } else {
        toast({ title: "Pre-Order Berhasil", description: "Pesanan Anda akan diproses setelah waktu perilisan." });
      }
    } else {
      toast({ title: "Berhasil ditambahkan", description: `${product.name} masuk ke keranjang!` });
    }
  };

  return (
    /**
     * Seluruh kartu adalah Link ke halaman detail.
     * Klik di mana saja (kecuali tombol "Tambah") akan membuka detail produk.
     */
    <Link href={`/product/${product.id}`} data-testid={`card-product-${product.id}`}>
      <motion.div 
        whileHover={{ y: -10, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="group flex flex-col bg-card rounded-[2rem] border border-border/50 overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)] transition-shadow duration-500 cursor-pointer h-full relative"
      >
        {/* Gambar produk */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <motion.img
            src={product.image}
            alt={product.name}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            className="object-cover w-full h-full"
          />
          
          {/* Badge kategori */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white/80 dark:bg-black/80 text-foreground backdrop-blur-md rounded-full shadow-lg border border-white/20">
              {product.category}
            </span>
            {product.isFlashSale && (
              <span className="flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded-full shadow-lg animate-bounce">
                <Zap className="h-3 w-3 fill-white" /> Flash Sale
              </span>
            )}
            {product.stock <= 0 && (
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white rounded-full shadow-lg">
                Stok Habis
              </span>
            )}
            {isPreOrder && !isReleased && (
              <span className="flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white rounded-full shadow-lg">
                <Clock className="h-3 w-3" /> Pre-Order
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
            className={`absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
              inWishlist 
                ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20 scale-110" 
                : "bg-white/50 dark:bg-black/50 border-white/20 text-foreground hover:bg-white hover:text-red-500"
            }`}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
          </button>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* View Detail Indicator */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <span className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-1 uppercase tracking-tighter">
              Lihat Detail <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Konten teks */}
        <div className="p-5 flex flex-col flex-grow relative bg-card">
          {/* Rating */}
          {rating && rating.count > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-2"
            >
              <RatingBadge average={rating.average} count={rating.count} />
            </motion.div>
          )}

          <h3 className="font-black text-lg text-foreground line-clamp-1 mb-0.5 tracking-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div 
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2 cursor-pointer hover:text-primary transition-colors w-fit relative z-30"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSellerModal(true); }}
          >
            <Store className="h-3 w-3" />
            <span className="font-bold">{product.sellerName}</span>
            <div className="flex gap-1">
              {sellerUser?.isVerifiedSeller && (
                <div className="flex items-center gap-0.5 bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5 fill-current" />
                  <span className="text-[8px] font-black uppercase tracking-tight">True Seller</span>
                </div>
              )}
              {sellerUser?.isVerifiedReseller && (
                <div className="flex items-center gap-0.5 bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                  <ShieldCheck className="h-2.5 w-2.5 fill-current" />
                  <span className="text-[8px] font-black uppercase tracking-tight">True Reseller</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 flex-grow mb-2 leading-relaxed opacity-80">
            {product.description}
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            {product.stock > 0 ? (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">
                Tersedia: {product.stock}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md">
                Stok Habis
              </span>
            )}
            {isPreOrder && !isReleased && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-md flex items-center gap-1">
                <Clock className="h-3 w-3" /> Rilis: {new Date(product.releaseDate!).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          {/* Baris harga + tombol tambah */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
            <div className="flex flex-col">
              {product.isFlashSale ? (
                <>
                  <span className="text-[10px] text-muted-foreground line-through font-bold">{formatPrice(product.price)}</span>
                  <span className="font-black text-xl text-red-600 tracking-tighter">
                    {formatPrice(product.price * (1 - (product.discountPercent || 0) / 100))}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Mulai dari</span>
                  <span className="font-black text-xl text-primary tracking-tighter">{formatPrice(product.price)}</span>
                </>
              )}
            </div>
            
            <motion.div
              whileHover={product.stock > 0 ? { scale: 1.05 } : {}}
              whileTap={product.stock > 0 ? { scale: 0.95 } : {}}
            >
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || (isPreOrder && !isReleased && !isWithinEarlyAccess)}
                data-testid={`button-add-to-cart-${product.id}`}
                size="sm"
                className={`rounded-2xl shadow-xl text-[11px] font-black px-4 h-10 gap-2 transition-all ${
                  product.stock > 0 && !(isPreOrder && !isReleased && !isWithinEarlyAccess)
                    ? "bg-gradient-to-br from-primary to-orange-600 shadow-primary/20 hover:shadow-primary/40" 
                    : "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
                }`}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {product.stock <= 0 ? "Habis" : (isPreOrder && !isReleased) ? "Pre-Order" : "Tambah"}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {showSellerModal && sellerUser && (
          <SellerInfoModal 
            seller={sellerUser} 
            onClose={() => setShowSellerModal(false)} 
          />
        )}
      </AnimatePresence>
    </Link>
  );
}
