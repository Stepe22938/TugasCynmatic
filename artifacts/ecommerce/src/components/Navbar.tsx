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
import { Button } from "./ui/button";

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`;
}

export function Navbar() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();
  const { activeSessions } = useLive();
  const isLive = activeSessions.length > 0;
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location === path;

  const navItems = [
    { path: "/", label: "Home", icon: Package },
    { path: "/flashsale", label: "Flash Sale", icon: Zap, pulse: true },
    { path: "/orders", label: "Pesanan", icon: ClipboardList },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? "h-16 bg-background/60 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]" 
        : "h-20 bg-transparent py-2"
    }`}>
      <div className="container mx-auto h-full px-6 flex items-center justify-between">
 
        {/* Logo Section */}
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:rotate-12 transition-transform">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-gradient">Cynmatic</span>
          </Link>

          {/* Premium Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div className={`relative px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-xl ${
                  isActive(item.path) ? "text-white" : "text-muted-foreground hover:text-white"
                }`}>
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon className={`h-3.5 w-3.5 ${item.pulse ? "animate-pulse text-orange-500" : ""}`} />
                    {item.label}
                  </span>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-orange-600/20 border border-orange-500/50 rounded-xl z-0 shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
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
            
            <div className="w-px h-4 bg-white/10 mx-0.5" />

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10">
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-black text-white shadow-lg shadow-orange-600/30 ring-2 ring-background">
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
                  <span className="text-xs font-black text-foreground group-hover:text-orange-500 transition-colors uppercase tracking-tighter">
                    {user.name.split(" ")[0]}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 opacity-50">
                    {user.role}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-white/10 group-hover:ring-orange-500/50 transition-all">
                  <img src={avatarUrl(user.name)} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
