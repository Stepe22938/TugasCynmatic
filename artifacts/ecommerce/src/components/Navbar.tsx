/**
 * Navbar.tsx
 * Navigasi utama + notification bell + LIVE indicator + Kurir link + Theme Toggle.
 */
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, ClipboardList, ShieldCheck, Store, Bell,
         CheckCheck, Trash2, Radio, Truck, Moon, Sun, ArrowRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLive } from "../contexts/LiveContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

const NOTIF_ICON: Record<string, string> = {
  order_placed: "🛍️", order_received: "📦",
  product_approved: "✅", product_rejected: "❌",
  friend_request: "👥", friend_accept: "🤝",
  gift_received: "🎁", points_earned: "✨",
  promo: "🔥", system: "⚙️", report_status: "🚩"
};

export function Navbar() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();
  const { activeSessions } = useLive();
  const isLive = activeSessions.length > 0;
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location === path;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBellClick = () => {
    setBellOpen((v) => !v);
    if (!bellOpen && unreadCount > 0) markAllRead();
  };

  const navItems = [
    { path: "/", label: "Home", icon: Package },
    { path: "/flashsale", label: "Flash Sale", icon: Zap, pulse: true },
    { path: "/orders", label: "Pesanan", icon: ClipboardList },
    ...(user?.role === "seller" || user?.role === "admin" ? [{ path: "/seller", label: "Dashboard", icon: Store }] : []),
    ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 border-b ${
      scrolled 
        ? "bg-background/95 backdrop-blur-xl py-2 shadow-xl shadow-black/5" 
        : "bg-background/50 backdrop-blur-md py-4"
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
 
        {/* Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-primary font-black text-2xl tracking-tighter group transition-all active:scale-95">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="bg-primary/10 p-1.5 rounded-xl border border-primary/20"
            >
              <Package className="h-7 w-7" />
            </motion.div>
            <span className="hidden sm:inline">Toko Online</span>
          </Link>

          {/* Desktop Nav Items with Sliding Underline */}
          <nav className="hidden lg:flex items-center gap-1 relative">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div className={`relative px-4 py-2 text-sm font-bold transition-all cursor-pointer rounded-xl hover:bg-muted/50 ${
                  isActive(item.path) ? "text-primary" : item.pulse ? "text-orange-500" : "text-muted-foreground hover:text-foreground"
                }`}>
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.pulse ? "animate-pulse fill-orange-500" : ""}`} />
                    {item.label}
                  </span>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20 z-0"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-2">

          {/* LIVE button */}
          <Link href="/live">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${
                isLive
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30 ring-4 ring-red-600/10 animate-pulse"
                  : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent"
              }`}
            >
              {isLive ? (
                <><motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-white rounded-full" />LIVE</>
              ) : (
                <><Radio className="h-3.5 w-3.5" /><span className="hidden md:inline">Live Show</span></>
              )}
            </motion.button>
          </Link>

          <div className="flex items-center bg-muted/30 p-1 rounded-2xl border border-border/50">
            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-10 w-10">
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </motion.div>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Keranjang */}
            <Link href="/cart">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="relative rounded-xl h-10 w-10" data-testid="button-cart-icon">
                  <ShoppingCart className="h-5 w-5" />
                  <AnimatePresence>
                    {totalItems > 0 && (
                      <motion.span 
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        data-testid="text-cart-count"
                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow-lg shadow-primary/20"
                      >
                        {totalItems}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* Avatar / Profile */}
          {user && (
            <Link href="/profile">
              <motion.button 
                whileHover={{ x: 3 }}
                data-testid="button-nav-profile" 
                className="flex items-center gap-3 ml-2 pl-4 border-l border-border/50 group"
              >
                <div className="hidden md:flex flex-col items-end leading-none">
                  <span className="text-[13px] font-black text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                    {user.name.split(" ")[0]}
                    {user.role === "admin"  && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                    {user.role === "seller" && <Store className="h-3.5 w-3.5 text-purple-500" />}
                    {user.role === "kurir"  && <Truck className="h-3.5 w-3.5 text-blue-500" />}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.1em] mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {user.role} Account
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-2xl overflow-hidden ring-4 transition-all duration-300 ${
                  isActive("/profile") ? "ring-primary/20 border-2 border-primary" : "ring-transparent border-2 border-transparent group-hover:border-primary/50"
                }`}>
                  <img src={avatarUrl(user.name)} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
