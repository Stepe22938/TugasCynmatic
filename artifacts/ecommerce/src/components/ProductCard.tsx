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
import { Star, ShoppingCart } from "lucide-react";
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
  const rating = allRatings[product.id];

  /**
   * Tambah ke keranjang tanpa navigasi.
   * stopPropagation() mencegah klik meneruskan ke Link di atasnya.
   */
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Jangan ikuti Link
    e.stopPropagation();
    dispatch({
      type: "ADD_ITEM",
      payload: { id: product.id, name: product.name, price: product.price, image: product.image },
    });
    toast({ title: "Berhasil ditambahkan", description: `${product.name} masuk ke keranjang!` });
  };

  return (
    /**
     * Seluruh kartu adalah Link ke halaman detail.
     * Klik di mana saja (kecuali tombol "Tambah") akan membuka detail produk.
     */
    <Link href={`/product/${product.id}`} data-testid={`card-product-${product.id}`}>
      <div className="group flex flex-col bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full">

        {/* Gambar produk */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badge kategori */}
          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold bg-white/90 text-foreground backdrop-blur-sm rounded-full shadow-sm">
            {product.category}
          </span>
          {/* Overlay "Lihat Detail" muncul saat hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full shadow">
              Lihat Detail
            </span>
          </div>
        </div>

        {/* Konten teks */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Rating — hanya muncul jika ada ulasan */}
          {rating && rating.count > 0 && (
            <div className="mb-1.5">
              <RatingBadge average={rating.average} count={rating.count} />
            </div>
          )}

          {/* Nama produk */}
          <h3 className="font-bold text-base text-foreground line-clamp-1 mb-1">
            {product.name}
          </h3>

          {/* Deskripsi singkat */}
          <p className="text-xs text-muted-foreground line-clamp-2 flex-grow mb-3">
            {product.description}
          </p>

          {/* Baris harga + tombol tambah */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t">
            <span className="font-bold text-base text-primary">{formatPrice(product.price)}</span>
            <Button
              onClick={handleAddToCart}
              data-testid={`button-add-to-cart-${product.id}`}
              size="sm"
              className="rounded-full shadow-sm text-xs px-3"
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1" />
              Tambah
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
