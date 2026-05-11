/**
 * SellerPage.tsx
 * Dashboard Seller — hanya bisa diakses user dengan role "seller".
 *
 * Fitur:
 * - Form tambah produk baru (dikirim ke admin untuk disetujui)
 * - Daftar produk yang sudah disubmit + badge status
 * - Seller bisa hapus produk miliknya sendiri (pending/rejected)
 */
import React, { useState } from "react";
import {
  PlusCircle, Package, Clock, CheckCircle2, XCircle,
  Trash2, ChevronDown, ChevronUp, Store,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProducts, SellerProduct } from "../contexts/ProductsContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";

// ─── Konstanta ────────────────────────────────────────────────────────────────

const CATEGORIES = ["Sepatu", "Tas", "Pakaian", "Aksesori", "Elektronik", "Makanan", "Lainnya"];

const STATUS_CONFIG: Record<SellerProduct["status"], { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: "Menunggu Review",  color: "bg-amber-100 text-amber-700",  icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Disetujui",        color: "bg-green-100 text-green-700",  icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Ditolak",          color: "bg-red-100 text-red-700",      icon: <XCircle className="h-3 w-3" /> },
};

// ─── Komponen Kartu Produk Seller ─────────────────────────────────────────────

function SellerProductCard({
  product,
  onDelete,
}: {
  product: SellerProduct;
  onDelete: (id: number) => void;
}) {
  const cfg = STATUS_CONFIG[product.status];
  const canDelete = product.status !== "approved";

  return (
    <div className="flex gap-4 p-4 bg-card border rounded-2xl shadow-sm items-start">
      <img
        src={product.image}
        alt={product.name}
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64?text=?"; }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm truncate">{product.name}</h3>
            <p className="text-xs text-muted-foreground">{product.category} · {formatPrice(product.price)}</p>
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
            {cfg.icon}{cfg.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.description}</p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:bg-red-50 flex-shrink-0"
          onClick={() => onDelete(product.id)}
          title="Hapus produk"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ─── Form Tambah Produk ───────────────────────────────────────────────────────

interface FormState {
  name: string; category: string; price: string;
  description: string; longDescription: string; image: string;
}

const emptyForm: FormState = {
  name: "", category: CATEGORIES[0], price: "", description: "", longDescription: "", image: "",
};

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { submitProduct } = useProducts();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim())             e.name = "Nama produk wajib diisi.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
                                        e.price = "Harga tidak valid.";
    if (!form.description.trim())      e.description = "Deskripsi singkat wajib diisi.";
    if (!form.longDescription.trim())  e.longDescription = "Deskripsi lengkap wajib diisi.";
    if (!form.image.trim())            e.image = "URL gambar wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    submitProduct({
      sellerId: user.id,
      sellerName: user.name,
      name: form.name.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      price: Number(form.price),
      image: form.image.trim(),
      images: [form.image.trim()],
      category: form.category,
      specs: [],
    });
    toast({ title: "Produk dikirim!", description: "Menunggu persetujuan admin." });
    setForm(emptyForm);
    setErrors({});
    setLoading(false);
    onSuccess();
  };

  const field = (id: keyof FormState, label: string, node: React.ReactNode, err?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">{label}</Label>
      {node}
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field("name", "Nama Produk",
        <Input id="name" placeholder="Nama produk kamu" value={form.name} onChange={set("name")} className="h-10" />,
        errors.name)}

      <div className="grid grid-cols-2 gap-4">
        {field("category", "Kategori",
          <select id="category" value={form.category} onChange={set("category")}
            className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>)}
        {field("price", "Harga (Rp)",
          <Input id="price" type="number" min="1" placeholder="Contoh: 150000" value={form.price} onChange={set("price")} className="h-10" />,
          errors.price)}
      </div>

      {field("description", "Deskripsi Singkat",
        <Input id="description" placeholder="1–2 kalimat ringkasan produk" value={form.description} onChange={set("description")} className="h-10" />,
        errors.description)}

      {field("longDescription", "Deskripsi Lengkap",
        <textarea id="longDescription" rows={3} placeholder="Jelaskan produk secara lengkap…"
          value={form.longDescription} onChange={set("longDescription")}
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />,
        errors.longDescription)}

      {field("image", "URL Gambar Produk",
        <Input id="image" type="url" placeholder="https://…" value={form.image} onChange={set("image")} className="h-10" />,
        errors.image)}

      {/* Preview gambar */}
      {form.image && (
        <div className="rounded-xl overflow-hidden border w-24 h-24">
          <img src={form.image} alt="preview" className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/96x96?text=Error"; }} />
        </div>
      )}

      <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
        {loading
          ? <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Mengirim…</span>
          : <span className="flex items-center gap-2"><PlusCircle className="h-4 w-4" />Kirim untuk Ditinjau</span>}
      </Button>
    </form>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export function SellerPage() {
  const { user } = useAuth();
  const { sellerProducts, deleteProduct } = useProducts();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const myProducts = sellerProducts.filter((p) => p.sellerId === user?.id);
  const counts = {
    pending:  myProducts.filter((p) => p.status === "pending").length,
    approved: myProducts.filter((p) => p.status === "approved").length,
    rejected: myProducts.filter((p) => p.status === "rejected").length,
  };

  const handleDelete = (id: number) => {
    deleteProduct(id);
    toast({ title: "Produk dihapus." });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard Seller</h1>
          <p className="text-sm text-muted-foreground">Kelola produk yang kamu jual</p>
        </div>
      </div>

      {/* Statistik singkat */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Menunggu", count: counts.pending,  color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
          { label: "Disetujui", count: counts.approved, color: "text-green-600",  bg: "bg-green-50 border-green-200" },
          { label: "Ditolak",  count: counts.rejected, color: "text-red-600",    bg: "bg-red-50 border-red-200" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${bg}`}>
            <p className={`text-2xl font-extrabold ${color}`}>{count}</p>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Form tambah produk */}
      <div className="bg-card border rounded-2xl overflow-hidden mb-6 shadow-sm">
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
          onClick={() => setShowForm((v) => !v)}
        >
          <span className="flex items-center gap-2 font-bold">
            <PlusCircle className="h-5 w-5 text-primary" />
            Tambah Produk Baru
          </span>
          {showForm ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showForm && (
          <div className="px-5 pb-6 border-t">
            <p className="text-xs text-muted-foreground mt-4 mb-4">
              Produk yang kamu kirim akan menunggu persetujuan admin sebelum tampil di toko.
            </p>
            <AddProductForm onSuccess={() => setShowForm(false)} />
          </div>
        )}
      </div>

      {/* Daftar produk saya */}
      <div>
        <h2 className="text-base font-bold mb-3">Produk Saya ({myProducts.length})</h2>
        {myProducts.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
            <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">Belum ada produk</p>
            <p className="text-xs text-muted-foreground mt-1">Klik "Tambah Produk Baru" di atas untuk memulai.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myProducts.map((p) => (
              <SellerProductCard key={p.id} product={p} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
