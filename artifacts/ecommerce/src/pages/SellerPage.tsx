/**
 * SellerPage.tsx
 * Dashboard Seller — tabs: Statistik (Dashboard) · Produk · Pesanan · Kerjasama
 * Collapsible vertical sidebar layout, aligned with modern SaaS admin panels.
 */
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  PlusCircle, Package, Clock, CheckCircle2, XCircle, Trash2,
  ChevronDown, ChevronUp, ChevronLeft, Menu, Store, Plus, X, ShieldCheck,
  ShoppingBag, Truck, Search, MessageSquare, Send, ToggleLeft, ToggleRight,
  Zap, Pencil, Heart, Bot, ClipboardList, BarChart2, TrendingUp,
  Handshake, ArrowUpRight, Percent, Sparkles, Users, Briefcase, ArrowLeft, Gavel
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useProducts, SellerProduct, AdminProduct } from "../contexts/ProductsContext";
import { useOrderHistory, PurchasedOrder, OrderStatus } from "../contexts/OrderHistoryContext";
import { useSellerStats } from "../hooks/useSellerStats";
import { useCollaboration } from "../contexts/CollaborationContext";
import { useAISettings } from "../contexts/AISettingsContext";
import { useAuction } from "../contexts/AuctionContext";
import { useVouchers } from "../contexts/VoucherContext";
import { formatPrice } from "../utils/formatPrice";
import { formatDate } from "../utils/formatDate";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { useWishlist } from "../contexts/WishlistContext";

