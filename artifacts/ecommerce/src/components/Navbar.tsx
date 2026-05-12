/**
 * Navbar.tsx
 * Navigasi utama + notification bell + LIVE indicator.
 */
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, ClipboardList, ShieldCheck, Store, Bell, CheckCheck, Trash2, Radio } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLive } from "../contexts/LiveContext";
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
  order_placed: "🛍️",
  order_received: "📦",
  product_approved: "✅",
  product_rejected: "❌",
};

export function Navbar() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();
  const { session } = useLive();
  const [location] = useLocation();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location === path;

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  const handleBellClick = () => {
    setBellOpen((v) => !v);
    if (!bellOpen && unreadCount > 0) markAllRead();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl flex-shrink-0">
          <Package className="h-6 w-6" />
          <span className="hidden sm:inline">Toko Online</span>
          <span className="sm:hidden">Toko</span>
        </Link>

        {/* Nav kanan */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* LIVE indicator — shown to everyone when live is active */}
          <Link href="/live">
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session.isLive
                  ? "bg-red-600 text-white animate-pulse"
                  : "border border-muted text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
              title={session.isLive ? "Live sedang berlangsung!" : "Live Shopping"}
            >
              {session.isLive ? (
                <>
                  <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                  LIVE
                </>
              ) : (
                <>
                  <Radio className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Live</span>
                </>
              )}
            </button>
          </Link>

          {/* Seller dashboard */}
          {user?.role === "seller" && (
            <Link href="/seller">
              <Button variant={isActive("/seller") ? "secondary" : "ghost"} size="sm"
                className="hidden sm:flex items-center gap-1.5" data-testid="button-nav-seller">
                <Store className="h-4 w-4" />Dashboard
              </Button>
              <Button variant={isActive("/seller") ? "secondary" : "ghost"} size="icon"
                className="sm:hidden" title="Dashboard Seller">
                <Store className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Panel Admin */}
          {user?.role === "admin" && (
            <Link href="/admin">
              <Button variant={isActive("/admin") ? "secondary" : "ghost"} size="sm"
                className="hidden sm:flex items-center gap-1.5" data-testid="button-nav-admin">
                <ShieldCheck className="h-4 w-4" />Panel Admin
              </Button>
              <Button variant={isActive("/admin") ? "secondary" : "ghost"} size="icon"
                className="sm:hidden" title="Panel Admin">
                <ShieldCheck className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Pesanan */}
          <Link href="/orders">
            <Button variant={isActive("/orders") ? "secondary" : "ghost"} size="sm"
              className="hidden sm:flex items-center gap-1.5" data-testid="button-nav-orders">
              <ClipboardList className="h-4 w-4" />Pesanan
            </Button>
            <Button variant={isActive("/orders") ? "secondary" : "ghost"} size="icon"
              className="sm:hidden" title="Riwayat Pesanan">
              <ClipboardList className="h-5 w-5" />
            </Button>
          </Link>

          {/* Notification Bell */}
          <div ref={bellRef} className="relative">
            <Button variant="ghost" size="icon" className="relative" onClick={handleBellClick} title="Notifikasi">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <span className="font-bold text-sm">Notifikasi</span>
                  <div className="flex items-center gap-1">
                    {notifications.length > 0 && (
                      <>
                        <button onClick={markAllRead} title="Tandai semua dibaca"
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                          <CheckCheck className="h-4 w-4" />
                        </button>
                        <button onClick={clearAll} title="Hapus semua"
                          className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Belum ada notifikasi
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button key={n.id} onClick={() => { markRead(n.id); setBellOpen(false); }}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 ${!n.read ? "bg-primary/5" : ""}`}>
                        <span className="text-xl flex-shrink-0 mt-0.5">{NOTIF_ICON[n.type] ?? "🔔"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Keranjang */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-cart-icon" title="Keranjang">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span data-testid="text-cart-count"
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Avatar → Profil */}
          {user && (
            <Link href="/profile">
              <button data-testid="button-nav-profile" title={`Profil — ${user.name}`}
                className="flex items-center gap-2 ml-1 pl-3 border-l group">
                <div className={`w-9 h-9 rounded-xl overflow-hidden ring-2 transition-all ${
                  isActive("/profile") ? "ring-primary" : "ring-transparent group-hover:ring-primary/50"
                }`}>
                  <img src={avatarUrl(user.name)} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {user.name.split(" ")[0]}
                    {user.role === "admin"  && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                    {user.role === "seller" && <Store className="h-3.5 w-3.5 text-purple-500" />}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">{user.role}</span>
                </div>
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
