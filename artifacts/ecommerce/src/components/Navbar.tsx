/**
 * Navbar.tsx
 * Navigasi utama — link yang muncul disesuaikan dengan role user.
 *
 * user   → Beranda · Pesanan · Keranjang · Avatar (Profil)
 * seller → + Dashboard Seller
 * admin  → + Panel Admin (menggantikan Seller)
 */
import React from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, ClipboardList, ShieldCheck, Store } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`;
}

export function Navbar() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

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

          {/* Seller dashboard — hanya role seller */}
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

          {/* Panel Admin — hanya role admin */}
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
