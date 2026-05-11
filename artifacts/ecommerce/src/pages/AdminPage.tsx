/**
 * AdminPage.tsx
 * Panel Admin — hanya bisa diakses user dengan role "admin".
 *
 * Tab 1 — Produk Seller:
 *   Lihat semua produk yang disubmit seller.
 *   Setujui / tolak / hapus produk.
 *
 * Tab 2 — Kelola Pengguna:
 *   Lihat semua akun terdaftar.
 *   Ubah role (user / seller / admin).
 */
import React, { useState } from "react";
import {
  ShieldCheck, Package, Users, CheckCircle2, XCircle,
  Trash2, Clock, ChevronDown,
} from "lucide-react";
import { useAuth, User, UserRole } from "../contexts/AuthContext";
import { useProducts, SellerProduct } from "../contexts/ProductsContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<SellerProduct["status"], string> = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<SellerProduct["status"], string> = {
  pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak",
};

const ROLE_LABEL: Record<UserRole, string> = {
  user: "User", seller: "Seller", admin: "Admin",
};
const ROLE_COLOR: Record<UserRole, string> = {
  user:   "bg-blue-100 text-blue-700",
  seller: "bg-purple-100 text-purple-700",
  admin:  "bg-orange-100 text-orange-700",
};

// ─── Kartu Produk (untuk tab Produk) ─────────────────────────────────────────

function ProductRow({
  product,
  onApprove,
  onReject,
  onDelete,
}: {
  product: SellerProduct;
  onApprove: (id: number) => void;
  onReject:  (id: number) => void;
  onDelete:  (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex gap-4 p-4 items-start">
        <img
          src={product.image}
          alt={product.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64?text=?"; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 justify-between">
            <div>
              <h3 className="font-bold text-sm">{product.name}</h3>
              <p className="text-xs text-muted-foreground">{product.category} · {formatPrice(product.price)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">oleh <span className="font-medium">{product.sellerName}</span></p>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[product.status]}`}>
              {product.status === "pending" && <Clock className="h-3 w-3" />}
              {product.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
              {product.status === "rejected" && <XCircle className="h-3 w-3" />}
              {STATUS_LABEL[product.status]}
            </span>
          </div>

          {/* Toggle deskripsi */}
          <button
            className="flex items-center gap-1 text-[11px] text-primary mt-2 hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Sembunyikan" : "Lihat deskripsi"}
          </button>
          {expanded && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{product.longDescription}</p>
          )}
        </div>
      </div>

      {/* Tombol aksi */}
      <div className="flex gap-2 px-4 pb-4 flex-wrap">
        {product.status !== "approved" && (
          <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => onApprove(product.id)}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Setujui
          </Button>
        )}
        {product.status !== "rejected" && (
          <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => onReject(product.id)}>
            <XCircle className="h-3.5 w-3.5 mr-1" />Tolak
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 ml-auto" onClick={() => onDelete(product.id)}>
          <Trash2 className="h-3.5 w-3.5 mr-1" />Hapus
        </Button>
      </div>
    </div>
  );
}

// ─── Baris User (untuk tab Pengguna) ─────────────────────────────────────────

function UserRow({ user, currentUser, onRoleChange }: {
  user: User;
  currentUser: User;
  onRoleChange: (id: string, role: UserRole) => void;
}) {
  const isCurrentUser = user.id === currentUser.id;
  const isMainAdmin   = user.id === "admin-001";

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
      {/* Avatar inisial */}
      <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">
          {user.name}
          {isCurrentUser && <span className="text-xs text-muted-foreground font-normal ml-1">(kamu)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      {/* Selector role */}
      {isMainAdmin || isCurrentUser ? (
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ROLE_COLOR[user.role]}`}>
          {ROLE_LABEL[user.role]}
        </span>
      ) : (
        <select
          value={user.role}
          onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
          className="text-xs border border-input rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="user">User</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
      )}
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

type Tab = "products" | "users";

export function AdminPage() {
  const { user, getAllUsers, updateUserRole } = useAuth();
  const { sellerProducts, approveProduct, rejectProduct, deleteProduct } = useProducts();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("products");
  const [filter, setFilter] = useState<SellerProduct["status"] | "all">("all");
  const [users, setUsers] = useState<User[]>(() => getAllUsers());

  if (!user || user.role !== "admin") return null;

  // Produk yang ditampilkan sesuai filter
  const visibleProducts = filter === "all"
    ? sellerProducts
    : sellerProducts.filter((p) => p.status === filter);

  const counts = {
    all:      sellerProducts.length,
    pending:  sellerProducts.filter((p) => p.status === "pending").length,
    approved: sellerProducts.filter((p) => p.status === "approved").length,
    rejected: sellerProducts.filter((p) => p.status === "rejected").length,
  };

  const handleApprove = (id: number) => {
    approveProduct(id);
    toast({ title: "Produk disetujui dan tampil di toko." });
  };
  const handleReject = (id: number) => {
    rejectProduct(id);
    toast({ title: "Produk ditolak." });
  };
  const handleDelete = (id: number) => {
    deleteProduct(id);
    toast({ title: "Produk dihapus." });
  };
  const handleRoleChange = (userId: string, role: UserRole) => {
    updateUserRole(userId, role);
    setUsers(getAllUsers());
    toast({ title: `Role berhasil diubah menjadi ${ROLE_LABEL[role]}.` });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Panel Admin</h1>
          <p className="text-sm text-muted-foreground">Kelola produk seller dan pengguna</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 bg-muted/40 p-1 rounded-xl w-fit">
        {(["products", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "products" ? <Package className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            {t === "products" ? `Produk Seller (${counts.all})` : `Pengguna (${users.length})`}
          </button>
        ))}
      </div>

      {/* ── Tab: Produk ──────────────────────────────────────────────────── */}
      {tab === "products" && (
        <div>
          {/* Filter status */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {s === "all" ? `Semua (${counts.all})`
                  : s === "pending"  ? `Menunggu (${counts.pending})`
                  : s === "approved" ? `Disetujui (${counts.approved})`
                  :                    `Ditolak (${counts.rejected})`}
              </button>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
              <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-semibold text-muted-foreground">Tidak ada produk</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleProducts.map((p) => (
                <ProductRow key={p.id} product={p} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Pengguna ────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Belum ada pengguna.</div>
          ) : (
            <div className="divide-y">
              {users.map((u) => (
                <UserRow key={u.id} user={u} currentUser={user} onRoleChange={handleRoleChange} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
