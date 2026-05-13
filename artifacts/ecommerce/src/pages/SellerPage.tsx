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
  MessageSquare, Send, ToggleLeft, ToggleRight, Zap,
} from "lucide-react";
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

const CATEGORIES = ["Sepatu","Tas","Pakaian","Aksesori","Elektronik","Makanan","Lainnya"];

const STATUS_CONFIG: Record<SellerProduct["status"], { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: "Menunggu Review", color: "bg-amber-100 text-amber-700",  icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Disetujui",       color: "bg-green-100 text-green-700",  icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Ditolak",         color: "bg-red-100 text-red-700",      icon: <XCircle className="h-3 w-3" /> },
};

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  placed:      { label: "Pesanan Masuk",      color: "text-blue-700",   bg: "bg-blue-100" },
  processing:  { label: "Sedang Diproses",    color: "text-amber-700",  bg: "bg-amber-100" },
  shipped:     { label: "Dikirim ke Kurir",   color: "text-orange-700", bg: "bg-orange-100" },
  in_delivery: { label: "Dalam Pengiriman",   color: "text-purple-700", bg: "bg-purple-100" },
  delivered:   { label: "Terkirim",           color: "text-green-700",  bg: "bg-green-100" },
  completed:   { label: "Selesai",            color: "text-green-800",  bg: "bg-green-200" },
  problem:     { label: "Bermasalah",         color: "text-red-700",    bg: "bg-red-100" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Product cards ────────────────────────────────────────────────────────────
function SellerProductCard({ product, onDelete, canAlwaysDelete = false }: {
  product: SellerProduct; onDelete: (id: number) => void; canAlwaysDelete?: boolean;
}) {
  const cfg = STATUS_CONFIG[product.status];
  return (
    <div className="flex gap-4 p-4 bg-card border rounded-2xl shadow-sm items-start">
      <img src={product.image} alt={product.name}
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64?text=?"; }} />
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
      {(canAlwaysDelete || product.status !== "approved") && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 flex-shrink-0"
          onClick={() => onDelete(product.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function AdminProductCard({ product, onDelete }: { product: AdminProduct; onDelete: (id: number) => void }) {
  return (
    <div className="flex gap-4 p-4 bg-card border rounded-2xl shadow-sm items-start">
      <img src={product.image} alt={product.name}
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64?text=?"; }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm truncate">{product.name}</h3>
            <p className="text-xs text-muted-foreground">{product.category} · {formatPrice(product.price)}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            <ShieldCheck className="h-3 w-3" />Admin Toko
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.description}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 flex-shrink-0" onClick={() => onDelete(product.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Add Product Form ─────────────────────────────────────────────────────────
interface FormState { name: string; category: string; price: string; description: string; longDescription: string; image: string; }
const emptyForm: FormState = { name: "", category: CATEGORIES[0], price: "", description: "", longDescription: "", image: "" };
interface SpecRow { label: string; value: string; }

function AddProductForm({ onSuccess, isAdmin }: { onSuccess: () => void; isAdmin?: boolean }) {
  const { user } = useAuth();
  const { submitProduct, addAdminProduct } = useProducts();
  const { toast } = useToast();
  const [form, setForm]       = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [useSpecs, setUseSpecs] = useState(false);
  const [specs, setSpecs]       = useState<SpecRow[]>([{ label: "", value: "" }]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim())            e.name = "Nama produk wajib diisi.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Harga tidak valid.";
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
    if (isAdmin) {
      addAdminProduct({ name: form.name.trim(), description: form.description.trim(), longDescription: form.longDescription.trim(), price: Number(form.price), image: form.image.trim(), images: [form.image.trim()], category: form.category, specs: finalSpecs });
      toast({ title: "Produk ditambahkan!", description: "Langsung tampil di toko." });
    } else {
      submitProduct({ sellerId: user.id, sellerName: user.name, name: form.name.trim(), description: form.description.trim(), longDescription: form.longDescription.trim(), price: Number(form.price), image: form.image.trim(), images: [form.image.trim()], category: form.category, specs: finalSpecs });
      toast({ title: "Produk dikirim!", description: "Menunggu persetujuan admin." });
    }
    setForm(emptyForm); setErrors({}); setSpecs([{ label: "", value: "" }]); setUseSpecs(false);
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
      <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
        {loading ? <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Mengirim…</span>
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
  const { session, startLive, stopLive, updateSession, toggleProduct, gifts, totalPoints } = useLive();
  const { allStoreProducts } = useProducts();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn]   = useState(false);
  const [liveSearch, setLiveSearch] = useState("");

  const isMySellerId = session.sellerId === user.id || isAdmin;
  const canManage = isMySellerId || !session.isLive;

  const handleStartLive = () => {
    startLive(user.id, user.name);
    toast({ title: "🔴 Live dimulai!", description: "Penonton sekarang bisa bergabung." });
  };

  const handleStopLive = () => {
    stopLive();
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

  const selectedProducts = allStoreProducts.filter((p) => session.featuredProductIds.includes(p.id));

  return (
    <div className="space-y-5">
      {/* Live Status */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold">Status Live</h3>
              {session.isLive && session.sellerId === user.id && (
                <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />ON AIR
                </span>
              )}
              {session.isLive && session.sellerId !== user.id && (
                <span className="text-xs text-muted-foreground">(live oleh {session.hostName})</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {session.isLive
                ? (session.sellerId === user.id ? `Live aktif · ${totalPoints} poin hadiah diterima` : "Seller lain sedang live.")
                : "Mulai live untuk berjualan langsung kepada pembeli."}
            </p>
          </div>
          {(canManage) && (
            <button onClick={session.isLive ? handleStopLive : handleStartLive} className="flex-shrink-0">
              {session.isLive
                ? <ToggleRight className="h-12 w-12 text-red-500" />
                : <ToggleLeft  className="h-12 w-12 text-muted-foreground" />}
            </button>
          )}
        </div>
      </div>

      {/* Kamera preview */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><Camera className="h-4 w-4 text-primary" />Kamera Seller</h3>
          <Button size="sm" variant={cameraOn ? "destructive" : "outline"} onClick={cameraOn ? stopCamera : startCamera} className="gap-1.5 text-xs">
            {cameraOn ? <><CameraOff className="h-3.5 w-3.5" />Matikan</> : <><Camera className="h-3.5 w-3.5" />Nyalakan Kamera</>}
          </Button>
        </div>
        <div className={`rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center ${cameraOn ? "" : "border border-dashed border-muted"}`} style={{ height: "200px" }}>
          {cameraOn
            ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            : <div className="text-center text-muted-foreground">
                <Camera className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Kamera belum aktif</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Preview lokal saja — viewer melihat etalase produk</p>
              </div>}
        </div>
      </div>

      {/* Live config */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm">Konfigurasi Siaran</h3>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Judul Siaran</label>
          <input value={session.title} onChange={(e) => updateSession({ title: e.target.value })}
            placeholder="Flash Sale — Penawaran Terbatas!"
            className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama Host</label>
          <input value={session.hostName} onChange={(e) => updateSession({ hostName: e.target.value })}
            placeholder="Nama toko / nama kamu"
            className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {/* Gift stats */}
      {session.isLive && totalPoints > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-orange-500" />
            <h3 className="font-bold text-sm">Hadiah Diterima</h3>
            <span className="text-orange-600 font-bold text-sm ml-auto">{totalPoints} poin</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {GIFT_TYPES.map((g) => (
              <div key={g.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-base">{g.emoji}</span>
                <span className="font-semibold">{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produk etalase */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />Etalase Live
          </h3>
          <p className="text-xs text-muted-foreground">
            {session.featuredProductIds.length === 0
              ? "Belum ada produk dipilih — semua produk akan tampil."
              : `${session.featuredProductIds.length} produk dipilih.`}
          </p>
        </div>
        {/* Selected products preview */}
        {selectedProducts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-1 w-16">
                <div className="relative">
                  <img src={p.image} alt={p.name} className="w-14 h-14 rounded-lg object-cover border-2 border-orange-400" />
                  <button onClick={() => toggleProduct(p.id)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px]">×</button>
                </div>
                <span className="text-[9px] text-center text-muted-foreground line-clamp-1">{p.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={liveSearch} onChange={(e) => setLiveSearch(e.target.value)} placeholder="Cari produk…"
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {filteredProducts.map((p) => {
            const selected = session.featuredProductIds.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggleProduct(p.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${selected ? "border-orange-500 bg-orange-50" : "border-border hover:border-primary/40"}`}>
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "bg-orange-500 border-orange-500" : "border-muted-foreground"}`}>
                  {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
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
  const { session } = useLive();
  const [tab, setTab] = useState<"products" | "orders" | "live" | "auction">("products");
  const [showForm, setShowForm] = useState(false);
  const [chatOrder, setChatOrder] = useState<PurchasedOrder | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "all">("all");
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
            {id === "live" && session.isLive && <Radio className="h-3.5 w-3.5 text-red-500" />}
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
            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors" onClick={() => setShowForm((v) => !v)}>
              <span className="flex items-center gap-2 font-bold"><PlusCircle className="h-5 w-5 text-primary" />Tambah Produk Baru</span>
              {showForm ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showForm && (
              <div className="px-5 pb-6 border-t">
                <p className="text-xs text-muted-foreground mt-4 mb-4">
                  {isAdmin ? "Produk langsung tampil di toko." : "Produk menunggu persetujuan admin."}
                </p>
                <AddProductForm onSuccess={() => setShowForm(false)} isAdmin={isAdmin} />
              </div>
            )}
          </div>
          {isAdmin && adminProducts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-bold mb-3">Produk Admin Toko <span className="text-sm font-normal text-muted-foreground">({adminProducts.length})</span></h2>
              <div className="space-y-3">{adminProducts.map((p) => <AdminProductCard key={p.id} product={p} onDelete={handleDeleteAdmin} />)}</div>
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
              <div className="space-y-3">{mySellerProducts.map((p) => <SellerProductCard key={p.id} product={p} onDelete={handleDelete} canAlwaysDelete={isAdmin} />)}</div>
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
