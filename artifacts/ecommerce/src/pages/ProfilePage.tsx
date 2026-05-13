/**
 * ProfilePage.tsx
 * Profil pengguna: statistik, koin, edit nama, quick links ke halaman role.
 * Koin: 1.000 rupiah = 1 koin (dibulatkan ke bawah dari total belanja).
 */
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { User, Mail, Calendar, ShoppingBag, Edit2, Check, X, LogOut,
         ShieldCheck, Package, Store, Coins, Truck, Send, Globe, Wifi, Ticket, Users, Palette, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useTickets } from "../contexts/TicketContext";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`;
}

const ROLE_LABEL: Record<string, string> = { user: "Pelanggan", seller: "Seller", admin: "Administrator" };
const ROLE_COLOR: Record<string, string> = {
  user:   "bg-blue-100 text-blue-700",
  seller: "bg-purple-100 text-purple-700",
  admin:  "bg-orange-100 text-orange-700",
};

export function ProfilePage() {
  const { user, logout, updateName, updateIps } = useAuth();
  const { state: orderState } = useOrderHistory();
  const { getUserTickets, createTicket } = useTickets();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(user?.name ?? "");
  const tickets = getUserTickets();

  const [ticketText, setTicketText] = useState("");

  useEffect(() => {
    if (user && !user.publicIp) {
      fetch("https://api.ipify.org?format=json")
        .then(r => r.json())
        .then(data => {
          updateIps(data.ip, "Dilindungi oleh Browser (WebRTC Leak Prevent)");
        })
        .catch(console.error);
    }
  }, [user]);

  if (!user) return null;

  const totalOrders = orderState.orders.length;
  const totalItems  = orderState.orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const totalSpend  = orderState.orders.reduce((s, o) => s + o.grandTotal, 0);

  const handleSaveName = () => {
    if (nameInput.trim()) updateName(nameInput.trim());
    setEditingName(false);
  };

  const handleLogout = () => { logout(); setLocation("/login"); };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-5">

      {/* ── Kartu header ────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${user.theme || "from-primary to-orange-600"} rounded-3xl p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white/30 flex-shrink-0 shadow-lg">
            <img src={avatarUrl(user.name)} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold truncate">{user.name}</h1>
              {user.role === "admin"  && <span className="flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/30"><ShieldCheck className="h-3 w-3" />Admin</span>}
              {user.role === "seller" && <span className="flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/30"><Store className="h-3 w-3" />Seller</span>}
            </div>
            <p className="text-white/80 text-sm truncate">{user.email}</p>
            {user.bio && <p className="text-white/70 text-xs mt-1 italic">"{user.bio}"</p>}
            <div className="flex items-center gap-3 text-white/60 text-xs mt-1">
              <p>ID: {user.systemId ?? user.id.slice(-6)}</p>
              <p>&bull;</p>
              <p>Bergabung {formatDate(user.createdAt)}</p>
              <p>&bull;</p>
              <p>{(user.friends || []).length} Teman</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick links ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Teman */}
        <Link href="/friends">
          <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl hover:bg-violet-100 transition-colors cursor-pointer h-full">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-violet-800">Teman <span className="text-xs font-normal text-violet-500">({(user.friends || []).length})</span></p>
              <p className="text-xs text-violet-600">Lihat & tambah teman</p>
            </div>
          </div>
        </Link>
        {/* Kustomisasi */}
        <Link href="/customize">
          <div className="flex items-center gap-3 p-4 bg-pink-50 border border-pink-200 rounded-2xl hover:bg-pink-100 transition-colors cursor-pointer h-full">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Palette className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-pink-800">Kustomisasi Profil</p>
              <p className="text-xs text-pink-600">Ubah bio & tema banner</p>
            </div>
          </div>
        </Link>
        {/* Tiket Bantuan */}
        <Link href="/tickets">
          <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-2xl hover:bg-teal-100 transition-colors cursor-pointer h-full">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Ticket className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-teal-800">Pusat Bantuan</p>
              <p className="text-xs text-teal-600">Dashboard Tiket</p>
            </div>
          </div>
        </Link>
        {/* Seller */}
        {(user.role === "seller" || user.role === "admin") && (
          <Link href="/seller">
            <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-2xl hover:bg-purple-100 transition-colors cursor-pointer h-full">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-purple-800">Dashboard Seller</p>
                <p className="text-xs text-purple-600">Kelola produk jualanmu</p>
              </div>
            </div>
          </Link>
        )}
        {/* Admin */}
        {user.role === "admin" && (
          <Link href="/admin">
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl hover:bg-orange-100 transition-colors cursor-pointer h-full">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-orange-800">Panel Admin</p>
                <p className="text-xs text-orange-600">Kelola toko & pengguna</p>
              </div>
            </div>
          </Link>
        )}
        {/* Kurir */}
        {(user.role === "kurir" || user.role === "admin") && (
          <Link href="/courier">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors cursor-pointer h-full">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-blue-800">Pengiriman</p>
                <p className="text-xs text-blue-600">Dashboard Kurir</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ── Statistik belanja ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ShoppingBag, label: "Pesanan",     value: totalOrders.toString(),   color: "text-primary" },
          { icon: Package,     label: "Item Dibeli",  value: totalItems.toString(),    color: "text-blue-600" },
          { icon: ShoppingBag, label: "Total Belanja",value: formatPrice(totalSpend),  color: "text-green-600" },
          { icon: Coins,       label: "Koin Saya",value: `${(user.coins || 0).toLocaleString("id-ID")} 🪙`, color: "text-amber-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border rounded-2xl p-4 text-center shadow-sm">
            <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
            <p className={`text-base font-extrabold ${color} leading-tight`}>{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🪙</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-800">Koin Saya: {(user.coins || 0).toLocaleString("id-ID")} koin</p>
          <p className="text-xs text-amber-700">Dapatkan koin dari aktivitas atau dikelola oleh admin.</p>
        </div>
        <Link href="/exchange">
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-none h-8 text-xs font-bold">
            Tukar Koin
          </Button>
        </Link>
      </div>

      {/* ── Info akun ────────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-muted/30 border-b">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Informasi Akun</h2>
        </div>
        <div className="divide-y">
          {/* Nama */}
          <div className="flex items-center gap-4 px-5 py-4">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Nama Lengkap</p>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="h-8 text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    autoFocus data-testid="input-edit-name" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveName}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingName(false)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{user.name}</p>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"
                    onClick={() => { setNameInput(user.name); setEditingName(true); }} data-testid="button-edit-name">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {/* Email */}
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
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Peran</p>
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLOR[user.role] ?? "bg-muted text-foreground"}`}>
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </div>
              {user.role === "user" && (
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => {
                  createTicket("rank_up", "Saya ingin mengajukan kenaikan pangkat menjadi Seller.");
                  toast({ title: "Pengajuan terkirim", description: "Admin akan segera meninjau permintaanmu." });
                }}>
                  Naik Pangkat
                </Button>
              )}
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
          {/* IP Info */}
          <div className="flex items-center gap-4 px-5 py-4">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">IP Publik</p>
              <p className="font-semibold text-sm">{user.publicIp || "Memuat..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <Wifi className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">IP Lokal</p>
              <p className="font-semibold text-sm text-muted-foreground">{user.localIp || "Memuat..."}</p>
            </div>
          </div>
        </div>
      </div>



      {/* Logout */}
      <Button variant="outline"
        className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400 font-semibold"
        onClick={handleLogout} data-testid="button-logout-profile">
        <LogOut className="h-4 w-4 mr-2" />Keluar dari Akun
      </Button>
    </div>
  );
}
