/**
 * GameTopUpPage.tsx
 * Halaman Top Up Game - 1:1 Replikasi Pointgo.id dengan Detail Luar Biasa.
 */
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  ChevronLeft, CreditCard, Smartphone, Banknote, 
  ShieldCheck, Zap, Star, Crown, ChevronRight,
  ArrowRight, CheckCircle2, Wallet, Gamepad2, Search,
  User, MessageCircle, Info, HelpCircle, Phone, 
  CreditCard as CardIcon, Check, X, Tag, Calculator
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

// EXACT POINTGO COLOR PALETTE
const COLORS = {
  bg: "#0B0E14",
  card: "#1C1F26",
  accent: "#CCFF00", // Neon Green
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  border: "rgba(255, 255, 255, 0.05)",
  input: "#0B0E14",
  secondary: "#12161F",
  danger: "#EF4444"
};

const GAMES = [
  { 
    id: "mlbb", 
    name: "Mobile Legends", 
    dev: "Moonton", 
    icon: "⚔️", 
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000",
    idLabel: "User ID",
    idPlaceholder: "Masukkan ID",
    hasZone: true,
    zonePlaceholder: "Server",
    categories: ["ALL", "MOBILE LEGENDS", "EVENT - NARUTO", "STARKUL"]
  },
  { 
    id: "ff", 
    name: "Free Fire", 
    dev: "Garena", 
    icon: "🔥", 
    banner: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&q=80&w=1000",
    idLabel: "Player ID",
    idPlaceholder: "Masukkan Player ID",
    categories: ["ALL", "DIAMONDS", "MEMBERSHIP"]
  }
];

const PACKAGES: Record<string, any[]> = {
  mlbb: [
    { id: "ml1", name: "3 Diamonds", price: 1056, oldPrice: 1121, discount: "13%", category: "MOBILE LEGENDS" },
    { id: "ml2", name: "5 Diamonds", price: 1509, oldPrice: 1619, discount: "13%", category: "MOBILE LEGENDS" },
    { id: "ml3", name: "12 Diamonds", price: 3415, oldPrice: 3800, discount: "10%", category: "MOBILE LEGENDS" },
    { id: "ml4", name: "28 Diamonds", price: 7980, oldPrice: 8500, discount: "15%", category: "MOBILE LEGENDS" },
    { id: "ml5", name: "86 Diamonds", price: 19800, oldPrice: 22000, discount: "20%", category: "MOBILE LEGENDS" },
    { id: "ml6", name: "172 Diamonds", price: 39600, oldPrice: 44000, discount: "20%", category: "MOBILE LEGENDS" },
    { id: "ml7", name: "257 Diamonds", price: 59400, oldPrice: 66000, discount: "20%", category: "MOBILE LEGENDS" },
    { id: "ml8", name: "344 Diamonds", price: 79200, oldPrice: 88000, discount: "20%", category: "MOBILE LEGENDS" },
    { id: "wdp", name: "Weekly Diamond Pass", price: 28496, oldPrice: 31519, discount: "13%", category: "EVENT - NARUTO" },
  ]
};

