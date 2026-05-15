/**
 * SellerPage.tsx
 * Dashboard Seller — tabs: Produk · Pesanan · Live
 * Bisa diakses role seller MAUPUN admin.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  PlusCircle, Package, Clock, CheckCircle2, XCircle, Trash2,
  ChevronDown, ChevronUp, Store, Plus, X, ShieldCheck,
  ShoppingBag, Truck, Radio, Camera, CameraOff, Search,
  MessageSquare, Send, ToggleLeft, ToggleRight, Zap, Pencil, Crown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useProducts, SellerProduct, AdminProduct } from "../contexts/ProductsContext";
import { useOrderHistory, PurchasedOrder, OrderStatus } from "../contexts/OrderHistoryContext";
import { useLive, GIFT_TYPES } from "../contexts/LiveContext";
import { useAuction } from "../contexts/AuctionContext";
import { Gavel } from "lucide-react";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { useSultan } from "../contexts/MySultanContext";
import { useWishlist } from "../contexts/WishlistContext";

const CATEGORIES = ["Sepatu","Tas","Pakaian","Aksesori","Elektronik","Makanan","Pre-Order","Lainnya"];

const STATUS_CONFIG: Record<SellerProduct["status"], { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: "Menunggu Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",  icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Disetujui",       color: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",  icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Ditolak",         color: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",      icon: <XCircle className="h-3 w-3" /> },
};

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  placed:      { label: "Pesanan Masuk",      color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-100 dark:bg-blue-950/50" },
  processing:  { label: "Sedang Diproses",    color: "text-amber-700 dark:text-amber-300",  bg: "bg-amber-100 dark:bg-amber-950/50" },
  pending_po:  { label: "Pending Pre-Order",  color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-100 dark:bg-cyan-950/50" },
  shipped:     { label: "Dikirim ke Kurir",   color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-950/50" },
  in_delivery: { label: "Dalam Pengiriman",   color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-950/50" },
  delivered:   { label: "Terkirim",           color: "text-green-700 dark:text-green-300",  bg: "bg-green-100 dark:bg-green-950/50" },
  completed:   { label: "Selesai",            color: "text-green-800 dark:text-green-400",  bg: "bg-green-200 dark:bg-green-950/70" },
  problem:     { label: "Bermasalah",         color: "text-red-700 dark:text-red-300",    bg: "bg-red-100 dark:bg-red-950/50" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Product cards ────────────────────────────────────────────────────────────
function SellerProductCard({ product, onDelete, onEdit, canAlwaysDelete = false }: {
  product: SellerProduct; onDelete: (id: number) => void; onEdit: (p: SellerProduct) => void; canAlwaysDelete?: boolean;
}) {
  const { toggleFlashSale, updateStock } = useProducts();
  const { getWishlistCountForProduct } = useWishlist();
  const cfg = STATUS_CONFIG[product.status];
  const [discount, setDiscount] = useState(product.discountPercent || 10);
  const wishlistCount = getWishlistCountForProduct(product.id);

  // Sync state if prop changes (important for UI consistency)
  useEffect(() => {
    if (product.discountPercent !== undefined) {
      setDiscount(product.discountPercent);
    }
  }, [product.discountPercent]);

  return (
    <div className="p-4 bg-card border rounded-2xl shadow-sm space-y-4">
      <div className="flex gap-4 items-start">
        <img src={product.image} alt={product.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64?text=?"; }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm truncate">{product.name}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <span className="text-muted-foreground">·</span>
                {product.isFlashSale ? (
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-amber-600">{formatPrice(product.price * (1 - (product.discountPercent || 0) / 100))}</p>
                    <p className="text-[10px] text-muted-foreground line-through opacity-60">{formatPrice(product.price)}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
              {cfg.icon}{cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
            {wishlistCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-lg border border-red-100 dark:border-red-900/50">
                <Heart className="h-2.5 w-2.5 fill-current" /> {wishlistCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10"
            onClick={() => onEdit(product)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {(canAlwaysDelete || product.status !== "approved") && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50"
              onClick={() => onDelete(product.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {product.status === "approved" && (
        <div className="flex items-center justify-between pt-3 border-t gap-4">
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${product.isFlashSale ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold">Flash Sale</span>
            <button 
              onClick={() => toggleFlashSale(product.id, !product.isFlashSale, discount)}
              className="transition-transform active:scale-90"
            >
              {product.isFlashSale ? <ToggleRight className="h-6 w-6 text-amber-500" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground opacity-30" />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Stok</span>
            <input 
              type="number" 
              value={product.stock} 
              min="0"
              onChange={(e) => updateStock(product.id, Number(e.target.value))}
              className="w-12 h-7 text-center text-sm font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
            />
            {product.stock === 0 && <span className="text-[9px] font-black text-red-500 uppercase ml-1 animate-pulse">Habis!</span>}
          </div>

          {product.isFlashSale && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-xl border-2 border-amber-200 dark:border-amber-800/50 shadow-sm animate-in zoom-in-95 duration-200">
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight">Diskon</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={discount} 
                  min="1"
                  max="100"
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  onBlur={() => {
                    const val = Math.min(100, Math.max(1, Number(discount)));
                    setDiscount(val);
                    toggleFlashSale(product.id, true, val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-12 h-7 text-center text-sm font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-amber-300 dark:border-amber-700 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
                />
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminProductCard({ product, onDelete, onEdit }: { product: AdminProduct; onDelete: (id: number) => void; onEdit: (p: AdminProduct) => void }) {
  const { toggleFlashSale, updateStock } = useProducts();
  const [discount, setDiscount] = useState(product.discountPercent || 10);

  useEffect(() => {
    if (product.discountPercent !== undefined) {
      setDiscount(product.discountPercent);
    }
  }, [product.discountPercent]);

  return (
    <div className="p-4 bg-card border rounded-2xl shadow-sm space-y-4">
      <div className="flex gap-4 items-start">
        <img src={product.image} alt={product.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64?text=?"; }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm truncate">{product.name}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <span className="text-muted-foreground">·</span>
                {product.isFlashSale ? (
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-amber-600">{formatPrice(product.price * (1 - (product.discountPercent || 0) / 100))}</p>
                    <p className="text-[10px] text-muted-foreground line-through opacity-60">{formatPrice(product.price)}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                )}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <ShieldCheck className="h-3 w-3" />Admin Toko
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.description}</p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10"
            onClick={() => onEdit(product)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50"
            onClick={() => onDelete(product.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t gap-4">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${product.isFlashSale ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
          <span className="text-xs font-bold">Flash Sale</span>
          <button 
            onClick={() => toggleFlashSale(product.id, !product.isFlashSale, discount)}
            className="transition-transform active:scale-90"
          >
            {product.isFlashSale ? <ToggleRight className="h-6 w-6 text-amber-500" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground opacity-30" />}
          </button>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border shadow-sm">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Stok</span>
          <input 
            type="number" 
            value={product.stock} 
            min="0"
            onChange={(e) => updateStock(product.id, Number(e.target.value))}
            className="w-12 h-7 text-center text-sm font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
          />
          {product.stock === 0 && <span className="text-[9px] font-black text-red-500 uppercase ml-1 animate-pulse">Habis!</span>}
        </div>
        
        {product.isFlashSale && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-xl border-2 border-amber-200 dark:border-amber-800/50 shadow-sm animate-in zoom-in-95 duration-200">
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight">Diskon</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={discount} 
                  min="1"
                  max="100"
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  onBlur={() => {
                    const val = Math.min(100, Math.max(1, Number(discount)));
                    setDiscount(val);
                    toggleFlashSale(product.id, true, val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-12 h-7 text-center text-sm font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-amber-300 dark:border-amber-700 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
                />
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">%</span>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Product Form ─────────────────────────────────────────────────────────
interface FormState { name: string; category: string; price: string; stock: string; description: string; longDescription: string; image: string; isPreOrder: boolean; releaseDate: string; }
const emptyForm: FormState = { name: "", category: CATEGORIES[0], price: "", stock: "50", description: "", longDescription: "", image: "", isPreOrder: false, releaseDate: "" };
interface SpecRow { label: string; value: string; }

function ProductForm({ onSuccess, isAdmin, product }: { onSuccess: () => void; isAdmin?: boolean; product?: SellerProduct | AdminProduct }) {
  const { user } = useAuth();
  const { submitProduct, addAdminProduct, updateProduct, updateAdminProduct } = useProducts();
  const { toast } = useToast();
  
  const [form, setForm] = useState<FormState>(() => {
    if (product) {
      return {
        name: product.name,
        category: product.category,
        price: String(product.price),
        stock: String(product.stock),
        description: product.description,
        longDescription: product.longDescription,
        image: product.image,
        isPreOrder: !!product.isPreOrder,
        releaseDate: product.releaseDate || "",
      };
    }
    return emptyForm;
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [useSpecs, setUseSpecs] = useState(!!(product?.specs && product.specs.length > 0));
  const [specs, setSpecs]       = useState<SpecRow[]>(product?.specs || [{ label: "", value: "" }]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim())            e.name = "Nama produk wajib diisi.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Harga tidak valid.";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = "Stok tidak valid.";
    if (!form.description.trim())     e.description = "Deskripsi singkat wajib diisi.";
    if (!form.longDescription.trim()) e.longDescription = "Deskripsi lengkap wajib diisi.";
    if (!form.image.trim())           e.image = "URL gambar wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const finalSpecs = useSpecs ? specs.filter((s) => s.label.trim() && s.value.trim()) : [];
    
    if (product) {
      // EDIT MODE
      const updateData = {
        name: form.name.trim(),
        description: form.description.trim(),
        longDescription: form.longDescription.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image.trim(),
        images: [form.image.trim()],
        category: form.category,
        specs: finalSpecs,
        isPreOrder: form.isPreOrder,
        releaseDate: form.releaseDate,
      };

      if (isAdmin) {
        updateAdminProduct(product.id, updateData);
      } else {
        updateProduct(product.id, updateData);
      }
      toast({ title: "Produk diperbarui!", description: "Detail produk telah disimpan." });
    } else {
      // ADD MODE
      if (isAdmin) {
        addAdminProduct({ name: form.name.trim(), description: form.description.trim(), longDescription: form.longDescription.trim(), price: Number(form.price), stock: Number(form.stock), image: form.image.trim(), images: [form.image.trim()], category: form.category, specs: finalSpecs, isPreOrder: form.isPreOrder, releaseDate: form.releaseDate });
        toast({ title: "Produk ditambahkan!", description: "Langsung tampil di toko." });
      } else {
        submitProduct({ sellerId: user.id, sellerName: user.name, name: form.name.trim(), description: form.description.trim(), longDescription: form.longDescription.trim(), price: Number(form.price), stock: Number(form.stock), image: form.image.trim(), images: [form.image.trim()], category: form.category, specs: finalSpecs, isPreOrder: form.isPreOrder, releaseDate: form.releaseDate });
        toast({ title: "Produk dikirim!", description: "Menunggu persetujuan admin." });
      }
    }
    
    if (!product) {
      setForm(emptyForm); setErrors({}); setSpecs([{ label: "", value: "" }]); setUseSpecs(false);
    }
    setLoading(false); onSuccess();
  };

  const addSpec = () => setSpecs((p) => [...p, { label: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs((p) => p.filter((_, j) => j !== i));
  const setSpec = (i: number, field: keyof SpecRow, val: string) =>
    setSpecs((p) => p.map((s, j) => j === i ? { ...s, [field]: val } : s));

  const field = (id: keyof FormState, label: string, node: React.ReactNode, err?: string) => (
    <div className="space-y-1.5"><Label htmlFor={id} className="text-sm font-semibold">{label}</Label>{node}{err && <p className="text-xs text-red-500">{err}</p>}</div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field("name", "Nama Produk", <Input id="name" placeholder="Nama produk" value={form.name} onChange={set("name")} className="h-10" />, errors.name)}
      <div className="grid grid-cols-2 gap-4">
        {field("category", "Kategori",
          <select id="category" value={form.category} onChange={set("category")} className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>)}
        {field("price", "Harga (Rp)", <Input id="price" type="number" min="1" placeholder="150000" value={form.price} onChange={set("price")} className="h-10" />, errors.price)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field("stock", "Jumlah Stok", <Input id="stock" type="number" min="0" placeholder="50" value={form.stock} onChange={set("stock")} className="h-10" />, errors.stock)}
        <div className="pt-8 text-[10px] text-muted-foreground italic leading-tight">
          Stok akan berkurang otomatis saat pembeli melakukan checkout.
        </div>
      </div>
      {field("description", "Deskripsi Singkat", <Input id="description" placeholder="1–2 kalimat ringkasan" value={form.description} onChange={set("description")} className="h-10" />, errors.description)}
      {field("longDescription", "Deskripsi Lengkap",
        <textarea id="longDescription" rows={3} placeholder="Jelaskan produk secara lengkap…" value={form.longDescription} onChange={set("longDescription")}
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />, errors.longDescription)}
      {field("image", "URL Gambar Produk", <Input id="image" type="url" placeholder="https://…" value={form.image} onChange={set("image")} className="h-10" />, errors.image)}
      {form.image && (
        <div className="rounded-xl overflow-hidden border w-24 h-24">
          <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/96x96?text=Error"; }} />
        </div>
      )}
      <div className="border rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={useSpecs} onChange={(e) => setUseSpecs(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
          <span className="text-sm font-semibold">Tambah Spesifikasi</span><span className="text-xs text-muted-foreground">(opsional)</span>
        </label>
        {useSpecs && (
          <div className="space-y-2">
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Label" value={spec.label} onChange={(e) => setSpec(i, "label", e.target.value)} className="h-9 flex-1 text-xs" />
                <Input placeholder="Nilai" value={spec.value} onChange={(e) => setSpec(i, "value", e.target.value)} className="h-9 flex-1 text-xs" />
                {specs.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-red-500 flex-shrink-0" onClick={() => removeSpec(i)}><X className="h-4 w-4" /></Button>}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={addSpec}><Plus className="h-3.5 w-3.5 mr-1" />Tambah Baris</Button>
          </div>
        )}
      </div>

      <div className="border rounded-xl p-4 space-y-4 bg-blue-50/30 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={form.isPreOrder} 
            onChange={(e) => setForm(f => ({ ...f, isPreOrder: e.target.checked }))} 
            className="h-4 w-4 rounded border-input accent-primary" 
          />
          <span className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" /> Aktifkan Pre-Order
          </span>
        </label>
        
        {form.isPreOrder && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Waktu Perilisan</Label>
            <Input 
              type="datetime-local" 
              value={form.releaseDate} 
              onChange={e => setForm(f => ({ ...f, releaseDate: e.target.value }))}
              className="h-10"
            />
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium italic">
              * MySultan dapat membeli 30 menit sebelum waktu ini.
            </p>
          </div>
        )}
      </div>
      <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
        {loading ? <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />{product ? "Menyimpan…" : "Mengirim…"}</span>
          : product ? <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Simpan Perubahan</span>
          : isAdmin ? <span className="flex items-center gap-2"><PlusCircle className="h-4 w-4" />Tambah ke Toko</span>
          : <span className="flex items-center gap-2"><PlusCircle className="h-4 w-4" />Kirim untuk Ditinjau</span>}
      </Button>
    </form>
  );
}

// ─── Order card (seller view) ─────────────────────────────────────────────────
function SellerOrderCard({ order, onProcess, onShip, onChat }: {
  order: PurchasedOrder;
  onProcess: (id: string) => void;
  onShip: (id: string) => void;
  onChat: (order: PurchasedOrder) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ORDER_STATUS_CONFIG[order.status] || { label: order.status || "Unknown", color: "text-gray-700", bg: "bg-gray-100" };

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-bold text-primary text-sm">{order.orderNumber}</span>
          <span className="text-xs text-muted-foreground">· {formatDate(order.date)}</span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
      </div>
      {order.shippingInfo && (
        <div className="px-4 py-2 border-b bg-muted/10 text-xs text-muted-foreground">
          📦 {order.shippingInfo.firstName} {order.shippingInfo.lastName} · 📍 {order.shippingInfo.address}
        </div>
      )}
      <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/20 transition-colors text-xs text-primary font-semibold"
        onClick={() => setExpanded((v) => !v)}>
        <span>{order.items.length} produk · {formatPrice(order.grandTotal)}</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {expanded && (
        <div className="px-4 pb-3 border-t divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 items-center py-2">
              <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">x{item.quantity} · {formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 px-4 pb-4 pt-2 flex-wrap">
        {order.status === "placed" && (
          <Button size="sm" onClick={() => onProcess(order.id)} className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />Proses Pesanan
          </Button>
        )}
        {order.status === "processing" && (
          <Button size="sm" onClick={() => onShip(order.id)} className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 text-xs">
            <Truck className="h-3.5 w-3.5" />Done (Kirim ke Kurir)
          </Button>
        )}
        {(order.status === "shipped" || order.status === "in_delivery") && (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 py-1">
            <Truck className="h-3.5 w-3.5" />
            {order.status === "shipped" ? "Menunggu kurir mengambil" : "Kurir sedang mengantar"}
          </span>
        )}
        {order.status === "problem" && order.problemReport && (
          <div className="w-full text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2">
            ⚠ Laporan pembeli: <em>{order.problemReport}</em>
          </div>
        )}
        <Button size="sm" variant="outline" onClick={() => onChat(order)} className="gap-1.5 text-xs ml-auto">
          <MessageSquare className="h-3.5 w-3.5" />Chat
          {(order.messages ?? []).length > 0 && (
            <span className="bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {(order.messages ?? []).length}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Chat Modal ───────────────────────────────────────────────────────────────
function ChatModal({ order, onClose }: { order: PurchasedOrder; onClose: () => void }) {
  const { user } = useAuth();
  const { addMessage } = useOrderHistory();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [order.messages]);

  const send = () => {
    if (!text.trim() || !user) return;
    addMessage(order.id, { senderId: user.id, senderName: user.name, senderRole: user.role, text: text.trim() });
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="font-bold text-sm">Pesan — {order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">Pembeli: {order.shippingInfo?.firstName} {order.shippingInfo?.lastName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl font-bold">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0" style={{ maxHeight: "300px" }}>
          {(order.messages ?? []).length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">Belum ada pesan. Kirim pesan ke pembeli!</p>
          ) : (order.messages ?? []).map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.id ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-muted-foreground mb-0.5">{msg.senderName}</span>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 p-3 border-t">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Tulis pesan…"
            className="flex-1 px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={send} className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live Tab ─────────────────────────────────────────────────────────────────
function LiveTab({ user, isAdmin }: { user: NonNullable<ReturnType<typeof useAuth>["user"]>; isAdmin: boolean }) {
  const { activeSessions, startLive, stopLive, updateSession, toggleProduct, gifts, totalPoints } = useLive();
  const { allStoreProducts } = useProducts();
  const { isSultan } = useSultan();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSultanAnnouncement = () => {
    if (!isLive) return;
    toast({ 
      title: "Announcement Sultan Terkirim", 
      description: "User Sultan telah menerima notifikasi early access untuk produk ini!" 
    });
    // In a real app, this would send a special socket event
  };

  // Find if THIS seller is live
  const mySession = activeSessions.find(s => s.sellerId === user.id);
  const isLive = !!mySession;

  const [cameraOn, setCameraOn]   = useState(false);
  const [liveSearch, setLiveSearch] = useState("");

  const handleStartLive = () => {
    startLive(user.id, user.name);
    toast({ title: "🔴 Live dimulai!", description: "Penonton sekarang bisa bergabung ke siaran kamu." });
  };

  const handleStopLive = () => {
    stopLive(user.id);
    stopCamera();
    toast({ title: "Live dihentikan." });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      toast({ title: "Tidak bisa akses kamera", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  useEffect(() => { return () => { stopCamera(); }; }, []);

  const filteredProducts = allStoreProducts.filter((p) =>
    !liveSearch || p.name.toLowerCase().includes(liveSearch.toLowerCase())
  );

  const selectedProducts = allStoreProducts.filter((p) => mySession?.featuredProductIds.includes(p.id) || false);

  return (
    <div className="space-y-5">
      {/* Live Status */}
      <div className="bg-card border rounded-[2rem] p-6 shadow-xl shadow-black/5 border-primary/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black tracking-tighter">Status Siaran</h3>
              {isLive && (
                <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/20">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />ON AIR
                </span>
              )}
            </div>
            {isLive && (
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={handleSultanAnnouncement}
                  variant="outline" 
                  className="flex-1 bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 font-bold text-xs gap-2"
                >
                  <Crown className="h-4 w-4" /> Announcement Sultan
                </Button>
                <Button variant="outline" className="flex-1 text-xs font-bold" onClick={handleStopLive}>
                  Akhiri Sesi Live
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground font-medium mt-2">
              {isLive
                ? `Siaran kamu sedang berlangsung · ${totalPoints} poin hadiah diterima`
                : "Mulai siaran untuk menjangkau lebih banyak pembeli secara langsung."}
            </p>
          </div>
          <button onClick={isLive ? handleStopLive : handleStartLive} className="flex-shrink-0 transition-transform active:scale-90">
            {isLive
              ? <ToggleRight className="h-14 w-14 text-red-500 drop-shadow-sm" />
              : <ToggleLeft  className="h-14 w-14 text-muted-foreground opacity-30" />}
          </button>
        </div>
      </div>

      {/* Kamera preview */}
      <div className="bg-card border rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black tracking-tighter text-sm flex items-center gap-2"><Camera className="h-4 w-4 text-primary" />Monitor Kamera</h3>
          <Button size="sm" variant={cameraOn ? "destructive" : "outline"} onClick={cameraOn ? stopCamera : startCamera} className="gap-2 rounded-xl text-xs font-bold px-4">
            {cameraOn ? <><CameraOff className="h-3.5 w-3.5" />Matikan</> : <><Camera className="h-3.5 w-3.5" />Aktifkan Preview</>}
          </Button>
        </div>
        <div className={`relative rounded-[1.5rem] overflow-hidden bg-gray-900 flex items-center justify-center transition-all ${cameraOn ? "aspect-video" : "h-40 border-2 border-dashed border-muted"}`}>
          {cameraOn
            ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Live Preview</span>
                </div>
              </>
            )
            : <div className="text-center text-muted-foreground">
                <Camera className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-[11px] font-bold uppercase tracking-widest">Kamera Nonaktif</p>
              </div>}
        </div>
      </div>

      {/* Live config */}
      <div className="bg-card border rounded-[2rem] p-6 shadow-sm space-y-4">
        <h3 className="font-black tracking-tighter text-sm">Pengaturan Konten</h3>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Judul Siaran</label>
          <input 
            value={mySession?.title || ""} 
            onChange={(e) => updateSession(user.id, { title: e.target.value })}
            placeholder="Contoh: Diskon Gila-gilaan Akhir Bulan!"
            className="w-full px-4 py-3 text-sm border-2 border-muted rounded-2xl bg-background focus:outline-none focus:border-primary transition-colors font-bold" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nama Host</label>
          <input 
            value={mySession?.hostName || ""} 
            onChange={(e) => updateSession(user.id, { hostName: e.target.value })}
            placeholder="Nama kamu atau nama toko"
            className="w-full px-4 py-3 text-sm border-2 border-muted rounded-2xl bg-background focus:outline-none focus:border-primary transition-colors font-bold" 
          />
        </div>
      </div>

      {/* Gift stats */}
      {isLive && totalPoints > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2rem] p-6 text-white shadow-lg shadow-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-black tracking-tighter text-sm uppercase">Hadiah Diterima</h3>
              <p className="text-2xl font-black">{totalPoints} <span className="text-xs opacity-70">Poin</span></p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {GIFT_TYPES.map((g) => (
              <div key={g.id} className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                <span className="text-lg">{g.emoji}</span>
                <span className="text-[10px] font-black uppercase">{g.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Produk etalase */}
      <div className="bg-card border rounded-[2.5rem] p-6 shadow-sm space-y-5 border-muted">
        <div>
          <h3 className="font-black tracking-tighter text-sm mb-1 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />Katalog Produk Live
          </h3>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {mySession?.featuredProductIds.length === 0
              ? "Semua produk toko ditampilkan secara default."
              : `${mySession?.featuredProductIds.length} produk di-pin ke siaran.`}
          </p>
        </div>

        {/* Selected products preview */}
        {selectedProducts.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <img src={p.image} alt={p.name} className="relative w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm" />
                  <button 
                    onClick={() => toggleProduct(user.id, p.id)} 
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg"
                  >
                    ×
                  </button>
                </div>
                <span className="text-[9px] font-black text-center text-muted-foreground line-clamp-1 uppercase tracking-tighter">{p.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            value={liveSearch} 
            onChange={(e) => setLiveSearch(e.target.value)} 
            placeholder="Cari produk dari tokomu..."
            className="w-full pl-12 pr-4 py-3 text-sm border-2 border-muted rounded-2xl bg-background focus:outline-none focus:border-primary transition-colors font-bold" 
          />
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {filteredProducts.map((p) => {
            const selected = mySession?.featuredProductIds.includes(p.id) || false;
            return (
              <button 
                key={p.id} 
                onClick={() => toggleProduct(user.id, p.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-[1.5rem] border-2 text-left transition-all ${
                  selected 
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                    : "border-muted hover:border-primary/20 hover:bg-muted/30"
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-tight truncate">{p.name}</p>
                  <p className="text-primary font-black text-sm">{formatPrice(p.price)}</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                }`}>
                  {selected && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = "products" | "orders" | "live";

export function SellerPage() {
  const { user } = useAuth();
  const { auctions, createAuction, endAuction, deleteAuction } = useAuction();
  const { sellerProducts, adminProducts, deleteProduct, deleteAdminProduct } = useProducts();
  const { getAllOrders, updateOrderStatus } = useOrderHistory();
  const { activeSessions } = useLive();
  const isAnyLive = activeSessions.length > 0;
  const isMyLive = activeSessions.some(s => s.sellerId === user?.id);
  const [tab, setTab] = useState<"products" | "orders" | "live" | "auction">("products");
  const [showForm, setShowForm] = useState(false);
  const [chatOrder, setChatOrder] = useState<PurchasedOrder | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "all">("all");
  const [editingProduct, setEditingProduct] = useState<SellerProduct | AdminProduct | null>(null);
  const { toast } = useToast();

  const myAuctions = auctions.filter(a => a.sellerId === user?.id);

  // Form states for Auction
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [auctionData, setAuctionData] = useState({
    title: "", description: "", imageUrl: "",
    startPrice: "", minStep: "", duration: "1" // hours
  });

  const handleCreateAuction = () => {
    if (!auctionData.title || !auctionData.startPrice) {
      toast({ variant: "destructive", title: "Error", description: "Lengkapi data lelang" });
      return;
    }
    const endTime = new Date(Date.now() + Number(auctionData.duration) * 60 * 60 * 1000).toISOString();
    createAuction({
      title: auctionData.title,
      description: auctionData.description,
      imageUrl: auctionData.imageUrl || "https://placehold.co/400x300?text=Barang+Lelang",
      startPrice: Number(auctionData.startPrice),
      minStep: Number(auctionData.minStep) || 1000,
      endTime
    });
    setShowAuctionForm(false);
    setAuctionData({ title: "", description: "", imageUrl: "", startPrice: "", minStep: "", duration: "1" });
    toast({ title: "Lelang Dibuat!", description: "Barangmu kini bisa di-bid oleh user lain." });
  };

  if (!user || (user.role !== "seller" && user.role !== "admin")) return null;
  const isAdmin = user.role === "admin";

  const mySellerProducts = sellerProducts.filter((p) => p.sellerId === user.id);
  const allOrders = getAllOrders();
  const visibleOrders = orderFilter === "all" ? allOrders : allOrders.filter((o) => o.status === orderFilter);

  const counts = {
    pending:  mySellerProducts.filter((p) => p.status === "pending").length,
    approved: isAdmin ? mySellerProducts.filter((p) => p.status === "approved").length + adminProducts.length : mySellerProducts.filter((p) => p.status === "approved").length,
    rejected: mySellerProducts.filter((p) => p.status === "rejected").length,
  };

  const orderCounts: Record<string, number> = {
    placed:      allOrders.filter((o) => o.status === "placed").length,
    processing:  allOrders.filter((o) => o.status === "processing").length,
    shipped:     allOrders.filter((o) => o.status === "shipped").length,
    problem:     allOrders.filter((o) => o.status === "problem").length,
  };

  const handleDelete      = (id: number) => { deleteProduct(id); toast({ title: "Produk dihapus." }); };
  const handleDeleteAdmin = (id: number) => { deleteAdminProduct(id); toast({ title: "Produk dihapus dari toko." }); };
  const handleEdit        = (p: SellerProduct | AdminProduct) => { setEditingProduct(p); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleProcess     = (id: string) => { updateOrderStatus(id, "processing"); toast({ title: "Pesanan diproses.", description: "Pembeli mendapat notifikasi." }); };
  const handleShip        = (id: string) => { updateOrderStatus(id, "shipped"); toast({ title: "Dikirim ke kurir!", description: "Kurir akan segera mengambil paket." }); };

  const TABS: { id: "products" | "orders" | "live" | "auction"; label: string; badge?: number }[] = [
    { id: "products", label: "Produk" },
    { id: "orders",   label: "Pesanan", badge: orderCounts.placed + orderCounts.problem },
    { id: "live",     label: "Live" },
    { id: "auction",  label: "Lelang" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          {isAdmin ? <ShieldCheck className="h-6 w-6 text-primary" /> : <Store className="h-6 w-6 text-primary" />}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{isAdmin ? "Kelola Toko" : "Dashboard Seller"}</h1>
          <p className="text-sm text-muted-foreground">Kelola produk, pesanan, dan live shopping</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-muted/40 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {id === "live" && isMyLive && <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />}
            {id === "live" && !isMyLive && isAnyLive && <Radio className="h-3.5 w-3.5 text-orange-500 opacity-50" />}
            {label}
            {badge != null && badge > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Produk ──────────────────────────────────────────────── */}
      {tab === "products" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Menunggu",  count: counts.pending,  color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              { label: isAdmin ? "Live di Toko" : "Disetujui", count: counts.approved, color: "text-green-600", bg: "bg-green-50 border-green-200" },
              { label: "Ditolak",   count: counts.rejected, color: "text-red-600",   bg: "bg-red-50 border-red-200" },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`rounded-2xl border p-4 text-center ${bg}`}>
                <p className={`text-2xl font-extrabold ${color}`}>{count}</p>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="bg-card border rounded-2xl overflow-hidden mb-6 shadow-sm">
            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors" onClick={() => { 
              if (showForm) { setShowForm(false); setEditingProduct(null); }
              else { setShowForm(true); }
            }}>
              <span className="flex items-center gap-2 font-bold text-left truncate">
                {editingProduct ? (
                  <><Pencil className="h-5 w-5 text-primary flex-shrink-0" /> Edit Produk: <span className="text-primary truncate">{editingProduct.name}</span></>
                ) : (
                  <><PlusCircle className="h-5 w-5 text-primary flex-shrink-0" /> Tambah Produk Baru</>
                )}
              </span>
              {showForm ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showForm && (
              <div className="px-5 pb-6 border-t">
                <p className="text-xs text-muted-foreground mt-4 mb-4">
                  {editingProduct ? "Silakan perbarui detail produk di bawah ini." : (isAdmin ? "Produk langsung tampil di toko." : "Produk menunggu persetujuan admin.")}
                </p>
                <ProductForm 
                  onSuccess={() => { setShowForm(false); setEditingProduct(null); }} 
                  isAdmin={isAdmin} 
                  product={editingProduct || undefined} 
                />
                {editingProduct && (
                  <Button variant="ghost" className="w-full mt-2 text-xs h-8 text-muted-foreground" onClick={() => { setEditingProduct(null); setShowForm(false); }}>
                    Batal Edit
                  </Button>
                )}
              </div>
            )}
          </div>
          {isAdmin && adminProducts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-bold mb-3">Produk Admin Toko <span className="text-sm font-normal text-muted-foreground">({adminProducts.length})</span></h2>
              <div className="space-y-3">{adminProducts.map((p) => <AdminProductCard key={p.id} product={p} onDelete={handleDeleteAdmin} onEdit={handleEdit} />)}</div>
            </div>
          )}
          <div>
            <h2 className="text-base font-bold mb-3">{isAdmin ? "Produk Disubmit" : "Produk Saya"} <span className="text-sm font-normal text-muted-foreground">({mySellerProducts.length})</span></h2>
            {mySellerProducts.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
                <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-muted-foreground">Belum ada produk</p>
              </div>
            ) : (
              <div className="space-y-3">{mySellerProducts.map((p) => <SellerProductCard key={p.id} product={p} onDelete={handleDelete} onEdit={handleEdit} canAlwaysDelete={isAdmin} />)}</div>
            )}
          </div>
        </>
      )}

      {/* ── Tab: Pesanan ─────────────────────────────────────────────── */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "all",        label: `Semua (${allOrders.length})` },
              { id: "placed",     label: `Baru (${orderCounts.placed})` },
              { id: "processing", label: `Diproses (${orderCounts.processing})` },
              { id: "shipped",    label: `Di Kurir (${orderCounts.shipped})` },
              { id: "problem",    label: `Masalah (${orderCounts.problem})` },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setOrderFilter(id as OrderStatus | "all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  orderFilter === id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}>
                {label}
              </button>
            ))}
          </div>
          {visibleOrders.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-semibold text-muted-foreground">Tidak ada pesanan</p>
              <p className="text-xs text-muted-foreground mt-1">Pesanan dari pembeli akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleOrders.map((order) => (
                <SellerOrderCard key={order.id} order={order} onProcess={handleProcess} onShip={handleShip} onChat={setChatOrder} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Live ────────────────────────────────────────────────── */}
      {tab === "live" && <LiveTab user={user} isAdmin={isAdmin} />}

      {chatOrder && <ChatModal order={chatOrder} onClose={() => setChatOrder(null)} />}

      {/* ── Tab: Lelang ──────────────────────────────────────────────── */}
      {tab === "auction" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-black">Manajemen Lelang</h2>
             <div className="flex gap-2">
               {myAuctions.length > 0 && (
                 <Button 
                   variant="outline" 
                   className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                   onClick={() => {
                     if (confirm("Hapus semua data lelang kamu?")) {
                       myAuctions.forEach(a => deleteAuction(a.id));
                     }
                   }}
                 >
                   Hapus Semua
                 </Button>
               )}
               <Button onClick={() => setShowAuctionForm(true)} className="gap-2 rounded-xl bg-amber-600 hover:bg-amber-700">
                 <Plus className="h-4 w-4" /> Buat Lelang Baru
               </Button>
             </div>
          </div>

          {showAuctionForm && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-amber-900">Formulir Lelang Baru</h3>
                <button onClick={() => setShowAuctionForm(false)} className="text-amber-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Barang</Label>
                  <Input value={auctionData.title} onChange={e => setAuctionData({...auctionData, title: e.target.value})} placeholder="Contoh: Sepatu Limited Edition" />
                </div>
                <div className="space-y-2">
                  <Label>URL Gambar</Label>
                  <Input value={auctionData.imageUrl} onChange={e => setAuctionData({...auctionData, imageUrl: e.target.value})} placeholder="https://..." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Deskripsi</Label>
                  <Input value={auctionData.description} onChange={e => setAuctionData({...auctionData, description: e.target.value})} placeholder="Jelaskan kondisi barang..." />
                </div>
                <div className="space-y-2">
                  <Label>Harga Awal (Rp)</Label>
                  <Input type="number" value={auctionData.startPrice} onChange={e => setAuctionData({...auctionData, startPrice: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Kelipatan Bid Minimal (Rp)</Label>
                  <Input type="number" value={auctionData.minStep} onChange={e => setAuctionData({...auctionData, minStep: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Durasi Lelang (Jam)</Label>
                  <select 
                    className="w-full p-2 bg-white border-2 rounded-xl text-sm"
                    value={auctionData.duration}
                    onChange={e => setAuctionData({...auctionData, duration: e.target.value})}
                  >
                    <option value="0.1">6 Menit (Tes)</option>
                    <option value="1">1 Jam</option>
                    <option value="6">6 Jam</option>
                    <option value="24">24 Jam (1 Hari)</option>
                    <option value="72">72 Jam (3 Hari)</option>
                  </select>
                </div>
                <div className="md:col-span-2 pt-2">
                  <Button onClick={handleCreateAuction} className="w-full bg-amber-600 hover:bg-amber-700 font-black h-12 rounded-xl">
                    AKTIFKAN LELANG SEKARANG
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {myAuctions.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <Gavel className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Kamu belum membuat lelang.</p>
              </div>
            ) : (
              myAuctions.map(a => (
                <div key={a.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={a.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
                    <div>
                      <h4 className="font-bold text-gray-900">{a.title}</h4>
                      <div className="flex gap-2 items-center mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {a.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{a.bids.length} Bidder</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Harga Tertinggi</p>
                    <p className="text-lg font-black text-amber-600">{formatPrice(a.currentPrice)}</p>
                    <div className="flex gap-2">
                      {a.status === "active" && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => endAuction(a.id)}>
                          Akhiri Paksa
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteAuction(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
