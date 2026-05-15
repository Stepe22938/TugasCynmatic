/**
 * ProductDetailPage.tsx
 * Halaman detail produk:
 * - Galeri gambar, nama, harga, deskripsi, spesifikasi
 * - Nama seller di bawah nama produk
 * - Tombol tambah ke keranjang
 * - Ringkasan rating + semua ulasan pembeli (global — dari semua akun)
 * - AI Product Checker untuk menilai keaslian produk
 */
import React, { useState } from "react";
import {
  ArrowLeft, ShoppingCart, Star, CheckCircle2, AlertCircle, Video, Package, Store, Sparkles, Heart, Share2, Zap, CreditCard, ShieldCheck
} from "lucide-react";
import { useWishlist } from "../contexts/WishlistContext";
import { useLocation, useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getProductById } from "../data/products";
import { useProducts } from "../contexts/ProductsContext";
import { useCart } from "../contexts/CartContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useProductRatings } from "../hooks/useProductRatings";
import { AIProductChecker } from "../components/AIProductChecker";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { SellerInfoModal } from "../components/SellerInfoModal";

// ─── Bintang Statis ───────────────────────────────────────────────────────────

function StarDisplay({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-6 h-6" }[size];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const fill = Math.min(1, Math.max(0, value - (s - 1)));
        return (
          <span key={s} className={`relative inline-block ${cls}`}>
            <Star className={`absolute inset-0 ${cls} text-muted-foreground/25`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${cls} fill-amber-400 text-amber-400`} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Kartu Ulasan ────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function ReviewCard({ review }: {
  review: {
    userName?: string;
    rating: number;
    status: "sesuai" | "tidak_sesuai";
    comment: string;
    mediaFiles: { name: string; type: "image" | "video"; preview: string }[];
    createdAt: string;
  };
}) {
  return (
    <div className="p-4 border rounded-2xl bg-card space-y-3">
      {/* Nama user */}
      {review.userName && (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {review.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold">{review.userName}</span>
        </div>
      )}

      {/* Rating & Status */}
      <div className="flex flex-wrap items-center gap-3">
        <StarDisplay value={review.rating} size="sm" />
        <span className="text-xs font-semibold text-amber-600">
          {["", "Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"][review.rating]}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          review.status === "sesuai" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {review.status === "sesuai" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {review.status === "sesuai" ? "Barang Sesuai" : "Barang Tidak Sesuai"}
        </span>
      </div>

      {/* Komentar */}
      <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>

      {/* Media */}
      {review.mediaFiles.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {review.mediaFiles.map((file, i) => (
            <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border bg-muted flex-shrink-0">
              {file.type === "image"
                ? <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground">video</span>
                  </div>}
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">{formatDate(review.createdAt)}</p>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export function ProductDetailPage() {
  const params    = useParams<{ id: string }>();
  const productId = Number(params.id);

  const { allStoreProducts }  = useProducts();
  const product = allStoreProducts.find((p) => p.id === productId) ?? getProductById(productId);

  const { dispatch, setDirectItem } = useCart();
  const { toast }    = useToast();
  const { getProductReviews } = useOrderHistory();
  const allRatings = useProductRatings();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [, setLocation] = useLocation();

  const { allUsers } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);

  const sellerUser = allUsers.find(u => u.id === product?.sellerId);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setShowFloatingBar(scrollPos > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Ambil semua review global untuk produk ini
  const reviews = product ? getProductReviews(productId) : [];

  const rating = allRatings[productId];

  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Produk Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-6">Produk dengan ID "{productId}" tidak ada di katalog.</p>
        <Link href="/"><Button>Kembali ke Beranda</Button></Link>
      </div>
    );
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      toast({ title: "Stok Habis", description: "Maaf, produk ini tidak tersedia saat ini.", variant: "destructive" });
      return;
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
        stock: product.stock,
        sellerId: product.sellerId,
        sellerName: product.sellerName
      } 
    });
    toast({ title: "Berhasil!", description: `${product.name} ditambahkan ke keranjang.` });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      toast({ title: "Stok Habis", description: "Maaf, produk ini tidak tersedia saat ini.", variant: "destructive" });
      return;
    }
    const discount = product.isFlashSale ? (product.discountPercent || 0) : 0;
    const finalPrice = product.price * (1 - discount / 100);

    setDirectItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image,
      stock: product.stock,
      quantity: 1,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
    });
    setLocation("/checkout");
  };

  const isWishlisted = isInWishlist(productId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />Beranda
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </div>

      {/* Konten utama */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

        {/* Galeri */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden border bg-muted">
            <img src={product.images[activeImage]} alt={product.name}
              className="w-full h-full object-cover" data-testid="img-product-main" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} data-testid={`button-thumbnail-${i}`}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImage === i ? "border-primary shadow-md scale-105" : "border-border hover:border-primary/50"
                  }`}>
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info produk */}
        <div className="space-y-4">
          {/* Badge kategori */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {product.category}
            </span>
            {product.isFlashSale && (
              <span className="flex items-center gap-1 text-xs font-black bg-red-600 text-white px-3 py-1 rounded-full animate-pulse">
                <Zap className="h-3 w-3 fill-white" /> Flash Sale -{product.discountPercent}%
              </span>
            )}
          </div>

          {/* Nama produk */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
            {product.name}
          </h1>

          {/* Nama seller */}
          <div 
            className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors group w-fit"
            onClick={() => setShowSellerModal(true)}
          >
            <Store className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <span>Dijual oleh <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{product.sellerName}</span></span>
              <div className="flex gap-2">
                {sellerUser?.isVerifiedSeller && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-sm animate-in fade-in zoom-in">
                    <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">True Seller</span>
                  </div>
                )}
                {sellerUser?.isVerifiedReseller && (
                  <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full border border-blue-500/20 shadow-sm animate-in fade-in zoom-in">
                    <ShieldCheck className="h-3.5 w-3.5 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">True Reseller</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          {rating && rating.count > 0 && (
            <div className="flex items-center gap-3" data-testid="product-rating-summary">
              <StarDisplay value={rating.average} size="md" />
              <span className="font-bold text-lg">{rating.average.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">dari {rating.count} ulasan</span>
            </div>
          )}

          {/* Harga */}
          <div className="flex flex-col">
            {product.isFlashSale ? (
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-extrabold text-red-600" data-testid="text-product-price">
                  {formatPrice(product.price * (1 - (product.discountPercent || 0) / 100))}
                </p>
                <p className="text-lg font-bold text-muted-foreground line-through opacity-60">
                  {formatPrice(product.price)}
                </p>
              </div>
            ) : (
              <p className="text-3xl font-extrabold text-primary" data-testid="text-product-price">
                {formatPrice(product.price)}
              </p>
            )}
          </div>

          {/* Deskripsi */}
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            {product.longDescription}
          </p>

          {/* Stok Info */}
          <div className="flex items-center gap-2 py-1 px-3 bg-muted/40 rounded-xl w-fit">
            <Package className={`h-4 w-4 ${product.stock > 0 ? "text-emerald-500" : "text-red-500"}`} />
            <span className={`text-xs font-bold ${product.stock > 0 ? "text-emerald-600" : "text-red-600"}`}>
              {product.stock > 0 ? `Tersedia: ${product.stock} unit` : "Stok Habis"}
            </span>
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              size="lg" 
              className={`flex-1 px-8 h-12 text-base font-semibold transition-all ${
                product.stock > 0 ? "" : "bg-muted text-muted-foreground shadow-none cursor-not-allowed hover:bg-muted"
              }`}
              onClick={handleAddToCart} 
              disabled={product.stock <= 0}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.stock > 0 ? "Tambah ke Keranjang" : "Habis Terjual"}
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className={`flex-1 px-8 h-12 text-base font-bold border-2 border-primary text-primary hover:bg-primary/5 transition-all ${
                product.stock > 0 ? "" : "opacity-50 cursor-not-allowed"
              }`}
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Beli Sekarang
            </Button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleWishlist(product)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border ${
                isWishlisted 
                  ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20" 
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
            </motion.button>
          </div>

          {/* Spesifikasi */}
          {product.specs.length > 0 && (
            <div className="border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/40 border-b">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Spesifikasi</h3>
              </div>
              <div className="divide-y">
                {product.specs.map(({ label, value }) => (
                  <div key={label} className="flex px-4 py-3 text-sm">
                    <span className="w-40 text-muted-foreground flex-shrink-0">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Product Checker */}
          <AIProductChecker
            productName={product.name}
            description={product.description + " " + product.longDescription}
            price={product.price}
            category={product.category}
          />
        </div>
      </div>

        {/* ── Ulasan Pembeli ───────────────────────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-t border-border/50 pt-16"
        >
          <h2 className="text-3xl font-black mb-10 flex items-center gap-3 tracking-tighter">
            <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
            Ulasan Pembeli
            {reviews.length > 0 && (
              <span className="text-lg font-bold text-muted-foreground opacity-50">({reviews.length})</span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/50">
              <Star className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="font-black text-xl tracking-tight">Belum Ada Cerita</p>
              <p className="text-sm text-muted-foreground mt-2 opacity-70">Jadilah pembeli pertama yang memberikan ulasan!</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Distribusi bintang */}
              {rating && (
                <div className="bg-card/50 backdrop-blur-md rounded-[3rem] p-8 flex flex-col md:flex-row gap-10 items-center border border-border/50 shadow-xl shadow-black/5">
                  <div className="text-center flex-shrink-0">
                    <p className="text-7xl font-black text-foreground tracking-tighter">{rating.average.toFixed(1)}</p>
                    <div className="my-2 flex justify-center">
                      <StarDisplay value={rating.average} size="lg" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{rating.count} TOTAL ULASAN</p>
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    {starCounts.map(({ star, count }) => {
                      const pct = rating.count > 0 ? (count / rating.count) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-4 text-xs">
                          <span className="w-4 text-right font-black text-muted-foreground">{star}</span>
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                          <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" 
                            />
                          </div>
                          <span className="w-8 font-black text-muted-foreground opacity-60">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {reviews.map((review, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <ReviewCard review={review} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {showFloatingBar && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl"
          >
            <div className="bg-background/80 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-4 flex items-center justify-between shadow-[0_40px_80px_rgba(0,0,0,0.4)] ring-1 ring-black/5">
              <div className="flex items-center gap-4 pl-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border/50 flex-shrink-0">
                  <img src={product.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm font-black truncate tracking-tight">{product.name}</p>
                  <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">
                    {product.isFlashSale 
                      ? formatPrice(product.price * (1 - (product.discountPercent || 0) / 100))
                      : formatPrice(product.price)
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }} 
                  onClick={() => toggleWishlist(product)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                    isWishlisted 
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                      : "bg-muted/50 text-foreground hover:bg-red-500/10 hover:text-red-500"
                  }`}
                >
                  <Heart className={`h-6 w-6 ${isWishlisted ? "fill-current" : ""}`} />
                </motion.button>
                <Button 
                  size="lg" 
                  disabled={product.stock <= 0}
                  className={`rounded-[1.5rem] font-black px-10 h-14 shadow-2xl transition-all text-base ${
                    product.stock > 0 
                      ? "bg-gradient-to-r from-primary to-orange-600 text-white shadow-primary/30" 
                      : "bg-muted text-muted-foreground shadow-none cursor-not-allowed hover:bg-muted"
                  }`}
                  onClick={handleAddToCart}
                >
                  {product.stock > 0 ? "Tambah Ke Keranjang" : "Stok Habis"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seller Info Modal */}
      <AnimatePresence>
        {showSellerModal && sellerUser && (
          <SellerInfoModal 
            seller={sellerUser} 
            onClose={() => setShowSellerModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
