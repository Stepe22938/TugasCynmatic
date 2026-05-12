/**
 * AdminPage.tsx
 * Panel Admin: produk, pengguna, voucher, live, pengaturan.
 */
import React, { useState } from "react";
import {
  ShieldCheck, Package, Users, CheckCircle2, XCircle, Trash2, Clock,
  ChevronDown, ToggleLeft, ToggleRight, Bot, Eye, EyeOff, KeyRound,
  CreditCard, Smartphone, QrCode, Tag, Radio, Plus, X, Search,
} from "lucide-react";
import { useAuth, User, UserRole } from "../contexts/AuthContext";
import { useProducts, SellerProduct } from "../contexts/ProductsContext";
import { useAISettings, AIProvider } from "../contexts/AISettingsContext";
import { usePaymentSettings } from "../contexts/PaymentSettingsContext";
import { useVouchers, Voucher, VoucherType } from "../contexts/VoucherContext";
import { useLive } from "../contexts/LiveContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

const STATUS_BADGE: Record<SellerProduct["status"], string> = {
  pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<SellerProduct["status"], string> = {
  pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak",
};
const ROLE_LABEL: Record<UserRole, string> = { user: "User", seller: "Seller", admin: "Admin" };
const ROLE_COLOR: Record<UserRole, string> = {
  user: "bg-blue-100 text-blue-700", seller: "bg-purple-100 text-purple-700", admin: "bg-orange-100 text-orange-700",
};

function ProductRow({ product, onApprove, onReject, onDelete }: {
  product: SellerProduct;
  onApprove: (id: number) => void;
  onReject:  (id: number) => void;
  onDelete:  (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex gap-4 p-4 items-start">
        <img src={product.image} alt={product.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64?text=?"; }} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 justify-between">
            <div>
              <h3 className="font-bold text-sm">{product.name}</h3>
              <p className="text-xs text-muted-foreground">{product.category} · {formatPrice(product.price)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">oleh <span className="font-medium">{product.sellerName}</span></p>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[product.status]}`}>
              {product.status === "pending"  && <Clock className="h-3 w-3" />}
              {product.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
              {product.status === "rejected" && <XCircle className="h-3 w-3" />}
              {STATUS_LABEL[product.status]}
            </span>
          </div>
          <button className="flex items-center gap-1 text-[11px] text-primary mt-2 hover:underline"
            onClick={() => setExpanded((v) => !v)}>
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Sembunyikan" : "Lihat deskripsi"}
          </button>
          {expanded && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{product.longDescription}</p>}
        </div>
      </div>
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

function UserRow({ user, currentUser, onRoleChange }: { user: User; currentUser: User; onRoleChange: (id: string, role: UserRole) => void }) {
  const isCurrentUser = user.id === currentUser.id;
  const isMainAdmin   = user.id === "admin-001";
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
      <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`}
          alt={user.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">
          {user.name}{isCurrentUser && <span className="text-xs text-muted-foreground font-normal ml-1">(kamu)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      {isMainAdmin || isCurrentUser ? (
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ROLE_COLOR[user.role]}`}>{ROLE_LABEL[user.role]}</span>
      ) : (
        <select value={user.role} onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
          className="text-xs border border-input rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="user">User</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
      )}
    </div>
  );
}

function APIKeyInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "sk-..."}
            className="w-full pl-8 pr-4 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
        </div>
        <button type="button" onClick={() => setShow((v) => !v)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ProviderToggle({ id, label, description, badge, active, hasKey, onActivate, onDeactivate }: {
  id: AIProvider; label: string; description: string; badge: string;
  active: boolean; hasKey: boolean; onActivate: () => void; onDeactivate: () => void;
}) {
  return (
    <div className={`border rounded-xl p-4 transition-all ${active ? "border-primary bg-primary/5" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm">{label}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{id === "openai" ? "ChatGPT" : "OpenRouter"}</span>
            {active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aktif</span>}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {!hasKey && <p className="text-[11px] text-amber-600 mt-1 font-medium">⚠ API key belum diisi</p>}
        </div>
        <button onClick={active ? onDeactivate : onActivate}
          disabled={!hasKey && !active} className="flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
          {active ? <ToggleRight className="h-10 w-10 text-green-500" /> : <ToggleLeft className="h-10 w-10 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

// ─── Voucher row ──────────────────────────────────────────────────────────────
function VoucherRow({ voucher, onToggle, onDelete }: { voucher: Voucher; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`border rounded-xl p-4 transition-all ${voucher.isActive ? "bg-card" : "bg-muted/20 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono font-extrabold text-sm tracking-wider text-primary">{voucher.code}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${voucher.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {voucher.isActive ? "Aktif" : "Nonaktif"}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {voucher.type === "percentage" ? `${voucher.value}%` : formatPrice(voucher.value)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{voucher.description}</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-muted-foreground">
            <span>Min: {formatPrice(voucher.minPurchase)}</span>
            {voucher.maxDiscount && <span>Maks diskon: {formatPrice(voucher.maxDiscount)}</span>}
            <span>Digunakan: {voucher.usedCount}{voucher.maxUses > 0 ? `/${voucher.maxUses}` : "x"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onToggle} title={voucher.isActive ? "Nonaktifkan" : "Aktifkan"}>
            {voucher.isActive
              ? <ToggleRight className="h-9 w-9 text-green-500" />
              : <ToggleLeft  className="h-9 w-9 text-muted-foreground" />}
          </button>
          <button onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = "products" | "users" | "vouchers" | "live" | "settings";

export function AdminPage() {
  const { user, getAllUsers, updateUserRole } = useAuth();
  const { sellerProducts, allStoreProducts, autoApprove, setAutoApprove, approveProduct, rejectProduct, deleteProduct } = useProducts();
  const ai  = useAISettings();
  const pay = usePaymentSettings();
  const { vouchers, addVoucher, toggleVoucher, deleteVoucher } = useVouchers();
  const { session, startLive, stopLive, updateSession, toggleProduct: toggleLiveProduct } = useLive();
  const { toast } = useToast();

  const [tab, setTab]         = useState<Tab>("products");
  const [filter, setFilter]   = useState<SellerProduct["status"] | "all">("all");
  const [users, setUsers]     = useState<User[]>(() => getAllUsers());

  const [draftOpenai,          setDraftOpenai]          = useState(ai.openaiKey);
  const [draftOpenrouter,      setDraftOpenrouter]      = useState(ai.openrouterKey);
  const [draftOpenrouterModel, setDraftOpenrouterModel] = useState(ai.openrouterModel);

  // Voucher form state
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [vCode,     setVCode]     = useState("");
  const [vType,     setVType]     = useState<VoucherType>("percentage");
  const [vValue,    setVValue]    = useState("");
  const [vMinPurch, setVMinPurch] = useState("");
  const [vMaxDisc,  setVMaxDisc]  = useState("");
  const [vMaxUses,  setVMaxUses]  = useState("");
  const [vDesc,     setVDesc]     = useState("");

  // Live search
  const [liveSearch, setLiveSearch] = useState("");

  if (!user || user.role !== "admin") return null;

  const visible = filter === "all" ? sellerProducts : sellerProducts.filter((p) => p.status === filter);
  const counts  = {
    all:      sellerProducts.length,
    pending:  sellerProducts.filter((p) => p.status === "pending").length,
    approved: sellerProducts.filter((p) => p.status === "approved").length,
    rejected: sellerProducts.filter((p) => p.status === "rejected").length,
  };

  const handleApprove = (id: number) => { approveProduct(id); toast({ title: "Produk disetujui." }); };
  const handleReject  = (id: number) => { rejectProduct(id);  toast({ title: "Produk ditolak." }); };
  const handleDelete  = (id: number) => { deleteProduct(id);  toast({ title: "Produk dihapus." }); };
  const handleRoleChange = (uid: string, role: UserRole) => {
    updateUserRole(uid, role); setUsers(getAllUsers());
    toast({ title: `Role diubah menjadi ${ROLE_LABEL[role]}.` });
  };
  const handleSaveKeys = () => {
    ai.setOpenaiKey(draftOpenai.trim());
    ai.setOpenrouterKey(draftOpenrouter.trim());
    ai.setOpenrouterModel(draftOpenrouterModel.trim());
    toast({ title: "Pengaturan AI disimpan." });
  };

  const handleAddVoucher = () => {
    const code = vCode.trim().toUpperCase();
    if (!code || !vValue || !vMinPurch) {
      toast({ title: "Lengkapi data voucher", variant: "destructive" }); return;
    }
    if (vouchers.some((v) => v.code === code)) {
      toast({ title: "Kode voucher sudah ada!", variant: "destructive" }); return;
    }
    addVoucher({
      code,
      type: vType,
      value: Number(vValue),
      minPurchase: Number(vMinPurch) * 1000,
      maxDiscount: vMaxDisc ? Number(vMaxDisc) * 1000 : undefined,
      maxUses: Number(vMaxUses) || 0,
      isActive: true,
      description: vDesc || `${vType === "percentage" ? `Diskon ${vValue}%` : `Potongan ${formatPrice(Number(vValue))}`}`,
    });
    toast({ title: `Voucher ${code} berhasil ditambahkan.` });
    setShowVoucherForm(false);
    setVCode(""); setVType("percentage"); setVValue(""); setVMinPurch(""); setVMaxDisc(""); setVMaxUses(""); setVDesc("");
  };

  const filteredStoreProducts = allStoreProducts.filter((p) =>
    !liveSearch || p.name.toLowerCase().includes(liveSearch.toLowerCase())
  );

  const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "products", icon: Package,     label: `Produk (${counts.all})` },
    { id: "users",    icon: Users,        label: `Pengguna (${users.length})` },
    { id: "vouchers", icon: Tag,          label: `Voucher (${vouchers.length})` },
    { id: "live",     icon: Radio,        label: "Live" },
    { id: "settings", icon: ToggleRight,  label: "Pengaturan" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Panel Admin</h1>
          <p className="text-sm text-muted-foreground">Kelola produk, pengguna, voucher, live, dan pengaturan toko</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-muted/40 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
            {id === "live" && session.isLive && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Produk ─────────────────────────────────────────────────── */}
      {tab === "products" && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}>
                {s === "all" ? `Semua (${counts.all})` : s === "pending" ? `Menunggu (${counts.pending})` : s === "approved" ? `Disetujui (${counts.approved})` : `Ditolak (${counts.rejected})`}
              </button>
            ))}
          </div>
          {visible.length === 0
            ? <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed"><Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" /><p className="font-semibold text-muted-foreground">Tidak ada produk</p></div>
            : <div className="space-y-3">{visible.map((p) => <ProductRow key={p.id} product={p} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} />)}</div>}
        </div>
      )}

      {/* ── Tab Pengguna ──────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          {users.length === 0
            ? <div className="text-center py-12 text-muted-foreground">Belum ada pengguna.</div>
            : <div className="divide-y">{users.map((u) => <UserRow key={u.id} user={u} currentUser={user} onRoleChange={handleRoleChange} />)}</div>}
        </div>
      )}

      {/* ── Tab Voucher ────────────────────────────────────────────────── */}
      {tab === "vouchers" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Manajemen Voucher</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{vouchers.length} voucher terdaftar</p>
            </div>
            <Button size="sm" onClick={() => setShowVoucherForm((v) => !v)} className="gap-1.5">
              {showVoucherForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showVoucherForm ? "Tutup" : "Tambah Voucher"}
            </Button>
          </div>

          {/* Create voucher form */}
          {showVoucherForm && (
            <div className="border rounded-2xl p-5 bg-card shadow-sm space-y-4">
              <h4 className="font-bold text-sm">Buat Voucher Baru</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Kode Voucher *</label>
                  <input value={vCode} onChange={(e) => setVCode(e.target.value.toUpperCase())}
                    placeholder="HEMAT20" maxLength={20}
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-wider uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tipe</label>
                  <select value={vType} onChange={(e) => setVType(e.target.value as VoucherType)}
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="percentage">Persen (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {vType === "percentage" ? "Nilai Diskon (%)* " : "Nominal (Rp)*"}
                  </label>
                  <input value={vValue} onChange={(e) => setVValue(e.target.value)} type="number" min="1"
                    placeholder={vType === "percentage" ? "20" : "50000"}
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Min. Pembelian (ribu Rp)*</label>
                  <input value={vMinPurch} onChange={(e) => setVMinPurch(e.target.value)} type="number" min="0"
                    placeholder="100"
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {vType === "percentage" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Maks. Diskon (ribu Rp)</label>
                    <input value={vMaxDisc} onChange={(e) => setVMaxDisc(e.target.value)} type="number" min="0"
                      placeholder="50 (opsional)"
                      className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Maks. Penggunaan (0=∞)</label>
                  <input value={vMaxUses} onChange={(e) => setVMaxUses(e.target.value)} type="number" min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Deskripsi</label>
                  <input value={vDesc} onChange={(e) => setVDesc(e.target.value)}
                    placeholder="Diskon 20% untuk semua produk"
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <Button onClick={handleAddVoucher} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />Simpan Voucher
              </Button>
            </div>
          )}

          {/* Voucher list */}
          <div className="space-y-3">
            {vouchers.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
                <Tag className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">Belum ada voucher</p>
              </div>
            ) : vouchers.map((v) => (
              <VoucherRow key={v.id} voucher={v}
                onToggle={() => { toggleVoucher(v.id); toast({ title: `Voucher ${v.code} ${v.isActive ? "dinonaktifkan" : "diaktifkan"}.` }); }}
                onDelete={() => { deleteVoucher(v.id); toast({ title: `Voucher ${v.code} dihapus.` }); }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Live ───────────────────────────────────────────────────── */}
      {tab === "live" && (
        <div className="space-y-5">

          {/* Live status toggle */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">Status Live</h3>
                  {session.isLive && (
                    <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />ON AIR
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {session.isLive ? "Live sedang berlangsung. Pengguna dapat menonton dan membeli produk." : "Live belum dimulai. Aktifkan untuk memulai sesi belanja live."}
                </p>
                {session.isLive && session.startedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dimulai: {new Date(session.startedAt).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
              <button
                onClick={() => { session.isLive ? stopLive() : startLive(); toast({ title: session.isLive ? "Live dihentikan." : "Live dimulai! 🔴" }); }}
                className="flex-shrink-0">
                {session.isLive
                  ? <ToggleRight className="h-12 w-12 text-red-500" />
                  : <ToggleLeft  className="h-12 w-12 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {/* Live config */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm">Konfigurasi Sesi Live</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Judul Siaran</label>
              <input
                value={session.title}
                onChange={(e) => updateSession({ title: e.target.value })}
                placeholder="Flash Sale — Penawaran Terbatas!"
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama Host</label>
              <input
                value={session.hostName}
                onChange={(e) => updateSession({ hostName: e.target.value })}
                placeholder="Admin Toko"
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Product picker */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm mb-1">Produk yang Ditampilkan di Live</h3>
              <p className="text-xs text-muted-foreground">
                {session.featuredProductIds.length === 0
                  ? "Belum ada produk dipilih — semua produk akan ditampilkan."
                  : `${session.featuredProductIds.length} produk dipilih.`}
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={liveSearch} onChange={(e) => setLiveSearch(e.target.value)}
                placeholder="Cari produk…"
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredStoreProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Tidak ada produk ditemukan.</p>
              ) : filteredStoreProducts.map((p) => {
                const selected = session.featuredProductIds.includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggleLiveProduct(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selected ? "border-red-500 bg-red-50" : "border-border hover:border-primary/40"
                    }`}>
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selected ? "bg-red-500 border-red-500" : "border-muted-foreground"
                    }`}>
                      {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {session.featuredProductIds.length > 0 && (
              <button
                onClick={() => { session.featuredProductIds.forEach((id) => toggleLiveProduct(id)); }}
                className="text-xs text-muted-foreground hover:text-red-500 underline underline-offset-2 transition-colors">
                Reset pilihan produk
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Pengaturan ────────────────────────────────────────────── */}
      {tab === "settings" && (
        <div className="space-y-4">

          {/* Auto-approve */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm">Auto-Approve Produk Seller</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Jika diaktifkan, produk baru dari seller langsung disetujui tanpa perlu review manual.
                </p>
              </div>
              <button onClick={() => { setAutoApprove(!autoApprove); toast({ title: `Auto-approve ${!autoApprove ? "diaktifkan" : "dinonaktifkan"}.` }); }}
                className="flex-shrink-0">
                {autoApprove ? <ToggleRight className="h-10 w-10 text-green-500" /> : <ToggleLeft className="h-10 w-10 text-muted-foreground" />}
              </button>
            </div>
            <div className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg inline-block ${autoApprove ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {autoApprove ? "Aktif — produk langsung masuk toko" : "Nonaktif — produk perlu disetujui manual"}
            </div>
          </div>

          {/* Payment Gateway */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Pengaturan Payment Gateway</h3>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Aktifkan atau nonaktifkan metode pembayaran yang tersedia di halaman checkout.
            </p>
            <div className="border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0"><Smartphone className="h-4 w-4 text-white" /></div>
                  <div><p className="font-bold text-sm">DANA</p><p className="text-xs text-muted-foreground">Dompet digital DANA</p></div>
                </div>
                <button onClick={() => { pay.update({ danaEnabled: !pay.danaEnabled }); toast({ title: `DANA ${!pay.danaEnabled ? "diaktifkan" : "dinonaktifkan"}.` }); }}>
                  {pay.danaEnabled ? <ToggleRight className="h-9 w-9 text-blue-500" /> : <ToggleLeft className="h-9 w-9 text-muted-foreground" />}
                </button>
              </div>
              {pay.danaEnabled && (
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nomor DANA (untuk mode demo)</label>
                  <input value={pay.danaNumber} onChange={(e) => pay.update({ danaNumber: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
                </div>
              )}
            </div>
            <div className="border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0"><QrCode className="h-4 w-4 text-white" /></div>
                  <div><p className="font-bold text-sm">QRIS</p><p className="text-xs text-muted-foreground">Scan QR dari semua e-wallet</p></div>
                </div>
                <button onClick={() => { pay.update({ qrisEnabled: !pay.qrisEnabled }); toast({ title: `QRIS ${!pay.qrisEnabled ? "diaktifkan" : "dinonaktifkan"}.` }); }}>
                  {pay.qrisEnabled ? <ToggleRight className="h-9 w-9 text-orange-500" /> : <ToggleLeft className="h-9 w-9 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <div className="border rounded-xl p-4 bg-amber-50/50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm">Mode Demo (Dummy Payment)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Jika aktif, checkout menampilkan simulasi pembayaran tanpa transaksi nyata.</p>
                </div>
                <button onClick={() => { pay.update({ dummyMode: !pay.dummyMode }); toast({ title: `Mode demo ${!pay.dummyMode ? "diaktifkan" : "dinonaktifkan"}.` }); }}>
                  {pay.dummyMode ? <ToggleRight className="h-9 w-9 text-amber-500" /> : <ToggleLeft className="h-9 w-9 text-muted-foreground" />}
                </button>
              </div>
              <div className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg inline-block ${pay.dummyMode ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                {pay.dummyMode ? "⚠ Mode Demo aktif — tidak ada pembayaran nyata" : "Mode Produksi — gunakan gateway sungguhan"}
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
              Metode aktif: {[pay.danaEnabled && "DANA", pay.qrisEnabled && "QRIS"].filter(Boolean).join(", ") || "—"}
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Pengaturan AI Analisis Produk</h3>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Masukkan API key dan pilih provider yang ingin digunakan. Hanya satu provider yang bisa aktif sekaligus.
            </p>
            <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
              <APIKeyInput label="ChatGPT (OpenAI) API Key" value={draftOpenai} onChange={setDraftOpenai} placeholder="sk-..." />
              <APIKeyInput label="OpenRouter API Key" value={draftOpenrouter} onChange={setDraftOpenrouter} placeholder="sk-or-..." />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">OpenRouter Model</label>
                <input type="text" value={draftOpenrouterModel} onChange={(e) => setDraftOpenrouterModel(e.target.value)}
                  placeholder="openai/gpt-4o-mini"
                  className="w-full px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
                <p className="text-[11px] text-muted-foreground">
                  Format: <code className="bg-muted px-1 rounded">provider/model-name</code> — contoh:{" "}
                  <button type="button" className="text-primary hover:underline font-mono" onClick={() => setDraftOpenrouterModel("openai/gpt-4o-mini")}>openai/gpt-4o-mini</button>
                  {", "}
                  <button type="button" className="text-primary hover:underline font-mono" onClick={() => setDraftOpenrouterModel("google/gemini-flash-1.5")}>google/gemini-flash-1.5</button>.
                </p>
              </div>
              <Button size="sm" onClick={handleSaveKeys} className="w-full sm:w-auto">Simpan Pengaturan</Button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pilih Provider Aktif</p>
              <ProviderToggle id="openai" label="ChatGPT" description="Gunakan model GPT-4o-mini dari OpenAI."
                badge="bg-emerald-100 text-emerald-700" active={ai.activeProvider === "openai"} hasKey={Boolean(ai.openaiKey)}
                onActivate={() => { ai.setActiveProvider("openai"); toast({ title: "ChatGPT diaktifkan." }); }}
                onDeactivate={() => { ai.setActiveProvider(null); toast({ title: "AI dinonaktifkan." }); }} />
              <ProviderToggle id="openrouter" label="OpenRouter" description="Akses berbagai model AI lewat satu API."
                badge="bg-violet-100 text-violet-700" active={ai.activeProvider === "openrouter"} hasKey={Boolean(ai.openrouterKey)}
                onActivate={() => { ai.setActiveProvider("openrouter"); toast({ title: "OpenRouter diaktifkan." }); }}
                onDeactivate={() => { ai.setActiveProvider(null); toast({ title: "AI dinonaktifkan." }); }} />
            </div>
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${ai.isAIEnabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {ai.isAIEnabled
                ? `✓ AI aktif — menggunakan ${ai.activeProvider === "openai" ? "ChatGPT (OpenAI)" : "OpenRouter"}`
                : "AI tidak aktif — fitur analisis produk dinonaktifkan"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
