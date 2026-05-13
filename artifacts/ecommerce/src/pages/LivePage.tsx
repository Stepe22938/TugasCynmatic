/**
 * LivePage.tsx
 * Halaman Live Shopping — viewer mode.
 * Fitur: kamera/etalase toggle (seller), chat palsu, gift system, produk scroll.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { Heart, Send, ShoppingCart, Eye, Zap, ArrowLeft, Radio, Package, Tag, Gift } from "lucide-react";
import { useLive, GIFT_TYPES, GiftEvent } from "../contexts/LiveContext";
import { useProducts } from "../contexts/ProductsContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { formatPrice } from "../utils/formatPrice";

// ─── Fake chat pool ───────────────────────────────────────────────────────────
const FAKE_CHATS = [
  { user: "Budi123",    msg: "keren banget produknya!" },
  { user: "SitiAyu",   msg: "berapa stoknya kak? 🙏" },
  { user: "Agus_shop", msg: "bisa COD nggak?" },
  { user: "NinaXO",    msg: "udah beli kemarin, bagus banget!" },
  { user: "RioS",      msg: "harganya worth it banget!" },
  { user: "DewiM",     msg: "ada diskon lagi ga kak?" },
  { user: "FahriK",    msg: "mau 2 pcs dong 😍" },
  { user: "LindaS",    msg: "produknya ori kak?" },
  { user: "TokoFan99", msg: "❤️❤️❤️ suka banget" },
  { user: "BuyerJkt",  msg: "ke Surabaya berapa hari?" },
  { user: "MilaShop",  msg: "udah add to cart!" },
  { user: "HendraK",   msg: "ini bagus buat hadiah ga?" },
  { user: "PutriA",    msg: "waaaah murah banget 😱" },
  { user: "BangDodi",  msg: "bisa request produk lain?" },
  { user: "YuniIda",   msg: "packaging-nya rapih ga kak?" },
  { user: "SeptianR",  msg: "mantap jiwa 🔥🔥🔥" },
  { user: "CindyBear", msg: "kak stok tinggal berapa?" },
  { user: "ArifBudi",  msg: "voucher LIVE25 masih bisa?" },
  { user: "RahmaW",    msg: "kak boleh tanya-tanya dulu?" },
  { user: "GunturM",   msg: "ini bisa kirim same day?" },
  { user: "IndriS",    msg: "review bagus semua, gaspol!" },
  { user: "PriyoK",    msg: "tambah stoknya kak pleaseee 🥺" },
  { user: "TiaraS",    msg: "sudah transfer, semangat kak!" },
  { user: "DannyBoy",  msg: "oke beli ah, udah lama incarin" },
  { user: "YuliaR",    msg: "lagi promo apa hari ini kak?" },
  { user: "SandiW",    msg: "ini sudah include bubble wrap?" },
  { user: "MegaP",     msg: "thanks sudah live kak! 🙌" },
  { user: "Faisal_K",  msg: "keren kak, lanjutkan!" },
  { user: "AndiW",     msg: "mantap banget sih ini" },
  { user: "BonitaR",   msg: "kirim mawar buat host! 🌹" },
];

interface ChatMessage { id: number; user: string; msg: string; color: string; isGift?: boolean; }
const USER_COLORS = ["text-pink-500","text-blue-500","text-purple-500","text-emerald-500","text-orange-500","text-cyan-500","text-rose-500"];
function randomColor() { return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]; }

// ─── Floating gift component ──────────────────────────────────────────────────
function FloatingGiftAnim({ gift, onDone }: { gift: GiftEvent; onDone: () => void }) {
  const giftType = GIFT_TYPES.find((g) => g.id === gift.giftId);
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="absolute bottom-8 pointer-events-none z-20 animate-bounce"
      style={{ right: `${gift.x}%`, fontSize: "2rem", animationDuration: "0.5s" }}>
      {giftType?.emoji ?? "🎁"}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function LivePage() {
  const { session, gifts, totalPoints, sendGift, clearGift } = useLive();
  const { allStoreProducts } = useProducts();
  const { dispatch } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const featuredProducts = allStoreProducts.filter((p) =>
    session.featuredProductIds.includes(p.id)
  );
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : allStoreProducts.slice(0, 8);

  const [featIdx, setFeatIdx]         = useState(0);
  const [viewers, setViewers]         = useState(1247);
  const [chatMsgs, setChatMsgs]       = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]     = useState("");
  const [showGifts, setShowGifts]     = useState(false);
  const chatEndRef                     = useRef<HTMLDivElement>(null);
  const msgIdRef                       = useRef(0);

  // Rotate featured product every 6s
  useEffect(() => {
    if (displayProducts.length === 0) return;
    const t = setInterval(() => setFeatIdx((i) => (i + 1) % displayProducts.length), 6000);
    return () => clearInterval(t);
  }, [displayProducts.length]);

  // Viewer count fluctuates
  useEffect(() => {
    const t = setInterval(() => setViewers((v) => Math.max(500, v + Math.floor(Math.random() * 41) - 20)), 5000);
    return () => clearInterval(t);
  }, []);

  // Fake chat
  useEffect(() => {
    let shuffled = [...FAKE_CHATS].sort(() => Math.random() - 0.5);
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    function addNext() {
      const entry = shuffled[idx % shuffled.length];
      idx++;
      if (idx >= shuffled.length) shuffled = [...FAKE_CHATS].sort(() => Math.random() - 0.5);
      const id = ++msgIdRef.current;
      setChatMsgs((prev) => [...prev.slice(-60), { id, user: entry.user, msg: entry.msg, color: randomColor() }]);
      timer = setTimeout(addNext, 1500 + Math.random() * 2000);
    }
    timer = setTimeout(addNext, 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  // Gift chat announcements
  useEffect(() => {
    gifts.forEach((g) => {
      const giftType = GIFT_TYPES.find((t) => t.id === g.giftId);
      const id = ++msgIdRef.current;
      setChatMsgs((prev) => {
        if (prev.some((m) => m.id === id)) return prev;
        return [...prev.slice(-60), {
          id, user: g.senderName,
          msg: `mengirim ${giftType?.emoji} ${giftType?.label}!`,
          color: giftType?.color ?? "text-pink-500",
          isGift: true,
        }];
      });
    });
  }, [gifts]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const id = ++msgIdRef.current;
    setChatMsgs((prev) => [...prev.slice(-60), { id, user: "Kamu", msg: chatInput.trim(), color: "text-orange-500" }]);
    setChatInput("");
  }, [chatInput]);

  const handleSendGift = useCallback((giftId: string) => {
    sendGift(giftId, user?.name ?? "Penonton");
    const giftType = GIFT_TYPES.find((g) => g.id === giftId);
    toast({ title: `${giftType?.emoji} ${giftType?.label} terkirim!`, description: `+${giftType?.points} poin` });
    setShowGifts(false);
  }, [sendGift, user, toast]);

  const addToCart = useCallback((product: typeof displayProducts[0]) => {
    dispatch({ type: "ADD_ITEM", payload: { id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock } });
    toast({ title: "Ditambahkan!", description: `${product.name} masuk keranjang` });
  }, [dispatch, toast]);

  const currentProduct = displayProducts[featIdx];

  // ── Not live fallback ──────────────────────────────────────────────────────
  if (!session.isLive) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-950">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="h-10 w-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Belum Ada Live</h2>
          <p className="text-gray-400 mb-6">
            Tidak ada sesi live yang sedang berlangsung.<br />
            Seller bisa memulai live dari Dashboard Seller.
          </p>
          <Link href="/">
            <button className="flex items-center gap-2 mx-auto bg-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />Kembali Belanja
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />LIVE
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
               style={{ minHeight: "300px", maxHeight: "380px" }}>

            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Host info */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-white text-xs font-semibold drop-shadow">{session.hostName}</span>
                {totalPoints > 0 && (
                  <span className="ml-1.5 text-yellow-300 text-[10px] font-bold">+{totalPoints} poin</span>
                )}
              </div>
            </div>

            {/* LIVE badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />LIVE
            </div>

            {/* Current product showcase */}
            {currentProduct && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl mb-3 bg-white/10">
                  <img src={currentProduct.image} alt={currentProduct.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-white font-bold text-sm sm:text-base drop-shadow-lg max-w-xs truncate">{currentProduct.name}</p>
                <p className="text-yellow-300 font-extrabold text-lg drop-shadow-lg mt-1">{formatPrice(currentProduct.price)}</p>
              </div>
            )}

            {/* Floating gifts */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {gifts.map((g) => (
                <FloatingGiftAnim key={g.id} gift={g} onDone={() => clearGift(g.id)} />
              ))}
            </div>

            {/* Product dots */}
            {displayProducts.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {displayProducts.map((_, i) => (
                  <button key={i} onClick={() => setFeatIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === featIdx ? "bg-white w-5" : "bg-white/40 w-2"}`} />
                ))}
              </div>
            )}
          </div>

          {/* Voucher hint */}
          <div className="bg-orange-500/10 border-y border-orange-500/20 px-4 py-2 flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
            <p className="text-xs text-orange-700 font-medium">
              Gunakan kode <strong className="tracking-wider">LIVE25</strong> saat checkout — diskon 25%!
            </p>
          </div>

          {/* Featured products — scrollable grid */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-orange-500" />
              <h3 className="font-bold text-white text-sm">Produk Live</h3>
              <span className="text-xs text-white/40">({displayProducts.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayProducts.map((product, i) => (
                <div key={product.id}
                  className={`bg-gray-800 rounded-xl overflow-hidden border transition-all ${i === featIdx ? "border-orange-500 shadow-lg shadow-orange-500/20" : "border-white/10"}`}>
                  <div className="relative cursor-pointer" onClick={() => setFeatIdx(i)}>
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
                    <button onClick={() => addToCart(product)}
                      className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
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
             style={{ height: "420px", maxHeight: "420px", flexShrink: 0 }}>

          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-semibold">Chat Live</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Gift total */}
              {totalPoints > 0 && (
                <span className="text-yellow-400 text-xs font-bold">🎁 {totalPoints}pts</span>
              )}
              <button onClick={() => setShowGifts((v) => !v)}
                className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors text-xs bg-pink-500/10 px-2 py-1 rounded-lg">
                <Gift className="h-4 w-4" />Kirim Gift
              </button>
            </div>
          </div>

          {/* Gift panel */}
          {showGifts && (
            <div className="border-b border-white/10 p-3 bg-gray-800 flex-shrink-0">
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wide mb-2">Pilih hadiah</p>
              <div className="grid grid-cols-4 gap-2">
                {GIFT_TYPES.map((g) => (
                  <button key={g.id} onClick={() => handleSendGift(g.id)}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors">
                    <span className="text-xl">{g.emoji}</span>
                    <span className="text-white/80 text-[9px] font-semibold">{g.label}</span>
                    <span className={`text-[9px] font-bold ${g.color}`}>{g.points}pts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
            {chatMsgs.map((m) => (
              <div key={m.id} className={`flex items-baseline gap-1.5 text-xs ${m.isGift ? "bg-white/5 rounded-lg px-2 py-1" : ""}`}>
                <span className={`font-bold flex-shrink-0 ${m.color}`}>{m.user}</span>
                <span className="text-white/80 leading-relaxed">{m.msg}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-3 py-3 border-t border-white/10 flex gap-2 flex-shrink-0">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Tulis pesan…"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-orange-500" />
            <button onClick={sendChat}
              className="w-9 h-9 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