const PAYMENT_METHODS = [
  { group: "E-Wallet", methods: [
    { id: "qris", name: "QRIS All Payment", icon: Smartphone, fee: 0, logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" },
    { id: "dana", name: "DANA", icon: Smartphone, fee: 150, logo: "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" },
    { id: "ovo", name: "OVO", icon: Smartphone, fee: 150, logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" },
    { id: "shopeepay", name: "ShopeePay", icon: Smartphone, fee: 150, logo: "https://upload.wikimedia.org/wikipedia/commons/f/fe/ShopeePay_logo.svg" },
  ]},
  { group: "Virtual Account", methods: [
    { id: "bca", name: "BCA Virtual Account", icon: CardIcon, fee: 2500, logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
    { id: "mandiri", name: "Mandiri Virtual Account", icon: CardIcon, fee: 2500, logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
    { id: "bni", name: "BNI Virtual Account", icon: CardIcon, fee: 2500, logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/BNI_logo.svg" },
  ]},
  { group: "Convenience Store", methods: [
    { id: "alfamart", name: "Alfamart", icon: CardIcon, fee: 3000, logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Alfamart_logo.svg" },
    { id: "indomaret", name: "Indomaret", icon: CardIcon, fee: 3000, logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Logo_Indomaret.png" },
  ]},
  { group: "Saldo", methods: [
    { id: "mydompet", name: "MyDompet (Saldo Akun)", icon: Wallet, fee: 0 },
  ]}
];

export function GameTopUpPage() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>("E-Wallet");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const currentPackages = selectedGame ? (PACKAGES[selectedGame.id] || []) : [];
  const displayPackages = activeCategory === "ALL" 
    ? currentPackages 
    : currentPackages.filter(p => p.category === activeCategory);

  const handlePreCheckout = () => {
    if (!selectedPackage) return setErrorModal("Silakan Pilih Nominal Layanan Terlebih Dahulu!");
    if (!userId) return setErrorModal("User ID Tidak Boleh Kosong!");
    if (selectedGame.hasZone && !zoneId) return setErrorModal("Server ID Tidak Boleh Kosong!");
    if (!selectedMethod) return setErrorModal("Silakan Pilih Metode Pembayaran Terlebih Dahulu!");
    if (!whatsapp) return setErrorModal("Nomor WhatsApp Tidak Boleh Kosong!");
    
    setShowConfirmModal(true);
  };

  const handleFinalCheckout = () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast({ title: "Pesanan Berhasil!", description: "Sedang diproses oleh sistem otomatis kami." });
      setLocation("/profile");
    }, 2000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen font-['Inter',sans-serif] selection:bg-[#CCFF00] selection:text-black" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      
      {/* ── Navbar 1:1 Pointgo ────────────────────────────────────────────────── */}
      <nav className="bg-[#12161F] border-b border-white/5 sticky top-20 z-40 px-6 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/profile" className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-1 group">
              CYNMATIC <span style={{ color: COLORS.accent }} className="group-hover:animate-pulse">TOPUP</span>
            </h1>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
              <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-2"><Star className="h-3.5 w-3.5" /> Beranda</span>
              <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-2"><Info className="h-3.5 w-3.5" /> Cek Pesanan</span>
              <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-2"><Calculator className="h-3.5 w-3.5" /> Kalkulator</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 text-[12px] font-black shadow-inner">
              <Wallet className="h-4 w-4" style={{ color: COLORS.accent }} />
              <span className="tracking-tight">{formatPrice(balance)}</span>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {!selectedGame ? (
          /* ── Home Grid 1:1 Pointgo ─────────────────────────────────────────── */
          <motion.div 
            key="home"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="max-w-7xl mx-auto px-6 py-16"
          >
            <div className="text-center mb-20">
              <h2 className="text-5xl font-black tracking-tighter mb-6 bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent">Mau Top Up Apa Hari Ini?</h2>
              <div className="relative max-w-3xl mx-auto group">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-[#CCFF00] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Cari Game, Voucher, atau Jasa..." 
                  className="w-full bg-[#1C1F26] border-2 border-white/5 rounded-[2.5rem] py-7 pl-20 pr-10 text-base font-bold focus:outline-none focus:border-[#CCFF00]/50 transition-all shadow-2xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {GAMES.map(game => (
                <button 
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className="group bg-[#1C1F26] rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-[#CCFF00] transition-all hover:-translate-y-3 shadow-2xl relative"
                >
                  <div className="aspect-[3/4.2] relative">
                    <img src={game.banner} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent opacity-95" />
                    <div className="absolute top-5 left-5 bg-[#CCFF00] text-black text-[9px] font-black px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-widest">Official</div>
                  </div>
                  <div className="p-6 text-left">
                    <h3 className="font-black text-[15px] tracking-tight truncate mb-1">{game.name}</h3>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{game.dev}</p>
                  </div>
                  <div className="absolute inset-0 bg-[#CCFF00]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── Topup Page 1:1 Pointgo ────────────────────────────────────────── */
          <motion.div 
            key="topup"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="max-w-7xl mx-auto px-6 py-12"
          >
            {/* Hero Game Section */}
            <div className="relative rounded-[3rem] overflow-hidden mb-12 h-72 md:h-96 shadow-3xl group">
              <img src={selectedGame.banner} className="w-full h-full object-cover brightness-[0.35] group-hover:scale-105 transition-transform duration-2000" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent p-12 flex items-end">
                <div className="flex items-center gap-10">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] bg-white/10 backdrop-blur-3xl flex items-center justify-center text-6xl border-2 border-white/20 shadow-3xl transform rotate-3 hover:rotate-0 transition-transform">
                    {selectedGame.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-[#CCFF00] text-black text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-[0.2em]">Verified</span>
                      <span className="bg-white/10 text-white text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-[0.2em]">24/7 Service</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">{selectedGame.name}</h2>
                    <p className="text-white/30 text-[11px] font-black uppercase tracking-[0.5em]">{selectedGame.dev} Global</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* LEFT COLUMN: Nominal selection (1:1 Pointgo) */}
              <div className="lg:col-span-8 space-y-10">
                
                {/* 1. Pilih Nominal Section */}
                <div className="bg-[#1C1F26] rounded-[3rem] p-10 shadow-3xl border border-white/5 relative overflow-hidden">
                  <div className="flex items-center gap-6 mb-12 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-black text-xl shadow-2xl shadow-[#CCFF00]/30 animate-bounce-slow">1</div>
                    <h3 className="text-2xl font-black uppercase tracking-widest italic">Pilih Nominal Layanan</h3>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-8 mb-10 no-scrollbar relative z-10">
                    {selectedGame.categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-xl ${
                          activeCategory === cat ? "bg-[#CCFF00] text-black scale-105" : "bg-white/5 text-white/40 hover:bg-white/10"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                    {displayPackages.map(pkg => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-7 rounded-[2.5rem] border-3 text-left transition-all relative group overflow-hidden ${
                          selectedPackage?.id === pkg.id ? "border-[#CCFF00] bg-[#CCFF00]/10" : "border-transparent bg-[#12161F] hover:border-white/20"
                        }`}
                      >
                        <div className="relative z-10">
                          <p className={`font-black text-[15px] md:text-[17px] mb-3 leading-tight tracking-tight ${selectedPackage?.id === pkg.id ? "text-[#CCFF00]" : "text-white"}`}>{pkg.name}</p>
                          <div className="flex flex-col gap-1">
                             <p className="text-xs font-black text-[#CCFF00] opacity-80">{formatPrice(pkg.price)}</p>
                             {pkg.oldPrice && (
                               <div className="flex items-center gap-3">
                                 <span className="text-[11px] text-white/10 line-through font-bold">{formatPrice(pkg.oldPrice)}</span>
                                 <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-md font-black italic">{pkg.discount}</span>
                               </div>
                             )}
                          </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-20 transition-all group-hover:scale-150">
                           <Zap className="h-16 w-16" style={{ color: COLORS.accent }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Sticky Data, Payment, WA (1:1 Pointgo) */}
              <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-10">
                
                {/* Guide Sidebar */}
                <div className="bg-[#12161F] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#CCFF00] mb-6 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" /> Cara Top Up
                  </h4>
                  <ul className="text-[10px] font-bold text-white/40 space-y-3 leading-relaxed uppercase tracking-widest">
                    <li className="flex gap-3"><span className="text-[#CCFF00]">01.</span> Pilih Produk yang diinginkan</li>
                    <li className="flex gap-3"><span className="text-[#CCFF00]">02.</span> Masukkan ID & SERVER</li>
                    <li className="flex gap-3"><span className="text-[#CCFF00]">03.</span> Pilih Metode Pembayaran</li>
                    <li className="flex gap-3"><span className="text-[#CCFF00]">04.</span> Masukkan No Telp (WhatsApp)</li>
                    <li className="flex gap-3"><span className="text-[#CCFF00]">05.</span> Klik Beli Sekarang & Bayar</li>
                  </ul>
                </div>

                {/* 2. Lengkapi Data Section */}
                <div className="bg-[#1C1F26] rounded-[2.5rem] p-8 shadow-3xl border border-white/5">
                  <div className="flex items-center gap-5 mb-10">
                    <div className="w-10 h-10 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-black text-lg shadow-2xl">2</div>
                    <h3 className="text-lg font-black uppercase tracking-widest italic">Lengkapi Data</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <input 
                        type="text" placeholder={selectedGame.idPlaceholder} value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="flex-1 bg-[#0B0E14] border-2 border-white/5 rounded-2xl px-6 py-5 text-sm font-bold focus:outline-none focus:border-[#CCFF00] transition-all"
                      />
                      {selectedGame.hasZone && (
                        <input 
                          type="text" placeholder={selectedGame.zonePlaceholder} value={zoneId}
                          onChange={(e) => setZoneId(e.target.value)}
                          className="w-28 bg-[#0B0E14] border-2 border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-center focus:outline-none focus:border-[#CCFF00] transition-all"
                        />
                      )}
                    </div>
                    <div className="p-5 bg-[#CCFF00]/5 rounded-3xl border border-[#CCFF00]/10 flex gap-4">
                       <Info className="h-5 w-5 text-[#CCFF00] shrink-0" />
                       <p className="text-[10px] text-[#CCFF00] font-black leading-relaxed uppercase tracking-widest">
                         Pastikan ID & Server benar (Server jangan diberi tanda kurung). Contoh: 12345678 1234
                       </p>
                    </div>
                  </div>
                </div>

                {/* 3. Pilih Pembayaran Section */}
                <div className="bg-[#1C1F26] rounded-[2.5rem] p-8 shadow-3xl border border-white/5">
                  <div className="flex items-center gap-5 mb-10">
                    <div className="w-10 h-10 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-black text-lg shadow-2xl">3</div>
                    <h3 className="text-lg font-black uppercase tracking-widest italic">Pilih Pembayaran</h3>
                  </div>

                  <div className="space-y-4">
                    {PAYMENT_METHODS.map(group => (
                      <div key={group.group} className="border border-white/5 rounded-3xl overflow-hidden bg-[#12161F]">
                        <button 
                          onClick={() => setOpenAccordion(openAccordion === group.group ? null : group.group)}
                          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all"
                        >
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">{group.group}</span>
                          <ChevronRight className={`h-5 w-5 transition-transform ${openAccordion === group.group ? "rotate-90 text-[#CCFF00]" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {openAccordion === group.group && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-white/5"
                            >
                              <div className="p-4 space-y-3">
                                {group.methods.map(m => (
                                  <button
                                    key={m.id}
                                    onClick={() => setSelectedMethod(m.id)}
                                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                                      selectedMethod === m.id ? "border-[#CCFF00] bg-[#CCFF00]/10" : "border-white/5 bg-[#0B0E14] hover:border-white/10"
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      {m.logo ? (
                                        <img src={m.logo} alt={m.name} className="h-4 object-contain brightness-200" />
                                      ) : (
                                        <m.icon className={`h-5 w-5 ${selectedMethod === m.id ? "text-[#CCFF00]" : "text-white/20"}`} />
                                      )}
                                      <span className="text-xs font-black uppercase tracking-widest">{m.name}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-[#CCFF00]">+{formatPrice(m.fee)}</p>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Nomor Whatsapp Section */}
                <div className="bg-[#1C1F26] rounded-[2.5rem] p-8 shadow-3xl border border-white/5">
                  <div className="flex items-center gap-5 mb-10">
                    <div className="w-10 h-10 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-black text-lg shadow-2xl">4</div>
                    <h3 className="text-lg font-black uppercase tracking-widest italic">Kontak</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                      <input 
                        type="text" placeholder="No. Whatsapp (08xxx)" value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full bg-[#0B0E14] border-2 border-white/5 rounded-2xl py-5 pl-16 pr-8 text-sm font-bold focus:outline-none focus:border-[#CCFF00] transition-all shadow-inner"
                      />
                    </div>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest px-1">WA wajib aktif untuk konfirmasi pesanan.</p>
                  </div>
                </div>

                {/* Final Buy Button Section */}
                <div className="bg-[#1C1F26] rounded-[3rem] p-12 shadow-3xl border-3 border-[#CCFF00]/10 space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="space-y-5 relative z-10">
                    <div className="flex justify-between text-[12px] font-black uppercase tracking-[0.3em] text-white/30">
                      <span>Total Tagihan</span>
                      <span>{selectedMethod ? selectedMethod.toUpperCase() : "—"}</span>
                    </div>
                    <div className="text-5xl font-black text-right tracking-tighter italic" style={{ color: COLORS.accent }}>
                      {selectedPackage ? formatPrice(selectedPackage.price) : "Rp 0"}
                    </div>
                  </div>
                  <Button 
                    onClick={handlePreCheckout}
                    disabled={isProcessing}
                    className="w-full h-20 rounded-3xl bg-[#CCFF00] text-black font-black text-xl hover:scale-[1.03] active:scale-95 transition-all shadow-3xl shadow-[#CCFF00]/20 border-0 uppercase tracking-[0.2em] italic"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : "BELI SEKARANG"}
                  </Button>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmation Modal 1:1 Copy ────────────────────────────────────────── */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center px-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, rotate: -2 }} animate={{ scale: 1, y: 0, rotate: 0 }} exit={{ scale: 0.9, y: 50 }}
              className="bg-[#1C1F26] w-full max-w-lg rounded-[4rem] overflow-hidden border-2 border-white/10 shadow-[0_0_100px_rgba(204,255,0,0.1)]"
            >
              <div className="bg-[#CCFF00] p-10 text-black flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black italic tracking-tighter">KONFIRMASI</h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-50">Silakan cek detail pesanan Anda</p>
                </div>
                <div className="w-16 h-16 bg-black/10 rounded-[2rem] flex items-center justify-center shadow-inner">
                  <Info className="h-8 w-8" />
                </div>
              </div>
              <div className="p-12 space-y-8">
                <div className="space-y-6 text-sm font-black uppercase tracking-widest">
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-white/20 text-[11px]">Produk</span>
                    <span className="text-white">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-white/20 text-[11px]">ID Player</span>
                    <span className="text-[#CCFF00] text-lg tracking-tighter">{userId} {zoneId && `(${zoneId})`}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-white/20 text-[11px]">Metode</span>
                    <span className="text-white uppercase">{selectedMethod}</span>
                  </div>
                  <div className="flex justify-between pt-6">
                    <span className="text-white/20 text-[11px]">Total Pembayaran</span>
                    <span className="text-3xl font-black text-[#CCFF00] tracking-tighter italic">{formatPrice(selectedPackage.price)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-6">
                  <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="h-16 rounded-3xl border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[11px] transition-all">Batal</Button>
                  <Button onClick={handleFinalCheckout} className="h-16 rounded-3xl bg-[#CCFF00] text-black font-black hover:scale-105 transition-all shadow-2xl shadow-[#CCFF00]/20 uppercase tracking-widest text-[11px]">Ya, Bayar!</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Modal 1:1 Copy ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {errorModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] flex items-center justify-center px-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.7, rotate: 10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.7 }}
              className="bg-[#1C1F26] p-12 rounded-[4rem] border-2 border-red-500/20 text-center max-w-sm w-full shadow-3xl"
            >
              <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-red-500/10">
                <X className="h-12 w-12" />
              </div>
              <h3 className="text-3xl font-black mb-4 italic tracking-tighter">WADUH CO!</h3>
              <p className="text-xs text-white/30 font-black mb-10 leading-relaxed uppercase tracking-[0.2em]">{errorModal}</p>
              <Button onClick={() => setErrorModal(null)} className="w-full h-16 bg-white/5 hover:bg-white/10 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] transition-all">SIAAP CO!</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer Section 1:1 Pointgo ────────────────────────────────────────── */}
      <footer className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 mt-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-[#CCFF00]/30 to-transparent" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="col-span-1 md:col-span-2 space-y-10">
             <h4 className="font-black italic tracking-tighter text-4xl">CYNMATIC <span style={{ color: COLORS.accent }}>TOPUP</span></h4>
             <p className="text-sm text-white/20 leading-relaxed font-black uppercase tracking-widest max-w-lg">
               Platform penyedia layanan top up game dan voucher digital terpercaya di Indonesia. Diproses secara otomatis 24 jam nonstop untuk kenyamanan maksimal pengalaman gaming Anda.
             </p>
             <div className="flex gap-6">
                {["IG", "WA", "FB", "TK"].map(s => (
                  <div key={s} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-[#CCFF00] hover:text-black transition-all cursor-pointer shadow-xl border border-white/5 group">
                    <span className="font-black text-xs group-hover:scale-125 transition-transform">{s}</span>
                  </div>
                ))}
             </div>
          </div>
          <div className="space-y-8">
             <h5 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#CCFF00]">Navigasi</h5>
             <ul className="text-[11px] text-white/20 space-y-5 font-black uppercase tracking-[0.3em]">
               <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-3"><ArrowRight className="h-3 w-3" /> Beranda</li>
               <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-3"><ArrowRight className="h-3 w-3" /> Cek Pesanan</li>
               <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-3"><ArrowRight className="h-3 w-3" /> Syarat Layanan</li>
               <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-3"><ArrowRight className="h-3 w-3" /> Kontak Kami</li>
             </ul>
          </div>
          <div className="space-y-8">
             <h5 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#CCFF00]">Payment</h5>
             <div className="grid grid-cols-3 gap-3">
                {["QRIS", "DANA", "OVO", "SPAY", "BCA", "MDR", "BNI", "ALFA", "INDO"].map(p => (
                  <div key={p} className="bg-white/5 rounded-xl py-3 text-center text-[10px] font-black border border-white/5 shadow-inner hover:bg-white/10 transition-all cursor-default">{p}</div>
                ))}
             </div>
          </div>
        </div>
        <div className="mt-32 pt-10 border-t border-white/5 text-center">
           <p className="text-[10px] font-black uppercase tracking-[1em] text-white/5">© 2026 CYNMATIC TOPUP • ALL RIGHTS RESERVED</p>
        </div>
      </footer>

      {/* Floating Support Button */}
      <div className="fixed bottom-10 right-10 z-[300]">
        <button className="w-20 h-20 bg-[#25D366] text-white rounded-full shadow-[0_0_50px_rgba(37,211,102,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative">
          <MessageCircle className="h-10 w-10" />
          <div className="absolute right-24 bg-[#1C1F26] text-white text-[11px] font-black px-6 py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border-2 border-white/10 shadow-3xl translate-x-5 group-hover:translate-x-0 italic uppercase tracking-widest">
            Halo Co! Butuh Bantuan?
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-[#0B0E14] animate-pulse" />
        </button>
      </div>
    </div>
  );
}
