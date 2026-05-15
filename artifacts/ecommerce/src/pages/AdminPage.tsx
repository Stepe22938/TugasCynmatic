/**
 * AdminPage.tsx
 * Panel Admin: produk, pengguna, voucher, live, pengaturan.
 * v2.1 - Force Refresh
 */
import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Package, Users, CheckCircle2, XCircle, Trash2, Clock,
  ChevronDown, ToggleLeft, ToggleRight, Bot, Eye, EyeOff, KeyRound,
  CreditCard, Smartphone, QrCode, Tag, Radio, Plus, X, Search, Coins, Ban, Globe, ArrowRight, Gift, Crown,
  History, Wallet, AlertTriangle, Activity, ShoppingBag, Vote, BarChart3, ListTodo, Palette
} from "lucide-react";
import { useAuth, User, UserRole } from "../contexts/AuthContext";
import { useCosmetics, Cosmetic } from "../contexts/CosmeticContext";
import { useProducts, SellerProduct } from "../contexts/ProductsContext";
import { useAISettings } from "../contexts/AISettingsContext";
import { usePaymentSettings } from "../contexts/PaymentSettingsContext";
import { useVouchers, Voucher, VoucherType } from "../contexts/VoucherContext";
import { useLive } from "../contexts/LiveContext";
import { useTickets } from "../contexts/TicketContext";
import { useExchangeSettings } from "../contexts/ExchangeSettingsContext";
import { useRedeem } from "../contexts/RedeemContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { useSultan } from "../contexts/MySultanContext";
import { useVote } from "../contexts/VoteContext";

type Tab = "products" | "users" | "coins" | "ip_list" | "tickets" | "vouchers" | "redeem" | "live" | "sultan" | "voting" | "settings" | "cosmetics";

