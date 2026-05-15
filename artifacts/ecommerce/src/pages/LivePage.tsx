/**
 * LivePage.tsx
 * Halaman Live Shopping — Vertical Feed Mode (TikTok/Shopee Live Style).
 * Fitur: Vertical Snap Scroll, Real Product Integration, Advanced Gift System, Immersive UI.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { 
  Heart, Send, ShoppingBag, Eye, Zap, ArrowLeft, Radio, 
  Package, Tag, Gift, X, Share2, MessageCircle, MoreHorizontal,
  ChevronUp, ChevronDown, ShoppingCart, Star, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLive, GIFT_TYPES, GiftEvent, LiveSession } from "../contexts/LiveContext";
import { useProducts } from "../contexts/ProductsContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";

// ─── Constants & Mock Data ──────────────────────────────────────────────────
const USER_COLORS = ["text-pink-400","text-blue-400","text-purple-400","text-emerald-400","text-orange-400","text-cyan-400"];
const FAKE_CHATS: string[] = [];

// ─── Helpers ────────────────────────────────────────────────────────────────
function randomColor() { return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]; }

// ─── Components ─────────────────────────────────────────────────────────────

/**
 * Floating Heart Animation
 */
function FloatingHeart({ x, onDone }: { x: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.5, x: 0 }}
      animate={{ y: -400, opacity: 0, scale: 1.5, x: (Math.random() - 0.5) * 100 }}
      transition={{ duration: 2, ease: "easeOut" }}
      className="absolute bottom-20 z-50 text-red-500"
      style={{ left: `${x}%` }}
    >
      <Heart className="fill-current h-6 w-6" />
    </motion.div>
  );
}

/**
 * Individual Stream View
 */
