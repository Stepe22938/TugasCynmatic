/**
 * Navbar.tsx
 * Navigasi utama Toko Online menggunakan Clerk untuk info user.
 *
 * Menampilkan:
 * - Logo + nama toko (link ke Home)
 * - Link Riwayat Pesanan (hanya jika sudah login)
 * - Ikon keranjang dengan badge jumlah item
 * - Nama user + tombol logout (jika sudah login)
 * - Tombol "Masuk" (jika belum login)
 */
import React from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, LogOut, Package, ClipboardList, LogIn } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useUser, useClerk } from "@clerk/react";
import { Button } from "./ui/button";

export function Navbar() {
  const { totalItems } = useCart();
  // useUser dari Clerk — isSignedIn null saat masih loading
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  /** Logout dan kembali ke halaman utama */
  const handleLogout = () => {
    signOut({ redirectUrl: `${basePath}/` });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo dan nama toko */}
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Package className="h-6 w-6" />
          <span className="hidden sm:inline">Toko Online</span>
          <span className="sm:hidden">Toko</span>
        </Link>

        {/* Navigasi kanan */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Link Riwayat Pesanan — hanya jika sudah login */}
          {isSignedIn && (
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
          )}

          {/* Ikon keranjang dengan badge — selalu tampil */}
          <Link href={isSignedIn ? "/cart" : "/sign-in"}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-testid="button-cart-icon"
              title="Keranjang"
            >
              <ShoppingCart className="h-5 w-5" />
              {/* Badge jumlah item */}
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

          {/* Info user dan logout — jika sudah login */}
          {isSignedIn && user ? (
            <div className="flex items-center gap-2 ml-1 border-l pl-3">
              {/* Nama user — hanya di layar besar */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium leading-tight">
                  {user.firstName ?? user.fullName ?? "User"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  via Google
                </span>
              </div>
              {/* Avatar Google */}
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover hidden sm:block"
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                title="Logout"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          ) : (
            /* Tombol masuk — jika belum login */
            !isSignedIn && isSignedIn !== null && (
              <Link href="/sign-in">
                <Button size="sm" className="ml-1" data-testid="button-sign-in">
                  <LogIn className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Masuk</span>
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
