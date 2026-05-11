/**
 * ProfilePage.tsx
 * Halaman profil pengguna yang sedang login.
 *
 * Fitur:
 * - Tampil nama, email, role (badge Admin/User), tanggal bergabung
 * - Avatar otomatis dari inisial nama via DiceBear
 * - Edit nama langsung di halaman
 * - Statistik: total pesanan, total item dibeli, total belanja
 * - Tombol logout
 */
import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  User,
  Mail,
  Calendar,
  ShoppingBag,
  Edit2,
  Check,
  X,
  LogOut,
  ShieldCheck,
  Package,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

/** Format tanggal ISO ke bahasa Indonesia */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Avatar URL dari inisial nama */
function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`;
}

export function ProfilePage() {
  const { user, logout, updateName } = useAuth();
  const { state: orderState } = useOrderHistory();
  const [, setLocation] = useLocation();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(user?.name ?? "");

  if (!user) return null;

  // Hitung statistik dari riwayat pesanan
  const totalOrders = orderState.orders.length;
  const totalItems  = orderState.orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const totalSpend  = orderState.orders.reduce((sum, o) => sum + o.grandTotal, 0);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateName(nameInput.trim());
    }
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setNameInput(user.name);
    setEditingName(false);
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">

      {/* ── Header kartu profil ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white/30 flex-shrink-0 shadow-lg">
            <img
              src={avatarUrl(user.name)}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Nama + email + role */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold truncate">{user.name}</h1>
              {user.role === "admin" && (
                <span className="flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/30">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-orange-100 text-sm truncate">{user.email}</p>
            <p className="text-orange-200 text-xs mt-1">
              Bergabung {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Statistik belanja ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: ShoppingBag, label: "Pesanan",    value: totalOrders.toString() },
          { icon: Package,     label: "Item Dibeli", value: totalItems.toString() },
          { icon: ShoppingBag, label: "Total Belanja", value: formatPrice(totalSpend) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border rounded-2xl p-4 text-center shadow-sm">
            <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground leading-tight">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Informasi akun ───────────────────────────────────────────────── */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm mb-4">
        <div className="px-5 py-4 bg-muted/30 border-b">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Informasi Akun
          </h2>
        </div>

        <div className="divide-y">
          {/* Nama — bisa diedit */}
          <div className="flex items-center gap-4 px-5 py-4">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Nama Lengkap</p>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoFocus
                    data-testid="input-edit-name"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{user.name}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => { setNameInput(user.name); setEditingName(true); }}
                    data-testid="button-edit-name"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Email — read-only */}
          <div className="flex items-center gap-4 px-5 py-4">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="font-semibold text-sm truncate">{user.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4 px-5 py-4">
            <ShieldCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Peran</p>
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                  user.role === "admin"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {user.role === "admin" ? "Administrator" : "Pelanggan"}
              </span>
            </div>
          </div>

          {/* Bergabung */}
          <div className="flex items-center gap-4 px-5 py-4">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Bergabung Sejak</p>
              <p className="font-semibold text-sm">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tombol logout ────────────────────────────────────────────────── */}
      <Button
        variant="outline"
        className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400 font-semibold"
        onClick={handleLogout}
        data-testid="button-logout-profile"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Keluar dari Akun
      </Button>
    </div>
  );
}
