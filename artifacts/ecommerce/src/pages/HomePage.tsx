/**
 * HomePage.tsx
 * Halaman utama: live banner, search, filter kategori, filter harga, dan sort produk.
 */
import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star, Truck, Shield, Search, X, SlidersHorizontal, ChevronDown, Radio, Eye, Zap } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductsContext";
import { useLive } from "../contexts/LiveContext";

const PERKS = [
  { icon: Truck,  label: "Gratis Ongkir",  desc: "Untuk pembelian pertama" },
  { icon: Shield, label: "Belanja Aman",    desc: "Jaminan uang kembali" },
  { icon: Star,   label: "Produk Terpilih", desc: "Kualitas terjamin" },
];

type SortKey = "newest" | "price_asc" | "price_desc" | "name_asc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",     label: "Terbaru" },
  { key: "price_asc",  label: "Harga Terendah" },
  { key: "price_desc", label: "Harga Tertinggi" },
  { key: "name_asc",   label: "Nama A–Z" },
];

type PriceRange = "all" | "u100" | "100to300" | "300to500" | "o500";
const PRICE_RANGES: { key: PriceRange; label: string; min: number; max: number }[] = [
  { key: "all",      label: "Semua Harga", min: 0,      max: Infinity },
  { key: "u100",     label: "< 100rb",     min: 0,      max: 100000 },
  { key: "100to300", label: "100–300rb",   min: 100000, max: 300000 },
  { key: "300to500", label: "300–500rb",   min: 300000, max: 500000 },
  { key: "o500",     label: "> 500rb",     min: 500000, max: Infinity },
];

export function HomePage() {
  const { user } = useAuth();
  const { allStoreProducts } = useProducts();
  const { session } = useLive();

  const [query,          setQuery]          = useState("");
  const [activeCategory, setCategory]       = useState("Semua");
  const [priceRange,     setPriceRange]     = useState<PriceRange>("all");
  const [sort,           setSort]           = useState<SortKey>("newest");
  const [showFilters,    setShowFilters]    = useState(false);

  const categories = useMemo(() => {
    const cats = ["Semua", ...Array.from(new Set(allStoreProducts.map((p) => p.category)))];
    return cats;
  }, [allStoreProducts]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const pr = PRICE_RANGES.find((r) => r.key === priceRange)!;

    let result = allStoreProducts.filter((p) => {
      const matchCat   = activeCategory === "Semua" || p.category === activeCategory;
      const matchQ     = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchPrice = p.price >= pr.min && p.price < pr.max;
      return matchCat && matchQ && matchPrice;
    });

    switch (sort) {
      case "price_asc":  result = [...result].sort((a, b) => a.price - b.price); break;
      case "price_desc": result = [...result].sort((a, b) => b.price - a.price); break;
      case "name_asc":   result = [...result].sort((a, b) => a.name.localeCompare(b.name, "id")); break;
      default:           result = [...result].reverse(); break;
    }

    return result;
  }, [allStoreProducts, query, activeCategory, priceRange, sort]);

  const firstName = user?.name?.split(" ")[0] ?? null;
  const isFiltering = query || activeCategory !== "Semua" || priceRange !== "all" || sort !== "newest";

  const clearAll = () => {
    setQuery(""); setCategory("Semua"); setPriceRange("all"); setSort("newest");
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Live Banner — shown when live is active ─────────────────────── */}
      {session.isLive && (
        <Link href="/live">
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 text-white px-4 py-3 cursor-pointer hover:from-red-700 hover:to-orange-600 transition-all">
            <div className="container mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full flex-shrink-0">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <span className="text-xs font-extrabold tracking-widest">LIVE</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{session.title}</p>
                  <p className="text-[11px] text-white/80">oleh {session.hostName} · Klik untuk bergabung</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 text-white/90 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="font-semibold font-mono">1.2rb+ penonton</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-full">
                  <Zap className="h-3 w-3" />Tonton Sekarang
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

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
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <a href="#products"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-md hover:bg-primary/90 transition-colors">
                <ShoppingBag className="h-4 w-4" />Lihat Produk
              </a>
              <Link href="/live">
                <button className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border-2 transition-colors ${
                  session.isLive
                    ? "bg-red-600 border-red-600 text-white hover:bg-red-700"
                    : "border-primary/40 text-primary hover:bg-primary/5"
                }`}>
                  <Radio className="h-4 w-4" />
                  {session.isLive ? "Tonton Live" : "Live Shopping"}
                </button>
              </Link>
            </div>
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

      {/* Produk + Filter */}
      <section id="products" className="container mx-auto px-4 py-10">

        {/* ── Search + Filter toggle row ─────────────────────────────── */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xl">
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

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-semibold transition-all ${
              showFilters || priceRange !== "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input text-muted-foreground hover:border-primary/50"
            }`}>
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
            {priceRange !== "all" && (
              <span className="w-5 h-5 rounded-full bg-white/30 text-[10px] font-bold flex items-center justify-center">1</span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 pl-4 pr-8 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer text-foreground"
            >
              {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* ── Expanded filter panel ──────────────────────────────────── */}
        {showFilters && (
          <div className="bg-card border rounded-2xl p-4 mb-4 space-y-4 shadow-sm">
            {/* Kategori */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Kategori</p>
              <div className="flex gap-2 flex-wrap">
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
            </div>

            {/* Range Harga */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Rentang Harga</p>
              <div className="flex gap-2 flex-wrap">
                {PRICE_RANGES.map((pr) => (
                  <button key={pr.key} onClick={() => setPriceRange(pr.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      priceRange === pr.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                    }`}>
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Category pills (always visible when filter panel is closed) */}
        {!showFilters && (
          <div className="flex gap-2 flex-wrap mb-4">
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
        )}

        {/* ── Active filter chips ────────────────────────────────────── */}
        {isFiltering && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs text-muted-foreground font-medium">Filter aktif:</span>
            {activeCategory !== "Semua" && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                {activeCategory}
                <button onClick={() => setCategory("Semua")} className="ml-0.5 hover:text-primary/70"><X className="h-3 w-3" /></button>
              </span>
            )}
            {priceRange !== "all" && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                {PRICE_RANGES.find((r) => r.key === priceRange)?.label}
                <button onClick={() => setPriceRange("all")} className="ml-0.5 hover:text-primary/70"><X className="h-3 w-3" /></button>
              </span>
            )}
            {query && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                "{query}"
                <button onClick={() => setQuery("")} className="ml-0.5 hover:text-primary/70"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1">
              Reset semua
            </button>
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Koleksi Terbaru</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {filtered.length} produk{isFiltering ? " ditemukan" : " tersedia"}
            </p>
          </div>
          {!isFiltering && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Produk Terpilih
            </span>
          )}
        </div>

        {/* ── Grid produk ────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Produk tidak ditemukan</p>
            <p className="text-sm mt-1">Coba kata kunci lain atau ubah filter.</p>
            <button onClick={clearAll} className="mt-4 text-sm text-primary underline underline-offset-2">
              Reset semua filter
            </button>
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
