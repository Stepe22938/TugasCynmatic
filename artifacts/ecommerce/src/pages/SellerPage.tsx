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
  MessageSquare, Send, ToggleLeft, ToggleRight, Zap, Pencil, Crown,
  Gavel, Heart, Bot, ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useProducts, SellerProduct, AdminProduct } from "../contexts/ProductsContext";
import { useOrderHistory, PurchasedOrder, OrderStatus } from "../contexts/OrderHistoryContext";
import { useLive, GIFT_TYPES } from "../contexts/LiveContext";
import { useAuction } from "../contexts/AuctionContext";
import { formatPrice } from "../utils/formatPrice";
import { formatDate } from "../utils/formatDate";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { useSultan } from "../contexts/MySultanContext";
import { useWishlist } from "../contexts/WishlistContext";

const CATEGORIES = ["Sepatu","Tas","Pakaian","Aksesori","Elektronik","Makanan","Pre-Order","Lainnya"];

const SELLER_STATUS_CONFIG: Record<SellerProduct["status"], { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: "Matrix Review", color: "bg-amber-600/10 text-amber-500 border-amber-500/20",  icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Verified",      color: "bg-emerald-600/10 text-emerald-500 border-emerald-500/20",  icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Terminated",    color: "bg-rose-600/10 text-rose-500 border-rose-500/20",      icon: <XCircle className="h-3 w-3" /> },
};

const SELLER_ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  placed:      { label: "Inbound Signal",      color: "text-blue-400",   bg: "bg-blue-600/10 border-blue-500/20" },
  processing:  { label: "Matrix Processing",   color: "text-amber-400",  bg: "bg-amber-600/10 border-amber-500/20" },
  pending_po:  { label: "Delayed Protocol",    color: "text-cyan-400",   bg: "bg-cyan-600/10 border-cyan-500/20" },
  shipped:     { label: "Assets Deployed",     color: "text-orange-400", bg: "bg-orange-600/10 border-orange-500/20" },
  in_delivery: { label: "Frequency Active",    color: "text-purple-400", bg: "bg-purple-600/10 border-purple-500/20" },
  delivered:   { label: "Node Arrival",        color: "text-emerald-400", bg: "bg-emerald-600/10 border-emerald-500/20" },
  completed:   { label: "Sync Complete",       color: "text-emerald-500", bg: "bg-emerald-600/20 border-emerald-500/30" },
  problem:     { label: "Anomaly Detected",    color: "text-rose-400",    bg: "bg-rose-600/10 border-rose-500/20" },
};

function formatSellerDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Product cards ────────────────────────────────────────────────────────────
function SellerProductCard({ product, onDelete, onEdit, canAlwaysDelete = false }: {
  product: SellerProduct; onDelete: (id: number) => void; onEdit: (p: SellerProduct) => void; canAlwaysDelete?: boolean;
}) {
  const { toggleFlashSale, updateStock } = useProducts();
  const { getWishlistCountForProduct } = useWishlist();
  const cfg = SELLER_STATUS_CONFIG[product.status];
  const [discount, setDiscount] = useState(product.discountPercent || 10);
  const wishlistCount = getWishlistCountForProduct(product.id);

  useEffect(() => {
    if (product.discountPercent !== undefined) {
      setDiscount(product.discountPercent);
    }
  }, [product.discountPercent]);

  return (
    <div className="group relative glass-card p-6 rounded-[2.5rem] border-white/5 bg-white/5 hover:border-orange-500/20 transition-all duration-500 shadow-xl">
      <div className="flex gap-6 items-start">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
          <img src={product.image} alt={product.name}
            className="relative w-24 h-24 rounded-2xl object-cover flex-shrink-0 bg-white/5 border border-white/10"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=?"; }} />
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white group-hover:text-orange-500 transition-colors uppercase italic">{product.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{product.category}</span>
                <div className="w-1 h-1 bg-white/10 rounded-full" />
                {product.isFlashSale ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-orange-500 italic">{formatPrice(product.price * (1 - (product.discountPercent || 0) / 100))}</p>
                    <p className="text-[10px] text-white/20 line-through font-bold">{formatPrice(product.price)}</p>
                  </div>
                ) : (
                  <p className="text-sm font-black text-white/60 italic">{formatPrice(product.price)}</p>
                )}
              </div>
            </div>
            <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.color.replace("dark:bg-", "bg-").replace("dark:text-", "text-")}`}>
               {cfg.label}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <p className="text-xs font-bold text-white/30 line-clamp-1">{product.description}</p>
            {wishlistCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
                <Heart className="h-2.5 w-2.5 fill-current" />
                <span className="text-[10px] font-black">{wishlistCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-orange-500/10 text-orange-500"
            onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {(canAlwaysDelete || product.status !== "approved") && (
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-red-500/10 text-red-500"
              onClick={() => onDelete(product.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {product.status === "approved" && (
        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <Zap className={`h-4 w-4 ${product.isFlashSale ? "text-orange-500 fill-orange-500" : "text-white/20"}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Flash Sale</span>
            </div>
            <button 
              onClick={() => toggleFlashSale(product.id, !product.isFlashSale, discount)}
              className="transition-transform active:scale-90"
            >
              {product.isFlashSale ? <ToggleRight className="h-7 w-7 text-orange-500" /> : <ToggleLeft className="h-7 w-7 text-white/10" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Stok Assets</span>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={product.stock} 
                min="0"
                onChange={(e) => updateStock(product.id, Number(e.target.value))}
                className="w-12 bg-transparent text-center text-xs font-black text-white focus:outline-none"
              />
              {product.stock === 0 && <span className="text-[9px] font-black text-red-500 uppercase animate-pulse">Out!</span>}
            </div>
          </div>

          {product.isFlashSale && (
            <div className="flex items-center justify-between px-4 py-2 bg-orange-600/10 rounded-2xl border border-orange-500/20 animate-in zoom-in-95">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Discount %</span>
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
                  className="w-10 bg-transparent text-center text-xs font-black text-orange-500 focus:outline-none"
                />
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
    <div className="group relative glass-card p-6 rounded-[2.5rem] border-white/5 bg-white/5 hover:border-orange-500/20 transition-all duration-500 shadow-xl">
      <div className="flex gap-6 items-start">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
          <img src={product.image} alt={product.name}
            className="relative w-24 h-24 rounded-2xl object-cover flex-shrink-0 bg-white/5 border border-white/10"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=?"; }} />
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white group-hover:text-orange-500 transition-colors uppercase italic">{product.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{product.category}</span>
                <div className="w-1 h-1 bg-white/10 rounded-full" />
                {product.isFlashSale ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-orange-500 italic">{formatPrice(product.price * (1 - (product.discountPercent || 0) / 100))}</p>
                    <p className="text-[10px] text-white/20 line-through font-bold">{formatPrice(product.price)}</p>
                  </div>
                ) : (
                  <p className="text-sm font-black text-white/60 italic">{formatPrice(product.price)}</p>
                )}
              </div>
            </div>
            <div className="px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-500/20 bg-orange-600/10 text-orange-500 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Admin Asset
            </div>
          </div>
          <p className="text-xs font-bold text-white/30 line-clamp-1">{product.description}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-orange-500/10 text-orange-500"
            onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-red-500/10 text-red-500"
            onClick={() => onDelete(product.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <Zap className={`h-4 w-4 ${product.isFlashSale ? "text-orange-500 fill-orange-500" : "text-white/20"}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Flash Sale</span>
            </div>
            <button 
              onClick={() => toggleFlashSale(product.id, !product.isFlashSale, discount)}
              className="transition-transform active:scale-90"
            >
              {product.isFlashSale ? <ToggleRight className="h-7 w-7 text-orange-500" /> : <ToggleLeft className="h-7 w-7 text-white/10" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Stok Assets</span>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={product.stock} 
                min="0"
                onChange={(e) => updateStock(product.id, Number(e.target.value))}
                className="w-12 bg-transparent text-center text-xs font-black text-white focus:outline-none"
              />
              {product.stock === 0 && <span className="text-[9px] font-black text-red-500 uppercase animate-pulse">Out!</span>}
            </div>
          </div>
          
          {product.isFlashSale && (
            <div className="flex items-center justify-between px-4 py-2 bg-orange-600/10 rounded-2xl border border-orange-500/20 animate-in zoom-in-95">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Discount %</span>
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
                  className="w-10 bg-transparent text-center text-xs font-black text-orange-500 focus:outline-none"
                />
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
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{label}</Label>
      {node}
      {err && <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-tight">/! {err}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {field("name", "Asset Identity", <Input id="name" placeholder="Rare Item Name" value={form.name} onChange={set("name")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.name)}
          
          <div className="grid grid-cols-2 gap-6">
            {field("category", "Asset Category",
              <select id="category" value={form.category} onChange={set("category")} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500 appearance-none">
                {CATEGORIES.map((c) => <option key={c} className="bg-background">{c}</option>)}
              </select>)}
            {field("price", "Valuation (Rp)", <Input id="price" type="number" min="1" placeholder="0" value={form.price} onChange={set("price")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.price)}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {field("stock", "Asset Inventory", <Input id="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={set("stock")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.stock)}
            <div className="flex items-center">
               <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest leading-tight italic">Inventory levels synchronize automatically post-transaction.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {field("image", "Visualization Link", <Input id="image" type="url" placeholder="https://..." value={form.image} onChange={set("image")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.image)}
          
          <div className="flex gap-6 items-center">
            {form.image ? (
              <div className="relative group/img">
                <div className="absolute -inset-1 bg-orange-600 rounded-2xl blur opacity-20 group-hover/img:opacity-40 transition duration-500" />
                <img src={form.image} alt="preview" className="relative w-28 h-28 rounded-2xl object-cover border border-white/10 bg-white/5" onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/112x112?text=Error"; }} />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center text-white/10 italic text-[10px] font-black uppercase text-center px-4">Waiting for visual...</div>
            )}
            <div className="flex-1">
              {field("description", "Brief Intel", <Input id="description" placeholder="Short asset overview" value={form.description} onChange={set("description")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.description)}
            </div>
          </div>

          {field("longDescription", "Detailed Specification",
            <textarea id="longDescription" rows={3} placeholder="Provide comprehensive technical details and history..." value={form.longDescription} onChange={set("longDescription")}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-medium text-white/80 focus:outline-none focus:border-orange-500 resize-none min-h-[112px]" />, errors.longDescription)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Specs Protocol */}
        <div className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-white/5 space-y-6">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${useSpecs ? "bg-orange-600 text-white" : "bg-white/5 text-white/20"}`}>
                <ClipboardList className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white italic group-hover:text-orange-500 transition-colors">Advanced Specs Protocol</span>
            </div>
            <input type="checkbox" checked={useSpecs} onChange={(e) => setUseSpecs(e.target.checked)} className="hidden" />
            <div className={`w-10 h-5 rounded-full relative transition-colors ${useSpecs ? "bg-orange-600" : "bg-white/10"}`}>
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${useSpecs ? "left-6" : "left-1"}`} />
            </div>
          </label>
          
          {useSpecs && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-4 pt-2"
            >
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-3 items-center group/spec">
                  <Input placeholder="Label" value={spec.label} onChange={(e) => setSpec(i, "label", e.target.value)} className="h-10 rounded-xl bg-white/5 border-white/5 text-[10px] font-bold uppercase tracking-widest focus:border-orange-500/50" />
                  <Input placeholder="Val" value={spec.value} onChange={(e) => setSpec(i, "value", e.target.value)} className="h-10 rounded-xl bg-white/5 border-white/5 text-[10px] font-bold uppercase tracking-widest focus:border-orange-500/50" />
                  {specs.length > 1 && (
                    <button type="button" onClick={() => removeSpec(i)} className="p-2 text-white/10 hover:text-rose-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="ghost" className="w-full h-10 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white" onClick={addSpec}>
                <Plus className="h-3.5 w-3.5 mr-2" /> Append Data Row
              </Button>
            </motion.div>
          )}
        </div>

        {/* Pre-Order Protocol */}
        <div className={`glass-card rounded-[2.5rem] p-8 border-white/5 transition-colors duration-500 ${form.isPreOrder ? "bg-orange-600/5 border-orange-500/20" : "bg-white/5"}`}>
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${form.isPreOrder ? "bg-orange-600 text-white" : "bg-white/5 text-white/20"}`}>
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white italic group-hover:text-orange-500 transition-colors">Pre-Order Protocol</span>
            </div>
            <input type="checkbox" checked={form.isPreOrder} onChange={(e) => setForm(f => ({ ...f, isPreOrder: e.target.checked }))} className="hidden" />
            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.isPreOrder ? "bg-orange-600" : "bg-white/10"}`}>
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${form.isPreOrder ? "left-6" : "left-1"}`} />
            </div>
          </label>
          
          {form.isPreOrder && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-4 pt-6"
            >
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-orange-500 ml-1">Release Schedule</Label>
                <Input type="datetime-local" value={form.releaseDate} onChange={e => setForm(f => ({ ...f, releaseDate: e.target.value }))} className="glass-input h-12 rounded-xl border-orange-500/20 text-white" />
              </div>
              <p className="text-[9px] text-orange-500/60 font-black uppercase tracking-widest italic leading-relaxed px-1">
                * Elite status enables 30-minute early access priority.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="pt-6">
        <Button type="submit" className="w-full h-20 rounded-[2.5rem] bg-orange-600 hover:bg-orange-700 text-white shadow-2xl shadow-orange-600/20 disabled:opacity-50 transition-all" disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-3 border-white border-t-transparent animate-spin" />
              <span className="text-xs font-black uppercase tracking-[0.3em] italic">Transmitting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {product ? <CheckCircle2 className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
              <span className="text-sm font-black uppercase tracking-[0.4em] italic">
                {product ? "Confirm Asset Modifications" : (isAdmin ? "Execute Direct Deployment" : "Initialize Asset Review")}
              </span>
            </div>
          )}
        </Button>
      </div>
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
  const cfg = SELLER_ORDER_STATUS_CONFIG[order.status] || { label: order.status || "Unknown", color: "text-gray-400", bg: "bg-white/5" };

  return (
    <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 bg-white/5 shadow-xl group hover:border-orange-500/20 transition-all duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-6 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center">
            <Package className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <span className="block font-black text-orange-500 text-sm tracking-tighter italic">{order.orderNumber}</span>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{formatDate(order.date)}</span>
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/5 ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
      
      {order.shippingInfo && (
        <div className="px-8 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <Truck className="h-3.5 w-3.5 text-white/40" />
          </div>
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
            Shipping to: <span className="text-white/60">{order.shippingInfo.firstName} {order.shippingInfo.lastName}</span> 
            <span className="mx-2 opacity-20">|</span> 
            {order.shippingInfo.address}
          </div>
        </div>
      )}

      <button 
        className="w-full flex items-center justify-between px-8 py-4 hover:bg-white/5 transition-colors group/btn"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {order.items.slice(0, 3).map((item, idx) => (
              <img key={idx} src={item.image} className="w-8 h-8 rounded-lg border-2 border-[#0a0a0b] object-cover bg-white/5" alt="" />
            ))}
            {order.items.length > 3 && (
              <div className="w-8 h-8 rounded-lg border-2 border-[#0a0a0b] bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs font-black text-white italic tracking-tight">{order.items.length} Asset{order.items.length > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-black text-orange-500 italic">{formatPrice(order.grandTotal)}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-white/20" /> : <ChevronDown className="h-4 w-4 text-white/20" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-8 pb-6 border-t border-white/5 divide-y divide-white/5"
          >
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 items-center py-4">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-white/5 border border-white/10 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white uppercase italic tracking-tight truncate">{item.name}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Quantity: {item.quantity} · {formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 px-8 pb-8 pt-4 flex-wrap">
        {order.status === "placed" && (
          <Button 
            onClick={() => onProcess(order.id)} 
            className="h-12 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-amber-500/20 gap-2"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Initialize Process
          </Button>
        )}
        {order.status === "processing" && (
          <Button 
            onClick={() => onShip(order.id)} 
            className="h-12 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-orange-600/20 gap-2"
          >
            <Truck className="h-3.5 w-3.5" /> Finalize Deployment
          </Button>
        )}
        {(order.status === "shipped" || order.status === "in_delivery") && (
          <div className="h-12 flex items-center gap-3 px-6 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
            {order.status === "shipped" ? "Awaiting Logistics Pickup" : "In Logistics Transit"}
          </div>
        )}
        {order.status === "problem" && order.problemReport && (
          <div className="w-full text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-500 rounded-[1.5rem] px-6 py-4 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="uppercase tracking-widest mb-1">Issue Reported by User</p>
              <p className="italic opacity-80">"{order.problemReport}"</p>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={() => onChat(order)} 
          className="h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/60 ml-auto gap-2"
        >
          <MessageSquare className="h-3.5 w-3.5 text-orange-500" /> Secure Chat
          {(order.messages ?? []).length > 0 && (
            <span className="bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card rounded-[3rem] shadow-2xl w-full max-w-lg flex flex-col border-white/10 overflow-hidden" 
        style={{ maxHeight: "85vh" }}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-black text-white italic uppercase tracking-tighter">Asset Chat — {order.orderNumber}</p>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Target: {order.shippingInfo?.firstName} {order.shippingInfo?.lastName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-white transition-colors text-2xl font-light">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 min-h-0 custom-scrollbar">
          {(order.messages ?? []).length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Bot className="h-8 w-8 text-white/10" />
              </div>
              <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">No communication history detected.</p>
            </div>
          ) : (order.messages ?? []).map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.id ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{msg.senderName}</span>
                {msg.senderRole === "admin" && <ShieldCheck className="h-3 w-3 text-orange-500" />}
              </div>
              <div className={`max-w-[85%] px-5 py-4 rounded-[1.5rem] text-sm font-medium shadow-lg ${
                msg.senderId === user?.id 
                  ? "bg-orange-600 text-white rounded-tr-none shadow-orange-600/10" 
                  : "bg-white/5 text-white/80 border border-white/5 rounded-tl-none"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="p-8 border-t border-white/5 bg-white/5">
          <div className="flex gap-4 p-2 bg-white/5 rounded-[2rem] border border-white/10">
            <input 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Transmit secure message..."
              className="flex-1 px-6 py-3 text-xs font-bold text-white bg-transparent focus:outline-none placeholder:text-white/20" 
            />
            <button 
              onClick={send} 
              className="w-12 h-12 bg-orange-600 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-600/20 active:scale-90 transition-transform"
            >
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
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
    <div className="space-y-8">
      {/* Live Status Protocol */}
      <div className="glass-card border-white/5 bg-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Radio className="h-24 w-24 text-orange-500" />
        </div>
        
        <div className="flex items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40 italic">Broadcasting Protocol</h3>
              {isLive && (
                <span className="flex items-center gap-1.5 bg-red-500 text-white text-[9px] font-black px-4 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/20 tracking-widest">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">
              {isLive ? "Sultan Live Stream Active" : "Initialize Live Transmission"}
            </h2>

            {isLive && (
              <div className="flex gap-3 mb-4">
                <Button 
                  onClick={handleSultanAnnouncement}
                  className="h-10 px-6 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-black text-[9px] uppercase tracking-widest gap-2 rounded-xl"
                >
                  <Crown className="h-3.5 w-3.5" /> Sultan Ping
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-10 px-6 text-white/40 hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl" 
                  onClick={handleStopLive}
                >
                  Terminate Sesi
                </Button>
              </div>
            )}
            
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
              {isLive
                ? `Active broadcast session detected · ${totalPoints} gift points accumulated`
                : "Initialize real-time engagement to expand market reach and elite influence."}
            </p>
          </div>
          
          <button onClick={isLive ? handleStopLive : handleStartLive} className="flex-shrink-0 transition-all hover:scale-110 active:scale-95">
            {isLive
              ? <ToggleRight className="h-16 w-16 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
              : <ToggleLeft  className="h-16 w-16 text-white/10" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monitor Kamera */}
        <div className="glass-card border-white/5 bg-white/5 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
                <Camera className="h-4 w-4 text-orange-500" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 italic">Visual Monitor</h3>
            </div>
            <Button size="sm" variant={cameraOn ? "destructive" : "ghost"} onClick={cameraOn ? stopCamera : startCamera} className="gap-2 rounded-xl text-[9px] font-black uppercase tracking-widest h-8 px-4">
              {cameraOn ? <><CameraOff className="h-3.5 w-3.5" /> Close Feed</> : <><Camera className="h-3.5 w-3.5" /> Open Feed</>}
            </Button>
          </div>
          
          <div className={`relative rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center transition-all duration-500 ${cameraOn ? "aspect-video" : "h-48"}`}>
            {cameraOn ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                  <span className="text-white text-[9px] font-black uppercase tracking-widest italic">Live Encryption Active</span>
                </div>
              </>
            ) : (
              <div className="text-center space-y-3 opacity-20">
                <Camera className="h-12 w-12 mx-auto" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em]">Feed Offline</p>
              </div>
            )}
          </div>
        </div>

        {/* Transmission Settings */}
        <div className="glass-card border-white/5 bg-white/5 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-orange-500" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 italic">Session Config</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Broadcast Title</label>
              <input 
                value={mySession?.title || ""} 
                onChange={(e) => updateSession(user.id, { title: e.target.value })}
                placeholder="Elite Showcase Session"
                className="w-full px-6 py-4 text-xs bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-orange-500 transition-all font-bold uppercase tracking-widest placeholder:text-white/10" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Host Identity</label>
              <input 
                value={mySession?.hostName || ""} 
                onChange={(e) => updateSession(user.id, { hostName: e.target.value })}
                placeholder="Merchant ID"
                className="w-full px-6 py-4 text-xs bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-orange-500 transition-all font-bold uppercase tracking-widest placeholder:text-white/10" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gift Stats Protocol */}
      {isLive && totalPoints > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-orange-500/20 bg-gradient-to-br from-orange-600/10 to-transparent rounded-[2.5rem] p-8 relative overflow-hidden"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 italic mb-1">Asset Gifts Accumulated</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white italic tracking-tighter">{totalPoints}</span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Valuation Points</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-8 flex-wrap">
            {GIFT_TYPES.map((g) => (
              <div key={g.id} className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/5 hover:border-orange-500/20 transition-colors">
                <span className="text-xl">{g.emoji}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{g.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Produk etalase Protocol */}
      <div className="glass-card border-white/5 bg-white/5 rounded-[3rem] p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-orange-500" /> Live Asset Showcase
            </h3>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">
              {mySession?.featuredProductIds.length === 0
                ? "Universal portfolio display active"
                : `Elite selection: ${mySession?.featuredProductIds.length} assets pinned`}
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input 
              value={liveSearch} 
              onChange={(e) => setLiveSearch(e.target.value)} 
              placeholder="Search portfolio..."
              className="w-full pl-12 pr-6 py-4 text-xs bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-orange-500 transition-all font-bold uppercase tracking-widest placeholder:text-white/10" 
            />
          </div>
        </div>

        {/* Selected assets preview */}
        {selectedProducts.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex-shrink-0 group/pin w-24">
                <div className="relative">
                  <div className="absolute -inset-1 bg-orange-600 rounded-2xl blur opacity-0 group-hover/pin:opacity-40 transition duration-500" />
                  <img src={p.image} alt={p.name} className="relative w-24 h-24 rounded-2xl object-cover border border-white/10 bg-white/5" />
                  <button 
                    onClick={() => toggleProduct(user.id, p.id)} 
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-xl flex items-center justify-center text-lg font-light shadow-xl hover:scale-110 active:scale-90 transition-all"
                  >
                    ×
                  </button>
                </div>
                <p className="text-[9px] font-black text-center text-white/40 mt-3 truncate uppercase italic tracking-tighter">{p.name}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredProducts.map((p) => {
            const selected = mySession?.featuredProductIds.includes(p.id) || false;
            return (
              <button 
                key={p.id} 
                onClick={() => toggleProduct(user.id, p.id)}
                className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-500 text-left group/item ${
                  selected 
                    ? "border-orange-500/50 bg-orange-600/5 shadow-lg shadow-orange-600/10" 
                    : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-white uppercase italic tracking-tight truncate group-hover/item:text-orange-500 transition-colors">{p.name}</p>
                  <p className="text-orange-500 font-black text-sm italic">{formatPrice(p.price)}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  selected ? "bg-orange-600 border-orange-500 text-white rotate-0" : "border-white/5 text-white/10 -rotate-12 group-hover/item:rotate-0"
                }`}>
                  <CheckCircle2 className={`h-5 w-5 ${selected ? "opacity-100" : "opacity-0"}`} />
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
  const handleEdit        = (p: SellerProduct | AdminProduct) => { setEditingProduct(p); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleProcess     = (id: string) => { updateOrderStatus(id, "processing"); toast({ title: "Pesanan diproses.", description: "Pembeli mendapat notifikasi." }); };
  const handleShip        = (id: string) => { updateOrderStatus(id, "shipped"); toast({ title: "Dikirim ke kurir!", description: "Kurir akan segera mengambil paket." }); };

  const TABS: { id: "products" | "orders" | "live" | "auction"; label: string; badge?: number; icon: any }[] = [
    { id: "products", label: "Produk", icon: Package },
    { id: "orders",   label: "Pesanan", badge: orderCounts.placed + orderCounts.problem, icon: ShoppingBag },
    { id: "live",     label: "Live", icon: Radio },
    { id: "auction",  label: "Lelang", icon: Gavel },
  ];

  return (
    <div className="min-h-screen bg-background pt-4 pb-20">
      <div className="container mx-auto px-6 max-w-4xl space-y-10">
        
        {/* Elite Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[3rem] p-10 relative overflow-hidden border-white/5 shadow-2xl bg-gradient-to-br from-orange-600/10 via-background to-background"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            {isAdmin ? <ShieldCheck className="h-32 w-32" /> : <Store className="h-32 w-32" />}
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-orange-600/30">
              {isAdmin ? <ShieldCheck className="h-10 w-10 text-white" /> : <Store className="h-10 w-10 text-white" />}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-white drop-shadow-xl">
                {isAdmin ? "Elite Store Management" : "Merchant Command Center"}
              </h1>
              <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-2">
                Operational Dashboard & Assets Control
              </p>
            </div>
          </div>
        </motion.div>

        {/* Premium Navigation Tabs */}
        <div className="flex flex-wrap gap-3 p-2 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
          {TABS.map(({ id, label, badge, icon: Icon }) => (
            <button 
              key={id} 
              onClick={() => setTab(id)}
              className={`flex-1 min-w-[120px] relative flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                tab === id 
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${id === "live" && isMyLive ? "animate-pulse text-red-400" : ""}`} />
              {label}
              {badge != null && badge > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Produk ──────────────────────────────────────────────── */}
        {tab === "products" && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            {/* Sultan Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Menunggu Review", count: counts.pending, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" },
                { label: isAdmin ? "Live di Toko" : "Disetujui", count: counts.approved, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
                { label: "Ditolak Sistem", count: counts.rejected, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/20" },
              ].map(({ label, count, color, bg, border }) => (
                <div key={label} className={`glass-card rounded-[2.5rem] p-8 text-center space-y-2 border-white/5 ${bg} group hover:scale-105 transition-all duration-500`}>
                  <p className={`text-4xl font-black tracking-tighter ${color}`}>{count}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</p>
                </div>
              ))}
            </div>

            {/* Premium Form Section */}
            <div className="glass-card rounded-[3.5rem] overflow-hidden border-white/5 shadow-2xl">
              <button 
                className="w-full flex items-center justify-between px-10 py-8 hover:bg-white/5 transition-all group"
                onClick={() => { 
                  if (showForm) { setShowForm(false); setEditingProduct(null); }
                  else { setShowForm(true); }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                    {editingProduct ? <Pencil className="h-5 w-5 text-orange-500" /> : <PlusCircle className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-black uppercase tracking-widest text-white italic">
                      {editingProduct ? "Update Asset Identity" : "Forge New Asset"}
                    </span>
                    {editingProduct && <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest opacity-60">Editing: {editingProduct.name}</span>}
                  </div>
                </div>
                {showForm ? <ChevronUp className="h-5 w-5 text-white/20" /> : <ChevronDown className="h-5 w-5 text-white/20" />}
              </button>
              
              <AnimatePresence>
                {showForm && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-white/5"
                  >
                    <div className="p-10">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-10 text-center">
                        {editingProduct ? "Synchronizing Asset Modifications..." : (isAdmin ? "Direct Deployment Enabled" : "System Review Required Post-Deployment")}
                      </p>
                      <ProductForm 
                        onSuccess={() => { setShowForm(false); setEditingProduct(null); }} 
                        isAdmin={isAdmin} 
                        product={editingProduct || undefined} 
                      />
                      {editingProduct && (
                        <Button 
                          variant="ghost" 
                          className="w-full mt-6 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white/40 hover:text-white"
                          onClick={() => { setEditingProduct(null); setShowForm(false); }}
                        >
                          Abort Modifications
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Asset List Section */}
            <div className="space-y-10">
              {isAdmin && adminProducts.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 px-4">
                    <ShieldCheck className="h-5 w-5 text-orange-500" />
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 italic">Elite Admin Assets <span className="ml-2 px-2 py-0.5 bg-orange-600/20 text-orange-500 rounded-md">{adminProducts.length}</span></h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {adminProducts.map((p) => <AdminProductCard key={p.id} product={p} onDelete={handleDeleteAdmin} onEdit={handleEdit} />)}
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-4">
                  <Package className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 italic">
                    {isAdmin ? "Submitted Merchant Assets" : "Personal Asset Portfolio"} 
                    <span className="ml-2 px-2 py-0.5 bg-white/5 text-white/50 rounded-md">{mySellerProducts.length}</span>
                  </h2>
                </div>
                
                {mySellerProducts.length === 0 ? (
                  <div className="text-center py-20 glass-card rounded-[3rem] border-white/5 bg-white/5 border-dashed">
                    <Package className="h-16 w-16 text-white/10 mx-auto mb-6" />
                    <p className="text-xl font-black uppercase italic tracking-tighter text-white/20">Empty Portfolio</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/10 mt-2">Forge your first asset to begin</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {mySellerProducts.map((p) => <SellerProductCard key={p.id} product={p} onDelete={handleDelete} onEdit={handleEdit} canAlwaysDelete={isAdmin} />)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      {/* ── Tab: Pesanan ─────────────────────────────────────────────── */}
      {tab === "orders" && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {[
              { id: "all",        label: `Semua Assets (${allOrders.length})` },
              { id: "placed",     label: `Incoming (${orderCounts.placed})` },
              { id: "processing", label: `Processing (${orderCounts.processing})` },
              { id: "shipped",    label: `Deployed (${orderCounts.shipped})` },
              { id: "problem",    label: `Issues (${orderCounts.problem})` },
            ].map(({ id, label }) => (
              <button 
                key={id} 
                onClick={() => setOrderFilter(id as OrderStatus | "all")}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  orderFilter === id 
                    ? "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-600/20" 
                    : "glass-card text-white/40 border-white/5 hover:border-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          {visibleOrders.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-[3rem] border-white/5 bg-white/5 border-dashed">
              <ShoppingBag className="h-16 w-16 text-white/10 mx-auto mb-6" />
              <p className="text-xl font-black uppercase italic tracking-tighter text-white/20">Zero Transactions</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/10 mt-2">Waiting for market activity</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {visibleOrders.map((order) => (
                <SellerOrderCard key={order.id} order={order} onProcess={handleProcess} onShip={handleShip} onChat={setChatOrder} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tab: Live ────────────────────────────────────────────────── */}
      {tab === "live" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <LiveTab user={user} isAdmin={isAdmin} />
        </motion.div>
      )}

      {chatOrder && <ChatModal order={chatOrder} onClose={() => setChatOrder(null)} />}

      {/* ── Tab: Lelang ──────────────────────────────────────────────── */}
      {tab === "auction" && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
             <div>
               <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white">Auction Management</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">High-Stakes Asset Bidding</p>
             </div>
             <div className="flex gap-4">
               {myAuctions.length > 0 && (
                 <Button 
                   variant="ghost" 
                   className="rounded-2xl h-12 px-6 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10"
                   onClick={() => {
                     if (confirm("Purge all auction data permanently?")) {
                       myAuctions.forEach(a => deleteAuction(a.id));
                     }
                   }}
                 >
                   Purge All
                 </Button>
               )}
               <Button 
                 onClick={() => setShowAuctionForm(true)} 
                 className="gap-3 rounded-2xl h-12 px-8 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-600/20"
               >
                 <Plus className="h-4 w-4" /> Initialize Auction
               </Button>
             </div>
          </div>

          <AnimatePresence>
            {showAuctionForm && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="glass-card rounded-[3rem] p-10 border-orange-500/20 bg-orange-600/5"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-orange-500 uppercase italic tracking-widest">New Auction Protocol</h3>
                  <button onClick={() => setShowAuctionForm(false)} className="text-white/20 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Asset Identity</Label>
                    <Input className="glass-input h-12 rounded-2xl border-white/10" value={auctionData.title} onChange={e => setAuctionData({...auctionData, title: e.target.value})} placeholder="Rare Item Name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Asset Visualization URL</Label>
                    <Input className="glass-input h-12 rounded-2xl border-white/10" value={auctionData.imageUrl} onChange={e => setAuctionData({...auctionData, imageUrl: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Asset Description</Label>
                    <Input className="glass-input h-12 rounded-2xl border-white/10" value={auctionData.description} onChange={e => setAuctionData({...auctionData, description: e.target.value})} placeholder="Elite conditions and history..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Starting Reserve (Rp)</Label>
                    <Input className="glass-input h-12 rounded-2xl border-white/10" type="number" value={auctionData.startPrice} onChange={e => setAuctionData({...auctionData, startPrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Minimum Bid Increment (Rp)</Label>
                    <Input className="glass-input h-12 rounded-2xl border-white/10" type="number" value={auctionData.minStep} onChange={e => setAuctionData({...auctionData, minStep: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Protocol Duration</Label>
                    <select 
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500"
                      value={auctionData.duration}
                      onChange={e => setAuctionData({...auctionData, duration: e.target.value})}
                    >
                      <option value="0.1" className="bg-background">6 Minutes (Testing)</option>
                      <option value="1" className="bg-background">1 Hour</option>
                      <option value="6" className="bg-background">6 Hours</option>
                      <option value="24" className="bg-background">24 Hours (1 Day)</option>
                      <option value="72" className="bg-background">72 Hours (3 Days)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 pt-6">
                    <Button onClick={handleCreateAuction} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black h-16 rounded-[2rem] shadow-xl shadow-orange-600/20 uppercase tracking-widest">
                      ACTIVATE AUCTION PROTOCOL
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-6">
            {myAuctions.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-[3rem] border-white/5 bg-white/5 border-dashed">
                <Gavel className="h-16 w-16 text-white/10 mx-auto mb-6" />
                <p className="text-xl font-black uppercase italic tracking-tighter text-white/20">No Active Auctions</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/10 mt-2">Initialize a protocol to start bidding</p>
              </div>
            ) : (
              myAuctions.map(a => (
                <div key={a.id} className="glass-card p-8 rounded-[3rem] border-white/5 bg-white/5 flex items-center justify-between group hover:border-orange-500/20 transition-all duration-500">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                      <img src={a.imageUrl} className="relative w-20 h-20 rounded-[1.5rem] object-cover border border-white/10" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase italic tracking-tight group-hover:text-orange-500 transition-colors">{a.title}</h4>
                      <div className="flex gap-3 items-center mt-2">
                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${a.status === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-white/5 text-white/40"}`}>
                          {a.status}
                        </span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{a.bids.length} Active Bidders</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Highest Valuation</p>
                    <p className="text-2xl font-black text-orange-500 italic drop-shadow-lg">{formatPrice(a.currentPrice)}</p>
                    <div className="flex gap-3 mt-2">
                      {a.status === "active" && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500/10" 
                          onClick={() => endAuction(a.id)}
                        >
                          Abort Session
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 rounded-xl text-red-500 hover:bg-red-500/10" 
                        onClick={() => deleteAuction(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}
