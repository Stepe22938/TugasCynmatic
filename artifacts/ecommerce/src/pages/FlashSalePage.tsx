/**
 * FlashSalePage.tsx
 * Halaman khusus untuk menampilkan produk yang sedang dalam masa Flash Sale.
 */
import React, { useState, useEffect } from "react";
import { Zap, Clock, TrendingDown, ShoppingCart, Star, ShieldCheck, Crown, Lock } from "lucide-react";
import { useProducts } from "../contexts/ProductsContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../hooks/use-toast";
import { formatPrice } from "../utils/formatPrice";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { useSultan } from "../contexts/MySultanContext";
import { useAuth } from "../contexts/AuthContext";

export function FlashSalePage() {
  const { allStoreProducts, decrementStock } = useProducts();
  const { isSultan, hasEarlyAccess } = useSultan();
  const { user } = useAuth();
  const { dispatch } = useCart();
  const { toast } = useToast();

  // Mock scheduled time for demonstration (30 mins from now)
  const scheduledTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const canAccessEarly = hasEarlyAccess(scheduledTime);

  const flashSaleProducts = allStoreProducts.filter(p => p.isFlashSale);
  const upcomingProducts = allStoreProducts.slice(0, 2); // Mock upcoming products

  const handleAddToCart = (p: any, isEarly = false) => {
    if (isEarly && !isSultan) {
      toast({ title: "Akses Terkunci", description: "Hanya anggota MySultan yang bisa akses early-bird.", variant: "destructive" });
      return;
    }
    if (p.stock <= 0) {
      toast({ title: "Stok Habis", description: "Produk ini sudah habis terjual.", variant: "destructive" });
      return;
    }

    const discount = p.discountPercent || 0;
    const finalPrice = p.price * (1 - discount / 100);

    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: p.id,
        name: p.name,
        price: finalPrice,
        image: p.image,
        sellerId: p.sellerId,
        sellerName: p.sellerName,
        stock: p.stock
      }
    });
    toast({ 
      title: isEarly ? "Early Access Berhasil!" : "Berhasil!", 
      description: `${p.name} ditambahkan ke keranjang.` 
    });
  };

  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Banner Flash Sale */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 p-8 md:p-12 text-white shadow-2xl mb-12">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 mb-4">
              <Zap className="h-4 w-4 fill-white text-white" />
              <span className="text-xs font-black uppercase tracking-widest">Penawaran Terbatas</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">
              FLASH SALE <br /> <span className="text-amber-300">GILA-GILAAN!</span>
            </h1>
            <p className="text-lg opacity-90 max-w-md font-medium">
              Dapatkan diskon hingga 90% untuk produk pilihan. Stok terbatas, siapa cepat dia dapat!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70">Berakhir Dalam</p>
            <div className="flex gap-4">
              {[
                { label: "JAM", value: timeLeft.hours },
                { label: "MENIT", value: timeLeft.minutes },
                { label: "DETIK", value: timeLeft.seconds }
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white text-orange-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black shadow-lg">
                    {t.value.toString().padStart(2, "0")}
                  </div>
                  <span className="text-[10px] font-black mt-2 opacity-80 tracking-widest">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sultan Early Access Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-3 rounded-2xl shadow-lg">
              <Crown className="h-6 w-6 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">Sultan Early Access</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Beli 30 Menit Lebih Awal</p>
            </div>
          </div>
          {isSultan ? (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> AKSES TERBUKA
            </div>
          ) : (
            <Link href="/mysultan">
              <Button variant="outline" className="rounded-full text-xs font-black border-amber-200 text-amber-700 hover:bg-amber-50">GABUNG SULTAN</Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          {upcomingProducts.map((p) => (
            <div key={p.id} className="relative group overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col sm:flex-row p-6 gap-6">
              {!isSultan && (
                <div className="absolute inset-0 z-10 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 p-4 rounded-3xl shadow-2xl text-center scale-90 group-hover:scale-100 transition-transform duration-500">
                    <Lock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-900">KHUSUS SULTAN</p>
                  </div>
                </div>
              )}
              
              <div className="w-full sm:w-48 h-48 rounded-[2rem] overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>

              <div className="flex-1 flex flex-col justify-between py-2">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Eksklusif</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Mulai dalam 30m
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2 line-clamp-1">{p.name}</h3>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-2xl font-black text-primary">{formatPrice(p.price * 0.5)}</span>
                    <span className="text-sm text-muted-foreground line-through opacity-50 mb-1">{formatPrice(p.price)}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => handleAddToCart(p, true)}
                  disabled={!isSultan}
                  className={`w-full rounded-2xl h-12 font-black tracking-widest transition-all duration-500 ${isSultan ? "shadow-lg shadow-primary/20" : "bg-slate-200 text-slate-400"}`}
                >
                  {isSultan ? "BELI SEKARANG" : "TERKUNCI"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid Produk */}
      {flashSaleProducts.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-[3rem] border-4 border-dashed border-muted">
          <TrendingDown className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-muted-foreground">Belum Ada Promo Aktif</h2>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Sabar ya! Seller sedang menyiapkan kejutan diskon besar untukmu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {flashSaleProducts.map((p) => {
            const discount = p.discountPercent || 0;
            const discountedPrice = p.price * (1 - discount / 100);
            
            return (
              <div key={p.id} className="group relative bg-card border-2 border-muted hover:border-orange-500 rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2">
                {/* Badge Diskon */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-lg shadow-red-600/30 flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4" />
                    -{discount}%
                  </div>
                  {p.sellerId === "admin-001" && (
                    <div className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                      Official
                    </div>
                  )}
                </div>

                {/* Gambar */}
                <div className="aspect-square overflow-hidden bg-muted">
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-md">
                      {p.category}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">4.9</span>
                    </div>
                  </div>

                  <h3 className="font-black text-xl mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {p.name}
                  </h3>

                  <div className="flex items-end gap-3 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground line-through font-bold">{formatPrice(p.price)}</p>
                      <p className="text-2xl font-black text-orange-600 tracking-tighter">{formatPrice(discountedPrice)}</p>
                    </div>
                    <div className={`mb-1 text-[10px] font-black uppercase ${p.stock <= 0 ? "text-red-500" : p.stock < 10 ? "text-orange-500 animate-pulse" : "text-emerald-500"}`}>
                      {p.stock <= 0 ? "Stok Habis!" : `Sisa ${p.stock} Stok!`}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>{p.stock > 0 ? "Tersedia" : "Habis"}</span>
                      <span>{p.stock < 10 && p.stock > 0 ? "Hampir Habis" : ""}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-1000`} 
                        style={{ width: `${Math.min(100, (p.stock / 50) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/product/${p.id}`} className="flex-1">
                      <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                        Detail
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => handleAddToCart(p)}
                      disabled={p.stock <= 0}
                      className={`flex-[2] h-12 rounded-xl font-black gap-2 transition-all ${
                        p.stock > 0 
                          ? "bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20" 
                          : "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
                      }`}
                    >
                      <Zap className={`h-4 w-4 ${p.stock > 0 ? "fill-white" : ""}`} /> 
                      {p.stock > 0 ? "BELI SEKARANG" : "HABIS TERJUAL"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: "Super Cepat", desc: "Produk langsung diproses dalam hitungan menit." },
          { icon: ShieldCheck, title: "100% Aman", desc: "Jaminan uang kembali jika barang tidak sampai." },
          { icon: Star, title: "Kualitas Premium", desc: "Hanya seller terverifikasi yang bisa ikut Flash Sale." }
        ].map((feat, i) => (
          <div key={i} className="flex items-center gap-4 p-6 rounded-3xl bg-muted/30 border border-muted">
            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
              <feat.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight">{feat.title}</h4>
              <p className="text-xs text-muted-foreground font-medium">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
