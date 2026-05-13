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
import { useParams, Link } from "wouter";
import {
  ArrowLeft, ShoppingCart, Star, CheckCircle2, AlertCircle, Video, Package, Store,
} from "lucide-react";
import { getProductById } from "../data/products";
import { useProducts } from "../contexts/ProductsContext";
import { useCart } from "../contexts/CartContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useProductRatings } from "../hooks/useProductRatings";
import { AIProductChecker } from "../components/AIProductChecker";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

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
  const product = getProductById(productId) ?? allStoreProducts.find((p) => p.id === productId);

  const { dispatch } = useCart();
  const { toast }    = useToast();
  const { getProductReviews } = useOrderHistory();
  const allRatings = useProductRatings();

  const [activeImage, setActiveImage] = useState(0);

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

  const handleAddToCart = () => {
    dispatch({ 
      type: "ADD_ITEM", 
      payload: { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        image: product.image,
        sellerId: product.sellerId,
        sellerName: product.sellerName
      } 
    });
    toast({ title: "Berhasil!", description: `${product.name} ditambahkan ke keranjang.` });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">

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
          <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
            {product.category}
          </span>

          {/* Nama produk */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
            {product.name}
          </h1>

          {/* Nama seller */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            <span>Dijual oleh <span className="font-semibold text-foreground">{product.sellerName}</span></span>
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
          <p className="text-3xl font-extrabold text-primary" data-testid="text-product-price">
            {formatPrice(product.price)}
          </p>

          {/* Deskripsi */}
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            {product.longDescription}
          </p>

          {/* Tombol tambah ke keranjang */}
          <Button size="lg" className="w-full sm:w-auto px-8 h-12 text-base font-semibold"
            onClick={handleAddToCart} data-testid={`button-add-to-cart-${product.id}`}>
            <ShoppingCart className="h-5 w-5 mr-2" />Tambah ke Keranjang
          </Button>

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
      <div className="border-t pt-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
          Ulasan Pembeli
          {reviews.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">({reviews.length} ulasan)</span>
          )}
        </h2>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
            <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">Belum Ada Ulasan</p>
            <p className="text-sm text-muted-foreground mt-1">Beli produk ini dan jadilah yang pertama memberikan ulasan!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Distribusi bintang */}
            {rating && (
              <div className="bg-muted/30 rounded-2xl p-5 flex flex-col sm:flex-row gap-6 items-center sm:items-start border">
                <div className="text-center flex-shrink-0">
                  <p className="text-5xl font-extrabold text-foreground">{rating.average.toFixed(1)}</p>
                  <StarDisplay value={rating.average} size="md" />
                  <p className="text-xs text-muted-foreground mt-1">{rating.count} ulasan</p>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  {starCounts.map(({ star, count }) => {
                    const pct = rating.count > 0 ? (count / rating.count) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-right text-muted-foreground">{star}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                        <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {reviews.map((review, i) => <ReviewCard key={i} review={review} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
