/**
 * SettingsPage.tsx
 * Standalone dedicated settings experience inspired by HyperOS 3.0/4.0.
 * Houses all 39 page routes inside the e-commerce workspace.
 */
import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { 
  Smartphone, RefreshCw, ShieldCheck, Wifi, Zap, Radio, Globe, Sun, Moon, Type, 
  Palette, Bell, BellRing, Volume2, Mail, Languages, Clock, Coins, Sparkles, Music, 
  Pause, Play, Sliders, Lock, TrendingUp, MapPin, Trash2, ChevronRight, X, Check,
  Store, Truck, ShieldAlert, LogOut, Wallet, ClipboardList, Heart, Gift, Users,
  Gamepad2, Trophy, Bot, Vote as VoteIcon, Info, Ticket, HelpCircle, ArrowLeft, Edit2,
  Package, ShoppingBag, ShoppingCart, User, CreditCard, ChevronLeft, Crown, Gavel,
  MessageSquare, CheckCircle2
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useSultan } from "../contexts/MySultanContext";
import { useMyCrypto } from "../contexts/MyCryptoContext";
import { useCurrency, CurrencyCode, CURRENCIES } from "../contexts/CurrencyContext";

export function SettingsPage() {
  const params = useParams<{ subpage?: string }>();
  const [, setLocation] = useLocation();
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();

  const { isSultan } = useSultan();
  const { isCryptoMember } = useMyCrypto();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(user?.name ?? "");
  const [profileBioInput, setProfileBioInput] = useState(user?.bio ?? "BJIER");

  useEffect(() => {
    if (user) {
      setProfileNameInput(user.name);
      setProfileBioInput(user.bio || "BJIER");
    }
  }, [user]);

  const getInitials = (name: string) => {
    if (!name) return "AT";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatJoinedDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
    } catch (e) {
      return "15 MEI 2026";
    }
  };

  const subpageRaw = params.subpage || "main";
  const settingsSubPage = subpageRaw.replace("-", "_");

  // Search keyword query
  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");

  // --- Interactive HyperOS Settings States ---
  const [wifiConnected, setWifiConnected] = useState("Arthur Cloud");
  const [wifiConnecting, setWifiConnecting] = useState<string | null>(null);
  const [wifiPasswordInput, setWifiPasswordInput] = useState("");
  const [bluetoothConnected, setBluetoothConnected] = useState<string | null>(null);
  const [bluetoothConnecting, setBluetoothConnecting] = useState<string | null>(null);
  const [bluetoothScanning, setBluetoothScanning] = useState(false);
  const [systemUpdateBadge, setSystemUpdateBadge] = useState(1);
  const [systemUpdating, setSystemUpdating] = useState(false);
  const [securityScanStatus, setSecurityScanStatus] = useState<"safe" | "needs_scan" | "scanning">("needs_scan");
  const [brightnessValue, setBrightnessValue] = useState(100);
  const [textSizeValue, setTextSizeValue] = useState<"small" | "normal" | "large" | "huge">("normal");
  const [accentTheme, setAccentTheme] = useState<"default" | "cyberpunk" | "emerald" | "sultan_gold" | "crimson">("default");
  const [languageCode, setLanguageCode] = useState<"id" | "en">("id");
  const [timezoneValue, setTimezoneValue] = useState<"WIB" | "WITA" | "WIT" | "UTC">("WIB");
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheSize, setCacheSize] = useState(14.8);
  const [readingMode, setReadingMode] = useState(false);
  const [systemRebooting, setSystemRebooting] = useState(false);

  // Currency — connected to global CurrencyContext
  const { currency: globalCurrency, setCurrency: setGlobalCurrency } = useCurrency();
  const currencyFormat = globalCurrency.code;

  // Background Audio Synth Beat States
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Privacy toggles
  const [ipProtected, setIpProtected] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [marketAlertsEnabled, setMarketAlertsEnabled] = useState(true);

  // YouTube input state
  const [ytInput, setYtInput] = useState(user?.youtubeId || "");

  // Update progress tracker
  const [updateProgress, setUpdateProgress] = useState(0);

  // Language translation helper
  const t = (idText: string, enText: string) => {
    return languageCode === "id" ? idText : enText;
  };

  const setSettingsSubPage = (page: string) => {
    if (page === "main") {
      setLocation("/settings");
    } else {
      setLocation(`/settings/${page.replace("_", "-")}`);
    }
  };

  useEffect(() => {
    audioRef.current = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = musicVolume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
      toast({ title: "Soundtrack Paused", description: "Beats player has been paused." });
    } else {
      audioRef.current.play().catch(err => console.log("Audio play blocked by browser:", err));
      setMusicPlaying(true);
      toast({ title: "Playing Lofi beats 🎵", description: "Enjoy premium chill vibes." });
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const formatWalletBalance = () => {
    const bal = user?.balance || 0;
    switch (currencyFormat) {
      case "USD":
        return `$ ${(bal / 16000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case "EUR":
        return `€ ${(bal / 17500).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      default:
        return `Rp ${bal.toLocaleString("id-ID")}`;
    }
  };

  // Accent theme selectors
  const getAccentColor = () => {
    switch (accentTheme) {
      case "cyberpunk": return "#BF5AF2";
      case "emerald": return "#30D158";
      case "sultan_gold": return "#FF9F0A";
      case "crimson": return "#FF2D55";
      default: return "#007AFF";
    }
  };

  // Text size classes mapping
  const getTextSizeClass = () => {
    switch (textSizeValue) {
      case "small": return "text-xs";
      case "large": return "text-base";
      case "huge": return "text-lg";
      default: return "text-sm";
    }
  };

  const getLabelTextSizeClass = () => {
    switch (textSizeValue) {
      case "small": return "text-[13px]";
      case "large": return "text-[16px]";
      case "huge": return "text-[18px]";
      default: return "text-[15px]";
    }
  };

  const getSublabelTextSizeClass = () => {
    switch (textSizeValue) {
      case "small": return "text-[10px]";
      case "large": return "text-[13px]";
      case "huge": return "text-[14px]";
      default: return "text-xs";
    }
  };

  interface PageRow {
    path: string;
    label: string;
    desc: string;
    icon: React.ComponentType<any>;
    color: string;
    isGradient?: boolean;
  }

  interface PageGroup {
    id: string;
    title: string;
    keywords: string[];
    rows: PageRow[];
  }

  // --- Dynamic Mappings of All Workspace Pages ---
  const pageGroups: PageGroup[] = [
    {
      id: "group_ecommerce",
      title: t("Halaman E-Commerce & Belanja", "Core E-Commerce & Shopping"),
      keywords: ["home", "homepage", "beranda", "keranjang", "cart", "checkout", "orders", "riwayat pesanan", "resi", "wishlist", "favorit", "topup", "dompet", "saldo", "voucher", "redeem", "success", "detail", "produk"],
      rows: [
        { path: "/orders", label: t("Riwayat Pesanan", "Order Tracking Registers"), desc: t("Lacak status pesanan & nomor resi", "Live shipment tracking logs"), icon: ClipboardList, color: "#BF5AF2" },
        { path: "/wishlist", label: t("Favorit & Wishlist", "Archived Shopping Nodes"), desc: t("Koleksi produk pilihan Anda", "Saved product wishlists"), icon: Heart, color: "#FF2D55" },
        { path: "/mydompet", label: t("My Dompet", "Total E-Wallet Registry"), desc: t("Lihat total saldo E-Wallet & transaksi", "Personal virtual vault details"), icon: Wallet, color: "#34C759" },
        { path: "/myredeem", label: t("Klaim Kode Voucher", "Claim Voucher Node"), desc: t("Tukarkan kode promo & kupon", "Redeem bonus platform codes"), icon: Gift, color: "#30D158" }
      ]
    },
    {
      id: "group_vip",
      title: t("Klub Sultan & Keanggotaan VIP", "VIP Lounge & Personalization"),
      keywords: ["sultan", "privilege", "badge", "lencana", "cosmetic", "aura", "glow", "badge", "lencana", "customize", "edit", "banner", "lofi", "music", "beats", "profil", "profile"],
      rows: [
        { path: "/profile", label: t("Profil Pengguna", "User Elite Profile"), desc: t("Halaman dashboard profil utama Anda", "Manage personal account profile"), icon: User, color: "#007AFF" },
        { path: "/mysultan", label: t("Sultan Privilege", "Sultan Elite Privilege"), desc: t("Layanan premium & kustom lencana", "Luxury status overrides"), icon: Crown, color: "#FF9F0A", isGradient: true },
        { path: "/cosmetics", label: t("Cosmetic Aura", "Aura Badges Suite"), desc: t("Lencana bersinar & visual avatar", "Neon tags & visual credentials"), icon: Sparkles, color: "#BF5AF2" },
        { path: "/customize", label: t("Personalize Banner", "Banner ID Calibrator"), desc: t("Kustomisasi Youtube banner & warna", "Theme customization deck"), icon: Sliders, color: "#FF9F0A" },
        { path: "/mymusic", label: t("VIP Music Lounge", "Lofi Stream Deck"), desc: t("Pemutar musik lofi platform", "Vibe calibrator audio player"), icon: Music, color: "#FF2D55" }
      ]
    },
    {
      id: "group_web3",
      title: t("Koin Kripto, Lelang & Gaming", "Crypto Suite, Auction & Arcade"),
      keywords: ["crypto", "btc", "eth", "usdt", "signals", "sinyal", "swap", "exchange", "tukar", "koin", "flashsale", "ops", "sale", "auction", "lelang", "arcade", "minigames", "voting", "civic", "governance", "game", "topup"],
      rows: [
        { path: "/mycrypto", label: t("AI Signals", "AI Token Signals"), desc: t("Analisis & sinyal token kripto", "Live Web3 token insights"), icon: TrendingUp, color: "#5E5CE6" },
        { path: "/exchange", label: t("Coin Swap", "Bridge Swap Terminal"), desc: t("Tukar koin ke saldo rupiah", "Convert token coins to cash balance"), icon: Coins, color: "#34C759" },
        { path: "/flashsale", label: t("Flash Ops Sale", "Limited Flash Sales"), desc: t("Promo kilat dengan diskon raksasa", "High-speed token clearance"), icon: Zap, color: "#FF9F0A" },
        { path: "/auction", label: t("Global Auction", "Elite Bid Auction Deck"), desc: t("Tawar item langka & koleksi NFT", "Bid on legendary digital items"), icon: Gavel, color: "#636366" },
        { path: "/game-topup", label: t("Top Up Game", "Arcade Diamond Topup"), desc: t("Top up diamond & voucher game populer", "Refill in-game currencies"), icon: Gamepad2, color: "#BF5AF2" },
        { path: "/minigames", label: t("Arcade Minigames", "Arcade Machine Gate"), desc: t("Mainkan game instan & dapatkan koin", "Simulate minigames & earn coins"), icon: Gamepad2, color: "#BF5AF2" },
        { path: "/voting", label: t("Civic Voice Voting", "Governance Proposal Node"), desc: t("Partisipasi keputusan platform", "Decentralized proposal feedback"), icon: VoteIcon, color: "#007AFF" }
      ]
    },
    {
      id: "group_social",
      title: t("Sosial, Chat, & Komisi", "Social Hub, AI Chat & Matrix"),
      keywords: ["friends", "teman", "social", "hub", "aichat", "bot", "chat", "companion", "notifikasi", "pesan", "affiliate", "matrix", "referral", "komisi", "leaderboard", "fame", "skor", "ban", "block"],
      rows: [
        { path: "/friends", label: t("Social Hub", "Elite Friends Matrix"), desc: t("Daftar teman & pengikut sosial", "Lobby of active connections"), icon: Users, color: "#5E5CE6" },
        { path: "/friends", label: t("Inbox Pesan", "Message Inbox"), desc: t("Chat langsung dengan teman — kirim foto & video", "Send messages, photos & videos to friends"), icon: MessageSquare, color: "#007AFF" },
        { path: "/aichat", label: t("AI Companion", "DeepMind Copilot Bot"), desc: t("Chat asisten AI pintar DeepMind", "Interactive AI helper"), icon: Bot, color: "#007AFF" },
        { path: "/notifications", label: t("Notifikasi Global", "Platform Alert Terminal"), desc: t("Daftar pemberitahuan & pesan baru", "Security and sale dispatch"), icon: Bell, color: "#FF9F0A" },
        { path: "/affiliate", label: t("Affiliate Matrix", "Referral Kickback Network"), desc: t("Program referral komisi 5%", "Earn cashback matrix dividends"), icon: Zap, color: "#34C759" },
        { path: "/leaderboard", label: t("Hall of Fame", "Platform Hall of Fame"), desc: t("Peringkat pembeli & Sultan teratas", "Leaderboard score metric"), icon: Trophy, color: "#FF9F0A" },
        { path: "/ban-leaderboard", label: t("Ban Leaderboard", "Exile Integrity Registry"), desc: t("Daftar hitam pengguna bermasalah", "Vulnerabilities block registry"), icon: ShieldAlert, color: "#FF3B30" }
      ]
    },
    {
      id: "group_management",
      title: t("Pusat Manajemen & Operasi", "Merchant, Delivery & Operations"),
      keywords: ["seller", "toko", "produk", "merchant", "stok", "kurir", "courier", "rute", "delivery", "admin", "command", "server", "live", "broadcast", "streaming"],
      rows: [
        { path: "/seller", label: t("Merchant Center", "Merchant Inventory Control"), desc: t("Kelola toko, pesanan & produk", "Control store catalog as seller"), icon: Store, color: "#BF5AF2" },
        { path: "/courier", label: t("Delivery Deck", "Courier Dispatch Terminal"), desc: t("Rute kurir & status pengantaran", "Dispatch tasks & secure routing"), icon: Truck, color: "#34C759" },
        { path: "/admin", label: t("Global Admin Command", "Core Engine Panel"), desc: t("Kontrol penuh sistem & server", "Admin telemetry console"), icon: ShieldCheck, color: "#FF3B30" },
        { path: "/live", label: t("Broadcast Room", "Live Commerce Deck"), desc: t("Kamar live streaming TokoArthur", "Interact with sellers live"), icon: Radio, color: "#FF2D55" }
      ]
    },
    {
      id: "group_support",
      title: t("Platform & Bantuan", "System, Portal & Support Tickets"),
      keywords: ["about us", "tentang kami", "cynmatic", "legenda", "tickets", "tiket", "bantuan", "support", "aduan", "login", "masuk", "register", "daftar", "akun", "settings", "setelan", "404", "error", "found"],
      rows: [
        { path: "/about-us", label: t("Tentang Kami", "AI Cyber Telemetry"), desc: t("Statistik AI & lore penyelamatan server", "Read legendary cynmatic archives"), icon: Info, color: "#FF9F0A" },
        { path: "/tickets", label: t("Hub Tiket Bantuan", "Support Ticket Hub"), desc: t("Buat tiket keluhan & hubungi bantuan", "Post issues & check responses"), icon: Ticket, color: "#5E5CE6" }
      ]
    }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 relative overflow-hidden font-sans">
      {/* Dynamic Background Overlays */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(20,20,50,0.18)_0%,rgba(0,0,0,1)_80%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.025] pointer-events-none z-0" />

      {/* Main Settings Panel Wrapper */}
      <div className="container mx-auto px-6 max-w-2xl pt-24 relative z-10 space-y-8">
        
        {/* Sleek Top Navigation Back Arrow */}
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <button className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Arthur HyperOS</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {(() => {
            switch (settingsSubPage) {
              
              /* ── TENTANG TELEPON ── */
              case "about":
                return (
                  <motion.div
                    key="about-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="relative rounded-[2.5rem] overflow-hidden min-h-[260px] flex flex-col items-center justify-center" style={{ background: "linear-gradient(160deg, #1a237e 0%, #283593 40%, #1565c0 70%, #0d47a1 100%)", boxShadow: `0 0 25px rgba(21, 101, 192, 0.4)` }}>
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)" }} />
                      <div className="relative z-10 text-center space-y-2 px-8">
                        <h2 className="text-3xl font-light text-white tracking-wide">Arthur HyperOS</h2>
                        <p className="text-white/60 text-base font-light">{systemUpdateBadge === 0 ? "4.1.0-Release" : "4.0.2"}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { label: t("Nama perangkat", "Device name"), value: user.name, chevron: true },
                        { label: t("Penyimpanan", "Storage"), value: cacheSize === 0 ? "10.0 GB / 128 GB" : "24.8 GB / 128 GB", chevron: true },
                      ].map((row) => (
                        <div key={row.label} className="bg-[#1c1c1e] rounded-[1.4rem] px-5 py-4 flex items-center justify-between">
                          <span className="text-white text-sm font-normal">{row.label}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-white/40 text-sm">{row.value}</span>
                            {row.chevron && <ChevronRight className="w-4 h-4 text-white/25" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {[
                        { label: t("Versi OS", "OS Version"), value: systemUpdateBadge === 0 ? "4.1.0.ARTHUROS" : "4.0.2.ARTHUROS" },
                        { label: t("Versi Android", "Android Version"), value: "16 BP2A.250605.031.A3" },
                        { label: t("Update keamanan Android", "Android Security Patch"), value: "2026-05-23" },
                        { label: t("Info detail dan spesifikasi", "Specs & details"), value: "", chevron: true },
                      ].map((row) => (
                        <div key={row.label} className="bg-[#1c1c1e] rounded-[1.4rem] px-5 py-4 flex items-center justify-between">
                          <span className="text-white text-sm font-normal">{row.label}</span>
                          <div className="flex items-center gap-1">
                            {row.value && <span className="text-white/40 text-sm">{row.value}</span>}
                            {row.chevron && <ChevronRight className="w-4 h-4 text-white/25" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );

              /* ── WI-FI SETTINGS ── */
              case "wifi": {
                const networks = [
                  { name: "Arthur Cloud", secure: true, level: 4, saved: true },
                  { name: "VIP Lounge 5G", secure: true, level: 5, saved: true },
                  { name: "DeepMind Guest", secure: false, level: 3, saved: false },
                  { name: "Cyberpunk Net", secure: true, level: 4, saved: false }
                ];

                const handleConnect = (ssid: string) => {
                  if (wifiConnected === ssid) return;
                  setWifiConnecting(ssid);
                  setTimeout(() => {
                    setWifiConnected(ssid);
                    setWifiConnecting(null);
                    toast({
                      title: t("Wi-Fi Terhubung", "Wi-Fi Connected"),
                      description: t(`Berhasil tersambung ke jaringan ${ssid}`, `Successfully connected to network ${ssid}`)
                    });
                  }, 1500);
                };

                return (
                  <motion.div
                    key="wifi-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Setelan Wi-Fi", "Wi-Fi Settings")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("PILIH JARINGAN YANG TERSEDIA", "SELECT AVAILABLE NETWORK")}</p>
                      </div>

                      <div className="space-y-2">
                        {networks.map((net) => {
                          const isConnected = wifiConnected === net.name;
                          const isConnecting = wifiConnecting === net.name;

                          return (
                            <button
                              key={net.name}
                              disabled={wifiConnecting !== null}
                              onClick={() => handleConnect(net.name)}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                                isConnected 
                                  ? "bg-white/5 border-white/20 shadow-md" 
                                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isConnected ? "bg-white/10" : "bg-white/5"}`}>
                                  <Wifi className={`w-4.5 h-4.5 ${isConnected ? "text-emerald-400 animate-pulse" : "text-white/60"}`} />
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-white flex items-center gap-1.5">
                                    {net.name}
                                    {net.saved && <span className="text-[8px] bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-white/40 font-black uppercase tracking-wider">{t("Tersimpan", "Saved")}</span>}
                                  </p>
                                  <p className="text-[10px] text-white/40 font-mono mt-0.5 uppercase tracking-wide">
                                    {isConnected 
                                      ? t("Terhubung (Sinyal Sempurna)", "Connected (Excellent Signal)") 
                                      : isConnecting 
                                      ? t("Menyambungkan...", "Connecting...") 
                                      : net.secure 
                                      ? t("Dilindungi WPA3", "Secured with WPA3") 
                                      : t("Jaringan Terbuka", "Open Network")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isConnecting && (
                                  <div className="w-4 h-4 rounded-full border border-t-white border-white/20 animate-spin" />
                                )}
                                {isConnected && (
                                  <Check className="w-4.5 h-4.5 text-emerald-400" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── BLUETOOTH SETTINGS ── */
              case "bluetooth": {
                const accessories = [
                  { name: "Arthur Beats Solo", type: "headphone", battery: "90%" },
                  { name: "Sultan Ring Smart V4", type: "ring", battery: "65%" },
                  { name: "Cyber Glasses Pro", type: "glasses", battery: "40%" }
                ];

                const handleConnectBt = (name: string) => {
                  if (bluetoothConnected === name) return;
                  setBluetoothConnecting(name);
                  setTimeout(() => {
                    setBluetoothConnected(name);
                    setBluetoothConnecting(null);
                    toast({
                      title: t("Bluetooth Tersambung", "Bluetooth Connected"),
                      description: t(`Berhasil menghubungkan ke ${name}`, `Successfully connected to ${name}`)
                    });
                  }, 1500);
                };

                const handleScanBt = () => {
                  setBluetoothScanning(true);
                  setTimeout(() => {
                    setBluetoothScanning(false);
                    toast({
                      title: t("Pindaian Selesai", "Scan Completed"),
                      description: t("Menemukan 3 perangkat aksesoris di sekitar Anda", "Found 3 accessories nearby")
                    });
                  }, 2000);
                };

                return (
                  <motion.div
                    key="bluetooth-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">Bluetooth</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("HUBUNGKAN PERANGKAT AKSESORIS", "CONNECT EXTERNAL ACCESSORIES")}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                          <span className="text-sm font-semibold">{t("Aktifkan Bluetooth", "Enable Bluetooth")}</span>
                          <SettingsToggle 
                            checked={bluetoothConnected !== null || bluetoothScanning} 
                            onChange={() => {
                              if (bluetoothConnected) {
                                setBluetoothConnected(null);
                                toast({ title: "Bluetooth Mati", description: "Koneksi aksesoris diputus" });
                              } else {
                                handleScanBt();
                              }
                            }} 
                          />
                        </div>

                        {bluetoothScanning ? (
                          <div className="py-8 text-center space-y-3 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl animate-pulse">
                            <div className="w-7 h-7 rounded-full border-2 border-t-white border-white/20 animate-spin mx-auto" />
                            <p className="text-[9px] font-mono tracking-widest text-white/40 uppercase">{t("SEDANG MEMINDAI AKSESORIS...", "SCANNING FOR SIGNALS...")}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {accessories.map((acc) => {
                              const isConnected = bluetoothConnected === acc.name;
                              const isConnecting = bluetoothConnecting === acc.name;

                              return (
                                <button
                                  key={acc.name}
                                  disabled={bluetoothConnecting !== null}
                                  onClick={() => handleConnectBt(acc.name)}
                                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                                    isConnected 
                                      ? "bg-white/5 border-white/20 shadow-md" 
                                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                      <Zap className={`w-4 h-4 ${isConnected ? "text-emerald-400" : "text-white/60"}`} />
                                    </div>
                                    <div>
                                      <p className="text-[14px] font-bold text-white flex items-center gap-2">
                                        {acc.name}
                                        {isConnected && <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold uppercase">{acc.battery}</span>}
                                      </p>
                                      <p className="text-[10px] text-white/40 font-mono mt-0.5 uppercase tracking-wide">
                                        {isConnected 
                                          ? t("Terhubung & Aktif", "Connected & Active") 
                                          : isConnecting 
                                          ? t("Menghubungkan...", "Connecting...") 
                                          : t("Ketuk untuk menyambungkan", "Tap to connect")}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isConnecting && (
                                      <div className="w-4 h-4 rounded-full border border-t-white border-white/20 animate-spin" />
                                    )}
                                    {isConnected && (
                                      <Check className="w-4.5 h-4.5 text-emerald-400" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── SYSTEM UPDATE ── */
              case "system_update": {
                const handleStartUpdate = () => {
                  setSystemUpdating(true);
                  setUpdateProgress(0);
                  const interval = setInterval(() => {
                    setUpdateProgress(prev => {
                      const next = prev + 5;
                      if (next >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                          setSystemRebooting(true);
                          setTimeout(() => {
                            setSystemRebooting(false);
                            setSystemUpdating(false);
                            setSystemUpdateBadge(0);
                            toast({
                              title: t("Pembaruan Selesai!", "System Upgraded!"),
                              description: t("Arthur HyperOS berhasil diperbarui ke v4.1.0-Release", "Successfully upgraded system firmware to build v4.1.0-Release")
                            });
                          }, 1500);
                        }, 500);
                      }
                      return next;
                    });
                  }, 100);
                };

                return (
                  <motion.div
                    key="system-update-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Pembaruan Sistem", "System Update")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("PAKET DISTRIBUSI DISTRO ARTHUR", "ARTHUR DISTRO SYSTEM BUILD")}</p>
                      </div>

                      {systemUpdating ? (
                        <div className="py-8 text-center space-y-4">
                          <div className="relative w-20 h-20 mx-auto rounded-full border border-white/5 flex items-center justify-center">
                            <div className="absolute inset-1 rounded-full border-4 border-white/5 border-t-white animate-spin" />
                            <span className="text-xs font-mono font-black">{updateProgress}%</span>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-white animate-pulse">
                              {updateProgress < 60 
                                ? t("Mengunduh Paket Sistem...", "Downloading System Packages...") 
                                : t("Memasang & Mengonfigurasi...", "Installing & Configuring Kernel...")}
                            </p>
                            <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                              {t("Jangan matikan koneksi atau tutup aplikasi", "Do not interrupt connection or close application")}
                            </p>
                          </div>

                          <div className="w-full h-1.5 bg-white/5 border border-white/15 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white transition-all duration-100" 
                              style={{ width: `${updateProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : systemUpdateBadge > 0 ? (
                        <div className="space-y-4">
                          <div className="bg-[#1565c0]/15 border border-[#1565c0]/30 rounded-2xl p-5 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black uppercase text-[#2196f3] tracking-widest">{t("VERSI BARU TERSEDIA", "NEW BUILD DETECTED")}</span>
                              <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">v4.1.0-Release</span>
                            </div>
                            
                            <div className="space-y-1.5 text-xs text-white/70">
                              <p className="font-semibold text-white">Changelog Updates:</p>
                              <ul className="list-disc list-inside pl-1 space-y-1 text-[11px] text-white/55">
                                <li>{t("Integrasi Aksen Warna & Canvas Eksklusif", "Luxury Accent Color Themes & Canvas Engine")}</li>
                                <li>{t("Engine Kecerahan Layar Absolute Hardware", "Absolute screen physical dimmer engine")}</li>
                                <li>{t("Purging Cache Ledger Keamanan", "High speed storage cache purge channel")}</li>
                              </ul>
                            </div>
                            
                            <p className="text-[10px] font-mono text-white/30">Size: 242.8 MB • Hash: SHA-256 (f8c0a2)</p>
                          </div>

                          <Button
                            onClick={handleStartUpdate}
                            className="w-full h-11 rounded-xl bg-white hover:bg-white/90 text-black font-black uppercase tracking-widest text-[9px] shadow-lg transition-all"
                          >
                            {t("Unduh dan Pasang Pembaruan", "Download & Install Update")}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                              <Check className="w-6 h-6" style={{ color: getAccentColor() }} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{t("Sistem Up-To-Date", "System Up-To-Date")}</p>
                              <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">Arthur HyperOS v4.1.0-Release</p>
                            </div>
                            
                            <p className="text-[10px] text-white/30 max-w-xs mx-auto leading-relaxed">
                              {t("Selamat! Perangkat Anda berjalan pada patch keamanan dan modul kernel termutakhir.", "Congratulations! Your system is running on the latest kernel build and security database.")}
                            </p>
                          </div>

                          <Button
                            onClick={() => {
                              toast({
                                title: t("Sistem Diperiksa", "System Checked"),
                                description: t("Sistem Anda adalah versi terbaru.", "Your system is already up-to-date.")
                              });
                            }}
                            className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1.5"
                          >
                            {t("Periksa Pembaruan Lagi", "Check for Updates Again")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }

              /* ── SECURITY STATUS ── */
              case "security_status": {
                const handleStartScan = () => {
                  setSecurityScanStatus("scanning");
                  let prog = 0;
                  const interval = setInterval(() => {
                    prog += 4;
                    if (prog >= 100) {
                      clearInterval(interval);
                      setSecurityScanStatus("safe");
                      toast({
                        title: t("Pindaian Aman!", "Security Safe!"),
                        description: t("0 ancaman terdeteksi pada node e-commerce Anda.", "0 malware threats found on your local node.")
                      });
                    }
                  }, 100);
                };

                return (
                  <motion.div
                    key="security-status-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Status Keamanan", "Security Status")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("MODUL INTEGRITAS NODE TRANSAKSI", "TRANSACTION LEDGER INTEGRITY CHECK")}</p>
                      </div>

                      <div className="flex flex-col items-center py-6 text-center space-y-4">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          {securityScanStatus === "scanning" && (
                            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/20 animate-spin" />
                          )}
                          
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-500 ${
                            securityScanStatus === "scanning" 
                              ? "bg-white/5 border-white/30 text-white animate-pulse" 
                              : securityScanStatus === "safe" 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10" 
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/10"
                          }`} style={{ borderColor: securityScanStatus === "safe" ? "#30D158" : securityScanStatus === "scanning" ? "#ffffff" : "#FF9F0A" }}>
                            <ShieldCheck className="w-10 h-10" />
                          </div>
                        </div>

                        {securityScanStatus === "needs_scan" && (
                          <div className="space-y-4 w-full">
                            <div>
                              <h4 className="text-sm font-bold text-white">{t("Sistem Belum Dipindai", "System Not Scanned")}</h4>
                              <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">{t("Pindai terakhir: 2 jam lalu", "Last scan: 2 hours ago")}</p>
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed">
                              {t("Sangat disarankan untuk memindai ledger transaksi, cookie auth, dan modul enkripsi public IP secara berkala.", "It is highly recommended to run scanner checking on transaction ledgers, authorization headers, and VPN IP routing tables.")}
                            </p>
                            
                            <Button
                              onClick={handleStartScan}
                              className="w-full h-11 rounded-xl bg-white hover:bg-white/90 text-black font-black uppercase tracking-widest text-[9px] shadow-lg transition-all"
                            >
                              {t("Pindai Node Sekarang", "Scan Node Now")}
                            </Button>
                          </div>
                        )}

                        {securityScanStatus === "scanning" && (
                          <div className="space-y-3 w-full">
                            <div>
                              <p className="text-sm font-bold text-white animate-pulse">{t("Memindai File & Ledger...", "Scanning Ledgers & Signatures...")}</p>
                              <p className="text-[9px] font-mono text-[#34C759] uppercase tracking-wider mt-1 truncate px-4">
                                /sys/nodes/auth_credential.pem
                              </p>
                            </div>
                            
                            <div className="w-full h-1 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-white animate-[pulse_1s_infinite] w-3/4 mx-auto" />
                            </div>
                          </div>
                        )}

                        {securityScanStatus === "safe" && (
                          <div className="space-y-4 w-full">
                            <div>
                              <h4 className="text-sm font-bold text-[#34C759] flex items-center justify-center gap-1">
                                <Check className="w-4 h-4 text-emerald-500" /> {t("Sistem Sepenuhnya Aman", "System Completely Secure")}
                              </h4>
                              <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">{t("PINDAIAN TERAKHIR: BARU SAJA", "LAST SCAN: JUST NOW")}</p>
                            </div>
                            
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-[9px] font-mono text-white/50 text-left space-y-1 w-full">
                              <div className="flex justify-between border-b border-white/5 pb-1"><span>LOG SECURITY NODES:</span> <span className="font-bold text-[#34C759]">VERIFIED</span></div>
                              <div className="flex justify-between border-b border-white/5 pb-1"><span>ENCRYPTED COOKIES:</span> <span className="font-bold text-[#34C759]">SAFE</span></div>
                              <div className="flex justify-between"><span>VULNERABILITIES DETECTED:</span> <span className="font-bold text-white">0 THREATS</span></div>
                            </div>

                            <Button
                              onClick={handleStartScan}
                              className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 font-black uppercase tracking-widest text-[9px] transition-all"
                            >
                              {t("Pindai Ulang", "Scan Again")}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── BRIGHTNESS SETTINGS ── */
              case "brightness": {
                return (
                  <motion.div
                    key="brightness-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sun className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Tampilan & Kecerahan", "Display & Brightness")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("PENGATURAN HARDWARE LAYAR", "SCREEN HARDWARE CALIBRATOR")}</p>
                      </div>

                      <div className="space-y-5">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                          <div className="flex justify-between items-center text-xs font-bold text-white/80">
                            <span>{t("Kecerahan Fisik Layar", "Screen Physical Brightness")}</span>
                            <span className="font-mono">{brightnessValue}%</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Sun className="w-4 h-4 text-white/40" />
                            <input 
                              type="range" 
                              min="20" 
                              max="100" 
                              value={brightnessValue} 
                              onChange={e => setBrightnessValue(parseInt(e.target.value))} 
                              className="flex-1 accent-white h-2 rounded-full cursor-pointer bg-white/10 border border-white/5" 
                            />
                            <Sun className="w-5 h-5 text-white/80 animate-pulse" />
                          </div>
                          
                          <p className="text-[10px] text-white/30">
                            {t("Menurunkan slider akan menggelapkan layar secara fisik untuk kenyamanan mata Anda.", "Lowering slider dims screen physically for eye-protection.")}
                          </p>
                        </div>

                        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><Sun className="w-4 h-4 text-orange-400" /></div>
                              <div>
                                <p className="text-[14px] font-bold text-white">{t("Mode Baca (Warm Sepia)", "Reading Mode (Warm Sepia)")}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">{t("Mengurangi cahaya biru", "Reduce blue light spectrum")}</p>
                              </div>
                            </div>
                            <SettingsToggle checked={readingMode} onChange={() => setReadingMode(!readingMode)} />
                          </div>

                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Moon className="w-4 h-4 text-blue-400" /></div>
                              <div>
                                <p className="text-[14px] font-bold text-white">{t("Kecerahan Otomatis", "Auto Brightness")}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">{t("Menyesuaikan dengan sensor cahaya", "Adapt to environmental lux sensors")}</p>
                              </div>
                            </div>
                            <SettingsToggle checked={true} onChange={() => toast({ title: t("Kecerahan Otomatis Aktif", "Auto Brightness Active") })} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── TEXT SIZE ── */
              case "text_size": {
                const steps = ["small", "normal", "large", "huge"] as const;

                return (
                  <motion.div
                    key="text-size-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Type className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Ukuran Teks", "Text Size")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("PENGUKUR RASIO FONT TERMINAL", "TERMINAL FONT SCALING DECK")}</p>
                      </div>

                      <div className="space-y-5">
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-3">
                          <span className="text-[8px] font-black uppercase text-white/30 tracking-widest block">{t("PRATINJAU DILAYAR", "LIVE SCREEN PREVIEW")}</span>
                          
                          <div className="bg-[#1c1c1e] border border-white/5 rounded-2xl p-4 space-y-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Arthur companions:</p>
                            <p className={`${getTextSizeClass()} font-medium text-white transition-all leading-relaxed`}>
                              {t("Halo VIP! Dengan mengubah ukuran teks ini, semua tulisan setelan sistem akan disesuaikan demi keterbacaan yang sempurna.", "Hello VIP! By adjusting this font sizer, all system settings rows scale dynamically for ideal eye comfort.")}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/40 tracking-wider">
                            <span>{t("SANGAT KECIL", "SMALL SIZE")}</span>
                            <span className="text-white font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[10px]">{textSizeValue.toUpperCase()}</span>
                            <span>{t("SANGAT BESAR", "HUGE SIZE")}</span>
                          </div>

                          <div className="relative flex justify-between items-center px-4 py-2">
                            <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
                            
                            {steps.map((step) => {
                              const isActive = textSizeValue === step;
                              return (
                                <button
                                  key={step}
                                  onClick={() => {
                                    setTextSizeValue(step);
                                    toast({
                                      title: t("Ukuran Teks Diubah", "Text Size Updated"),
                                      description: t(`Font diset ke skala ${step.toUpperCase()}`, `System font scaled to ${step.toUpperCase()}`)
                                    });
                                  }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${
                                    isActive 
                                      ? "bg-white text-black shadow-md border-2 border-white scale-110" 
                                      : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                                  }`}
                                >
                                  <span className="text-[10px] font-bold">A</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── ACCENT THEME COLOR ── */
              case "accent_theme": {
                const themes = [
                  { id: "default", name: "Default Blue", color: "#007AFF", bg: "bg-[#007AFF]" },
                  { id: "cyberpunk", name: "Cyberpunk Pink", color: "#BF5AF2", bg: "bg-[#BF5AF2]" },
                  { id: "emerald", name: "Emerald Green", color: "#30D158", bg: "bg-[#30D158]" },
                  { id: "sultan_gold", name: "Sultan Gold", color: "#FF9F0A", bg: "bg-[#FF9F0A]" },
                  { id: "crimson", name: "Crimson Red", color: "#FF2D55", bg: "bg-[#FF2D55]" }
                ] as const;

                return (
                  <motion.div
                    key="accent-theme-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Palette className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Tema & Warna Aksen", "Theme & Accent Color")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("KUSTOMISASI ENGINE DECK TAMPILAN", "PERSONALIZATION VISUAL ENGINE DECK")}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 text-center">
                          <p className="text-xs text-white/60">{t("Pilih aksen warna untuk diaplikasikan ke semua tombol, tab aktif, dan ornamen visual.", "Select a primary color scheme to customize buttons, active states, and glowing badges.")}</p>
                          
                          <div className="flex justify-center gap-4 py-2">
                            {themes.map((theme) => {
                              const isActive = accentTheme === theme.id;
                              return (
                                <button
                                  key={theme.id}
                                  onClick={() => {
                                    setAccentTheme(theme.id);
                                    toast({
                                      title: t("Aksen Tema Diubah", "Accent Color Updated"),
                                      description: t(`Warna aksen sistem diset ke ${theme.name}`, `System accent set to ${theme.name}`)
                                    });
                                  }}
                                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${theme.bg} ${
                                    isActive 
                                      ? "ring-4 ring-white ring-offset-4 ring-offset-[#1c1c1e] scale-110 shadow-lg" 
                                      : "opacity-60 hover:opacity-100 hover:scale-105"
                                  }`}
                                  style={{ boxShadow: isActive ? `0 0 15px ${theme.color}` : "none" }}
                                >
                                  {isActive && <Check className="w-5 h-5 text-black font-black" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: getAccentColor(), boxShadow: `0 0 8px ${getAccentColor()}` }} />
                          <p className="text-[11px] font-mono text-white/50 uppercase tracking-widest">
                            {t("AKSEN AKTIF:", "ACTIVE COLOR SCHEMA:")} <span className="font-black text-white">{accentTheme.toUpperCase().replace("_", " ")}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── LANGUAGE OPTIONS ── */
              case "language": {
                const languages = [
                  { code: "id", name: "Bahasa Indonesia", subtitle: "Local translation" },
                  { code: "en", name: "English (US)", subtitle: "Universal standard translation" }
                ] as const;

                return (
                  <motion.div
                    key="language-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Languages className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Bahasa", "Language")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("LOKALISASI TRANSLATION GATEWAY", "LOCALIZATION TRANSLATION GATEWAY")}</p>
                      </div>

                      <div className="space-y-2">
                        {languages.map((lang) => {
                          const isActive = languageCode === lang.code;
                          return (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setLanguageCode(lang.code);
                                toast({
                                  title: lang.code === "id" ? "Bahasa Diubah" : "Language Updated",
                                  description: lang.code === "id" ? "Aplikasi diset ke Bahasa Indonesia" : "Application language updated to English (US)"
                                });
                              }}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                                isActive 
                                  ? "bg-white/5 border-white/20" 
                                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div>
                                <p className="text-[14px] font-bold text-white">{lang.name}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">{lang.subtitle}</p>
                              </div>

                              {isActive && (
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black">
                                  <Check className="w-4.5 h-4.5 text-black font-black" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── TIMEZONE SETTINGS ── */
              case "timezone": {
                const zones = [
                  { id: "WIB", name: "WIB (Waktu Indonesia Barat)", offset: "GMT+7", desc: "Jakarta, Surabaya, Medan" },
                  { id: "WITA", name: "WITA (Waktu Indonesia Tengah)", offset: "GMT+8", desc: "Denpasar, Makassar, Balikpapan" },
                  { id: "WIT", name: "WIT (Waktu Indonesia Timur)", offset: "GMT+9", desc: "Ambon, Jayapura, Manokwari" },
                  { id: "UTC", name: "UTC (Coordinated Universal Time)", offset: "GMT+0", desc: "London, Greenwich Standard Time" }
                ] as const;

                return (
                  <motion.div
                    key="timezone-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Zona Waktu", "Timezone")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("KRONOLOGIS SINKRONISASI WAKTU", "CHRONOLOGICAL CLOCK SENSORS")}</p>
                      </div>

                      <div className="space-y-2">
                        {zones.map((zone) => {
                          const isActive = timezoneValue === zone.id;
                          return (
                            <button
                              key={zone.id}
                              onClick={() => {
                                setTimezoneValue(zone.id);
                                toast({
                                  title: t("Zona Waktu Diubah", "Timezone Updated"),
                                  description: t(`Zona waktu diset ke ${zone.name}`, `System clock synchronized with ${zone.name}`)
                                });
                              }}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                                isActive 
                                  ? "bg-white/5 border-white/20" 
                                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div>
                                <p className="text-[14px] font-bold text-white flex items-center gap-2">
                                  {zone.id}
                                  <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold text-white/60">{zone.offset}</span>
                                </p>
                                <p className="text-[10px] text-white/40 mt-0.5">{zone.desc}</p>
                              </div>

                              {isActive && (
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black">
                                  <Check className="w-4.5 h-4.5 text-black font-black" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── CURRENCY FORMAT ── */
              case "currency": {
                return (
                  <motion.div
                    key="currency-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Format Mata Uang", "Currency Format")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("NOMINAL VALUTA LEDGER BALANCE", "CURRENCY SCALE LEDGER INDEX")}</p>
                      </div>

                      <div className="space-y-2">
                        {CURRENCIES.map((fmt) => {
                          const isActive = currencyFormat === fmt.code;
                          const descs: Record<string, string> = {
                            IDR: "Default Local Standard Balance",
                            USD: "Simulated Conversions (Rate: $1 = Rp 16.000)",
                            EUR: "Simulated Conversions (Rate: €1 = Rp 17.500)"
                          };
                          return (
                            <button
                              key={fmt.code}
                              onClick={() => {
                                setGlobalCurrency(fmt.code);
                                toast({
                                  title: t("Mata Uang Diubah", "Currency Scale Switched"),
                                  description: t(`Harga produk & checkout diubah ke format ${fmt.code}`, `Product prices & checkout updated to ${fmt.code}`)
                                });
                              }}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                                isActive 
                                  ? "bg-white/5 border-white/20" 
                                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div>
                                <p className="text-[14px] font-bold text-white flex items-center gap-2">
                                  {fmt.name}
                                  <span className="text-[10px] font-black text-emerald-400 font-mono">({fmt.symbol})</span>
                                </p>
                                <p className="text-[10px] text-white/40 mt-0.5">{descs[fmt.code]}</p>
                              </div>

                              {isActive && (
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black">
                                  <Check className="w-4.5 h-4.5 text-black font-black" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── APP CACHE PURGER ── */
              case "clear_cache": {
                const handlePurge = () => {
                  setClearingCache(true);
                  let counter = 0;
                  const interval = setInterval(() => {
                    counter += 1;
                    if (counter >= 15) {
                      clearInterval(interval);
                      setClearingCache(false);
                      setCacheSize(0);
                      toast({
                        title: t("Cache Berhasil Dihapus", "Cache Safely Purged"),
                        description: t("Berhasil mengosongkan 14.8 MB ruang penyimpanan", "Successfully purged 14.8 MB from temporary buffers")
                      });
                    }
                  }, 100);
                };

                return (
                  <motion.div
                    key="clear-cache-page"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setSettingsSubPage("main")}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold py-1 border-b border-white/5 pb-3 w-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" style={{ color: getAccentColor() }} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t("Kembali", "Back")}</span>
                    </button>

                    <div className="bg-[#1c1c1e] rounded-[2.5rem] p-6 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-5 h-5" style={{ color: getAccentColor() }} />
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Hapus Riwayat & Cache", "Clear History & Cache")}</h3>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("PEMBERSIHAN RUANG KELOLA MEMORI", "TEMPORARY BUFFER DESTRUCT GATEWAY")}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-[#FF3B30]/5 border border-[#FF3B30]/15 rounded-3xl p-5 text-center space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF3B30]/5 blur-xl rounded-full" />
                          
                          <div className="w-16 h-16 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center mx-auto text-[#FF3B30] relative z-10">
                            <Trash2 className="w-7 h-7" />
                          </div>

                          <div className="relative z-10">
                            <p className="text-[10px] uppercase font-black tracking-widest text-white/30">{t("TEMPORARY APP BUFFER SIZE", "TEMPORARY APP BUFFER SIZE")}</p>
                            <p className="text-2xl font-black font-mono text-white mt-1">
                              {cacheSize === 0 ? "0.0 MB" : `${cacheSize} MB`}
                            </p>
                          </div>

                          <p className="text-[10px] text-white/40 leading-relaxed px-2">
                            {t("Menghapus cache akan menghapus receipt logs temporer, cookies visual, dan data sandbox mockup.", "Clearing cache purges local receipt logs, cookie buffers, and temporary visual nodes safely.")}
                          </p>
                        </div>

                        {clearingCache ? (
                          <div className="py-4 text-center space-y-2 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
                            <div className="w-6 h-6 rounded-full border-2 border-t-white border-white/20 animate-spin mx-auto" />
                            <p className="text-[8px] font-mono tracking-widest text-white/40 uppercase animate-pulse">{t("SEDANG MENGHAPUS CACHE...", "SWEEPING STORAGE BUFFERS...")}</p>
                          </div>
                        ) : (
                          <Button
                            onClick={handlePurge}
                            disabled={cacheSize === 0}
                            className={`w-full h-11 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg transition-all ${
                              cacheSize === 0 
                                ? "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed" 
                                : "bg-white hover:bg-white/90 text-black border-white"
                            }`}
                          >
                            {cacheSize === 0 ? t("Cache Sudah Bersih", "Buffers Already Empty") : t("Hapus Cache Sekarang", "Purge Buffers Now")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              /* ── MAIN SETTINGS LIST ── */
              default:
                return (
                  <motion.div
                    key="settings-main"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className={`space-y-5 ${getTextSizeClass()}`}
                  >
                    {/* Premium Profile Header Banner */}
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl p-6 sm:p-8 bg-[#0a0a0c] min-h-[220px] flex flex-col justify-between group">
                      {/* Banner Background (Animated Video or Static Shibuya Neon Cover) */}
                      {user.useAnimation && user.youtubeId ? (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black opacity-30">
                          <iframe
                            className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 aspect-video blur-[0.5px]"
                            src={`https://www.youtube.com/embed/${user.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${user.youtubeId}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
                            allow="autoplay; encrypted-media"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-[#0a0a0c]" />
                        </div>
                      ) : (
                        <>
                          <div 
                            className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-[1px] transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=1200&q=80')" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/85 to-[#0a0a0c] z-0" />
                        </>
                      )}

                      {/* Giant Tokyo Japan Outline/Fill overlay */}
                      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-[0.035]">
                        <span className="text-[120px] font-black tracking-[0.1em] text-white leading-none uppercase italic">TOKYO</span>
                        <span className="text-[32px] font-black tracking-[0.4em] text-white uppercase mt-[-15px] italic">JAPAN</span>
                      </div>

                      {/* Content Container */}
                      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                          <div className="absolute -inset-2.5 bg-white/5 rounded-[2.4rem] blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-[#050507] border-2 border-white/20 relative z-10 shadow-2xl flex items-center justify-center text-white text-4xl sm:text-5xl font-black tracking-tighter transition-all hover:scale-105 duration-300">
                            {getInitials(user.name)}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center sm:text-left min-w-0">
                          <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2.5 flex-wrap justify-center sm:justify-start">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase italic drop-shadow-md">
                              {user.name}
                            </h1>
                            <div className="flex items-center gap-1.5">
                              <span className="border border-amber-500/50 bg-amber-500/10 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-[0.4rem] tracking-wider uppercase select-none">
                                #BETA
                              </span>
                              <button 
                                onClick={() => setEditingProfile(true)}
                                className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all text-white/50 hover:text-white"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Role Badges */}
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                            {isSultan && (
                              <span className="bg-[#991b1b] border border-red-500/30 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                                <Crown className="w-3 h-3 fill-white" /> Sultan Member
                              </span>
                            )}
                            {isCryptoMember && (
                              <span className="bg-[#1e3a8a] border border-blue-500/30 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                                <TrendingUp className="w-3 h-3" /> MyCrypto
                              </span>
                            )}
                            {user.role === "admin" && (
                              <span className="bg-[#78350f] border border-orange-500/30 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                                <ShieldCheck className="w-3 h-3" /> Admin
                              </span>
                            )}
                          </div>

                          {/* Bio status */}
                          <span className="text-red-500 font-extrabold text-xs uppercase tracking-wider mt-2.5 block drop-shadow-sm select-none">
                            {user.bio || "BJIER"}
                          </span>

                          {/* Mail & Clock Joined */}
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-x-4 gap-y-1 text-white/40 text-[10px] font-bold uppercase tracking-wider mt-3.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email.toUpperCase()}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> JOINED {formatJoinedDate(user.createdAt || new Date().toISOString())}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats list at bottom */}
                      <div className="relative z-10 flex gap-6 mt-6 pt-4 border-t border-white/10 w-full justify-center sm:justify-start">
                        <div className="text-center sm:text-left">
                          <p className="text-lg font-black text-white leading-none">{(user.friends || []).length}</p>
                          <p className="text-[9px] uppercase font-black text-white/30 tracking-widest mt-1">Friends</p>
                        </div>
                        <div className="w-px bg-white/10 self-stretch my-1" />
                        <div className="text-center sm:text-left">
                          <p className="text-lg font-black text-white leading-none">{((user.friendRequests || []).length + (user.friends || []).length)}</p>
                          <p className="text-[9px] uppercase font-black text-white/30 tracking-widest mt-1">Followers</p>
                        </div>
                        <div className="w-px bg-white/10 self-stretch my-1" />
                        <div className="text-center sm:text-left">
                          <p className="text-lg font-black text-white leading-none">{((user.sentRequests || []).length + (user.friends || []).length)}</p>
                          <p className="text-[9px] uppercase font-black text-white/30 tracking-widest mt-1">Following</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="relative z-10 flex gap-2">
                      <Link href="/friends">
                        <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0071e3] active:scale-95 transition-all shadow-[0_0_16px_rgba(0,122,255,0.3)] text-white text-[11px] font-black uppercase tracking-widest">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {t("Pesan", "Messages")}
                        </button>
                      </Link>
                      <Link href="/friends">
                        <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-white/60 hover:text-white text-[11px] font-black uppercase tracking-widest">
                          <Users className="w-3.5 h-3.5" />
                          {t("Teman", "Friends")}
                        </button>
                      </Link>
                    </div>

                    {/* Header Title */}
                    <h2 className="text-4xl font-semibold text-white tracking-tight px-1 pt-2">{t("Setelan", "Settings")}</h2>

                    {/* Pill Search Bar */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                      <input
                        type="text"
                        value={settingsSearchQuery}
                        onChange={e => setSettingsSearchQuery(e.target.value)}
                        placeholder={t("Cari di setelan", "Search settings")}
                        className="w-full h-11 bg-[#1c1c1e] rounded-[2rem] pl-10 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none border border-white/5 focus:border-white/20 transition-colors"
                      />
                      {settingsSearchQuery && (
                        <button
                          onClick={() => setSettingsSearchQuery("")}
                          className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white/70 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filtered Dynamic Settings Cards */}
                    {(() => {
                      const q = settingsSearchQuery.toLowerCase().trim();
                      const match = (label: string) => label.toLowerCase().includes(q);

                      // Primary System Groups Filter Flags
                      const group1Labels = ["tentang telepon", "about phone", "pembaruan aplikasi sistem", "status keamanan", "keamanan", "pembaruan", "update", "sistem", "telepon", "hp"];
                      const group2Labels = ["wi-fi", "wifi", "bluetooth", "jaringan seluler", "jaringan", "seluler", "vpn", "internet", "koneksi"];
                      const group3Labels = ["tampilan", "kecerahan", "brightness", "mode gelap", "dark mode", "ukuran teks", "tema", "warna", "layar"];
                      const group4Labels = ["notifikasi", "push notifikasi", "email", "suara notifikasi", "getar", "alert", "pemberitahuan"];
                      const group5Labels = ["bahasa", "language", "zona waktu", "wilayah", "region", "format mata uang", "currency", "lokasi"];
                      const group6Labels = ["ambient animasi", "animasi", "vip soundtrack", "soundtrack", "musik", "volume beats", "volume", "video banner id", "banner", "youtube", "personalisasi", "media"];
                      const group7Labels = ["samarkan node ip", "ip", "node", "two-factor auth", "2fa", "autentikasi", "notifikasi sinyal pasar", "sinyal", "pasar", "keamanan", "privasi", "perlindungan", "lokasi", "riwayat", "cookie"];

                      const show1 = !q || group1Labels.some(match);
                      const show2 = !q || group2Labels.some(match);
                      const show3 = !q || group3Labels.some(match);
                      const show4 = !q || group4Labels.some(match);
                      const show5 = !q || group5Labels.some(match);
                      const show6 = !q || group6Labels.some(match);
                      const show7 = !q || group7Labels.some(match);

                      // Match check across all 39 page groups
                      const filteredPageGroups = pageGroups.map(group => {
                        const matchedRows = group.rows.filter(row => {
                          return !q || 
                            row.label.toLowerCase().includes(q) || 
                            row.desc.toLowerCase().includes(q) || 
                            row.path.toLowerCase().includes(q);
                        });
                        return {
                          ...group,
                          rows: matchedRows,
                          visible: matchedRows.length > 0
                        };
                      });

                      const anyPageGroupVisible = filteredPageGroups.some(g => g.visible);
                      const anyVisible = show1 || show2 || show3 || show4 || show5 || show6 || show7 || anyPageGroupVisible;

                      return (
                        <>
                          {/* ── SEGMENT A: CORE DEVICE SETTINGS ── */}
                          {(!q || show1 || show2 || show3 || show4 || show5 || show6 || show7) && (
                            <div className="space-y-1 py-1">
                              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-4">{t("Setelan Utama Perangkat", "System Hardware & Core Toggles")}</h3>
                              
                              {/* GROUP 1: Sistem */}
                              {show1 && (
                                <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden divide-y divide-white/[0.06]">
                                  {(!q || match("tentang telepon") || match("about phone")) && (
                                    <button onClick={() => setSettingsSubPage("about")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#636366] flex items-center justify-center flex-shrink-0"><Smartphone className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Tentang telepon", "About phone")}</span>
                                      <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />
                                    </button>
                                  )}
                                  {(!q || match("pembaruan aplikasi sistem") || match("pembaruan") || match("update") || match("system app updater")) && (
                                    <button onClick={() => setSettingsSubPage("system_update")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#007AFF] flex items-center justify-center flex-shrink-0"><RefreshCw className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Pembaruan aplikasi sistem", "System app updater")}</span>
                                      <div className="flex items-center gap-2">
                                        {systemUpdateBadge > 0 && (
                                          <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-black text-white">1</span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-white/25" />
                                      </div>
                                    </button>
                                  )}
                                  {(!q || match("status keamanan") || match("keamanan") || match("security status")) && (
                                    <button onClick={() => setSettingsSubPage("security_status")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#34C759] flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Status keamanan", "Security status")}</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${securityScanStatus === "safe" ? "text-emerald-400" : "text-amber-400"}`}>
                                          {securityScanStatus === "safe" ? t("Aman", "Secure") : t("Perlu Pindai", "Scan Required")}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />
                                      </div>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* GROUP 2: Konektivitas */}
                              {show2 && (
                                <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden divide-y divide-white/[0.06]">
                                  {(!q || match("wi-fi") || match("wifi")) && (
                                    <button onClick={() => setSettingsSubPage("wifi")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#007AFF] flex items-center justify-center flex-shrink-0"><Wifi className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>Wi-Fi</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{wifiConnected}</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                  {(!q || match("bluetooth")) && (
                                    <button onClick={() => setSettingsSubPage("bluetooth")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#007AFF] flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>Bluetooth</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{bluetoothConnected || t("Mati", "Off")}</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                  {(!q || match("jaringan seluler") || match("seluler") || match("mobile networks")) && (
                                    <button onClick={() => toast({ title: t("Jaringan Seluler", "Mobile Networks"), description: t("Simulasi 5G Aktif & Stabil", "5G connection active & stable") })} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#34C759] flex items-center justify-center flex-shrink-0"><Radio className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Jaringan seluler", "Mobile networks")}</span>
                                      <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />
                                    </button>
                                  )}
                                  {(!q || match("vpn")) && (
                                    <button onClick={() => { setIpProtected(!ipProtected); toast({ title: !ipProtected ? t("VPN Aktif", "VPN Connected") : t("VPN Mati", "VPN Disconnected"), description: !ipProtected ? t("Koneksi aman melalui Arthur Node", "Secure connection via Arthur Node") : t("Koneksi langsung", "Direct connection") }); }} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#007AFF] flex items-center justify-center flex-shrink-0"><Globe className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>VPN</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{ipProtected ? t("Aktif", "Active") : t("Mati", "Off")}</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* GROUP 3: Tampilan */}
                              {show3 && (
                                <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden divide-y divide-white/[0.06]">
                                  {(!q || match("tampilan & kecerahan") || match("tampilan") || match("layar") || match("brightness")) && (
                                    <button onClick={() => setSettingsSubPage("brightness")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#FF9F0A] flex items-center justify-center flex-shrink-0"><Sun className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Tampilan & Kecerahan", "Display & Brightness")}</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{brightnessValue}%</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                  {(!q || match("mode gelap") || match("dark mode") || match("tema")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#636366] flex items-center justify-center flex-shrink-0"><Moon className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-white font-normal ${getLabelTextSizeClass()}`}>{t("Mode Gelap", "Dark Mode")}</span>
                                      <SettingsToggle checked={true} onChange={() => toast({ title: t("Mode Gelap Aktif", "Dark Mode Active") })} />
                                    </div>
                                  )}
                                  {(!q || match("ukuran teks") || match("teks") || match("text size")) && (
                                    <button onClick={() => setSettingsSubPage("text_size")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#5E5CE6] flex items-center justify-center flex-shrink-0"><Type className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Ukuran Teks", "Text Size")}</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{textSizeValue.toUpperCase()}</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                  {(!q || match("warna") || match("tema") || match("aksen") || match("accent")) && (
                                    <button onClick={() => setSettingsSubPage("accent_theme")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#BF5AF2] flex items-center justify-center flex-shrink-0"><Palette className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Tema & Warna Aksen", "Theme & Accent Color")}</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{accentTheme === "default" ? "DEFAULT" : accentTheme.toUpperCase().replace("_", " ")}</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* GROUP 4: Notifikasi */}
                              {show4 && (
                                <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden divide-y divide-white/[0.06]">
                                  {(!q || match("notifikasi") || match("pemberitahuan") || match("notifications")) && (
                                    <button onClick={() => toast({ title: t("Setelan Notifikasi", "Notification Settings"), description: t("Gunakan switch di bawah untuk kustomisasi cepat", "Use the switches below for quick customization") })} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#FF3B30] flex items-center justify-center flex-shrink-0"><Bell className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Notifikasi", "Notifications")}</span>
                                      <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />
                                    </button>
                                  )}
                                  {(!q || match("push notifikasi") || match("notifikasi") || match("push notifications")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#FF9F0A] flex items-center justify-center flex-shrink-0"><BellRing className="w-5 h-5 text-white" /></div>
                                      <div className="flex-grow"><p className={`text-white font-normal ${getLabelTextSizeClass()}`}>{t("Push Notifikasi", "Push Notifications")}</p><p className={`text-white/40 mt-0.5 ${getSublabelTextSizeClass()}`}>{t("Transaksi & sinyal", "Transactions & signals")}</p></div>
                                      <SettingsToggle checked={marketAlertsEnabled} onChange={() => { setMarketAlertsEnabled(!marketAlertsEnabled); toast({ title: !marketAlertsEnabled ? t("Push Notif Aktif", "Push Notif Active") : t("Push Notif Mati", "Push Notif Inactive") }); }} />
                                    </div>
                                  )}
                                  {(!q || match("suara notifikasi") || match("suara") || match("getar") || match("sound")) && (
                                    <button onClick={() => { const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav"); audio.volume = 0.3; audio.play().catch(() => {}); toast({ title: t("Suara & Getar", "Sound & Vibration"), description: t("Efek audio sistem diaktifkan", "System audio effects enabled") }); }} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#30D158] flex items-center justify-center flex-shrink-0"><Volume2 className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Suara & Getar", "Sound & Vibration")}</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{t("Hidup", "Active")}</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                  {(!q || match("email") || match("notifikasi") || match("email notifications")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#007AFF] flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5 text-white" /></div>
                                      <div className="flex-grow"><p className={`text-white font-normal ${getLabelTextSizeClass()}`}>{t("Notifikasi Email", "Email Notifications")}</p><p className={`text-white/40 mt-0.5 ${getSublabelTextSizeClass()}`}>{user.email}</p></div>
                                      <SettingsToggle checked={true} onChange={() => toast({ title: t("Email Notif Diubah", "Email Notifications Updated") })} />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* GROUP 5: Bahasa & Wilayah */}
                              {show5 && (
                                <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden divide-y divide-white/[0.06]">
                                  {(!q || match("bahasa") || match("language")) && (
                                    <button onClick={() => setSettingsSubPage("language")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#007AFF] flex items-center justify-center flex-shrink-0"><Languages className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Bahasa", "Language")}</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{languageCode === "id" ? "Indonesia" : "English (US)"}</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                  {(!q || match("zona waktu") || match("wilayah") || match("region") || match("timezone")) && (
                                    <button onClick={() => setSettingsSubPage("timezone")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#636366] flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Zona Waktu", "Timezone")}</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{timezoneValue} (UTC{timezoneValue === "WIB" ? "+7" : timezoneValue === "WITA" ? "+8" : timezoneValue === "WIT" ? "+9" : "+0"})</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                  {(!q || match("format mata uang") || match("currency") || match("mata uang")) && (
                                    <button onClick={() => setSettingsSubPage("currency")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#34C759] flex items-center justify-center flex-shrink-0"><Coins className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Format Mata Uang", "Currency Format")}</span>
                                      <div className="flex items-center gap-1"><span className={`text-white/40 ${getSublabelTextSizeClass()}`}>{currencyFormat}</span><ChevronRight className="w-4 h-4 text-white/25" /></div>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* GROUP 6: Personalisasi & Ambient */}
                              {show6 && (
                                <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden divide-y divide-white/[0.06]">
                                  {(!q || match("ambient animasi") || match("animasi")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#BF5AF2] flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5 text-white" /></div>
                                      <span className="flex-1 text-white text-[15px] font-normal">Ambient Animasi</span>
                                      <SettingsToggle checked={!!user.useAnimation} onChange={() => { updateUser({ useAnimation: !user.useAnimation }); toast({ title: !user.useAnimation ? "Ambient Aktif" : "Ambient Mati" }); }} />
                                    </div>
                                  )}
                                  {(!q || match("vip soundtrack") || match("musik") || match("soundtrack")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#FF2D55] flex items-center justify-center flex-shrink-0"><Music className="w-5 h-5 text-white" /></div>
                                      <div className="flex-grow min-w-0">
                                        <p className="text-white text-[15px] font-normal">VIP Soundtrack</p>
                                        {musicPlaying && <p className="text-white/40 text-xs mt-0.5">Sedang diputar...</p>}
                                      </div>
                                      <button onClick={toggleMusic} className={`h-8 px-3.5 rounded-full font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 ${musicPlaying ? "bg-[#FF2D55]/20 text-[#FF2D55] border border-[#FF2D55]/30" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"}`}>
                                        {musicPlaying ? <><Pause className="w-3 h-3 fill-current" /> Pause</> : <><Play className="w-3 h-3 fill-current" /> Play</>}
                                      </button>
                                    </div>
                                  )}
                                  {musicPlaying && (!q || match("volume beats") || match("volume")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#30D158] flex items-center justify-center flex-shrink-0"><Volume2 className="w-5 h-5 text-white" /></div>
                                      <div className="flex-grow space-y-1.5">
                                        <div className="flex justify-between"><span className="text-white text-[15px] font-normal">Volume Beats</span><span className="text-white/40 text-sm">{Math.round(musicVolume * 100)}%</span></div>
                                        <input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))} className="w-full accent-[#30D158] h-1 rounded-full cursor-pointer" />
                                      </div>
                                    </div>
                                  )}
                                  {(!q || match("video banner id") || match("banner") || match("youtube")) && (
                                    <div className="flex flex-col gap-3 px-4 py-3.5">
                                      <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-[0.65rem] bg-[#FF3B30] flex items-center justify-center flex-shrink-0"><Sliders className="w-5 h-5 text-white" /></div>
                                        <div className="flex-1"><p className="text-white text-[15px] font-normal">Video Banner ID</p><p className="text-white/40 text-xs mt-0.5 truncate max-w-[220px]">{user.youtubeId || "Tidak ada ID aktif"}</p></div>
                                      </div>
                                      <div className="flex gap-2 pl-[52px]">
                                        <input value={ytInput} onChange={e => setYtInput(e.target.value)} placeholder="Masukkan YouTube Video ID" className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors" />
                                        <Button onClick={() => { updateUser({ youtubeId: ytInput.trim() }); toast({ title: "Banner diperbarui" }); }} className="h-9 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs px-4">Simpan</Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* GROUP 7: Keamanan & Privasi */}
                              {show7 && (
                                <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden divide-y divide-white/[0.06]">
                                  {(!q || match("samarkan node ip") || match("ip") || match("privasi")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#34C759] flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5 text-white" /></div>
                                      <div className="flex-1"><p className="text-white text-[15px] font-normal">Samarkan Node IP</p><p className="text-white/40 text-xs mt-0.5">{ipProtected ? "Terlindungi" : "Terbuka"}</p></div>
                                      <SettingsToggle checked={ipProtected} onChange={() => { setIpProtected(!ipProtected); toast({ title: !ipProtected ? "IP Terlindungi" : "IP Terbuka" }); }} />
                                    </div>
                                  )}
                                  {(!q || match("two-factor auth") || match("2fa") || match("autentikasi")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#FF9F0A] flex items-center justify-center flex-shrink-0"><Lock className="w-5 h-5 text-white" /></div>
                                      <div className="flex-grow"><p className="text-white text-[15px] font-normal">Two-Factor Auth</p><p className="text-white/40 text-xs mt-0.5">{twoFactorEnabled ? "Aktif" : "Nonaktif"}</p></div>
                                      <SettingsToggle checked={twoFactorEnabled} onChange={() => { setTwoFactorEnabled(!twoFactorEnabled); toast({ title: !twoFactorEnabled ? "2FA Diaktifkan" : "2FA Nonaktif" }); }} />
                                    </div>
                                  )}
                                  {(!q || match("notifikasi sinyal pasar") || match("sinyal") || match("pasar")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#5E5CE6] flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5 text-white" /></div>
                                      <div className="flex-grow"><p className="text-white text-[15px] font-normal">Notifikasi Sinyal Pasar</p><p className="text-white/40 text-xs mt-0.5">{marketAlertsEnabled ? "Aktif" : "Senyap"}</p></div>
                                      <SettingsToggle checked={marketAlertsEnabled} onChange={() => { setMarketAlertsEnabled(!marketAlertsEnabled); toast({ title: !marketAlertsEnabled ? "Sinyal Aktif" : "Sinyal Senyap" }); }} />
                                    </div>
                                  )}
                                  {(!q || match("lokasi") || match("privasi")) && (
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#007AFF] flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-white" /></div>
                                      <div className="flex-grow"><p className="text-white text-[15px] font-normal">Izin Lokasi</p><p className="text-white/40 text-xs mt-0.5">Saat menggunakan aplikasi</p></div>
                                      <SettingsToggle checked={false} onChange={() => toast({ title: "Izin Lokasi Diubah" })} />
                                    </div>
                                  )}
                                  {(!q || match("riwayat") || match("cookie") || match("privasi") || match("cache") || match("clear")) && (
                                    <button onClick={() => setSettingsSubPage("clear_cache")} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors">
                                      <div className="w-9 h-9 rounded-[0.65rem] bg-[#FF3B30] flex items-center justify-center flex-shrink-0"><Trash2 className="w-5 h-5 text-white" /></div>
                                      <span className={`flex-1 text-left text-white font-normal ${getLabelTextSizeClass()}`}>{t("Hapus Riwayat & Cache", "Clear History & Cache")}</span>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-white/40 ${getSublabelTextSizeClass()}`}>
                                          {cacheSize === 0 ? t("Terhapus", "Cleared") : `${cacheSize} MB`}
                                        </span>
                                        <ChevronRight className="w-4.5 h-4.5 text-white/25 flex-shrink-0" />
                                      </div>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── SEGMENT B: ALL WORKSPACE PAGES CATEGORIES ── */}
                          {filteredPageGroups.map(group => {
                            if (!group.visible) return null;

                            return (
                              <div key={group.id} className="space-y-1 py-1">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-4">{group.title}</h3>
                                <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden divide-y divide-white/[0.06]">
                                  {group.rows.map(row => (
                                    <Link key={row.path} href={row.path}>
                                      <button className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] transition-colors text-left group/row">
                                        <div 
                                          className={`w-9 h-9 rounded-[0.65rem] flex items-center justify-center flex-shrink-0 group-hover/row:scale-105 transition-transform duration-300`}
                                          style={{
                                            background: row.isGradient ? "linear-gradient(135deg, #FFD700, #FF8C00)" : `${row.color}15`,
                                            border: `1px solid ${row.isGradient ? "rgba(255, 215, 0, 0.4)" : `${row.color}30`}`
                                          }}
                                        >
                                          <row.icon className="w-4.5 h-4.5" style={{ color: row.isGradient ? "#ffffff" : row.color }} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-white font-bold leading-snug ${getLabelTextSizeClass()}`}>{row.label}</p>
                                          <p className={`text-white/40 truncate ${getSublabelTextSizeClass()}`}>{row.desc}</p>
                                        </div>
                                        
                                        <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0 group-hover/row:translate-x-1 transition-transform" />
                                      </button>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                          {/* GROUP 8: Terminate Session */}
                          <div className="bg-[#1c1c1e] rounded-[1.8rem] overflow-hidden">
                            {(!q || match("keluar dari akun") || match("keluar") || match("logout") || match("akun")) && (
                              <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#FF3B30]/5 transition-colors group">
                                <div className="w-9 h-9 rounded-[0.65rem] bg-[#FF3B30]/15 border border-[#FF3B30]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF3B30]/25 transition-colors"><LogOut className="w-5 h-5 text-[#FF3B30]" /></div>
                                <div className="flex-grow text-left min-w-0">
                                  <p className="text-[#FF3B30] text-[15px] font-semibold">Keluar dari Akun</p>
                                  <p className="text-[#FF3B30]/50 text-xs mt-0.5">Sesi akan diakhiri</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#FF3B30]/30 flex-shrink-0" />
                              </button>
                            )}
                          </div>

                          {/* No results state */}
                          {q && !anyVisible && (
                            <div className="py-16 flex flex-col items-center gap-3 text-center">
                              <svg className="w-12 h-12 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="1.5"/><path d="m21 21-4.35-4.35" strokeWidth="1.5" strokeLinecap="round"/></svg>
                              <p className="text-white/40 text-sm font-normal">Tidak ada hasil untuk <span className="text-white/70">"{settingsSearchQuery}"</span></p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </motion.div>
                );
            }
          })()}
        </AnimatePresence>

        {/* --- Node authorized statistics at bottom --- */}
        <div className="bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-md">
          <div className="px-8 py-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Authorized Account & Security</h3>
            <ShieldCheck className="h-4.5 w-4.5 text-white/80" />
          </div>
          <div className="divide-y divide-white/5 text-xs font-bold text-white/60">
            <div className="flex items-center justify-between px-8 py-4.5 hover:bg-white/[0.01] transition-colors">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Account Node UID</span>
              <span className="font-mono text-[10px] text-white/70">{user.id}</span>
            </div>
            <div className="flex items-center justify-between px-8 py-4.5 hover:bg-white/[0.01] transition-colors">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Authorized Public IP</span>
              <span className="font-mono text-[10px] text-white/70">
                {ipProtected ? "127.0.0.1 (Arthur VIP Secure Encrypted Protocol)" : (user.publicIp || "192.168.10.82")}
              </span>
            </div>
            <div className="flex items-center justify-between px-8 py-4.5 hover:bg-white/[0.01] transition-colors">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Node Credentials</span>
              <span className="text-[9px] px-2.5 py-0.5 rounded bg-white/10 border border-white/20 text-white uppercase tracking-widest font-black">Authorized</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Screen Physical Brightness Dimming Overlay ── */}
      <div 
        className="fixed inset-0 pointer-events-none z-[99999] bg-black transition-opacity duration-300" 
        style={{ opacity: (100 - brightnessValue) / 125 }} 
      />

      {/* ── Warm Reading Mode Sepia Overlay ── */}
      <div 
        className="fixed inset-0 pointer-events-none z-[99998] bg-[#f97316]/5 transition-opacity duration-300" 
        style={{ opacity: readingMode ? 1 : 0 }} 
      />

      {/* ── Simulated System Reboot Flash Overlay ── */}
      <AnimatePresence>
        {systemRebooting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[999999] flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <p className="text-[10px] font-mono tracking-widest text-white/50 uppercase">ARTHUR HYPEROS SYSTEM REBOOTING...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile Customization Modal ── */}
      <AnimatePresence>
        {editingProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] p-6 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="space-y-1">
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t("Kustomisasi Profil", "Customize Profile")}</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t("UBAH KREDENSI IDENTITAS ANDA", "EDIT YOUR IDENTITY CREDENTIALS")}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block">{t("NAMA PROFILE", "PROFILE NAME")}</label>
                  <input
                    type="text"
                    value={profileNameInput}
                    onChange={e => setProfileNameInput(e.target.value)}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-white/40 tracking-wider block">{t("BIO / STATUS", "BIO / STATUS")}</label>
                  <input
                    type="text"
                    value={profileBioInput}
                    onChange={e => setProfileBioInput(e.target.value)}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 font-bold uppercase tracking-widest text-[9px]"
                >
                  {t("Batal", "Cancel")}
                </Button>
                <Button 
                  onClick={() => {
                    if (profileNameInput.trim()) {
                      updateUser({ name: profileNameInput.trim(), bio: profileBioInput.trim() });
                      toast({ title: t("Profil Diperbarui", "Profile Updated"), description: t("Nama dan bio berhasil disimpan.", "Successfully updated name and status bio.") });
                      setEditingProfile(false);
                    }
                  }}
                  className="flex-1 h-11 rounded-xl bg-white hover:bg-white/90 text-black font-black uppercase tracking-widest text-[9px] shadow-lg"
                >
                  {t("Simpan", "Save")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors focus:outline-none flex items-center ${
        checked ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/10 border border-white/10"
      }`}
    >
      <motion.div 
        layout
        className="w-5 h-5 rounded-full bg-white shadow-md"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
