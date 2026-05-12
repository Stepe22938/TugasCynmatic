/**
 * HomePage.tsx
 * Halaman utama dengan search engine + filter kategori.
 */
import React, { useState, useMemo } from "react";
import { ShoppingBag, Star, Truck, Shield, Search, X } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductsContext";

const PERKS = [
  { icon: Truck,  label: "Gratis Ongkir",  desc: "Untuk pembelian pertama" },
  { icon: Shield, label: "Belanja Aman",    desc: "Jaminan uang kembali" },
  { icon: Star,   label: "Produk Terpilih", desc: "Kualitas terjamin" },
];

export function HomePage() {
  const { user } = useAuth();
  const { allStoreProducts } = useProducts();

  const [query, setQuery]       = useState("");
  const [activeCategory, setCategory] = useState("Semua");

  // Kumpulkan kategori unik dari semua produk
  const categories = useMemo(() => {
    const cats = ["Semua", ...Array.from(new Set(allStoreProducts.map((p) => p.category)))];
    return cats;
  }, [allStoreProducts]);

  // Filter produk berdasarkan query dan kategori
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allStoreProducts.filter((p) => {
      const matchCat = activeCategory === "Semua" || p.category === activeCategory;
      const matchQ   = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [allStoreProducts, query, activeCategory]);

  const firstName = user?.name?.split(" ")[0] ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-orange-50 border-b">
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Toko Online Pilihan</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
              {firstName
                ? <><span>Halo, </span><span className="text-primary">{firstName}!</span><br />Temukan Produk Terbaik</>
                : <>Temukan Produk <span className="text-primary">Terbaik</span> untuk Anda</>}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mb-6">
              Koleksi pilihan berkualitas dengan harga terjangkau. Belanja mudah, cepat, dan aman.
            </p>
            <a href="#products"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-md hover:bg-primary/90 transition-colors">
              <ShoppingBag className="h-4 w-4" />Lihat Produk
            </a>
          </div>
          <div className="flex-shrink-0 hidden md:block">
            <div className="w-48 h-48 bg-primary/10 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-24 h-24 text-primary/40" strokeWidth={1} />
            </div>
          </div>
        </div>

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

      {/* Produk + Search */}
      <section id="products" className="container mx-auto px-4 py-10">
        {/* Search bar */}
        <div className="relative mb-5 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, kategori…"
            data-testid="input-search"
            className="w-full h-11 pl-10 pr-10 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter kategori */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Header jumlah produk */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Koleksi Terbaru</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {filtered.length} produk{query || activeCategory !== "Semua" ? ` ditemukan` : " tersedia"}
            </p>
          </div>
          {!query && activeCategory === "Semua" && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Produk Terpilih
            </span>
          )}
        </div>

        {/* Grid produk */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Produk tidak ditemukan</p>
            <p className="text-sm mt-1">Coba kata kunci lain atau ubah filter kategori.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="product-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