const STATUS_BADGE: Record<SellerProduct["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300", 
  approved: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300", 
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};
const STATUS_LABEL: Record<SellerProduct["status"], string> = {
  pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak",
};
const ROLE_LABEL: Record<UserRole, string> = { user: "User", seller: "Seller", admin: "Admin", kurir: "Kurir" };
const ROLE_COLOR: Record<UserRole, string> = {
  user: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300", 
  seller: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300", 
  admin: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300", 
  kurir: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
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

function UserRow({ user, currentUser, onRoleChange, onBanToggle, onUpdateBalance, onViewDetails }: { 
  user: User; currentUser: User; 
  onRoleChange: (id: string, role: UserRole) => void;
  onBanToggle: (id: string, type: "permanent" | "trial", reason: string) => void;
  onUpdateBalance: (id: string, amount: number) => void;
  onViewDetails: (user: User) => void;
}) {
  const isCurrentUser = user.id === currentUser.id;
  const isMainAdmin   = user.id === "admin-001";
  const [showBanModal, setShowBanModal] = useState(false);
  const [banType, setBanType] = useState<"permanent" | "trial">("permanent");
  const [banReason, setBanReason] = useState("");
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(user.balance?.toString() || "0");

  return (
    <div className={`flex flex-col gap-2 px-4 py-4 border-b last:border-0 ${user.isBanned ? 'bg-red-50/50 dark:bg-red-950/20' : 'hover:bg-muted/10'}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-background shadow-sm">
          <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`}
            alt={user.name} className={`w-full h-full object-cover ${user.isBanned ? 'grayscale' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-black leading-tight truncate ${user.isBanned ? 'text-red-700 line-through' : ''}`}>
              {user.name}
            </p>
            {isCurrentUser && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest text-slate-500">YOU</span>}
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mb-1">ID: {user.id}</p>
          <div className="flex items-center gap-3">
             <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${ROLE_COLOR[user.role]}`}>{ROLE_LABEL[user.role]}</span>
             {user.isBanned && (
               <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${user.banType === 'permanent' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                 {user.banType === 'permanent' ? 'Permanent' : 'Trial'} Banned
               </span>
             )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Real-time Stats */}
          <div className="hidden sm:flex flex-col items-end mr-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
               <Coins className="h-3 w-3" /> {user.coins || 0}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
               <Wallet className="h-3 w-3" /> {formatPrice(user.balance || 0)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => onViewDetails(user)} title="Detail & Riwayat">
              <History className="h-4 w-4" />
            </Button>
            
            <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-500" onClick={() => setEditingBalance(true)} title="Edit Saldo">
              <CreditCard className="h-4 w-4" />
            </Button>

            {!isMainAdmin && !isCurrentUser && (
              <button onClick={() => user.isBanned ? onBanToggle(user.id, "permanent", "") : setShowBanModal(true)} 
                className={`p-1.5 rounded-lg transition-colors ${user.isBanned ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500'}`} 
                title={user.isBanned ? "Unban User" : "Ban User"}>
                <Ban className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Balance Edit UI */}
      {editingBalance && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Wallet className="h-4 w-4 text-blue-500" />
          <input 
            type="number" 
            value={balanceInput} 
            onChange={e => setBalanceInput(e.target.value)}
            className="flex-1 bg-transparent border-b border-blue-200 text-sm font-bold focus:outline-none"
            placeholder="Set Balance..."
          />
          <Button size="sm" className="h-7 text-[10px]" onClick={() => { onUpdateBalance(user.id, Number(balanceInput)); setEditingBalance(false); }}>Update</Button>
          <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setEditingBalance(false)}>Batal</Button>
        </div>
      )}

      {/* Ban Reason Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border-2 border-red-500 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black tracking-tighter mb-4 flex items-center gap-2 text-red-600">
              <ShieldCheck className="h-6 w-6" /> KONFIGURASI BAN
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipe Hukuman</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setBanType("permanent")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${banType === 'permanent' ? 'bg-red-600 border-red-600 text-white' : 'border-muted hover:border-red-400'}`}
                  >
                    PERMANENT
                  </button>
                  <button 
                    onClick={() => setBanType("trial")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${banType === 'trial' ? 'bg-amber-500 border-amber-500 text-white' : 'border-muted hover:border-amber-400'}`}
                  >
                    TRIAL (TEMPORARY)
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alasan Ban</label>
                <textarea 
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder="Misal: Penipuan, Spam, Toxic..."
                  className="w-full bg-muted/30 border-2 border-muted rounded-2xl p-4 text-sm font-bold focus:border-red-500 transition-colors h-24"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowBanModal(false)} className="flex-1 rounded-xl">Batal</Button>
                <Button onClick={() => { onBanToggle(user.id, banType, banReason); setShowBanModal(false); }} className="flex-[2] rounded-xl bg-red-600 hover:bg-red-700">TERAPKAN HUKUMAN</Button>
              </div>
            </div>
          </motion.div>
        </div>
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

// ─── Voucher row ──────────────────────────────────────────────────────────────
function VoucherRow({ voucher, onToggle, onDelete }: { voucher: Voucher; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`border rounded-xl p-4 transition-all ${voucher.isActive ? "bg-card" : "bg-muted/20 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono font-extrabold text-sm tracking-wider text-primary">{voucher.code}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${voucher.isActive ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
              {voucher.isActive ? "Aktif" : "Nonaktif"}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
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



function VotingAdminTab() {
  const { polls, createPoll, deletePoll, togglePollStatus } = useVote();
  const [newTitle, setNewTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => setOptions([...options, ""]);
  const handleRemoveOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleCreate = () => {
    if (!newTitle || options.some(o => !o.trim())) return;
    createPoll(newTitle, options);
    setNewTitle("");
    setOptions(["", ""]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-[2rem] p-6 shadow-sm space-y-4">
        <h3 className="font-black tracking-tighter text-sm flex items-center gap-2 uppercase">
          <Vote className="h-4 w-4" /> Buat Vote Baru
        </h3>
        <div className="space-y-3">
          <input 
            placeholder="Judul Vote (Contoh: Siapa admin favoritmu?)" 
            value={newTitle} 
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-4 py-3 text-sm border rounded-2xl bg-background font-bold"
          />
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Opsi Jawaban</p>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  placeholder={`Opsi ${i+1}`} 
                  value={opt} 
                  onChange={e => handleOptionChange(i, e.target.value)}
                  className="flex-1 px-4 py-2 text-sm border rounded-xl bg-background"
                />
                {options.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(i)} className="text-red-500">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full border-dashed rounded-xl">
              <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Opsi
            </Button>
          </div>
          <Button onClick={handleCreate} className="w-full h-12 rounded-2xl font-black">Rilis Voting</Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-black tracking-tighter text-sm flex items-center gap-2 uppercase ml-2">
          <BarChart3 className="h-4 w-4" /> Daftar & Hasil Voting
        </h3>
        {polls.map(poll => (
          <div key={poll.id} className="bg-card border rounded-[2rem] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-lg leading-tight mb-1">{poll.title}</h4>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                  <span>{poll.votedUserIds.length} Total Suara</span>
                  <span>•</span>
                  <span className={poll.isActive ? "text-green-500" : "text-red-500"}>
                    {poll.isActive ? "Sedang Berjalan" : "Ditutup"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => togglePollStatus(poll.id)}>
                  {poll.isActive ? "Tutup" : "Buka"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deletePoll(poll.id)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {poll.options.map(opt => {
                const percent = poll.votedUserIds.length === 0 ? 0 : Math.round((opt.votes / poll.votedUserIds.length) * 100);
                return (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{opt.text}</span>
                      <span>{opt.votes} Suara ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SultanAdminTab() {
  const { config, vouchers, updateConfig, getSultanStats, addSultanVoucher, removeSultanVoucher } = useSultan();
  const { activeUsers } = getSultanStats();
  const [newPrice, setNewPrice] = useState(config.price.toString());
  const [vCode, setVCode] = useState("");
  const [vDiscount, setVDiscount] = useState("");

  const handleUpdatePrice = () => {
    updateConfig({ price: Number(newPrice) });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-6 rounded-[2rem] text-white shadow-lg shadow-amber-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Sultan Aktif</p>
          <p className="text-3xl font-black">{activeUsers} User</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border p-6 rounded-[2rem] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Harga MySultan / Bulan</p>
          <p className="text-2xl font-black text-primary">{formatPrice(config.price)}</p>
        </div>
      </div>

      {/* Pricing Control */}
      <div className="bg-card border rounded-[2rem] p-6 shadow-sm space-y-4">
        <h3 className="font-black tracking-tighter text-sm flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Pengaturan Harga
        </h3>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={newPrice} 
            onChange={e => setNewPrice(e.target.value)}
            className="flex-1 px-4 py-2 text-sm border rounded-xl bg-background" 
          />
          <Button onClick={handleUpdatePrice}>Update Harga</Button>
        </div>
      </div>

      {/* Voucher Management */}
      <div className="bg-card border rounded-[2rem] p-6 shadow-sm space-y-4">
        <h3 className="font-black tracking-tighter text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" /> Voucher Khusus Sultan
        </h3>
        <div className="grid gap-3">
          {vouchers.map(v => (
            <div key={v.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-dashed">
              <div>
                <p className="text-sm font-black tracking-widest">{v.code}</p>
                <p className="text-xs text-muted-foreground">{v.type === "percent" ? `${v.discount}%` : formatPrice(v.discount)} off</p>
              </div>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => removeSultanVoucher(v.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tambah Voucher Baru</p>
          <div className="flex gap-2">
            <input placeholder="KODE" value={vCode} onChange={e => setVCode(e.target.value.toUpperCase())} className="flex-1 px-3 py-2 text-sm border rounded-xl" />
            <input type="number" placeholder="Diskon (Rp)" value={vDiscount} onChange={e => setVDiscount(e.target.value)} className="flex-1 px-3 py-2 text-sm border rounded-xl" />
            <Button onClick={() => {
              if(!vCode || !vDiscount) return;
              addSultanVoucher({ code: vCode, discount: Number(vDiscount), type: "flat", minPurchase: 0, category: "all" });
              setVCode(""); setVDiscount("");
            }}>Tambah</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailView({ user, onClose }: { user: User; onClose: () => void }) {
  const [view, setView] = useState<"activity" | "purchase">("activity");

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border-2 border-primary rounded-[2.5rem] w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-8 bg-muted/20 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
            <div>
              <h2 className="text-2xl font-black tracking-tighter">{user.name}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bergabung: {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-full h-12 w-12"><X className="h-6 w-6" /></Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
           <button onClick={() => setView("activity")} className={`flex-1 py-4 font-black text-sm uppercase tracking-widest transition-all ${view === 'activity' ? 'text-primary border-b-4 border-primary bg-primary/5' : 'text-muted-foreground'}`}>
             <div className="flex items-center justify-center gap-2"><Activity className="h-4 w-4" /> Riwayat Aktivitas</div>
           </button>
           <button onClick={() => setView("purchase")} className={`flex-1 py-4 font-black text-sm uppercase tracking-widest transition-all ${view === 'purchase' ? 'text-blue-500 border-b-4 border-blue-500 bg-blue-500/5' : 'text-muted-foreground'}`}>
             <div className="flex items-center justify-center gap-2"><ShoppingBag className="h-4 w-4" /> Riwayat Belanja</div>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {view === "activity" ? (
             user.activityLog?.length === 0 ? (
               <div className="text-center py-20 text-muted-foreground">Belum ada riwayat aktivitas.</div>
             ) : (
               user.activityLog.slice().reverse().map((log, i) => (
                 <div key={i} className="flex gap-4 p-4 bg-muted/20 rounded-2xl border border-dashed animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                       <Clock className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold">{log.action}</p>
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                 </div>
               ))
             )
           ) : (
             user.purchaseHistory?.length === 0 ? (
               <div className="text-center py-20 text-muted-foreground">Belum ada riwayat belanja.</div>
             ) : (
               user.purchaseHistory.slice().reverse().map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <ShoppingBag className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold">{item.itemName}</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                       </div>
                    </div>
                    <p className="text-sm font-black text-blue-600">{formatPrice(item.price)}</p>
                 </div>
               ))
             )
           )}
        </div>
      </motion.div>
    </div>
  );
}



export function AdminPage() {
  const { user, getAllUsers, updateUserRole, addCoins, toggleBan, updateBalance } = useAuth();
  const { cosmetics, addCosmetic, deleteCosmetic } = useCosmetics();
  const { sellerProducts, allStoreProducts, autoApprove, setAutoApprove, approveProduct, rejectProduct, deleteProduct } = useProducts();
  const ai  = useAISettings();
  const pay = usePaymentSettings();
  const { vouchers, addVoucher, toggleVoucher, deleteVoucher } = useVouchers();
  const { activeSessions, startLive, stopLive, updateSession, toggleProduct: toggleLiveProduct } = useLive();
  const isLive = activeSessions.length > 0;
  const mySession = activeSessions.find(s => s.sellerId === user?.id);
  const isMyLive = !!mySession;
  const { tickets, updateTicket } = useTickets();
  const { options: exchangeOptions, addOption: addExchangeOption, deleteOption: deleteExchangeOption } = useExchangeSettings();
  const { codes: redeemCodes, addCode: addRedeemCode, deleteCode: deleteRedeemCode, toggleCode: toggleRedeemCode } = useRedeem();
  const { toast } = useToast();

  const [tab, setTab]         = useState<Tab>("products");
  const [filter, setFilter]   = useState<SellerProduct["status"] | "all">("all");
  const [users, setUsers]     = useState<User[]>(() => getAllUsers());
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  const [bulkCoinAmount, setBulkCoinAmount] = useState("");
  const [targetUserId, setTargetUserId]     = useState("");
  const [singleCoinAmount, setSingleCoinAmount] = useState("");

  const [excCoins, setExcCoins] = useState("");
  const [excValue, setExcValue] = useState("");
  const [excTitle, setExcTitle] = useState("");

  // Redeem form state
  const [showRedeemForm, setShowRedeemForm] = useState(false);
  const [rCode, setRCode] = useState("");
  const [rType, setRType] = useState<"coin" | "balance">("coin");
  const [rValue, setRValue] = useState("");
  const [rMaxUses, setRMaxUses] = useState("1");

  // Live search
  const [liveSearch, setLiveSearch] = useState("");

  if (!user || user.role !== "admin") return <div className="text-center py-20 font-semibold">Akses Ditolak</div>;

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
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast({ title: "Peran Diperbarui" });
  };
  const handleBanToggle = (uid: string, type: "permanent" | "trial", reason: string) => {
    toggleBan(uid, type, reason); setUsers(getAllUsers());
    toast({ title: "Status hukuman pengguna diperbarui." });
  };
  const handleUpdateBalance = (uid: string, amount: number) => {
    updateBalance(uid, amount); setUsers(getAllUsers());
    toast({ title: "Saldo pengguna diperbarui." });
  };
  const handleSaveKeys = () => {
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

  const handleAddRedeemCode = () => {
    const code = rCode.trim().toUpperCase();
    if (!code || !rValue) {
      toast({ title: "Lengkapi data kode", variant: "destructive" }); return;
    }
    if (redeemCodes.some((c) => c.code === code)) {
      toast({ title: "Kode redeem sudah ada!", variant: "destructive" }); return;
    }
    addRedeemCode({
      code,
      type: rType,
      value: Number(rValue),
      maxUses: Number(rMaxUses) || 0,
      isActive: true,
    });
    toast({ title: `Kode redeem ${code} ditambahkan.` });
    setShowRedeemForm(false);
    setRCode(""); setRType("coin"); setRValue(""); setRMaxUses("1");
  };

  const handleGiveBulkCoins = () => {
    const amount = parseInt(bulkCoinAmount);
    if (!amount || amount <= 0) return toast({ title: "Jumlah tidak valid", variant: "destructive" });
    addCoins("all", amount);
    setUsers(users.map(u => ({ ...u, coins: (u.coins || 0) + amount })));
    setBulkCoinAmount("");
    toast({ title: "Berhasil", description: `Memberikan ${amount} koin ke semua pengguna.` });
  };

  const handleGiveSingleCoin = () => {
    if (!targetUserId) return toast({ title: "Pilih pengguna", variant: "destructive" });
    const amount = parseInt(singleCoinAmount);
    if (!amount || amount <= 0) return toast({ title: "Jumlah tidak valid", variant: "destructive" });
    addCoins(targetUserId, amount);
    setUsers(users.map(u => u.id === targetUserId ? { ...u, coins: (u.coins || 0) + amount } : u));
    setTargetUserId("");
    setSingleCoinAmount("");
    toast({ title: "Berhasil", description: `Memberikan ${amount} koin ke pengguna.` });
  };

  const handleAddExchangeOption = () => {
    const coins = parseInt(excCoins);
    const value = parseInt(excValue);
    if (!coins || !value || !excTitle.trim()) return toast({ title: "Isi data dengan benar", variant: "destructive" });
    addExchangeOption({ coins, value, title: excTitle.trim() });
    setExcCoins(""); setExcValue(""); setExcTitle("");
    toast({ title: "Opsi Tukar Koin Ditambahkan" });
  };

  const filteredStoreProducts = allStoreProducts.filter((p) =>
    !liveSearch || p.name.toLowerCase().includes(liveSearch.toLowerCase())
  );

  const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "products", icon: Package,     label: `Produk (${counts.all})` },
    { id: "users",    icon: Users,        label: `Pengguna (${users.length})` },
    { id: "coins",    icon: Coins,        label: "Koin" },
    { id: "ip_list",  icon: Globe,        label: "IP List" },
    { id: "tickets",  icon: ShieldCheck,  label: `Tiket Bantuan (${tickets.filter(t => t.status === "open").length})` },
    { id: "vouchers", icon: Tag,          label: `Voucher (${vouchers.length})` },
    { id: "redeem",   icon: Gift,         label: `Redeem (${redeemCodes.length})` },
    { id: "live",     icon: Radio,        label: "Live" },
    { id: "sultan",   icon: Crown,        label: "MySultan" },
    { id: "cosmetics", icon: Palette,      label: "Cosmetics" },
    { id: "voting",   icon: Vote,         label: "Voting" },
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
      <div className="flex gap-2 mb-6 bg-muted/60 p-1.5 rounded-xl w-fit flex-wrap border border-border/50">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? "bg-background shadow-md text-foreground border border-border/20" : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}>
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
            {id === "live" && isLive && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
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
        <div className="space-y-4">
          <div className="bg-card border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-2 shadow-sm flex items-center gap-3">
             <div className="pl-4">
               <Search className="h-5 w-5 text-muted-foreground" />
             </div>
             <input 
               value={userSearch}
               onChange={e => setUserSearch(e.target.value)}
               placeholder="Cari nama, email, atau ID user..."
               className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold h-10"
             />
          </div>

          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm divide-y">
            {users.filter(u => 
              u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
              u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
              u.id.toLowerCase().includes(userSearch.toLowerCase())
            ).length === 0
              ? <div className="text-center py-12 text-muted-foreground">Tidak ada pengguna ditemukan.</div>
              : users
                  .filter(u => 
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.id.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <UserRow 
                      key={u.id} 
                      user={u} 
                      currentUser={user} 
                      onRoleChange={handleRoleChange} 
                      onBanToggle={handleBanToggle} 
                      onUpdateBalance={handleUpdateBalance}
                      onViewDetails={setSelectedUser}
                    />
                  ))
            }
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailView user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {/* ── Tab Koin ──────────────────────────────────────────────── */}
      {tab === "coins" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6">
            <h3 className="font-bold text-amber-800 dark:text-amber-300 text-lg mb-2">Pemberian Koin Global</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400/80 mb-4">Berikan koin dalam jumlah tertentu ke SEMUA pengguna yang terdaftar.</p>
            <div className="flex gap-3 max-w-md">
              <input 
                type="number" 
                value={bulkCoinAmount} 
                onChange={e => setBulkCoinAmount(e.target.value)} 
                placeholder="Jumlah Koin" 
                className="flex-1 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-background focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Button onClick={handleGiveBulkCoins} className="bg-amber-600 hover:bg-amber-700 text-white">Give Coin All</Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground text-lg mb-2">Pemberian Koin Spesifik</h3>
            <p className="text-sm text-muted-foreground mb-4">Berikan koin hanya kepada satu pengguna pilihan.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <select 
                value={targetUserId} 
                onChange={e => setTargetUserId(e.target.value)}
                className="flex-[2] px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring bg-background text-sm"
              >
                <option value="">-- Pilih Pengguna --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <input 
                type="number" 
                value={singleCoinAmount} 
                onChange={e => setSingleCoinAmount(e.target.value)} 
                placeholder="Jumlah Koin" 
                className="flex-1 px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={handleGiveSingleCoin} className="flex-1">Berikan Koin</Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground text-lg mb-2">Manajemen Opsi Tukar Koin</h3>
            <p className="text-sm text-muted-foreground mb-4">Atur daftar hadiah atau diskon yang bisa didapatkan user dengan menukarkan koin mereka.</p>
            
            <div className="flex flex-col gap-3 max-w-3xl mb-6">
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  value={excCoins} 
                  onChange={e => setExcCoins(e.target.value)} 
                  placeholder="Harga Koin (cth: 5000)" 
                  className="w-1/4 px-3 py-2 text-sm rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input 
                  type="number" 
                  value={excValue} 
                  onChange={e => setExcValue(e.target.value)} 
                  placeholder="Nilai Diskon (Rp)" 
                  className="w-1/4 px-3 py-2 text-sm rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input 
                  type="text" 
                  value={excTitle} 
                  onChange={e => setExcTitle(e.target.value)} 
                  placeholder="Judul (cth: Potongan Rp5.000)" 
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button onClick={handleAddExchangeOption} size="sm">Tambah</Button>
              </div>
            </div>

            <div className="space-y-3">
              {exchangeOptions.map((opt) => (
                <div key={opt.id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-amber-700">{opt.coins.toLocaleString("id-ID")} Koin</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{opt.title}</span>
                      <span className="text-xs text-muted-foreground">Nilai: Rp{opt.value.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => deleteExchangeOption(opt.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {exchangeOptions.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">Belum ada opsi tukar koin.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab IP List ──────────────────────────────────────────────── */}
      {tab === "ip_list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Daftar IP Pengguna</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Pemantauan Alamat IP (Public & Local)</p>
            </div>
          </div>
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/40 border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Pengguna</th>
                    <th className="px-4 py-3 font-semibold">Peran</th>
                    <th className="px-4 py-3 font-semibold">IP Publik</th>
                    <th className="px-4 py-3 font-semibold">IP Lokal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`} alt="" className="w-6 h-6 rounded-md" />
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{u.publicIp || <span className="text-muted-foreground italic">Belum tercatat</span>}</td>
                      <td className="px-4 py-3 font-mono text-[10px]">{u.localIp || <span className="text-muted-foreground italic">Belum tercatat</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Tiket ──────────────────────────────────────────────── */}
      {tab === "tickets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Tiket Bantuan & Laporan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{tickets.length} tiket total</p>
            </div>
          </div>
          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed text-muted-foreground text-sm font-medium">Belum ada tiket.</div>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="bg-card border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{t.userName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.type === "order_problem" ? "bg-red-100 text-red-700" : t.type === "rank_up" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                          {t.type === "order_problem" ? "Masalah Pesanan" : t.type === "rank_up" ? "Pengajuan Pangkat" : "Lainnya"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "open" ? "bg-amber-100 text-amber-700" : t.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString("id-ID")}</p>
                    </div>
                    {t.status === "open" ? (
                      <div className="flex gap-2">
                        <Link href={`/ticket/${t.id}`}>
                          <Button size="sm" className="h-7 text-[11px]">Buka Tiket</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Link href={`/ticket/${t.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-[11px]">Lihat Detail</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  {t.orderId && <p className="text-xs font-semibold text-primary">Pesanan ID: {t.orderId}</p>}
                  <p className="text-sm line-clamp-2">{t.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{(t.messages || []).length} balasan</p>
                </div>
              ))}
            </div>
          )}
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

      {/* ── Tab Redeem ────────────────────────────────────────────────── */}
      {tab === "redeem" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Manajemen Redeem Code</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{redeemCodes.length} kode terdaftar</p>
            </div>
            <Button size="sm" onClick={() => setShowRedeemForm((v) => !v)} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              {showRedeemForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showRedeemForm ? "Tutup" : "Buat Kode"}
            </Button>
          </div>

          {showRedeemForm && (
            <div className="border rounded-2xl p-5 bg-card shadow-sm space-y-4">
              <h4 className="font-bold text-sm">Buat Kode Redeem Baru</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Kode (misal: WELCOME100) *</label>
                  <input value={rCode} onChange={(e) => setRCode(e.target.value.toUpperCase())}
                    placeholder="REWARD" maxLength={20}
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-wider uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tipe Hadiah</label>
                  <select value={rType} onChange={(e) => setRType(e.target.value as "coin" | "balance")}
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="coin">Koin</option>
                    <option value="balance">Saldo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Nilai Hadiah *</label>
                  <input value={rValue} onChange={(e) => setRValue(e.target.value)} type="number" min="1"
                    placeholder="1000"
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Batas Penggunaan (0=∞)</label>
                  <input value={rMaxUses} onChange={(e) => setRMaxUses(e.target.value)} type="number" min="0"
                    placeholder="1"
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <Button onClick={handleAddRedeemCode} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />Simpan Kode
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {redeemCodes.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
                <Gift className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">Belum ada kode redeem</p>
              </div>
            ) : redeemCodes.map((c) => (
              <div key={c.id} className={`border rounded-xl p-4 transition-all ${c.isActive ? "bg-card" : "bg-muted/20 opacity-60"}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-extrabold text-sm tracking-wider text-primary">{c.code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                        {c.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.type === 'coin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'}`}>
                        {c.type === 'coin' ? 'Koin' : 'Saldo'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-1">+{c.value.toLocaleString("id-ID")} {c.type === 'coin' ? 'Koin' : 'Saldo'}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span>Digunakan: {c.usedBy.length}{c.maxUses > 0 ? `/${c.maxUses}` : "x"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { toggleRedeemCode(c.id); toast({ title: `Kode ${c.code} ${c.isActive ? "dinonaktifkan" : "diaktifkan"}.` }); }}>
                      {c.isActive ? <ToggleRight className="h-9 w-9 text-green-500" /> : <ToggleLeft className="h-9 w-9 text-muted-foreground" />}
                    </button>
                    <button onClick={() => { deleteRedeemCode(c.id); toast({ title: `Kode ${c.code} dihapus.` }); }} className="p-1.5 text-red-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Live ───────────────────────────────────────────────────── */}
      {tab === "live" && (
        <div className="space-y-5">
          {/* Admin's own live session */}
          <div className="bg-card border rounded-[2rem] p-6 shadow-xl shadow-black/5 border-primary/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black tracking-tighter">Siaran Admin</h3>
                  {isMyLive && (
                    <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/20">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />ON AIR
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {isMyLive 
                    ? `Siaran kamu sedang berlangsung.` 
                    : "Mulai siaran sebagai admin untuk sesi belanja spesial."}
                </p>
              </div>
              <button
                onClick={() => { 
                  if (isMyLive) {
                    stopLive(user!.id);
                    toast({ title: "Live dihentikan." });
                  } else {
                    startLive(user!.id, user!.name);
                    toast({ title: "Live dimulai! 🔴" });
                  }
                }}
                className="flex-shrink-0 transition-transform active:scale-90"
              >
                {isMyLive
                  ? <ToggleRight className="h-14 w-14 text-red-500 drop-shadow-sm" />
                  : <ToggleLeft  className="h-14 w-14 text-muted-foreground opacity-30" />}
              </button>
            </div>

            {isMyLive && mySession && (
              <div className="mt-6 pt-6 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Judul Siaran</label>
                  <input
                    value={mySession.title}
                    onChange={(e) => updateSession(user!.id, { title: e.target.value })}
                    placeholder="Contoh: Flash Sale Admin!"
                    className="w-full px-4 py-3 text-sm border-2 border-muted rounded-2xl bg-background focus:outline-none focus:border-primary transition-colors font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nama Host</label>
                  <input
                    value={mySession.hostName}
                    onChange={(e) => updateSession(user!.id, { hostName: e.target.value })}
                    placeholder="Nama Admin"
                    className="w-full px-4 py-3 text-sm border-2 border-muted rounded-2xl bg-background focus:outline-none focus:border-primary transition-colors font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Active sessions list */}
          <div className="bg-card border rounded-[2rem] p-6 shadow-sm space-y-4">
            <h3 className="font-black tracking-tighter text-sm flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" /> Siaran Aktif ({activeSessions.length})
            </h3>
            
            {activeSessions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-muted rounded-[1.5rem]">
                <EyeOff className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Belum ada seller yang live</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((s) => (
                  <div key={s.sellerId} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50 transition-all hover:bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Radio className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-black truncate max-w-[200px]">{s.title}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Host: {s.hostName}</p>
                      </div>
                    </div>
                    {user?.id === "admin-001" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-black uppercase"
                        onClick={() => {
                          if (confirm(`Hentikan paksa siaran ${s.hostName}?`)) {
                            stopLive(s.sellerId);
                            toast({ title: "Siaran dihentikan paksa." });
                          }
                        }}
                      >
                        Hentikan
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Sultan ──────────────────────────────────────────────── */}
      {tab === "sultan" && (
        <SultanAdminTab />
      )}

      {/* ── Tab Voting ──────────────────────────────────────────────── */}
      {tab === "voting" && (
        <VotingAdminTab />
      )}

      {/* ── Tab Cosmetics ──────────────────────────────────────────────── */}
      {tab === "cosmetics" && (
        <div className="space-y-6">
          <div className="bg-card border-2 border-dashed border-indigo-200 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-500" /> BUAT KOSMETIK BARU
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as any;
              addCosmetic({
                name: form.cosmName.value,
                type: form.cosmType.value,
                value: form.cosmValue.value,
                price: Number(form.cosmPrice.value),
                rarity: form.cosmRarity.value
              });
              form.reset();
              toast({ title: "Kosmetik Berhasil Dibuat!" });
            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="cosmName" placeholder="Nama Kosmetik" className="bg-muted/50 border-none rounded-xl px-4 h-11 text-sm font-bold" required />
              <select name="cosmType" className="bg-muted/50 border-none rounded-xl px-4 h-11 text-sm font-bold">
                <option value="tag">Tag (Text)</option>
                <option value="visual">Visual (Image URL)</option>
              </select>
              <input name="cosmValue" placeholder="Value (#TAG atau URL Image)" className="bg-muted/50 border-none rounded-xl px-4 h-11 text-sm font-bold" required />
              <input name="cosmPrice" type="number" placeholder="Harga (MyDompet)" className="bg-muted/50 border-none rounded-xl px-4 h-11 text-sm font-bold" required />
              <select name="cosmRarity" className="bg-muted/50 border-none rounded-xl px-4 h-11 text-sm font-bold">
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
              <Button type="submit" className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px]">Simpan Kosmetik</Button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cosmetics.map(c => (
              <div key={c.id} className="bg-card border rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center font-black text-[10px] text-primary overflow-hidden">
                    {c.type === 'tag' ? c.value : <img src={c.value} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase">{c.rarity} · {formatPrice(c.price)}</p>
                  </div>
                </div>
                <button onClick={() => deleteCosmetic(c.id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
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
              <h3 className="font-bold">Pengaturan AI Analisis Produk (OpenRouter)</h3>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Masukkan API key OpenRouter untuk mengaktifkan AI produk checker.
            </p>
            <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
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
            
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${ai.isAIEnabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {ai.isAIEnabled
                ? `✓ AI aktif — menggunakan OpenRouter`
                : "AI tidak aktif — fitur analisis produk dinonaktifkan"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
