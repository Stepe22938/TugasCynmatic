/**
 * Navbar.tsx
 * Navigasi utama Toko Online.
 *
 * Menampilkan:
 * - Logo + nama toko (link ke Home)
 * - Link Riwayat Pesanan
 * - Ikon keranjang dengan badge jumlah item
 * - Nama user dan tombol logout
 */
import React from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, LogOut, Package, ClipboardList } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

export function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Package className="h-6 w-6" />
          <span className="hidden sm:inline">Toko Online</span>
          <span className="sm:hidden">Toko</span>
        </Link>

        {/* Navigasi kanan */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Link Riwayat Pesanan */}
          <Link href="/orders">
            <Button
              variant={location === "/orders" ? "secondary" : "ghost"}
              size="sm"
              className="hidden sm:flex items-center gap-1.5"
              data-testid="button-nav-orders"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Pesanan</span>
            </Button>
            <Button
              variant={location === "/orders" ? "secondary" : "ghost"}
              size="icon"
              className="sm:hidden"
              data-testid="button-nav-orders-mobile"
              title="Riwayat Pesanan"
            >
              <ClipboardList className="h-5 w-5" />
            </Button>
          </Link>

          {/* Ikon keranjang dengan badge */}
          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-testid="button-cart-icon"
              title="Keranjang"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span
                  data-testid="text-cart-count"
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                >
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Info user dan logout */}
          {user && (
            <div className="flex items-center gap-2 ml-1 border-l pl-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium leading-tight">{user.name}</span>
                <span className="text-[10px] text-muted-foreground">via Google</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                title="Logout"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
