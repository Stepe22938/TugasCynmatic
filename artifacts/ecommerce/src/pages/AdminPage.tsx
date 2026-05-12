/**
 * AdminPage.tsx
 * Panel Admin: kelola produk seller, kelola pengguna, pengaturan.
 */
import React, { useState } from "react";
import {
  ShieldCheck, Package, Users, CheckCircle2, XCircle, Trash2, Clock,
  ChevronDown, ToggleLeft, ToggleRight, Bot, Eye, EyeOff, KeyRound,
} from "lucide-react";
import { useAuth, User, UserRole } from "../contexts/AuthContext";
import { useProducts, SellerProduct } from "../contexts/ProductsContext";
import { useAISettings, AIProvider } from "../contexts/AISettingsContext";
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

function APIKeyInput({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "sk-..."}
            className="w-full pl-8 pr-4 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          />
        </div>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ProviderToggle({
  id, label, description, badge, active, hasKey, onActivate, onDeactivate,
}: {
  id: AIProvider; label: string; description: string; badge: string;
  active: boolean; hasKey: boolean;
  onActivate: () => void; onDeactivate: () => void;
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
          {!hasKey && (
            <p className="text-[11px] text-amber-600 mt-1 font-medium">⚠ API key belum diisi</p>
          )}
        </div>
        <button
          onClick={active ? onDeactivate : onActivate}
          disabled={!hasKey && !active}
          className="flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          title={!hasKey && !active ? "Isi API key terlebih dahulu" : undefined}
        >
          {active
            ? <ToggleRight className="h-10 w-10 text-green-500" />
            : <ToggleLeft className="h-10 w-10 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

type Tab = "products" | "users" | "settings";

export function AdminPage() {
  const { user, getAllUsers, updateUserRole } = useAuth();
  const { sellerProducts, autoApprove, setAutoApprove, approveProduct, rejectProduct, deleteProduct } = useProducts();
  const ai = useAISettings();
  const { toast } = useToast();
  const [tab, setTab]     = useState<Tab>("products");
  const [filter, setFilter] = useState<SellerProduct["status"] | "all">("all");
  const [users, setUsers]   = useState<User[]>(() => getAllUsers());

  const [draftOpenai,     setDraftOpenai]     = useState(ai.openaiKey);
  const [draftOpenrouter, setDraftOpenrouter] = useState(ai.openrouterKey);

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
    toast({ title: "API key disimpan." });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Panel Admin</h1>
          <p className="text-sm text-muted-foreground">Kelola produk, pengguna, dan pengaturan toko</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-muted/40 p-1 rounded-xl w-fit flex-wrap">
        {([
          { id: "products", icon: Package,     label: `Produk (${counts.all})` },
          { id: "users",    icon: Users,        label: `Pengguna (${users.length})` },
          { id: "settings", icon: ToggleRight,  label: "Pengaturan" },
        ] as { id: Tab; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="h-4 w-4" />{label}
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
                {autoApprove
                  ? <ToggleRight className="h-10 w-10 text-green-500" />
                  : <ToggleLeft  className="h-10 w-10 text-muted-foreground" />}
              </button>
            </div>
            <div className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg inline-block ${autoApprove ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {autoApprove ? "Aktif — produk langsung masuk toko" : "Nonaktif — produk perlu disetujui manual"}
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

            {/* API Key inputs */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
              <APIKeyInput
                label="ChatGPT (OpenAI) API Key"
                value={draftOpenai}
                onChange={setDraftOpenai}
                placeholder="sk-..."
              />
              <APIKeyInput
                label="OpenRouter API Key"
                value={draftOpenrouter}
                onChange={setDraftOpenrouter}
                placeholder="sk-or-..."
              />
              <Button size="sm" onClick={handleSaveKeys} className="w-full sm:w-auto">
                Simpan API Key
              </Button>
            </div>

            {/* Provider toggles */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pilih Provider Aktif</p>
              <ProviderToggle
                id="openai"
                label="ChatGPT"
                description="Gunakan model GPT-4o-mini dari OpenAI. Butuh API key dari platform.openai.com."
                badge="bg-emerald-100 text-emerald-700"
                active={ai.activeProvider === "openai"}
                hasKey={Boolean(ai.openaiKey)}
                onActivate={() => { ai.setActiveProvider("openai"); toast({ title: "ChatGPT diaktifkan." }); }}
                onDeactivate={() => { ai.setActiveProvider(null); toast({ title: "AI dinonaktifkan." }); }}
              />
              <ProviderToggle
                id="openrouter"
                label="OpenRouter"
                description="Akses berbagai model AI (GPT, Claude, Gemini, dll.) lewat satu API. Daftar di openrouter.ai."
                badge="bg-violet-100 text-violet-700"
                active={ai.activeProvider === "openrouter"}
                hasKey={Boolean(ai.openrouterKey)}
                onActivate={() => { ai.setActiveProvider("openrouter"); toast({ title: "OpenRouter diaktifkan." }); }}
                onDeactivate={() => { ai.setActiveProvider(null); toast({ title: "AI dinonaktifkan." }); }}
              />
            </div>

            {/* Status indicator */}
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
