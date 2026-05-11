/**
 * ProductCard.tsx
 * Kartu produk yang menampilkan gambar, nama, deskripsi, harga,
 * tombol tambah ke keranjang, dan rating bintang dari ulasan pembeli.
 *
 * Rating ditampilkan secara otomatis jika sudah ada ulasan dari
 * riwayat pesanan — kosong jika belum pernah dibeli/diulas.
 */
import React from "react";
import { Star, ShoppingCart } from "lucide-react";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../hooks/use-toast";
import { useProductRatings } from "../hooks/useProductRatings";
import { Button } from "./ui/button";

interface ProductProps {
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
  };
}

/**
 * Menampilkan bintang rating statis dengan rata-rata dan jumlah ulasan.
 * Hanya ditampilkan jika ada minimal 1 ulasan.
 */
function RatingDisplay({ average, count }: { average: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-2" data-testid="rating-display">
      {/* Bintang-bintang */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          // Tentukan seberapa "penuh" bintang ini (penuh, setengah, atau kosong)
          const fill = Math.min(1, Math.max(0, average - (star - 1)));
          return (
            <span key={star} className="relative inline-block w-3.5 h-3.5">
              {/* Bintang latar (abu-abu) */}
              <Star className="absolute inset-0 w-3.5 h-3.5 text-muted-foreground/30" />
              {/* Bintang kuning (clipped sesuai nilai fill) */}
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </span>
            </span>
          );
        })}
      </div>
      {/* Angka rata-rata dan jumlah ulasan */}
      <span className="text-xs text-muted-foreground font-medium">
        {average.toFixed(1)}{" "}
        <span className="font-normal">({count} ulasan)</span>
      </span>
    </div>
  );
}

export function ProductCard({ product }: ProductProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();

  // Ambil data rating untuk semua produk dari ulasan yang sudah ada
  const allRatings = useProductRatings();
  const rating = allRatings[product.id]; // undefined jika belum ada ulasan

  /** Tambahkan produk ini ke keranjang dan tampilkan notifikasi */
  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
    });
    toast({
      title: "Berhasil ditambahkan",
      description: `${product.name} masuk ke keranjang!`,
    });
  };

  return (
    <div
      className="group flex flex-col bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
      data-testid={`card-product-${product.id}`}
    >
      {/* Gambar produk dengan zoom saat hover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badge kategori */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-semibold bg-white/90 text-foreground backdrop-blur-sm rounded-full shadow-sm">
            {product.category}
          </span>
        </div>
      </div>

      {/* Konten kartu */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Rating — hanya tampil jika ada ulasan */}
        {rating && rating.count > 0 && (
          <RatingDisplay average={rating.average} count={rating.count} />
        )}

        <h3 className="font-bold text-base text-foreground line-clamp-1 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 flex-grow mb-3">
          {product.description}
        </p>

        {/* Harga dan tombol tambah */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t">
          <span className="font-bold text-base text-primary">
            {formatPrice(product.price)}
          </span>
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
  );
}