const CATEGORIES = [
  "Pakaian",
  "Sepatu",
  "Tas",
  "Aksesori",
  "Elektronik",
  "Skincare & Kecantikan",
  "Kesehatan",
  "Makanan",
  "Minuman",
  "Rumah Tangga",
  "Otomotif",
  "Pre-Order",
  "Lainnya"
];

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
const AI_PRODUCT_PROMPTS = [
  "Produk skincare lokal untuk kulit berminyak, harga terjangkau, stok 80, deskripsi ramah Gen Z.",
  "Bundle aksesoris HP premium untuk gamers, warna hitam, margin bagus, stok 45.",
  "Makanan ringan viral rasa pedas manis, cocok live selling, stok 120, tone copywriting FOMO.",
];

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

  // AI Generator specific state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDraftReady, setAiDraftReady] = useState(false);
  const { isAIEnabled, aiProvider, openrouterKey, openrouterModel, obscuraKey, obscuraModel } = useAISettings();

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = (targetForm: FormState = form): boolean => {
    const e: Partial<FormState> = {};
    if (!targetForm.name.trim())            e.name = "Nama produk wajib diisi.";
    if (!targetForm.price || isNaN(Number(targetForm.price)) || Number(targetForm.price) <= 0) e.price = "Harga tidak valid.";
    if (!targetForm.stock || isNaN(Number(targetForm.stock)) || Number(targetForm.stock) < 0) e.stock = "Stok tidak valid.";
    if (!targetForm.description.trim())     e.description = "Deskripsi singkat wajib diisi.";
    if (!targetForm.longDescription.trim()) e.longDescription = "Deskripsi lengkap wajib diisi.";
    if (!targetForm.image.trim())           e.image = "URL gambar wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveProduct = async (targetForm: FormState = form, targetSpecs: SpecRow[] = specs, shouldReset = true, targetUseSpecs = useSpecs) => {
    if (!validate(targetForm) || !user) return false;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const finalSpecs = targetUseSpecs ? targetSpecs.filter((s) => s.label.trim() && s.value.trim()) : [];
    
    if (product) {
      const updateData = {
        name: targetForm.name.trim(),
        description: targetForm.description.trim(),
        longDescription: targetForm.longDescription.trim(),
        price: Number(targetForm.price),
        stock: Number(targetForm.stock),
        image: targetForm.image.trim(),
        images: [targetForm.image.trim()],
        category: targetForm.category,
        specs: finalSpecs,
        isPreOrder: targetForm.isPreOrder,
        releaseDate: targetForm.releaseDate,
      };

      if (isAdmin) {
        updateAdminProduct(product.id, updateData);
      } else {
        updateProduct(product.id, updateData);
      }
      toast({ title: "Produk diperbarui!", description: "Detail produk telah disimpan." });
    } else if (isAdmin) {
      addAdminProduct({ name: targetForm.name.trim(), description: targetForm.description.trim(), longDescription: targetForm.longDescription.trim(), price: Number(targetForm.price), stock: Number(targetForm.stock), image: targetForm.image.trim(), images: [targetForm.image.trim()], category: targetForm.category, specs: finalSpecs, isPreOrder: targetForm.isPreOrder, releaseDate: targetForm.releaseDate });
      toast({ title: "Produk AI dipublish!", description: "Produk langsung tampil di toko." });
    } else {
      submitProduct({ sellerId: user.id, sellerName: user.name, name: targetForm.name.trim(), description: targetForm.description.trim(), longDescription: targetForm.longDescription.trim(), price: Number(targetForm.price), stock: Number(targetForm.stock), image: targetForm.image.trim(), images: [targetForm.image.trim()], category: targetForm.category, specs: finalSpecs, isPreOrder: targetForm.isPreOrder, releaseDate: targetForm.releaseDate });
      toast({ title: "Produk AI dikirim!", description: "Draft produk otomatis masuk review admin." });
    }
    
    if (!product && shouldReset) {
      setForm(emptyForm); setErrors({}); setSpecs([{ label: "", value: "" }]); setUseSpecs(false); setAiDraftReady(false);
    }
    setLoading(false); onSuccess();
    return true;
  };

  const handleAIForge = async (autoSubmit = false) => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const apiKey = openrouterKey;
      const model = aiProvider === "obscura" ? obscuraModel || undefined : openrouterModel || undefined;
      const res = await fetch(`${base}/api/ai/generate-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, apiKey, obscuraKey, aiProvider, model })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat produk.");
      }
      const data = await res.json();
      const generatedForm: FormState = {
        name: data.name || "",
        category: data.category || CATEGORIES[0],
        price: String(data.price || ""),
        stock: String(data.stock || "50"),
        description: data.description || "",
        longDescription: data.longDescription || "",
        image: data.image || "",
        isPreOrder: !!data.isPreOrder,
        releaseDate: data.releaseDate || ""
      };
      const generatedSpecs = data.specs && Array.isArray(data.specs) ? data.specs : [{ label: "", value: "" }];
      
      setForm(generatedForm);

      if (data.specs && Array.isArray(data.specs)) {
        setSpecs(generatedSpecs);
        setUseSpecs(true);
      } else {
        setSpecs(generatedSpecs);
        setUseSpecs(false);
      }

      setAiDraftReady(true);
      toast({
        title: "AI Product Builder selesai!",
        description: autoSubmit ? "Draft dibuat dan sedang dikirim." : "Form produk sudah diisi otomatis. Tinggal cek lalu kirim."
      });
      setAiPrompt("");
      if (autoSubmit) {
        await saveProduct(generatedForm, generatedSpecs, true, data.specs && Array.isArray(data.specs));
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "AI gagal membuat produk",
        description: err.message
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProduct(form, specs);
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
    <div className="space-y-8">
      {/* AI Product Builder */}
      <div className="rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#141414] shadow-2xl shadow-black/20">
        <div className="p-6 md:p-8 bg-gradient-to-br from-orange-500/10 via-white/[0.03] to-transparent border-b border-white/10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-white tracking-tight">AI Product Builder</h4>
              <p className="text-[11px] font-bold text-white/40 mt-1">Tulis ide produk, AI isi nama, harga, stok, deskripsi, gambar, dan spesifikasi.</p>
            </div>
          </div>
          <span className={`w-fit text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${isAIEnabled ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20" : "bg-red-500/10 text-red-300 border border-red-400/20"}`}>
            {isAIEnabled ? "AI Aktif" : "API Key Belum Ada"}
          </span>
        </div>
        
        {isAIEnabled ? (
          <div className="p-6 md:p-8 space-y-5">
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {AI_PRODUCT_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setAiPrompt(prompt)}
                  className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-[10px] font-bold leading-relaxed text-white/55 hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-white transition-all max-w-[260px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Contoh: bikin produk hoodie oversize bahan fleece, target anak kampus, harga 189000, stok 60, gaya copywriting simple tapi niat jualan."
              rows={4}
              className="w-full bg-white/[0.04] border border-white/10 rounded-[1.6rem] px-5 py-4 text-sm font-medium text-white/85 focus:outline-none focus:border-orange-400 resize-none placeholder:text-white/25"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              disabled={aiGenerating || !aiPrompt.trim()}
              onClick={() => handleAIForge(false)}
              className="h-12 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-orange-600/10"
            >
              {aiGenerating ? (
                <>
                  <Bot className="h-4 w-4 animate-spin text-white" />
                  <span>Lagi bikin draft...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Bikin Draft Produk</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              disabled={aiGenerating || loading || !aiPrompt.trim() || !!product}
              onClick={() => handleAIForge(true)}
              className="h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest gap-2 disabled:opacity-40"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isAdmin ? "AI Buat & Publish" : "AI Buat & Kirim Review"}</span>
            </Button>
            </div>
            {aiDraftReady && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[11px] font-bold text-emerald-200">
                Draft AI sudah masuk ke form. Seller bisa edit detailnya dulu atau langsung submit produk.
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <p className="text-[11px] font-bold text-white/35 leading-relaxed">
              AI Product Builder belum aktif. Isi OpenRouter API Key di pengaturan AI admin supaya seller bisa membuat produk otomatis dari prompt.
            </p>
          </div>
        )}
      </div>

      {/* Actual Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {field("name", "Nama Produk", <Input id="name" placeholder="Contoh: Hoodie Oversize Fleece" value={form.name} onChange={set("name")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.name)}
            
            <div className="grid grid-cols-2 gap-6">
              {field("category", "Kategori",
                <select id="category" value={form.category} onChange={set("category")} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500 appearance-none">
                  {CATEGORIES.map((c) => <option key={c} className="bg-background">{c}</option>)}
                </select>)}
              {field("price", "Harga (Rp)", <Input id="price" type="number" min="1" placeholder="0" value={form.price} onChange={set("price")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.price)}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {field("stock", "Stok Produk", <Input id="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={set("stock")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.stock)}
              <div className="flex items-center">
                 <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest leading-tight">Stok akan berkurang otomatis setelah checkout berhasil.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {field("image", "URL Foto Produk", <Input id="image" type="url" placeholder="https://..." value={form.image} onChange={set("image")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.image)}
            
            <div className="flex gap-6 items-center">
              {form.image ? (
                <div className="relative group/img">
                  <div className="absolute -inset-1 bg-orange-600 rounded-2xl blur opacity-20 group-hover/img:opacity-40 transition duration-500" />
                  <img src={form.image} alt="preview" className="relative w-28 h-28 rounded-2xl object-cover border border-white/10 bg-white/5" onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/112x112?text=Error"; }} />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center text-white/10 text-[10px] font-black uppercase text-center px-4">Preview Foto</div>
              )}
              <div className="flex-1">
                {field("description", "Deskripsi Singkat", <Input id="description" placeholder="Ringkasan produk yang tampil di kartu" value={form.description} onChange={set("description")} className="glass-input h-14 rounded-2xl border-white/10" />, errors.description)}
              </div>
            </div>

            {field("longDescription", "Deskripsi Lengkap",
              <textarea id="longDescription" rows={3} placeholder="Jelaskan bahan, ukuran, benefit, cara pakai, garansi, atau detail penting lain." value={form.longDescription} onChange={set("longDescription")}
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
                <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-orange-500 transition-colors">Spesifikasi Produk</span>
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
                  <Plus className="h-3.5 w-3.5 mr-2" /> Tambah Spesifikasi
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
                <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-orange-500 transition-colors">Mode Pre-Order</span>
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
                  <Label className="text-[9px] font-black uppercase tracking-widest text-orange-500 ml-1">Jadwal Rilis</Label>
                  <Input type="datetime-local" value={form.releaseDate} onChange={e => setForm(f => ({ ...f, releaseDate: e.target.value }))} className="glass-input h-12 rounded-xl border-orange-500/20 text-white" />
                </div>
                <p className="text-[9px] text-orange-500/60 font-black uppercase tracking-widest italic leading-relaxed px-1">
                  Produk baru bisa dibeli sesuai jadwal rilis yang seller tentukan.
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
                <span className="text-xs font-black uppercase tracking-[0.3em]">Menyimpan...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {product ? <CheckCircle2 className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
                <span className="text-sm font-black uppercase tracking-[0.4em] italic">
                  {product ? "Simpan Perubahan Produk" : (isAdmin ? "Publish Produk Sekarang" : "Kirim Produk ke Review")}
                </span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Stats Tab Component ──────────────────────────────────────────────────────
function StatsTab({ sellerId }: { sellerId: string }) {
  const stats = useSellerStats(sellerId);
  const { getAllOrders } = useOrderHistory();
  const { sellerProducts, adminProducts } = useProducts();

  const mySellerProductIds = useMemo(() => {
    const products = sellerId === "admin-001" ? adminProducts : sellerProducts.filter((p: any) => p.sellerId === sellerId);
    return new Set(products.map((p: any) => p.id));
  }, [sellerProducts, adminProducts, sellerId]);

  const sellerSales = useMemo(() => {
    const allOrders = getAllOrders();
    const sales: Array<{
      orderId: string;
      date: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      totalAmount: number;
    }> = [];

    allOrders.forEach((order) => {
      const myItems = order.items.filter((item) => mySellerProductIds.has(item.id));
      if (myItems.length > 0) {
        const total = myItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        sales.push({
          orderId: order.orderNumber || order.id,
          date: order.date || new Date().toISOString(),
          customerName: order.userName || "Anonim",
          items: myItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: total,
        });
      }
    });

    return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [getAllOrders, mySellerProductIds]);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: "text-emerald-500", glow: "shadow-emerald-500/5 bg-emerald-500/5 border-emerald-500/10" },
          { label: "Margin Estimasi (28%)", value: formatPrice(stats.totalMargin), icon: Percent, color: "text-orange-500", glow: "shadow-orange-500/5 bg-orange-500/5 border-orange-500/10", note: "Berdasarkan margin standar 28%" },
          { label: "Total Terjual", value: `${stats.totalUnitsSold} Unit`, icon: Package, color: "text-purple-500", glow: "shadow-purple-500/5 bg-purple-500/5 border-purple-500/10" },
          { label: "Sinergi Pesanan", value: `${stats.totalOrders} Transaksi`, icon: ShoppingBag, color: "text-cyan-500", glow: "shadow-cyan-500/5 bg-cyan-500/5 border-cyan-500/10" }
        ].map((c) => (
          <div key={c.label} className={`glass-card rounded-[2.5rem] p-6 border flex flex-col justify-between shadow-xl transition-all duration-300 hover:scale-[1.03] ${c.glow}`}>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="mt-4">
              <h4 className="text-xl font-black text-white italic tracking-tight">{c.value}</h4>
              {c.note && <p className="text-[8px] text-white/20 mt-1 font-bold uppercase">{c.note}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Bar Chart (CSS-based) */}
      <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Grafik Kinerja Penjualan (6 Bulan Terakhir)</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Estimasi omzet bulanan</p>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-white/40">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-gradient-to-t from-orange-600 to-orange-400 rounded-md" /> Revenue</div>
          </div>
        </div>

        <div className="relative pt-6 pb-2">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03] pl-10 pr-4 pb-12 pt-6">
            <div className="w-full border-t border-white" />
            <div className="w-full border-t border-white" />
            <div className="w-full border-t border-white" />
            <div className="w-full border-t border-white" />
          </div>

          <div className="flex justify-between items-end h-64 pl-10 pr-4 pb-8 relative z-10 gap-2 sm:gap-6">
            {stats.monthlyData.map((d, i) => {
              const pct = (d.revenue / stats.maxMonthRevenue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group/bar relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-[105%] bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-center pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300 shadow-2xl z-30 min-w-[120px]">
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-0.5">{d.month}</p>
                    <p className="text-xs font-black text-white italic">{formatPrice(d.revenue)}</p>
                    <p className="text-[8px] text-white/40 font-bold uppercase mt-0.5">{d.orders} Orders</p>
                  </div>

                  {/* Vertical bar */}
                  <div 
                    className="w-full sm:w-12 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-2xl relative overflow-hidden transition-all duration-1000 ease-out hover:from-orange-500 hover:to-orange-300 cursor-pointer shadow-lg shadow-orange-600/10 hover:shadow-orange-500/20"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  >
                    {/* Glowing highlight */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                  </div>

                  {/* X Axis Label */}
                  <span className="text-[10px] font-black uppercase text-white/30 group-hover/bar:text-orange-500 transition-colors mt-3 tracking-widest">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products Table & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Portfolio Performance */}
        <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Produk Berkinerja Terbaik</h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Diurutkan berdasarkan total omzet</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30">
                  <th className="pb-4 pr-4">Asset</th>
                  <th className="pb-4 px-4 text-right">Harga</th>
                  <th className="pb-4 px-4 text-center">Terjual</th>
                  <th className="pb-4 px-4 text-right">Revenue</th>
                  <th className="pb-4 pl-4 text-right">Margin Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.productStats.slice(0, 5).map((p) => (
                  <tr key={p.id} className="group/row hover:bg-white/5 transition-colors">
                    <td className="py-4 pr-4 flex items-center gap-3">
                      <img src={p.image} className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10" alt="" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white group-hover/row:text-orange-500 transition-colors uppercase italic truncate max-w-[140px]">{p.name}</p>
                        <p className="text-[8px] text-white/30 uppercase font-black tracking-widest mt-0.5">{p.status}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-xs font-bold text-white/60">{formatPrice(p.price)}</td>
                    <td className="py-4 px-4 text-center text-xs font-black text-white italic">{p.unitsSold}</td>
                    <td className="py-4 px-4 text-right text-xs font-black text-orange-500 italic">{formatPrice(p.revenue)}</td>
                    <td className="py-4 pl-4 text-right text-xs font-black text-emerald-500 italic">{formatPrice(p.margin)}</td>
                  </tr>
                ))}
                {stats.productStats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[10px] font-black uppercase text-white/20 tracking-widest">
                      Belum ada penjualan untuk dianalisis
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Portfolio Status Distribution */}
        <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Status Portofolio</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Status verifikasi sistem aset</p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Verified / Active", count: stats.approvedCount, pct: stats.totalProducts > 0 ? (stats.approvedCount / stats.totalProducts) * 100 : 0, color: "bg-emerald-500 text-emerald-500" },
              { label: "Review Pending", count: stats.pendingCount, pct: stats.totalProducts > 0 ? (stats.pendingCount / stats.totalProducts) * 100 : 0, color: "bg-amber-500 text-amber-500" },
              { label: "Terminated / Rejected", count: stats.rejectedCount, pct: stats.totalProducts > 0 ? (stats.rejectedCount / stats.totalProducts) * 100 : 0, color: "bg-rose-500 text-rose-500" }
            ].map((s) => (
              <div key={s.label} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-white/60">{s.label}</span>
                  <span className={s.color.split(" ")[1]}>{s.count} Aset</span>
                </div>
                <div className="w-full bg-white/5 border border-white/10 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full ${s.color.split(" ")[0]}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed text-center">
            Setiap pengajuan aset baru melewati matrix screening untuk menjaga status eksklusif.
          </div>
        </div>
      </div>

      {/* Riwayat Penjualan Terbaru */}
      <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Riwayat Transaksi Terbaru</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Daftar pesanan pembeli yang berisi produk Anda</p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Total: {sellerSales.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30">
                <th className="pb-4 pr-4">Tanggal & Waktu</th>
                <th className="pb-4 px-4">ID Transaksi</th>
                <th className="pb-4 px-4">Pelanggan</th>
                <th className="pb-4 px-4">Produk Dibeli</th>
                <th className="pb-4 pl-4 text-right">Total Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sellerSales.slice(0, 10).map((sale) => (
                <tr key={sale.orderId} className="group/row hover:bg-white/5 transition-colors">
                  <td className="py-4 pr-4 text-xs font-bold text-white/60">
                    {formatSellerDate(sale.date)}
                  </td>
                  <td className="py-4 px-4 text-xs font-mono font-black text-orange-500 uppercase">
                    {sale.orderId}
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-white">
                    {sale.customerName}
                  </td>
                  <td className="py-4 px-4 text-xs text-white/70 space-y-1">
                    {sale.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-black text-white italic">{it.name}</span>
                        <span className="text-[10px] text-white/40">x{it.quantity}</span>
                        <span className="text-[10px] text-white/30">({formatPrice(it.price)})</span>
                      </div>
                    ))}
                  </td>
                  <td className="py-4 pl-4 text-right text-xs font-black text-emerald-500 italic">
                    {formatPrice(sale.totalAmount)}
                  </td>
                </tr>
              ))}
              {sellerSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[10px] font-black uppercase text-white/20 tracking-widest">
                    Belum ada transaksi penjualan terekam
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Collaboration Tab Component ─────────────────────────────────────────────
function CollabTab({ sellerId }: { sellerId: string }) {
  const { user, allUsers } = useAuth();
  const collab = useCollaboration();
  const { sellerProducts, adminProducts } = useProducts();
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<"received" | "sent" | "active">("received");
  const [targetId, setTargetId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [collabType, setCollabType] = useState<"reseller" | "dropship">("reseller");
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedQuantity, setProposedQuantity] = useState("10");
  const [commissionPercent, setCommissionPercent] = useState("15");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Response with feedback states
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<"accept" | "reject" | null>(null);

  const sentRequests = collab.getSentRequests(sellerId);
  const receivedRequests = collab.getReceivedRequests(sellerId);

  // Active synergy contracts (accepted proposals)
  const activeSinergies = useMemo(() => {
    return collab.requests.filter((r: any) => 
      r.status === "accepted" && (r.fromSellerId === sellerId || r.toSellerId === sellerId)
    );
  }, [collab.requests, sellerId]);

  // Get other sellers / admin
  const availablePartners = allUsers.filter(u => 
    (u.role === "seller" || u.role === "admin") && u.id !== sellerId
  );

  // Get partner's approved products
  const partnerProducts = useMemo(() => {
    if (!targetId) return [];
    if (targetId === "admin-001") {
      return adminProducts;
    }
    return sellerProducts.filter((p: any) => p.sellerId === targetId && p.status === "approved");
  }, [targetId, sellerProducts, adminProducts]);

  // Selected product detail
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return partnerProducts.find((p: any) => String(p.id) === selectedProductId) || null;
  }, [selectedProductId, partnerProducts]);

  // Auto-fill proposed price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      // Propose reseller wholesale price at 80% of original price by default
      setProposedPrice(String(Math.round(selectedProduct.price * 0.8)));
    } else {
      setProposedPrice("");
    }
  }, [selectedProduct]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !message.trim()) return;

    setSending(true);
    await new Promise(r => setTimeout(r, 600));

    const targetUser = availablePartners.find(u => u.id === targetId);
    if (!targetUser) {
      toast({ variant: "destructive", title: "Error", description: "Target partner tidak ditemukan." });
      setSending(false);
      return;
    }

    const extra = selectedProduct ? {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productPrice: selectedProduct.price,
      productImage: selectedProduct.image,
      proposedPrice: collabType === "reseller" ? Number(proposedPrice) : undefined,
      proposedQuantity: collabType === "reseller" ? Number(proposedQuantity) : undefined,
      commissionPercent: collabType === "dropship" ? Number(commissionPercent) : undefined,
    } : undefined;

    collab.sendRequest(
      { id: targetUser.id, name: targetUser.name },
      { id: sellerId, name: user?.name || "Merchant" },
      collabType,
      message.trim(),
      extra
    );

    toast({
      title: "🚀 Proposal Kemitraan Terkirim!",
      description: `Menunggu konfirmasi dari ${targetUser.name}.`
    });

    setMessage("");
    setTargetId("");
    setSelectedProductId("");
    setSending(false);
  };

  const handleResponseSubmit = (id: string, type: "accept" | "reject") => {
    const feedback = feedbackText[id]?.trim() || "";
    if (type === "accept") {
      collab.acceptRequest(id, feedback);
      toast({ title: "Kemitraan Diterima!", description: "Sinergi resmi kemitraan aktif." });
    } else {
      collab.rejectRequest(id, feedback);
      toast({ title: "Proposal Ditolak." });
    }
    setRespondingId(null);
    setResponseType(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Panel */}
        <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Proposal Sinergi Baru</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Ajukan kerjasama reseller/dropship</p>
          </div>

          <form onSubmit={handleSendRequest} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Target Merchant</Label>
              <select
                value={targetId}
                onChange={e => {
                  setTargetId(e.target.value);
                  setSelectedProductId("");
                }}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500"
              >
                <option value="" className="bg-background">-- Pilih Partner --</option>
                {availablePartners.map((p) => (
                  <option key={p.id} value={p.id} className="bg-background">
                    {p.name} ({p.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {targetId && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Target Aset / Produk</Label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500"
                >
                  <option value="" className="bg-background">-- Pilih Produk --</option>
                  {partnerProducts.map((p: any) => (
                    <option key={p.id} value={p.id} className="bg-background">
                      {p.name} ({formatPrice(p.price)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected Product terms preview */}
            {selectedProduct && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 animate-in zoom-in-95">
                <div className="flex gap-3 items-center">
                  <img src={selectedProduct.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white uppercase italic truncate">{selectedProduct.name}</p>
                    <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-0.5">Stok Asli: {selectedProduct.stock} · {formatPrice(selectedProduct.price)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Tipe Kerjasama</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "reseller", label: "Reseller", desc: "Membeli & stok kembali aset" },
                  { id: "dropship", label: "Dropship", desc: "Penjualan langsung ke pasar" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCollabType(t.id as any)}
                    className={`p-4 rounded-2xl text-left border flex flex-col justify-between gap-2 transition-all ${
                      collabType === t.id
                        ? "border-orange-500 bg-orange-600/5"
                        : "border-white/5 bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{t.label} Protocol</span>
                    <span className="text-[8px] font-bold text-white/30 uppercase leading-snug">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic terms inputs */}
            {selectedProduct && collabType === "reseller" && (
              <div className="space-y-4 p-4 rounded-2xl bg-orange-600/5 border border-orange-500/10 animate-in slide-in-from-top-2">
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest italic">Reseller Financial Terms</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Proposed Buy Price (Rp)</label>
                    <input
                      type="number"
                      value={proposedPrice}
                      onChange={e => setProposedPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Target Stock Quantity</label>
                    <input
                      type="number"
                      value={proposedQuantity}
                      onChange={e => setProposedQuantity(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase text-white/40 tracking-widest">
                  <span>Est. Capital Needed:</span>
                  <span className="text-white text-xs font-black italic">{formatPrice(Number(proposedPrice) * Number(proposedQuantity))}</span>
                </div>
              </div>
            )}

            {selectedProduct && collabType === "dropship" && (
              <div className="space-y-4 p-4 rounded-2xl bg-orange-600/5 border border-orange-500/10 animate-in slide-in-from-top-2">
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest italic">Dropshipper Commission Terms</p>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Proposed Commission Percentage (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={commissionPercent}
                      onChange={e => setCommissionPercent(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-xs font-black text-orange-500">%</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase text-white/40 tracking-widest">
                  <span>Est. Earnings / Sale:</span>
                  <span className="text-emerald-500 text-xs font-black italic">{formatPrice(Math.round(selectedProduct.price * (Number(commissionPercent) / 100)))}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Pesan / Dokumen Pengantar</Label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tulis rincian proposal sinergi elite..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium text-white/80 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={sending || !targetId || !message.trim()}
              className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-orange-600/10"
            >
              {sending ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Transmitting Proposal...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Kirim Proposal</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Listing Panel */}
        <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 lg:col-span-2 space-y-6">
          <div className="flex flex-wrap gap-4 justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Matrix Kemitraan</h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Daftar pengajuan kerjasama</p>
            </div>
            
            {/* Inner Subtabs */}
            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
              {[
                { id: "received", label: `Proposal Masuk (${receivedRequests.length})` },
                { id: "sent", label: `Proposal Keluar (${sentRequests.length})` },
                { id: "active", label: `Sinergi Aktif (${activeSinergies.length})` }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id as any)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeSubTab === sub.id
                      ? "bg-orange-600 text-white shadow"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {activeSubTab === "received" ? (
              receivedRequests.length === 0 ? (
                <div className="text-center py-20 opacity-20 space-y-3">
                  <Handshake className="h-12 w-12 mx-auto" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Belum ada proposal masuk</p>
                </div>
              ) : (
                receivedRequests.map((r) => (
                  <div key={r.id} className="p-6 rounded-[2rem] border border-white/5 bg-white/5 space-y-4 hover:border-orange-500/10 transition-all duration-300 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] px-2 py-0.5 rounded bg-orange-600/10 text-orange-500 font-bold uppercase tracking-widest border border-orange-500/20">{r.type.toUpperCase()} PROTOCOL</span>
                        <h4 className="text-xs font-black text-white uppercase italic mt-2 tracking-tight">Dari: {r.fromSellerName}</h4>
                      </div>
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{formatSellerDate(r.createdAt)}</span>
                    </div>

                    {/* Product Specific Proposal Terms Card */}
                    {r.productId && (
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-4 items-center">
                        <img src={r.productImage} alt="" className="w-14 h-14 rounded-lg object-cover bg-white/5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white uppercase italic truncate">{r.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-black text-white/30 uppercase">Harga Asli: {formatPrice(r.productPrice || 0)}</span>
                          </div>
                          
                          {/* Financial terms breakdown */}
                          <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-orange-500">
                            {r.type === "reseller" ? (
                              <p>Beli Grosir: <span className="text-white font-bold">{r.proposedQuantity} Unit</span> @ <span className="text-white font-bold">{formatPrice(r.proposedPrice || 0)}</span></p>
                            ) : (
                              <p>Komisi Dropship: <span className="text-emerald-500 font-bold">{r.commissionPercent}%</span> per Penjualan</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-white/60 bg-black/20 p-4 rounded-xl italic">"{r.message}"</p>
                    
                    {r.status === "pending" ? (
                      <div className="space-y-4 pt-2">
                        {respondingId === r.id ? (
                          <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl animate-in zoom-in-95">
                            <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Pesan Balasan / Feedback (Opsional)</label>
                            <textarea
                              value={feedbackText[r.id] || ""}
                              onChange={e => setFeedbackText({ ...feedbackText, [r.id]: e.target.value })}
                              placeholder="Ketik persetujuan syarat, kontrak, atau alasan penolakan..."
                              rows={2}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-bold text-white focus:outline-none focus:border-orange-500 resize-none"
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleResponseSubmit(r.id, responseType || "accept")}
                                className={`h-8 px-4 font-black text-[9px] uppercase tracking-widest rounded-lg ${responseType === "accept" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"} text-white`}
                              >
                                {responseType === "accept" ? "Confirm Accept" : "Confirm Reject"}
                              </Button>
                              <Button 
                                onClick={() => { setRespondingId(null); setResponseType(null); }}
                                variant="ghost" 
                                className="h-8 px-4 text-white/40 hover:text-white font-black text-[9px] uppercase tracking-widest rounded-lg"
                              >
                                Batal
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => { setRespondingId(r.id); setResponseType("accept"); }}
                              className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl"
                            >
                              Terima Sinergi
                            </Button>
                            <Button 
                              onClick={() => { setRespondingId(r.id); setResponseType("reject"); }}
                              variant="ghost" 
                              className="h-10 px-5 text-rose-500 hover:bg-rose-500/10 font-black text-[9px] uppercase tracking-widest rounded-xl"
                            >
                              Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Respons ditransmisikan</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                          r.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {r.feedbackMessage && (
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-white/40 leading-relaxed italic">
                        <strong>Reply:</strong> "{r.feedbackMessage}"
                      </div>
                    )}
                  </div>
                ))
              )
            ) : activeSubTab === "sent" ? (
              sentRequests.length === 0 ? (
                <div className="text-center py-20 opacity-20 space-y-3">
                  <Send className="h-12 w-12 mx-auto" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Belum ada proposal terkirim</p>
                </div>
              ) : (
                sentRequests.map((r) => (
                  <div key={r.id} className="p-6 rounded-[2rem] border border-white/5 bg-white/5 space-y-4 hover:border-orange-500/10 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] px-2 py-0.5 rounded bg-white/5 text-white/40 font-bold uppercase tracking-widest border border-white/10">{r.type.toUpperCase()} PROTOCOL</span>
                        <h4 className="text-xs font-black text-white uppercase italic mt-2 tracking-tight">Kepada: {r.toSellerName}</h4>
                      </div>
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{formatSellerDate(r.createdAt)}</span>
                    </div>

                    {/* Product Specific Proposal Terms Card */}
                    {r.productId && (
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex gap-4 items-center">
                        <img src={r.productImage} alt="" className="w-14 h-14 rounded-lg object-cover bg-white/5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white uppercase italic truncate">{r.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-black text-white/30 uppercase">Harga Asli: {formatPrice(r.productPrice || 0)}</span>
                          </div>
                          
                          {/* Financial terms breakdown */}
                          <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-orange-500">
                            {r.type === "reseller" ? (
                              <p>Beli Grosir: <span className="text-white font-bold">{r.proposedQuantity} Unit</span> @ <span className="text-white font-bold">{formatPrice(r.proposedPrice || 0)}</span></p>
                            ) : (
                              <p>Komisi Dropship: <span className="text-emerald-500 font-bold">{r.commissionPercent}%</span> per Penjualan</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-white/60 bg-black/20 p-4 rounded-xl italic">"{r.message}"</p>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                        {r.responseAt ? `Direspons: ${formatSellerDate(r.responseAt)}` : "Menunggu verifikasi"}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        r.status === "accepted"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : r.status === "rejected"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>

                    {r.feedbackMessage && (
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-white/40 leading-relaxed italic">
                        <strong>Reply / Feedback:</strong> "{r.feedbackMessage}"
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              // Synergy / Active Partnerships tab
              activeSinergies.length === 0 ? (
                <div className="text-center py-20 opacity-20 space-y-3">
                  <ShieldCheck className="h-12 w-12 mx-auto" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Belum ada kemitraan aktif</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSinergies.map((r: any) => {
                    const isSupplier = r.toSellerId === sellerId;
                    return (
                      <div key={r.id} className="p-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-600/5 to-white/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-500 flex flex-col justify-between gap-4 shadow-xl">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-black tracking-widest border border-emerald-500/30 uppercase">{r.type} Contract</span>
                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Active</span>
                          </div>

                          <div className="flex gap-3 items-center">
                            <img src={r.productImage || "https://placehold.co/50x50"} className="w-12 h-12 rounded-xl object-cover bg-white/5 border border-white/10" alt="" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-white uppercase italic truncate tracking-tight">{r.productName}</h4>
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-0.5">Supplier: {isSupplier ? "Anda (Original)" : r.toSellerName}</p>
                            </div>
                          </div>

                          <div className="p-3 bg-black/40 rounded-xl space-y-1.5 text-[9px] font-black uppercase tracking-widest">
                            {r.type === "reseller" ? (
                              <>
                                <div className="flex justify-between text-white/40"><span>Wholesale Cost:</span><span className="text-white">{formatPrice(r.proposedPrice || 0)}</span></div>
                                <div className="flex justify-between text-white/40"><span>Allocated Stock:</span><span className="text-white">{r.proposedQuantity} Unit</span></div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between text-white/40"><span>Original Cost:</span><span className="text-white">{formatPrice(r.productPrice || 0)}</span></div>
                                <div className="flex justify-between text-white/40"><span>Dropship Margin:</span><span className="text-emerald-400">{r.commissionPercent}% Commission</span></div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 text-[8px] font-black uppercase tracking-[0.2em] text-white/20 flex justify-between items-center">
                          <span>Contract Synchronized</span>
                          <span className="text-emerald-500 italic">Official Synergy</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auction Tab Component ──────────────────────────────────────────────────
function AuctionTab({ sellerId }: { sellerId: string }) {
  const { auctions, createAuction, endAuction } = useAuction();
  const { sellerProducts, adminProducts } = useProducts();
  const { toast } = useToast();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [minStep, setMinStep] = useState("10000");
  const [durationHours, setDurationHours] = useState("24");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const myAuctions = useMemo(() => {
    return auctions.filter((a: any) => a.sellerId === sellerId);
  }, [auctions, sellerId]);

  // My approved products
  const myApprovedProducts = useMemo(() => {
    if (sellerId === "admin-001") return adminProducts;
    return sellerProducts.filter((p: any) => p.sellerId === sellerId && p.status === "approved");
  }, [sellerProducts, adminProducts, sellerId]);

  // Selected product
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return myApprovedProducts.find((p: any) => String(p.id) === selectedProductId) || null;
  }, [selectedProductId, myApprovedProducts]);

  // Auto-fill price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setStartPrice(String(selectedProduct.price));
    } else {
      setStartPrice("");
    }
  }, [selectedProduct]);

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !startPrice || !minStep) return;

    setCreating(true);
    await new Promise(r => setTimeout(r, 600));

    const product = selectedProduct;
    if (!product) {
      toast({ variant: "destructive", title: "Error", description: "Produk tidak ditemukan." });
      setCreating(false);
      return;
    }

    const endTime = new Date();
    endTime.setHours(endTime.getHours() + Number(durationHours));

    createAuction({
      title: product.name,
      description: message.trim() || product.description,
      imageUrl: product.image,
      startPrice: Number(startPrice),
      minStep: Number(minStep),
      endTime: endTime.toISOString(),
    });

    toast({
      title: "🔨 Lelang Baru Diaktifkan!",
      description: `Produk ${product.name} sekarang aktif di pasar lelang.`
    });

    setSelectedProductId("");
    setMessage("");
    setCreating(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Panel */}
        <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Mulai Lelang Baru</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Luncurkan sesi bidding produk Anda</p>
          </div>

          <form onSubmit={handleCreateAuction} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Pilih Produk Anda</Label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500 font-bold"
              >
                <option value="" className="bg-background">-- Pilih Produk Terverifikasi --</option>
                {myApprovedProducts.map((p: any) => (
                  <option key={p.id} value={p.id} className="bg-background">
                    {p.name} ({formatPrice(p.price)})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 animate-in zoom-in-95">
                <div className="flex gap-3 items-center">
                  <img src={selectedProduct.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white uppercase italic truncate">{selectedProduct.name}</p>
                    <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-0.5">Stok: {selectedProduct.stock} · {formatPrice(selectedProduct.price)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Harga Awal (Rp)</Label>
                <input
                  type="number"
                  value={startPrice}
                  onChange={e => setStartPrice(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Kelipatan Bid Min (Rp)</Label>
                <input
                  type="number"
                  value={minStep}
                  onChange={e => setMinStep(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Durasi Sesi Lelang</Label>
              <select
                value={durationHours}
                onChange={e => setDurationHours(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white px-4 focus:outline-none focus:border-orange-500 font-bold"
              >
                <option value="1" className="bg-background">1 Jam</option>
                <option value="6" className="bg-background">6 Jam</option>
                <option value="12" className="bg-background">12 Jam</option>
                <option value="24" className="bg-background">24 Jam (1 Hari)</option>
                <option value="48" className="bg-background">48 Jam (2 Hari)</option>
                <option value="168" className="bg-background">168 Jam (1 Minggu)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Catatan Tambahan Spek</Label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ketentuan lelang, early-access, atau kondisi detail produk..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium text-white/80 focus:outline-none focus:border-orange-500 resize-none font-bold"
              />
            </div>

            <Button
              type="submit"
              disabled={creating || !selectedProductId || !startPrice}
              className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-orange-600/10"
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Launching Auction...</span>
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4" />
                  <span>Mulai Lelang</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Listing Panel */}
        <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Monitor Lelang Anda</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Status dan penawaran lelang yang Anda buat</p>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {myAuctions.length === 0 ? (
              <div className="text-center py-24 opacity-20 space-y-4">
                <Gavel className="h-14 w-14 mx-auto animate-bounce text-white/60" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em]">Belum ada sesi lelang aktif</p>
              </div>
            ) : (
              myAuctions.map((a: any) => {
                const isActive = a.status === "active";
                const isExpired = new Date(a.endTime).getTime() < Date.now();
                const totalBids = (a.bids ?? []).length;
                const topBid = totalBids > 0 ? a.bids[0] : null;

                return (
                  <div key={a.id} className="p-6 rounded-[2rem] border border-white/5 bg-white/5 space-y-4 hover:border-orange-500/10 transition-all duration-300 relative overflow-hidden">
                    {/* Status Badge */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-widest border ${
                          isActive && !isExpired
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {isActive && !isExpired ? "ON GOING BID" : "ENDED"}
                        </span>
                        <span className="text-[9px] font-mono text-white/20 font-black">ID: {a.id}</span>
                      </div>
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">
                        Exp: {new Date(a.endTime).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex gap-4 items-center">
                      <img src={a.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-white/5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-white uppercase italic truncate tracking-tight">{a.title}</h4>
                        <p className="text-[9px] text-white/40 mt-1 leading-snug line-clamp-1 italic">"{a.description}"</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
                          <div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Harga Awal</p>
                            <p className="text-[10px] font-black text-white/60 mt-0.5">{formatPrice(a.startPrice)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Current Bid</p>
                            <p className="text-xs font-black text-orange-400 mt-0.5 italic">{formatPrice(a.currentPrice)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bids monitoring info */}
                    <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between">
                      <div className="text-[9px] font-black uppercase text-white/40">
                        Total Penawaran: <span className="text-white font-bold">{totalBids} Kali</span>
                      </div>
                      {topBid ? (
                        <div className="text-[9px] font-black uppercase text-white/40 text-right">
                          Bidder Teratas: <span className="text-orange-500 italic">{topBid.userName}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] font-black uppercase text-white/20 text-right">Belum ada penawar</div>
                      )}
                    </div>

                    {/* Manual Stop Session */}
                    {isActive && !isExpired ? (
                      <Button
                        onClick={() => {
                          if (confirm(`Akhiri sesi lelang untuk "${a.title}" sekarang? Pemenang saat ini akan disahkan.`)) {
                            endAuction(a.id);
                            toast({ title: "Sesi lelang diakhiri." });
                          }
                        }}
                        className="h-10 w-full px-5 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-rose-500/20"
                      >
                        Akhiri Sesi Lelang
                      </Button>
                    ) : (
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 text-center leading-normal">
                        {a.winnerName ? (
                          <p>🎉 Lelang dimenangkan oleh <strong className="text-emerald-500">{a.winnerName}</strong> seharga <strong className="text-white">{formatPrice(a.currentPrice)}</strong></p>
                        ) : (
                          <p>Sesi lelang ditutup tanpa pemenang (Zero Bids)</p>
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discount Tab Component ──────────────────────────────────────────────────
function DiscountTab({ sellerId }: { sellerId: string }) {
  const { user } = useAuth();
  const { sellerProducts, adminProducts } = useProducts();
  const { vouchers, addVoucher, toggleVoucher, deleteVoucher } = useVouchers();
  const { toast } = useToast();

  // My approved products
  const myApprovedProducts = useMemo(() => {
    if (sellerId === "admin-001") return adminProducts;
    return sellerProducts.filter((p: any) => p.sellerId === sellerId && p.status === "approved");
  }, [sellerProducts, adminProducts, sellerId]);

  // Form states
  const [code, setCode] = useState("");
  const [scope, setScope] = useState<"global" | "product">("global");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Filter vouchers belonging to this seller
  const myVouchers = useMemo(() => {
    return vouchers.filter((v: any) => v.sellerId === sellerId);
  }, [vouchers, sellerId]);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value || !maxUses) return;

    // Validation
    const cleanCode = code.replace(/\s+/g, "").toUpperCase();
    if (vouchers.some((v: any) => v.code.toUpperCase() === cleanCode)) {
      toast({
        variant: "destructive",
        title: "Kode Duplikat!",
        description: "Kode voucher sudah digunakan di database global. Silakan gunakan kode unik lain."
      });
      return;
    }

    setCreating(true);
    await new Promise(r => setTimeout(r, 500));

    let selectedProduct = null;
    if (scope === "product" && selectedProductId) {
      selectedProduct = myApprovedProducts.find((p: any) => String(p.id) === selectedProductId);
    }

    const newVoucherData = {
      code: cleanCode,
      type,
      value: Number(value),
      minPurchase: Number(minPurchase) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      maxUses: Number(maxUses),
      isActive: true,
      description: description.trim() || (
        type === "percentage" 
          ? `Diskon ${value}%${selectedProduct ? ` khusus untuk ${selectedProduct.name}` : " untuk semua produk toko"}`
          : `Potongan ${formatPrice(Number(value))}${selectedProduct ? ` khusus untuk ${selectedProduct.name}` : " untuk semua produk toko"}`
      ),
      sellerId,
      sellerName: user?.name || "Official Shop",
      productId: selectedProduct ? selectedProduct.id : undefined,
      productName: selectedProduct ? selectedProduct.name : undefined
    };

    addVoucher(newVoucherData);

    toast({
      title: "🎉 Voucher Berhasil Dirilis!",
      description: `Kupon ${cleanCode} sekarang aktif dan siap digunakan!`
    });

    // Reset Form
    setCode("");
    setValue("");
    setMinPurchase("0");
    setMaxDiscount("");
    setMaxUses("100");
    setDescription("");
    setSelectedProductId("");
    setScope("global");
    setCreating(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Form Buat Voucher */}
        <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Buat Kupon Baru</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Buat kode diskon untuk memikat pembeli</p>
          </div>

          <form onSubmit={handleCreateVoucher} className="space-y-5">
            
            {/* Kode Kupon */}
            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Kode Voucher *</Label>
              <Input
                type="text"
                required
                placeholder="PROMOSPESIAL"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\s+/g, "").toUpperCase())}
                className="glass-input h-11 rounded-xl border-white/10 uppercase font-mono tracking-widest"
              />
            </div>

            {/* Cakupan / Scope */}
            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Cakupan Voucher (Scope)</Label>
              <select
                value={scope}
                onChange={e => {
                  setScope(e.target.value as "global" | "product");
                  setSelectedProductId("");
                }}
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white px-4 focus:outline-none focus:border-orange-500 appearance-none"
              >
                <option value="global" className="bg-background">Semua Produk Toko (Global)</option>
                <option value="product" className="bg-background">Satu Produk Tertentu (Spesifik)</option>
              </select>
            </div>

            {/* Jika scope spesifik, munculkan dropdown produk seller */}
            {scope === "product" && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-[8px] font-black uppercase tracking-widest text-orange-500 ml-1">Pilih Produk Target *</Label>
                <select
                  required
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-orange-500/20 rounded-xl text-xs font-bold text-white px-4 focus:outline-none focus:border-orange-500 appearance-none"
                >
                  <option value="" className="bg-background">-- Pilih Produk Anda --</option>
                  {myApprovedProducts.map((p: any) => (
                    <option key={p.id} value={p.id} className="bg-background">
                      {p.name} ({formatPrice(p.price)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tipe Diskon & Nilai */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Tipe Potongan</Label>
                <select
                  value={type}
                  onChange={e => {
                    setType(e.target.value as "percentage" | "fixed");
                    setValue("");
                    setMaxDiscount("");
                  }}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white px-4 focus:outline-none focus:border-orange-500 appearance-none"
                >
                  <option value="percentage" className="bg-background">Persen (%)</option>
                  <option value="fixed" className="bg-background">Rupiah (Rp)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Nilai Potongan *</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  max={type === "percentage" ? "90" : undefined}
                  placeholder={type === "percentage" ? "15" : "20000"}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="glass-input h-11 rounded-xl border-white/10 font-bold"
                />
              </div>
            </div>

            {/* Min Pembelian & Max Potongan */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Min. Belanja (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minPurchase}
                  onChange={e => setMinPurchase(e.target.value)}
                  className="glass-input h-11 rounded-xl border-white/10 font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Maks. Potongan (Rp)</Label>
                <Input
                  type="number"
                  min="1"
                  disabled={type === "fixed"}
                  placeholder={type === "fixed" ? "N/A" : "50000"}
                  value={maxDiscount}
                  onChange={e => setMaxDiscount(e.target.value)}
                  className="glass-input h-11 rounded-xl border-white/10 font-bold"
                />
              </div>
            </div>

            {/* Kuota & Deskripsi */}
            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Kuota Kupon (Uses Limit)</Label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                className="glass-input h-11 rounded-xl border-white/10 font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-1">Deskripsi Tambahan (Opsional)</Label>
              <textarea
                placeholder="Diskon spesial gajian khusus sepatu cyber..."
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/80 focus:outline-none focus:border-orange-500 resize-none font-bold"
              />
            </div>

            <Button
              type="submit"
              disabled={creating || !code.trim() || !value}
              className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-orange-600/10"
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating Code...</span>
                </>
              ) : (
                <>
                  <Percent className="h-4 w-4" />
                  <span>Rilis Voucher Toko</span>
                </>
              )}
            </Button>

          </form>
        </div>

        {/* Panel List Voucher Toko */}
        <div className="glass-card rounded-[3rem] p-8 border border-white/5 bg-white/5 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Kupon Toko Anda</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Daftar kode promo aktif milik toko Anda</p>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {myVouchers.length === 0 ? (
              <div className="text-center py-24 opacity-20 space-y-4">
                <Percent className="h-14 w-14 mx-auto animate-bounce text-white/60" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em]">Belum ada kupon rilis</p>
              </div>
            ) : (
              myVouchers.map((v: any) => {
                const limitStr = v.maxUses > 0 ? `${v.usedCount} / ${v.maxUses}` : `${v.usedCount} / ∞`;
                
                return (
                  <div key={v.id} className={`p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden space-y-4 ${
                    v.isActive ? "border-orange-500/10 bg-orange-600/5" : "border-white/5 bg-white/5 opacity-60"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-mono font-black text-orange-500 bg-orange-600/10 border border-orange-500/20 px-3 py-1 rounded-xl uppercase tracking-widest shadow-md">
                          {v.code}
                        </span>
                        <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-widest border ${
                          v.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {v.isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleVoucher(v.id)}
                          className="px-3 py-1 bg-white/5 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/20 text-white/60 hover:text-orange-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                        >
                          {v.isActive ? "Matikan" : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus kupon promo "${v.code}" secara permanen?`)) {
                              deleteVoucher(v.id);
                              toast({ title: "Kupon dihapus secara permanen." });
                            }
                          }}
                          className="px-3 py-1 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-white/40 hover:text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black text-white italic">"{v.description}"</p>
                      {v.productName && (
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">
                          🔒 Khusus Produk: {v.productName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/5">
                      <div>
                        <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest">Tipe Diskon</span>
                        <span className="text-[10px] font-bold text-white/70">{v.type === "percentage" ? `Persen (${v.value}%)` : `Nominal (${formatPrice(v.value)})`}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest">Min. Belanja</span>
                        <span className="text-[10px] font-bold text-white/70">{formatPrice(v.minPurchase)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest">Maks. Potongan</span>
                        <span className="text-[10px] font-bold text-white/70">{v.maxDiscount ? formatPrice(v.maxDiscount) : "Tanpa Batas"}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest">Penggunaan (Quota)</span>
                        <span className="text-[10px] font-mono font-bold text-white/70">{limitStr}</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
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
function ChatModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { getOrder, addMessage } = useOrderHistory();
  const order = getOrder(orderId);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [order?.messages]);

  const send = () => {
    if (!text.trim() || !user || !order) return;
    addMessage(order.id, { senderId: user.id, senderName: user.name, senderRole: user.role, text: text.trim() });
    setText("");
  };

  if (!order) return null;

  const getRoleBadge = (role?: string) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
          🛡️ Admin
        </span>
      );
    }
    if (role === "seller") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]">
          🏪 Penjual
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-white/5 text-white/40 border border-white/10">
        🛒 Pembeli
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col border border-white/10 bg-[#0a0a0c]/95 backdrop-blur-xl overflow-hidden" 
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-600/20 rounded-xl flex items-center justify-center border border-orange-500/20">
              <MessageSquare className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="font-black text-sm text-white italic uppercase tracking-tight">Asset Chat — {order.orderNumber}</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Target: {order.shippingInfo?.firstName} {order.shippingInfo?.lastName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-lg font-light"
          >
            ×
          </button>
        </div>
        
        {/* Messages List */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 custom-scrollbar scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {(order.messages ?? []).length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                <Bot className="h-6 w-6 text-white/20 animate-pulse" />
              </div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">No communication history detected.</p>
            </div>
          ) : (order.messages ?? []).map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
              >
                {/* Sender Name & Role */}
                <div className="flex items-center gap-2 px-1 text-[9px] select-none">
                  <span className="font-bold text-white/40">{msg.senderName}</span>
                  {getRoleBadge(msg.senderRole)}
                </div>
                
                {/* Bubble */}
                <div 
                  className={`max-w-[80%] px-4 py-2.5 rounded-[1.2rem] text-sm font-medium shadow-md transition-all min-w-[40px] break-words ${
                    isMe 
                      ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-tr-none shadow-[0_4px_12px_rgba(249,115,22,0.15)] border border-orange-400/20" 
                      : "bg-white/5 backdrop-blur-md text-white/90 border border-white/10 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div className="p-6 border-t border-white/[0.06] bg-white/5">
          <div className="flex gap-3 p-1.5 bg-[#1c1c1e] rounded-[1.8rem] border border-white/[0.08] items-center">
            <input 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Transmit secure message..."
              className="flex-1 px-5 py-2.5 text-[13px] font-medium text-white bg-transparent focus:outline-none placeholder:text-white/25" 
            />
            <button 
              onClick={send} 
              disabled={!text.trim()}
              className={`w-10 h-10 rounded-[1.3rem] flex items-center justify-center flex-shrink-0 transition-all ${
                !text.trim()
                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                  : "bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 active:scale-95"
              }`}
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page Export ──────────────────────────────────────────────────────────
type Tab = "stats" | "products" | "orders" | "collab" | "auction" | "discount";

export function SellerPage() {
  const { user } = useAuth();
  const { sellerProducts, adminProducts, deleteProduct, deleteAdminProduct } = useProducts();
  const { getAllOrders, updateOrderStatus } = useOrderHistory();
  
  const [tab, setTab] = useState<Tab>("stats");
  const [showForm, setShowForm] = useState(false);
  const [chatOrder, setChatOrder] = useState<PurchasedOrder | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "all">("all");
  const [editingProduct, setEditingProduct] = useState<SellerProduct | AdminProduct | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();

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

  const TABS: { id: Tab; label: string; badge?: number; icon: any }[] = [
    { id: "stats",    label: "Statistik", icon: BarChart2 },
    { id: "products", label: "Produk", icon: Package },
    { id: "orders",   label: "Pesanan", badge: orderCounts.placed + orderCounts.problem, icon: ShoppingBag },
    { id: "discount", label: "Diskon", icon: Percent },
    { id: "auction",  label: "Lelang", icon: Gavel },
    { id: "collab",   label: "Kerjasama", icon: Handshake },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* ── SIDEBAR ────────────────────────────────────────────────── */}
      <aside
        className={`relative flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0a0a0b]/95 backdrop-blur-xl transition-all duration-500 ease-in-out ${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        } min-h-screen sticky top-0 h-screen overflow-hidden z-30`}
      >
        {/* Sidebar top glow */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-orange-600/10 to-transparent pointer-events-none" />

        {/* Logo / Brand */}
        <div className={`flex items-center gap-3 px-4 pt-6 pb-5 border-b border-white/[0.06] relative z-10 ${sidebarCollapsed ? "justify-center px-3" : ""}`}>
          <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/30">
            <Store className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[13px] font-black uppercase tracking-tighter text-white leading-none">Merchant</p>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Portal</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 px-2 no-scrollbar">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                title={sidebarCollapsed ? t.label : undefined}
                className={`relative w-full flex items-center gap-3 rounded-xl transition-all duration-200 group/nav ${
                  sidebarCollapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-orange-600/15 text-orange-400 border border-orange-500/30"
                    : "text-white/30 hover:text-white hover:bg-white/[0.06] border border-transparent"
                }`}
              >
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-orange-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
                )}
                <t.icon
                  className={`h-4 w-4 flex-shrink-0 transition-all ${
                    isActive ? "text-orange-400" : "text-white/30 group-hover/nav:text-orange-400"
                  }`}
                />
                {!sidebarCollapsed && (
                  <span className={`text-[11px] font-black uppercase tracking-widest flex-1 text-left leading-none ${
                    isActive ? "text-white" : ""
                  }`}>
                    {t.label}
                  </span>
                )}
                {/* Badge indicator */}
                {t.badge != null && t.badge > 0 && (
                  <span className={`bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg ${
                    sidebarCollapsed ? "absolute top-2 right-2" : "ml-auto"
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Back to Store */}
        <div className="border-t border-white/[0.06] p-3">
          <Link href="/">
            <a
              title={sidebarCollapsed ? "Kembali ke Toko Utama" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/20 hover:text-white hover:bg-white/[0.06] transition-all duration-200 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <ArrowLeft className="h-4 w-4 text-white/30 group-hover:text-white flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Ke Toko Utama</span>}
            </a>
          </Link>
        </div>

        {/* Collapse toggle */}
        <div className="border-t border-white/[0.06] p-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/20 hover:text-white hover:bg-white/[0.06] transition-all duration-200 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <ChevronLeft className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${
              sidebarCollapsed ? "rotate-180" : ""
            }`} />
            {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-6 py-4">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Page title based on active tab */}
            <div className="flex-1">
              {(() => {
                const activeTab = TABS.find(t => t.id === tab);
                return (
                  <div className="flex items-center gap-3">
                    {activeTab && <activeTab.icon className="h-5 w-5 text-orange-500" />}
                    <div>
                      <h1 className="text-base font-black uppercase tracking-tight text-white leading-none">
                        {activeTab?.label ?? "Merchant"}
                      </h1>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-0.5">Merchant Portal</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: server status + merchant badge */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Merchant Node Active</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-2 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center shadow-md">
                  {isAdmin ? <ShieldCheck className="h-3 w-3 text-white" /> : <Store className="h-3 w-3 text-white" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 hidden md:block">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="mb-8 rounded-[3rem] border border-white/10 bg-[#141414] overflow-hidden shadow-2xl shadow-black/20">
                <div className="p-7 md:p-9 bg-gradient-to-br from-orange-500/12 via-white/[0.03] to-transparent">
                  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-orange-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Ready Seller Center
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Kelola jualan lebih cepat.</h2>
                        <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-white/45">
                          Seller bisa pantau produk, pesanan, diskon, lelang, dan bikin listing produk otomatis pakai AI dari satu halaman.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => { setTab("products"); setShowForm(true); }}
                      className="h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest gap-2"
                    >
                      <Bot className="h-4 w-4" />
                      Buat Produk AI
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
                    {[
                      { label: "Pending", value: counts.pending, tone: "text-amber-300" },
                      { label: "Live", value: counts.approved, tone: "text-emerald-300" },
                      { label: "Pesanan", value: allOrders.length, tone: "text-sky-300" },
                      { label: "Problem", value: orderCounts.problem, tone: "text-rose-300" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className={`text-xl font-black ${item.tone}`}>{item.value}</p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-white/30">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── Tab: Statistik (Dashboard) ────────────────────────────────── */}
              {tab === "stats" && (
                <StatsTab sellerId={user.id} />
              )}

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
                            {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
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
                            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.3em] mb-10 text-center">
                              {editingProduct ? "Edit detail produk lalu simpan perubahan." : (isAdmin ? "Admin bisa publish produk langsung." : "Produk seller akan masuk review admin sebelum tampil.")}
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
                                Batal Edit Produk
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

              {/* ── Tab: Kerjasama ───────────────────────────────────────────── */}
              {tab === "collab" && (
                <CollabTab sellerId={user.id} />
              )}

              {/* ── Tab: Lelang ──────────────────────────────────────────────── */}
              {tab === "auction" && (
                <AuctionTab sellerId={user.id} />
              )}

              {/* ── Tab: Diskon ──────────────────────────────────────────────── */}
              {tab === "discount" && (
                <DiscountTab sellerId={user.id} />
              )}

            </div>
          </div>
        </main>
      </div>

      {chatOrder && <ChatModal orderId={chatOrder.id} onClose={() => setChatOrder(null)} />}
    </div>
  );
}
