/**
 * HomePage.tsx
 * Halaman utama yang menampilkan daftar produk tersedia.
 *
 * Menampilkan:
 * - Banner hero dengan sapaan dan CTA
 * - Grid 4 produk (responsive: 1 kolom di mobile, 2 di tablet, 4 di desktop)
 * - Setiap produk menampilkan rating otomatis dari ulasan pembelian
 */
import React from "react";
import { ShoppingBag, Star, Truck, Shield } from "lucide-react";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";
import { useUser } from "@clerk/react";

/** Fitur unggulan yang ditampilkan di bawah hero */
const PERKS = [
  { icon: Truck, label: "Gratis Ongkir", desc: "Untuk pembelian pertama" },
  { icon: Shield, label: "Belanja Aman", desc: "Jaminan uang kembali" },
  { icon: Star, label: "Produk Terpilih", desc: "Kualitas terjamin" },
];

export function HomePage() {
  const { user } = useUser();

  // Ambil nama depan user untuk sapaan personal
  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-orange-50 border-b">
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row items-center gap-8">
          {/* Teks hero */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Toko Online Pilihan
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
              {firstName ? (
                <>Halo, <span className="text-primary">{firstName}!</span><br />Temukan Produk Terbaik</>
              ) : (
                <>Temukan Produk <span className="text-primary">Terbaik</span> untuk Anda</>
              )}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mb-6">
              Koleksi pilihan berkualitas dengan harga terjangkau. Belanja mudah, cepat, dan aman.
            </p>
            {/* Scroll ke produk */}
            <a
              href="#products"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-md hover:bg-primary/90 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Lihat Produk
            </a>
          </div>

          {/* Ilustrasi / dekorasi hero */}
          <div className="flex-shrink-0 hidden md:block">
            <div className="w-48 h-48 bg-primary/10 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-24 h-24 text-primary/40" strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* Perks strip */}
        <div className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto md:mx-0">
            {PERKS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
                <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center mb-1">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground hidden sm:block">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daftar Produk ───────────────────────────────────────────────── */}
      <section id="products" className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Koleksi Terbaru</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {products.length} produk tersedia untuk Anda
            </p>
          </div>
          {/* Badge "Baru" dekoratif */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Produk Terpilih
          </span>
        </div>

        {/* Grid produk — responsif */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          data-testid="product-grid"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