function LiveStreamView({ 
  session, 
  isActive 
}: { 
  session: LiveSession; 
  isActive: boolean 
}) {
  const { gifts, sendGift, clearGift } = useLive();
  const { allStoreProducts } = useProducts();
  const { dispatch } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [viewers, setViewers] = useState(1);
  const [chatMsgs, setChatMsgs] = useState<{id: number, user: string, msg: string, color: string, isGift?: boolean}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [showProductDrawer, setShowProductDrawer] = useState(false);
  const [hearts, setHearts] = useState<{id: number, x: number}[]>([]);
  const heartIdRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  // Filter products for this stream
  const products = allStoreProducts.filter(p => {
    // Show selected products OR if none selected, show ALL approved products from this seller
    if (session.featuredProductIds.length > 0) {
      return session.featuredProductIds.includes(p.id);
    }
    return p.sellerId === session.sellerId;
  });
  const pinnedProduct = products.length > 0 ? products[0] : null;

  // Viewer fluctuation disabled
  /*
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => setViewers(v => Math.max(100, v + Math.floor(Math.random() * 21) - 10)), 3000);
    return () => clearInterval(t);
  }, [isActive]);
  */

  // Chat engine disabled (No dummy chats)
  /* 
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const msg = FAKE_CHATS[Math.floor(Math.random() * FAKE_CHATS.length)];
      const name = `User_${Math.floor(Math.random() * 1000)}`;
      const id = ++msgIdRef.current;
      setChatMsgs(prev => [...prev.slice(-30), { id, user: name, msg, color: randomColor() }]);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [isActive]);
  */

  // Gift sync
  useEffect(() => {
    if (!isActive) return;
    const lastGift = gifts[gifts.length - 1];
    if (lastGift && lastGift.sentAt > Date.now() - 1000) {
      const giftType = GIFT_TYPES.find(t => t.id === lastGift.giftId);
      const id = ++msgIdRef.current;
      setChatMsgs(prev => [...prev.slice(-30), { 
        id, 
        user: lastGift.senderName, 
        msg: `mengirim ${giftType?.emoji} ${giftType?.label}!`, 
        color: "text-amber-400 font-black uppercase",
        isGift: true 
      }]);
    }
  }, [gifts, isActive]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  const handleLike = () => {
    const id = ++heartIdRef.current;
    setHearts(prev => [...prev, { id, x: 20 + Math.random() * 60 }]);
  };

  const onSendChat = () => {
    if (!chatInput.trim()) return;
    const id = ++msgIdRef.current;
    setChatMsgs(prev => [...prev, { id, user: "Kamu", msg: chatInput.trim(), color: "text-orange-400" }]);
    setChatInput("");
  };

  const onSendGift = (giftId: string) => {
    const success = sendGift(giftId, user?.name ?? "Penonton", session.sellerId);
    if (success) {
      setShowGiftDrawer(false);
      toast({ title: "Hadiah Terkirim!", description: "Terima kasih atas dukungannya! ❤️" });
    } else {
      toast({ title: "Saldo Tidak Cukup", description: "Silakan top up dompet kamu dulu ya.", variant: "destructive" });
    }
  };

  const onAddToCart = (p: any) => {
    dispatch({ type: "ADD_ITEM", payload: { ...p, quantity: 1 } });
    toast({ title: "Berhasil!", description: `${p.name} masuk keranjang.` });
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden scroll-snap-align-start">
      {/* ── Background Stream (Gradient Mock) ── */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
        <div className={`w-full h-full bg-gradient-to-br transition-all duration-1000 ${
          session.sellerId === 'mock-1' ? 'from-orange-600 via-rose-600 to-purple-800' :
          session.sellerId === 'mock-2' ? 'from-emerald-600 via-blue-600 to-indigo-800' :
          'from-pink-600 via-purple-600 to-blue-800'
        }`} />
        
        {/* Animated Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [1000, -200], 
                x: [Math.random() * 1000, Math.random() * 1000],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 5 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-2 h-2 bg-white rounded-full blur-sm"
            />
          ))}
        </div>
      </div>

      {/* ── Top Bar ── */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 z-20 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black/40 backdrop-blur-md rounded-full p-1 pl-1 pr-4 flex items-center gap-2 border border-white/10">
              <div className="w-8 h-8 rounded-full border-2 border-primary overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.hostName}`} alt="" />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-[11px] font-black leading-none">{session.hostName}</span>
                <span className="text-white/60 text-[9px] font-bold uppercase tracking-tighter mt-0.5">FOLLOW</span>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-white/10">
              <Eye className="h-3 w-3 text-white" />
              <span className="text-white text-[11px] font-black">{viewers.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md animate-pulse shadow-lg shadow-red-600/20">LIVE</div>
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white rounded-full bg-black/20">
                <X className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-2 pl-2">
          <h2 className="text-white/90 text-sm font-black drop-shadow-md tracking-tight line-clamp-1">{session.title}</h2>
        </div>
      </div>

      {/* ── Floating Elements (Hearts & Gifts) ── */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <AnimatePresence>
          {hearts.map(h => (
            <FloatingHeart key={h.id} x={h.x} onDone={() => setHearts(prev => prev.filter(x => x.id !== h.id))} />
          ))}
          {gifts.map(g => {
             const type = GIFT_TYPES.find(t => t.id === g.giftId);
             return (
               <motion.div
                 key={g.id}
                 initial={{ opacity: 0, scale: 0, y: 100 }}
                 animate={{ opacity: 1, scale: 1.5, y: -200 }}
                 exit={{ opacity: 0, scale: 2 }}
                 transition={{ duration: 2, ease: "easeOut" }}
                 className="absolute bottom-40 z-50 pointer-events-none"
                 style={{ left: `${g.x}%` }}
               >
                 <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{type?.emoji}</span>
                 <motion.p 
                   animate={{ scale: [1, 1.2, 1] }} 
                   transition={{ repeat: Infinity, duration: 0.5 }}
                   className="text-[10px] text-white font-black uppercase text-center mt-2 bg-black/50 px-2 py-0.5 rounded-full"
                 >
                   {g.senderName}
                 </motion.p>
               </motion.div>
             );
          })}
        </AnimatePresence>
      </div>

      {/* ── Bottom Interface ── */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-10 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex flex-col gap-4">
          
          {/* Chat List */}
          <div className="h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2 mask-linear-gradient">
            {chatMsgs.map(m => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-baseline gap-2 max-w-[80%] ${m.isGift ? 'bg-amber-400/20 border border-amber-400/20' : 'bg-black/30 backdrop-blur-sm'} rounded-xl px-3 py-1.5`}
              >
                <span className={`text-[11px] font-black ${m.color}`}>{m.user}</span>
                <span className="text-white/90 text-[11px] leading-tight font-medium">{m.msg}</span>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex items-end justify-between gap-4">
            {/* Pinned Product Card */}
            {pinnedProduct && (
              <motion.div 
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProductDrawer(true)}
                className="bg-white rounded-2xl p-2 flex items-center gap-3 shadow-2xl max-w-[180px] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img src={pinnedProduct.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-[10px] font-black text-black truncate">{pinnedProduct.name}</p>
                  <p className="text-[11px] font-black text-primary">{formatPrice(pinnedProduct.price)}</p>
                </div>
                <div className="bg-primary text-white p-1.5 rounded-lg">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5">
                <input 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSendChat()}
                  placeholder="Katakan sesuatu..." 
                  className="bg-transparent border-none text-white text-[11px] font-bold focus:ring-0 placeholder:text-white/30 w-full"
                />
                <button onClick={onSendChat} className="text-primary hover:scale-110 transition-transform">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              
              <Button onClick={() => setShowProductDrawer(true)} variant="ghost" size="icon" className="rounded-full bg-black/40 text-white border border-white/10 h-10 w-10">
                <ShoppingBag className="h-5 w-5" />
              </Button>
              
              <Button onClick={() => setShowGiftDrawer(true)} variant="ghost" size="icon" className="rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white h-10 w-10 shadow-lg shadow-pink-500/30">
                <Gift className="h-5 w-5" />
              </Button>

              <button onClick={handleLike} className="relative group">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-lg opacity-0 group-hover:opacity-40 transition-opacity" />
                <Button variant="ghost" size="icon" className="rounded-full bg-black/40 text-white border border-white/10 h-10 w-10">
                  <Heart className={`h-5 w-5 ${hearts.length > 0 ? 'fill-red-500 text-red-500 animate-bounce' : ''}`} />
                </Button>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Drawers ── */}
      <AnimatePresence>
        {showProductDrawer && (
          <div className="fixed inset-0 z-[60] flex items-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProductDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full bg-background rounded-t-[2.5rem] p-6 pb-12 max-h-[70vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black tracking-tighter flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" /> Etalase Produk
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowProductDrawer(false)} className="rounded-full h-8 w-8 hover:bg-muted">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {products.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
                    <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm font-black text-muted-foreground">Etalase Masih Kosong</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-widest font-bold">Host belum menambahkan produk pilihan</p>
                  </div>
                ) : (
                  products.map(p => (
                    <div key={p.id} className="flex gap-4 p-4 rounded-3xl bg-muted/30 border border-border/50 group hover:border-primary/30 transition-all">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                        <img src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm mb-1 leading-tight">{p.name}</p>
                        <p className="text-primary font-black text-lg tracking-tighter">{formatPrice(p.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">Live Deal</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${p.stock > 0 ? "text-green-600 bg-green-50 border-green-100 dark:bg-green-950/30" : "text-red-600 bg-red-50 border-red-100 dark:bg-red-950/30"}`}>
                            {p.stock > 0 ? `Sisa ${p.stock}` : "Habis"}
                          </span>
                        </div>
                      </div>
                      <Button 
                        disabled={p.stock <= 0}
                        onClick={() => onAddToCart(p)} 
                        size="icon" 
                        className={`rounded-2xl h-12 w-12 shadow-lg ${p.stock > 0 ? "bg-primary shadow-primary/20" : "bg-muted text-muted-foreground shadow-none"}`}
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showGiftDrawer && (
          <div className="fixed inset-0 z-[60] flex items-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowGiftDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full bg-background/95 backdrop-blur-2xl rounded-t-[2.5rem] p-6 pb-12"
            >
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black tracking-tighter">Kirim Hadiah 💎</h3>
                <div className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                  <span className="text-primary text-[11px] font-black tracking-widest uppercase">MyDompet Saldo</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {GIFT_TYPES.map(g => (
                  <motion.button 
                    key={g.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSendGift(g.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-muted/40 border border-transparent hover:border-primary/30 hover:bg-white transition-all shadow-sm"
                  >
                    <span className="text-3xl">{g.emoji}</span>
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{g.label}</span>
                    <div className="bg-primary/5 px-2 py-0.5 rounded-full">
                      <span className={`text-[11px] font-black ${g.color}`}>{g.points} Pts</span>
                    </div>
                  </motion.button>
                ))}
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-8 font-bold opacity-60 uppercase tracking-widest">Saldo akan terpotong otomatis per hadiah</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Main Live Page
 */
export function LivePage() {
  const { activeSessions } = useLive();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback if no sessions
  if (activeSessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-gray-900 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
          <Radio className="h-10 w-10 text-gray-700" />
        </div>
        <h2 className="text-white text-2xl font-black tracking-tighter mb-2">Hening Sekali...</h2>
        <p className="text-white/40 text-sm max-w-xs mb-8">Saat ini tidak ada seller yang sedang Live. Coba cek beberapa saat lagi!</p>
        <Link href="/">
          <Button className="bg-white text-black hover:bg-white/90 rounded-2xl px-8 h-12 font-black">
            Kembali Belanja
          </Button>
        </Link>
      </div>
    );
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const height = e.currentTarget.clientHeight;
    const scrollPos = e.currentTarget.scrollTop;
    const index = Math.round(scrollPos / height);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <div className="h-screen w-full bg-black overflow-hidden relative">
      {/* ── Scroll Hints ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 pointer-events-none">
        <motion.div 
          animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="w-1.5 h-10 bg-white/20 rounded-full flex flex-col items-center py-2"
        >
          <div className="w-1 h-1 bg-white rounded-full" />
        </motion.div>
      </div>

      {/* ── Vertical Feed ── */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar"
      >
        {activeSessions.map((session, i) => (
          <LiveStreamView 
            key={session.sellerId} 
            session={session} 
            isActive={i === activeIndex} 
          />
        ))}
      </div>

      {/* Navigation Help */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2">
         {activeIndex > 0 && (
           <Button 
            onClick={() => containerRef.current?.scrollTo({ top: (activeIndex - 1) * window.innerHeight, behavior: 'smooth' })}
            size="icon" className="bg-black/20 backdrop-blur-md rounded-full border border-white/10 text-white"
           >
             <ChevronUp className="h-5 w-5" />
           </Button>
         )}
         {activeIndex < activeSessions.length - 1 && (
           <Button 
            onClick={() => containerRef.current?.scrollTo({ top: (activeIndex + 1) * window.innerHeight, behavior: 'smooth' })}
            size="icon" className="bg-black/20 backdrop-blur-md rounded-full border border-white/10 text-white"
           >
             <ChevronDown className="h-5 w-5" />
           </Button>
         )}
      </div>
    </div>
  );
}
