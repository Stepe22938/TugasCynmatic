/**
 * Navbar.tsx
 * Navigasi utama Premium - Glassmorphism & High-end UI.
 */
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, ClipboardList, ShieldCheck, Store, Bell,
         CheckCheck, Trash2, Radio, Truck, Moon, Sun, ArrowRight, Zap, Gem } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLive } from "../contexts/LiveContext";
import { useTheme } from "../contexts/ThemeContext";
import { useCosmetics } from "../contexts/CosmeticContext";
import { Button } from "./ui/button";

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`;
}

export function Navbar() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { cosmetics } = useCosmetics();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const { activeSessions } = useLive();
  const isLive = activeSessions.length > 0;
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const equippedCosmetics = user?.equippedCosmetics;
  const equippedTags = equippedCosmetics
    ? (Array.isArray(equippedCosmetics) ? equippedCosmetics : [])
        .map(id => cosmetics.find(c => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c && c.type === "tag")
    : [];

  const equippedVisual = equippedCosmetics
    ? cosmetics.find(c => c.type === "visual" && equippedCosmetics.includes(c.id))
    : undefined;

  const userAvatar = equippedVisual?.value || user?.avatar || avatarUrl(user?.name || "");

  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location === path.split("#")[0];

  const navItems = [
    { path: "/", label: "Home", icon: Package },
    { path: "/flashsale", label: "Flash Sale", icon: Zap, pulse: true },
    { path: "/orders", label: "Pesanan", icon: ClipboardList },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
      scrolled 
        ? "h-16 bg-background/60 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]" 
        : "h-20 bg-transparent py-2"
    }`}>
      <div className="container mx-auto h-full px-6 flex items-center justify-between">
 
        {/* Logo Section */}
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8B732A] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 group-hover:rotate-12 transition-transform">
              <ShieldCheck className="h-6 w-6 text-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-gradient">TokoArthur</span>
          </Link>

          {/* Premium Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div className={`relative px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-xl ${
                  isActive(item.path) ? "text-white" : "text-muted-foreground hover:text-white"
                }`}>
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon className={`h-3.5 w-3.5 ${item.pulse ? "animate-pulse text-[#D4AF37]" : ""}`} />
                    {item.label}
                  </span>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-xl z-0 shadow-[0_0_20px_-5px_rgba(212,175,55,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </nav>
        </div>



        {/* Mobile Nav Toggle */}
        <div className="flex lg:hidden items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-9 w-9 text-muted-foreground">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-white/5 rounded-xl border border-white/10"
          >
            <motion.div animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 6 : 0 }} className="w-5 h-0.5 bg-white" />
            <motion.div animate={{ opacity: isMobileMenuOpen ? 0 : 1 }} className="w-5 h-0.5 bg-white" />
            <motion.div animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -6 : 0 }} className="w-5 h-0.5 bg-white" />
          </button>
        </div>

        {/* Desktop Right Section */}
        <div className="hidden lg:flex items-center gap-4">
          {/* LIVE indicator */}
          <Link href="/live">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                isLive
                  ? "bg-red-600/10 border-red-500/50 text-red-500 shadow-lg shadow-red-500/20"
                  : "bg-white/5 border-white/5 text-muted-foreground hover:text-white"
              }`}
            >
              {isLive ? (
                <><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE NOW</>
              ) : (
                <><Radio className="h-3.5 w-3.5" /> Live Show</>
              )}
            </motion.button>
          </Link>

          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {(user?.role === "kurir" || user?.role === "admin") && (
              <Link href="/courier">
                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10">
                  <Truck className="h-4 w-4" />
                </Button>
              </Link>
            )}
            
            <div className="w-px h-4 bg-white/10 mx-0.5" />

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative rounded-xl h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white shadow-lg shadow-red-500/30 ring-2 ring-background animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-background/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[110]"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Notifications</h3>
                      <button onClick={markAllRead} className="text-[9px] font-black text-[#D4AF37] uppercase hover:underline">Clear All</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {unreadCount === 0 ? (
                        <div className="p-8 text-center">
                          <CheckCheck className="h-8 w-8 text-white/10 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">All caught up!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {notifications.slice(0, 3).map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => markRead(n.id)}
                              className={`p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3 relative ${
                                !n.read ? "bg-[#D4AF37]/5" : ""
                              }`}
                            >
                              {!n.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]" />
                              )}
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-[10px] font-black uppercase tracking-wider truncate ${
                                    !n.read ? "text-[#D4AF37]" : "text-white/40"
                                  }`}>
                                    {n.title}
                                  </p>
                                  {!n.read && (
                                    <span className="bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter flex-shrink-0 animate-pulse">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-white/70 line-clamp-1 mt-1 font-medium">
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link href="/notifications" onClick={() => setIsNotifOpen(false)}>
                      <div className="p-3 text-center bg-white/5 border-t border-white/5 hover:bg-white/10 transition-colors">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">View Full Matrix</span>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10">
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-black text-black shadow-lg shadow-[#D4AF37]/30 ring-2 ring-background">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* User Profile */}
          {user && (
            <Link href="/profile">
              <button className="flex items-center gap-3 pl-3 border-l border-white/10 group">
                <div className="hidden md:flex flex-col items-end leading-none">
                  <div className="flex items-center gap-1.5 justify-end">
                    {equippedTags.map(tag => (
                      <span
                        key={tag.id}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${
                          tag.rarity === "legendary"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse"
                            : tag.rarity === "epic"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                            : tag.rarity === "rare"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {tag.value}
                      </span>
                    ))}
                    <span className="text-xs font-black text-foreground group-hover:text-[#D4AF37] transition-colors uppercase tracking-tighter">
                      {user.name.split(" ")[0]}
                    </span>
                  </div>
                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-50">
                    {user.role}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-white/10 group-hover:ring-[#D4AF37]/50 transition-all">
                  <img src={userAvatar} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-2xl border-b border-white/10 p-6 space-y-4 shadow-2xl"
          >
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isActive(item.path) ? "bg-[#D4AF37]/20 text-white border border-[#D4AF37]/50" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${item.pulse ? "animate-pulse text-[#D4AF37]" : ""}`} />
                  <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                </div>
              </Link>
            ))}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              {user ? (
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3">
                    <img src={userAvatar} className="w-10 h-10 rounded-xl" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-black text-white uppercase">{user.name}</p>
                        {equippedTags.map(tag => (
                          <span
                            key={tag.id}
                            className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border transition-all ${
                              tag.rarity === "legendary"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse"
                                : tag.rarity === "epic"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                                : tag.rarity === "rare"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                            }`}
                          >
                            {tag.value}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{user.role}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#D4AF37] text-black font-black uppercase tracking-widest text-xs h-12 rounded-xl">Login Access</Button>
                </Link>
              )}
              <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="relative w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-white" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[9px] font-black text-black w-5 h-5 rounded-full flex items-center justify-center">{totalItems}</span>
                  )}
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
