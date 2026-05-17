/**
 * HomePage.tsx
 * Premium Landing Experience - High-end Aesthetics.
 */
import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star, Truck, Shield, ShieldCheck, Package, Search, X, SlidersHorizontal, ChevronDown, Radio, Eye, Zap, Sparkles, Trophy, Target, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "../components/ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductsContext";
import { useLive } from "../contexts/LiveContext";

const PERKS = [
  { icon: Award,  label: "Authentic Luxury",  desc: "100% Produk Original" },
  { icon: Target, label: "Precision Delivery", desc: "Pengiriman Cepat & Tepat" },
  { icon: Trophy, label: "Top-Tier Support",   desc: "Layanan Bantuan 24/7" },
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
    return ["Semua", ...Array.from(new Set(allStoreProducts.map((p) => p.category)))];
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

  return (
    <div className="min-h-screen bg-background">
      
      {/* ── High-End Hero Section ─────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center pt-6 overflow-hidden border-b border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/20 via-background to-background">
        
        {/* Animated Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/10 blur-[150px] rounded-full -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full translate-y-1/2" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="flex-1 text-center lg:text-left space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl mb-8">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/80">Ecosystem VPS v2.0</span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase italic italic-shadow">
                  {firstName ? (
                    <>Welcome Back, <br/><span className="text-gradient">{firstName}.</span></>
                  ) : (
                    <>Elevate Your <br/><span className="text-gradient">Style.</span></>
                  )}
                </h1>
                
                <p className="text-xl text-muted-foreground font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed opacity-70">
                  Temukan koleksi eksklusif yang dirancang khusus untuk Anda. Keamanan transaksi terjamin oleh sistem VPS MariaDB tercanggih.
                </p>

                <div className="flex flex-wrap gap-5 justify-center lg:justify-start pt-6">
                  <motion.a 
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    href="#products"
                    className="h-16 px-10 bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-[0_20px_50px_-15px_rgba(249,115,22,0.5)]"
                  >
                    <ShoppingBag className="h-5 w-5" /> Start Shopping
                  </motion.a>
                  
                  <Link href="/auctions">
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-16 px-10 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all"
                    >
                      <Trophy className="h-5 w-5 text-orange-500" /> Join Auction
                    </motion.button>
                  </Link>
                </div>
              </motion.div>

              {/* Perks Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-white/5">
                {PERKS.map((p, i) => (
                  <motion.div 
                    key={p.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex flex-col items-center lg:items-start gap-2"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">{p.label}</p>
                    <p className="text-xs text-muted-foreground font-bold">{p.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Visual Element */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="flex-1 relative hidden lg:block"
            >
              <div className="relative w-full aspect-square max-w-[500px] mx-auto">
                {/* Floating Glass Card */}
                <motion.div 
                  animate={{ y: [0, -30, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 glass-card rounded-[4rem] shadow-2xl p-12 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-20 h-20 rounded-[2rem] bg-orange-600/20 flex items-center justify-center border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                      <ShieldCheck className="h-10 w-10 text-orange-500" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Platform Status</p>
                      <p className="text-2xl font-black text-emerald-500 tracking-tighter">SECURE VPS</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 2, delay: 1 }}
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-700" 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">System Sync</p>
                      <p className="text-xs font-black text-orange-500">85% REAL-TIME</p>
                    </div>
                  </div>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-600/20 blur-3xl rounded-full animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Products Section ────────────────────────────────────────── */}
      <section id="products" className="container mx-auto px-6 py-24">
        
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <h2 className="text-5xl font-black tracking-tighter uppercase italic">The Collection</h2>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="w-8 h-px bg-orange-500/50" />
              Showing {filtered.length} curated products
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search elite items..."
                className="w-64 h-14 pl-12 pr-6 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-14 px-6 rounded-2xl border transition-all flex items-center gap-3 text-sm font-bold ${
                showFilters ? "bg-orange-600 border-orange-600 text-white" : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setCategory(c)}
                        className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                          activeCategory === c ? "bg-orange-600 text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Price Range</p>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map(r => (
                      <button 
                        key={r.key} 
                        onClick={() => setPriceRange(r.key)}
                        className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                          priceRange === r.key ? "bg-orange-600 text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/5">
            <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
            <p className="text-2xl font-black tracking-tighter uppercase italic opacity-50">No items found in our vault</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {filtered.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
