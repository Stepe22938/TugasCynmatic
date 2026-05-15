/**
 * HomePage.tsx
 * Halaman utama: live banner, search, filter kategori, filter harga, dan sort produk.
 */
import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star, Truck, Shield, Search, X, SlidersHorizontal, ChevronDown, Radio, Eye, Zap, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const { activeSessions } = useLive();
  const liveCount = activeSessions.length;
  const mainLive = activeSessions[0];

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
      {liveCount > 0 && (
        <Link href="/live">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 text-white px-4 py-3 cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="container mx-auto flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full flex-shrink-0 border border-white/20">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <span className="text-[10px] font-black tracking-[0.2em]">LIVE</span>
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm truncate tracking-tight">{mainLive.title}</p>
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-0.5">
                    {liveCount > 1 ? `+${liveCount - 1} Siaran Lainnya` : `oleh ${mainLive.hostName}`} · Gabung Sekarang
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 text-white/90 text-[10px] font-black uppercase bg-black/20 px-3 py-1 rounded-full">
                  <Eye className="h-3 w-3" />
                  <span>Sedang Ramai</span>
                </div>
                <Zap className="h-5 w-5 text-yellow-300 animate-pulse" />
              </div>
            </div>
          </motion.div>
        </Link>
      )}
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-orange-50/30 dark:to-orange-950/20 border-b">
        {/* Animated Background Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[30%] h-[50%] bg-primary/5 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            x: [0, -50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[50%] bg-orange-500/5 blur-[120px] rounded-full"
        />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 border border-primary/20">
                  <Sparkles className="h-3 w-3" /> Edisi Terbatas 2026
                </span>
                <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[1.1] mb-6 tracking-tighter">
                  {firstName
                    ? <>Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">{firstName}!</span><br />Waktunya Belanja.</>
                    : <>Gaya Hidup <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">Premium</span><br />Mulai dari Sini.</>}
                </h1>
                <p className="text-muted-foreground text-xl max-w-lg mb-8 leading-relaxed opacity-80 font-medium">
                  Koleksi pilihan berkualitas dengan standar internasional. Belanja cerdas, cepat, dan 100% terjamin aman.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <motion.a 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    href="#products"
                    className="inline-flex items-center gap-3 bg-gradient-to-br from-primary to-orange-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-primary/30 transition-all hover:shadow-primary/50"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Mulai Belanja
                  </motion.a>
                  <Link href="/live">
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black border-2 transition-all ${
                        liveCount > 0
                          ? "bg-red-600 border-red-600 text-white shadow-xl shadow-red-600/30"
                          : "border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <Radio className={`h-5 w-5 ${liveCount > 0 ? 'animate-pulse' : ''}`} />
                      {liveCount > 0 ? "Tonton Live Sekarang" : "Jadwal Live"}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="flex-shrink-0 hidden lg:block"
            >
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-[3rem] rotate-12 absolute inset-0 blur-2xl" />
                <div className="w-80 h-80 bg-card border border-white/20 rounded-[3rem] flex items-center justify-center shadow-2xl relative z-10 backdrop-blur-md">
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ShoppingBag className="w-40 h-40 text-primary opacity-20" strokeWidth={0.5} />
                  </motion.div>
                  <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-border/50 animate-bounce duration-[3000ms]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                        <Zap className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stok Ready</p>
                        <p className="text-sm font-black">99+ Produk</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PERKS.map(({ icon: Icon, label, desc }, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  key={label} 
                  className="flex items-center gap-4 group p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-primary/10 shadow-lg shadow-primary/5">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground tracking-tight">{label}</p>
                    <p className="text-xs text-muted-foreground font-medium">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
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
          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setCategory(cat)}
                className={`relative px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat
                    ? "text-white"
                    : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                }`}
              >
                <span className="relative z-10">{cat}</span>
                {activeCategory === cat && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-orange-600 rounded-2xl shadow-lg shadow-primary/20 z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 border-2 border-dashed border-border/50 rounded-[3rem] bg-muted/10"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground opacity-30" />
            </div>
            <p className="font-black text-xl tracking-tight">Ups! Tidak Ada Hasil</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto opacity-70">
              Kami tidak bisa menemukan produk yang cocok dengan pencarian atau filter kamu.
            </p>
            <button 
              onClick={clearAll} 
              className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-full text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Reset Semua Filter
            </button>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8" 
            data-testid="product-grid"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product, idx) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ 
                    duration: 0.5, 
                    delay: idx * 0.05,
                    type: "spring",
                    stiffness: 260,
                    damping: 20 
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}
