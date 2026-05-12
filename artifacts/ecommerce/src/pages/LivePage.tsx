/**
 * LivePage.tsx
 * Halaman Live Shopping — mirip Shopee Live.
 * Simulasi stream, fake chat real-time, viewer count, dan produk pinned.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { Heart, Send, ShoppingCart, Eye, Zap, ArrowLeft, Radio, Package, Tag } from "lucide-react";
import { useLive } from "../contexts/LiveContext";
import { useProducts } from "../contexts/ProductsContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../hooks/use-toast";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";

// ─── Fake chat pool ───────────────────────────────────────────────────────────
const FAKE_CHATS = [
  { user: "Budi123",      msg: "keren banget produknya!" },
  { user: "SitiNurAyu",   msg: "berapa stoknya kak? 🙏" },
  { user: "Agus_shop",    msg: "bisa COD nggak?" },
  { user: "NinaXO",       msg: "udah beli kemarin, bagus banget!" },
  { user: "RioSantoso",   msg: "harganya worth it banget!" },
  { user: "DewiMawar",    msg: "ada diskon lagi ga kak?" },
  { user: "FahriKu",      msg: "mau 2 pcs dong 😍" },
  { user: "LindaS",       msg: "produknya ori kak?" },
  { user: "TokoFans99",   msg: "❤️❤️❤️ suka banget" },
  { user: "BuyerJkt",     msg: "ke Surabaya berapa hari?" },
  { user: "MilaShop",     msg: "udah add to cart!" },
  { user: "HendraK",      msg: "ini bagus buat hadiah ga?" },
  { user: "PutriAna",     msg: "waaaah murah banget 😱" },
  { user: "BangDodi",     msg: "bisa request produk lain?" },
  { user: "YuniIda",      msg: "packaging-nya rapih ga kak?" },
  { user: "SeptianR",     msg: "mantap jiwa 🔥🔥🔥" },
  { user: "CindyBear",    msg: "kak stok tinggal berapa?" },
  { user: "Wahyu_jual",   msg: "ini baru masuk stok ya kak?" },
  { user: "NovitaDS",     msg: "langsung beli ah, murah!" },
  { user: "ArifBudi",     msg: "voucher LIVE25 masih bisa?" },
  { user: "RahmaWati",    msg: "kak boleh tanya-tanya dulu?" },
  { user: "GunturM",      msg: "ini bisa kirim same day?" },
  { user: "IndriSari",    msg: "review bagus semua, gaspol!" },
  { user: "PriyoK",       msg: "tambah stoknya kak pleaseee 🥺" },
  { user: "TiaraShop",    msg: "sudah transfer, semangat kak!" },
  { user: "DannyBoy",     msg: "oke beli ah, udah lama incarin" },
  { user: "YuliaR",       msg: "lagi promo apa hari ini kak?" },
  { user: "SandiW",       msg: "ini sudah include bubble wrap?" },
  { user: "MegaP",        msg: "thanks sudah live kak! 🙌" },
  { user: "Faisal_K",     msg: "keren kak, lanjutkan!" },
];

interface ChatMessage {
  id: number;
  user: string;
  msg: string;
  color: string;
  isHeart?: boolean;
}

const USER_COLORS = [
  "text-pink-500", "text-blue-500", "text-purple-500",
  "text-emerald-500", "text-orange-500", "text-cyan-500", "text-rose-500",
];

function randomColor() { return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]; }

// ─── Floating heart animation ─────────────────────────────────────────────────
interface FloatingHeart { id: number; x: number; delay: number }

// ─── Component ────────────────────────────────────────────────────────────────
export function LivePage() {
  const { session } = useLive();
  const { allStoreProducts } = useProducts();
  const { dispatch } = useCart();
  const { toast } = useToast();

  const featuredProducts = allStoreProducts.filter((p) =>
    session.featuredProductIds.includes(p.id)
  );
  const displayProducts = featuredProducts.length > 0
    ? featuredProducts
    : allStoreProducts.slice(0, 6);

  // ── Rotating "stream" product ──────────────────────────────────────────────
  const [featIdx, setFeatIdx]           = useState(0);
  const [viewers, setViewers]           = useState(1247);
  const [chatMsgs, setChatMsgs]         = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const [hearts, setHearts]             = useState<FloatingHeart[]>([]);
  const [heartCount, setHeartCount]     = useState(0);
  const chatEndRef                       = useRef<HTMLDivElement>(null);
  const msgIdRef                         = useRef(0);
  const heartIdRef                       = useRef(0);

  // Rotate featured product every 6s
  useEffect(() => {
    if (displayProducts.length === 0) return;
    const t = setInterval(() => setFeatIdx((i) => (i + 1) % displayProducts.length), 6000);
    return () => clearInterval(t);
  }, [displayProducts.length]);

  // Fake viewer count fluctuates every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setViewers((v) => Math.max(500, v + Math.floor(Math.random() * 41) - 20));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Fake chat messages appear every 1.5–3.5s
  useEffect(() => {
    let shuffled = [...FAKE_CHATS].sort(() => Math.random() - 0.5);
    let idx = 0;
    function addNext() {
      const entry = shuffled[idx % shuffled.length];
      idx++;
      if (idx >= shuffled.length) shuffled = [...FAKE_CHATS].sort(() => Math.random() - 0.5);
      const id = ++msgIdRef.current;
      setChatMsgs((prev) => [...prev.slice(-60), { id, user: entry.user, msg: entry.msg, color: randomColor() }]);
      const delay = 1500 + Math.random() * 2000;
      timer = setTimeout(addNext, delay);
    }
    let timer = setTimeout(addNext, 800);
    return () => clearTimeout(timer);
  }, []);

  // Periodic floating hearts
  useEffect(() => {
    const t = setInterval(() => {
      const id = ++heartIdRef.current;
      setHearts((prev) => [...prev.slice(-8), { id, x: 30 + Math.random() * 40, delay: Math.random() * 0.5 }]);
      setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2500);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const id = ++msgIdRef.current;
    setChatMsgs((prev) => [...prev.slice(-60), {
      id, user: "Kamu", msg: chatInput.trim(), color: "text-orange-500",
    }]);
    setChatInput("");
  }, [chatInput]);

  const sendHeart = useCallback(() => {
    setHeartCount((c) => c + 1);
    const id = ++heartIdRef.current;
    setHearts((prev) => [...prev.slice(-8), { id, x: 35 + Math.random() * 30, delay: 0 }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2500);
  }, []);

  const addToCart = useCallback((product: typeof displayProducts[0]) => {
    dispatch({ type: "ADD_ITEM", payload: { id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock } });
    toast({ title: "Ditambahkan!", description: `${product.name} masuk keranjang` });
  }, [dispatch, toast]);

  const currentProduct = displayProducts[featIdx];

  // ── Not live fallback ──────────────────────────────────────────────────────
  if (!session.isLive) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Belum Ada Live</h2>
          <p className="text-muted-foreground mb-6">
            Saat ini tidak ada sesi live yang sedang berlangsung.<br />
            Pantau terus untuk penawaran terbatas!
          </p>
          <Link href="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Kembali Belanja</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
            LIVE
          </span>
          <span className="text-white/80 text-sm font-semibold truncate max-w-[180px]">{session.title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/70 text-sm">
          <Eye className="h-4 w-4" />
          <span className="font-mono font-semibold">{viewers.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-52px)]">

        {/* ── LEFT: Stream + Products ── */}
        <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden">

          {/* Stream area */}
          <div className="relative bg-gradient-to-br from-orange-600 via-rose-600 to-purple-700 overflow-hidden"
               style={{ minHeight: "320px", maxHeight: "420px" }}>

            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Host info */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-white text-xs font-semibold drop-shadow">{session.hostName}</span>
            </div>

            {/* LIVE badge top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
              <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-ping" />
              LIVE
            </div>

            {/* Current product showcase */}
            {currentProduct && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl mb-3 bg-white/10">
                  <img src={currentProduct.image} alt={currentProduct.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-white font-bold text-sm sm:text-base drop-shadow-lg max-w-xs truncate">{currentProduct.name}</p>
                <p className="text-yellow-300 font-extrabold text-lg drop-shadow-lg mt-1">{formatPrice(currentProduct.price)}</p>
              </div>
            )}

            {/* Floating hearts */}
            <div className="absolute bottom-4 right-4 pointer-events-none">
              {hearts.map((h) => (
                <div key={h.id}
                  className="absolute bottom-0 text-red-400 animate-bounce"
                  style={{ right: `${h.x}%`, animationDuration: "0.6s", animationDelay: `${h.delay}s`,
                           transition: "opacity 2s", fontSize: "1.2rem" }}>
                  ❤️
                </div>
              ))}
            </div>

            {/* Product counter dots */}
            {displayProducts.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {displayProducts.map((_, i) => (
                  <button key={i} onClick={() => setFeatIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === featIdx ? "bg-white w-5" : "bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Voucher live hint */}
          <div className="bg-orange-500/10 border-y border-orange-500/20 px-4 py-2 flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
            <p className="text-xs text-orange-700 font-medium">
              Gunakan kode <strong className="font-bold tracking-wider">LIVE25</strong> saat checkout untuk diskon 25%!
            </p>
          </div>

          {/* Featured products grid */}
          <div className="p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-orange-500" />
              <h3 className="font-bold text-white text-sm">Produk di Live Ini</h3>
              <span className="text-xs text-white/40">({displayProducts.length} produk)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {displayProducts.map((product, i) => (
                <div key={product.id}
                  className={`bg-gray-800 rounded-xl overflow-hidden border transition-all ${i === featIdx ? "border-orange-500 shadow-lg shadow-orange-500/20" : "border-white/10"}`}>
                  <div className="relative">
                    <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
                    {i === featIdx && (
                      <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full animate-ping" />LIVE
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-white text-xs font-medium leading-tight line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-orange-400 font-bold text-sm">{formatPrice(product.price)}</p>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <ShoppingCart className="h-3 w-3" />Beli
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Chat ── */}
        <div className="lg:w-80 xl:w-96 flex flex-col bg-gray-900 border-t lg:border-t-0 lg:border-l border-white/10"
             style={{ height: "400px", maxHeight: "400px", flexShrink: 0 }}
             id="chat-panel">

          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-semibold">Chat Live</span>
            </div>
            <button onClick={sendHeart}
              className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors text-xs">
              <Heart className="h-4 w-4 fill-current" />
              <span className="font-mono">{(heartCount + 128).toLocaleString("id-ID")}</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
            {chatMsgs.map((m) => (
              <div key={m.id} className="flex items-baseline gap-1.5 text-xs">
                <span className={`font-bold flex-shrink-0 ${m.color}`}>{m.user}</span>
                <span className="text-white/80 leading-relaxed">{m.msg}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-3 py-3 border-t border-white/10 flex gap-2 flex-shrink-0">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Tulis pesan..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={sendChat}
              className="w-9 h-9 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
