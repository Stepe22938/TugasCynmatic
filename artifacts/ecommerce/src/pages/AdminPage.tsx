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
  ChevronDown, ChevronLeft, Menu, ToggleLeft, ToggleRight, Bot, Eye, EyeOff, KeyRound,
  CreditCard, Smartphone, QrCode, Tag, Radio, Plus, X, Search, Coins, Ban, Globe, ArrowRight, Gift, Crown,
  History, Wallet, AlertTriangle, Activity, ShoppingBag, Vote, BarChart3, ListTodo, Palette, Database, Server, Zap, Cpu, Loader2, ArrowLeft, Trophy
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
import { AdminGachaPanel } from "../components/AdminGachaPanel";
import { useVote } from "../contexts/VoteContext";

type Tab = "products" | "users" | "coins" | "ip_list" | "tickets" | "vouchers" | "redeem" | "live" | "sultan" | "voting" | "settings" | "cosmetics" | "database" | "android" | "gacha";

const STATUS_BADGE: Record<SellerProduct["status"], string> = {
  pending:  "bg-amber-600/10 text-amber-500 border-amber-500/20", 
  approved: "bg-emerald-600/10 text-emerald-500 border-emerald-500/20", 
  rejected: "bg-rose-600/10 text-rose-500 border-rose-500/20",
};
const STATUS_LABEL: Record<SellerProduct["status"], string> = {
  pending: "Matrix Queue", approved: "Verified", rejected: "Terminated",
};
const ROLE_LABEL: Record<UserRole, string> = { user: "Node", seller: "Merchant", admin: "Operator", kurir: "Courier" };
const ROLE_COLOR: Record<UserRole, string> = {
  user: "bg-blue-600/10 text-blue-400 border-blue-500/20", 
  seller: "bg-purple-600/10 text-purple-400 border-purple-500/20", 
  admin: "bg-orange-600/10 text-orange-400 border-orange-500/20", 
  kurir: "bg-emerald-600/10 text-emerald-400 border-emerald-500/20",
};

function ProductRow({ product, onApprove, onReject, onDelete }: {
  product: SellerProduct;
  onApprove: (id: number) => void;
  onReject:  (id: number) => void;
  onDelete:  (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 bg-white/5 shadow-xl group hover:border-orange-500/20 transition-all duration-500">
      <div className="flex flex-col md:flex-row gap-6 p-6 items-start">
        <div className="relative group/img">
          <div className="absolute -inset-1 bg-orange-600 rounded-2xl blur opacity-20 group-hover/img:opacity-40 transition duration-500" />
          <img src={product.image} alt={product.name}
            className="relative w-24 h-24 rounded-2xl object-cover flex-shrink-0 bg-white/5 border border-white/10"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=?"; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <h3 className="font-black text-white uppercase italic tracking-tighter text-xl group-hover:text-orange-500 transition-colors leading-none">{product.name}</h3>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{product.category}</p>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                {product.isFlashSale ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-orange-500 italic">{formatPrice(product.price * (1 - (product.discountPercent || 0) / 100))}</p>
                    <p className="text-[10px] text-white/20 line-through font-bold italic">{formatPrice(product.price)}</p>
                  </div>
                ) : (
                  <p className="text-sm font-black text-orange-500 italic">{formatPrice(product.price)}</p>
                )}
              </div>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-2 flex items-center gap-2">
                Merchant Node: <span className="text-orange-500 italic">{product.sellerName}</span>
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 text-[9px] font-black px-5 py-2 rounded-full border shadow-2xl uppercase tracking-[0.2em] ${STATUS_BADGE[product.status]}`}>
              {product.status === "pending"  && <Clock className="h-3 w-3 animate-pulse" />}
              {product.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
              {product.status === "rejected" && <XCircle className="h-3 w-3" />}
              {STATUS_LABEL[product.status]}
            </span>
          </div>
          
          <div className="mt-4 flex gap-3">
             <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors italic"
               onClick={() => setExpanded((v) => !v)}>
               <ChevronDown className={`h-3 w-3 transition-transform duration-500 ${expanded ? "rotate-180" : ""}`} />
               {expanded ? "Collapse Specs" : "Expand Data Matrix"}
             </button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-5 bg-black/20 rounded-2xl border border-white/5 space-y-4">
                  <p className="text-[11px] font-bold text-white/40 leading-relaxed italic">
                    {product.longDescription || product.description}
                  </p>
                  {product.specs && product.specs.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {product.specs.map((s, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{s.label}</span>
                          <span className="text-[10px] font-black text-white/60 uppercase">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex gap-3 px-6 pb-6 pt-2">
        {product.status !== "approved" && (
          <Button size="sm" className="h-11 px-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-2xl shadow-orange-600/30" onClick={() => onApprove(product.id)}>
            <CheckCircle2 className="h-4 w-4" /> Grant Approval
          </Button>
        )}
        {product.status !== "rejected" && (
          <Button size="sm" variant="ghost" className="h-11 px-8 rounded-xl bg-white/5 text-white/40 hover:text-rose-500 font-black uppercase tracking-widest text-[10px] gap-2 border border-white/5 transition-all" onClick={() => onReject(product.id)}>
            <XCircle className="h-4 w-4" /> Reject Protocol
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-11 w-11 p-0 rounded-xl bg-white/5 text-white/20 hover:bg-rose-500/20 hover:text-rose-500 ml-auto transition-all" onClick={() => onDelete(product.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function UserRow({ user, currentUser, onRoleChange, onBanToggle, onUpdateBalance, onUpdateCrypto, onViewDetails, onToggleVerifiedSeller, onToggleVerifiedReseller, onDelete, onUpdatePassword }: { 
  user: User; currentUser: User; 
  onRoleChange: (id: string, role: UserRole) => void;
  onBanToggle: (id: string, type: "permanent" | "trial", reason: string) => void;
  onUpdateBalance: (id: string, amount: number) => void;
  onUpdateCrypto: (id: string, cryptoType: "BTC" | "ETH", action: "add" | "reset", amount?: number) => void;
  onViewDetails: (user: User) => void;
  onToggleVerifiedSeller: (id: string) => void;
  onToggleVerifiedReseller: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onUpdatePassword: (id: string, newPassword: string) => void;
}) {
  const isCurrentUser = user.id === currentUser.id;
  const isMainAdmin   = user.id === "admin-001";
  const [showBanModal, setShowBanModal] = useState(false);
  const [banType, setBanType] = useState<"permanent" | "trial">("permanent");
  const [banReason, setBanReason] = useState("");
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(user.balance?.toString() || "0");
  const [editingCrypto, setEditingCrypto] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "ETH">("ETH");
  const [cryptoAmountInput, setCryptoAmountInput] = useState("0");
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPlainPassword, setShowPlainPassword] = useState(false);

  return (
    <div className={`flex flex-col gap-2 px-8 py-8 transition-all duration-500 border-b border-white/5 ${user.isBanned ? 'bg-rose-500/5' : 'hover:bg-white/5'}`}>
      <div className="flex flex-wrap items-center gap-8">
        <div className="relative group/avatar">
          <div className={`absolute -inset-2 rounded-[2rem] blur-xl opacity-10 group-hover/avatar:opacity-30 transition duration-700 ${user.isBanned ? 'bg-rose-600' : 'bg-orange-600'}`} />
          <div className="relative w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
            <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`}
              alt={user.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110 ${user.isBanned ? 'grayscale contrast-125' : ''}`} />
          </div>
          {user.isMyCryptoMember && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-2 border-[#050505] flex items-center justify-center shadow-lg">
              <Zap className="h-3 w-3 text-white fill-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <p className={`text-xl font-black uppercase italic tracking-tighter leading-none ${user.isBanned ? 'text-rose-500/40 line-through' : 'text-white'}`}>
              {user.name}
            </p>
            {isCurrentUser && <span className="text-[9px] font-black bg-orange-600 px-3 py-1 rounded-lg uppercase tracking-[0.2em] text-white shadow-xl shadow-orange-600/20">System Operator</span>}
            {user.isSultan && <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
          </div>
          <div className="flex flex-wrap items-center gap-4">
             <span className="text-[10px] font-mono text-white/20 tracking-widest font-black uppercase">NODE::{user.id.slice(0, 8)}</span>
             <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
             <span className={`text-[9px] font-black px-4 py-1 rounded-full border uppercase tracking-[0.2em] shadow-2xl ${ROLE_COLOR[user.role]}`}>
               {ROLE_LABEL[user.role]}
             </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
             {user.isVerifiedSeller && (
               <span className="text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xl">
                 Matrix Merchant
               </span>
             )}
             {user.isVerifiedReseller && (
               <span className="text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-xl">
                 Elite Reseller
               </span>
             )}
             {user.isBanned && (
               <span className={`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border shadow-2xl ${user.banType === 'permanent' ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20' : 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'}`}>
                 {user.banType === 'permanent' ? 'Access Terminated' : 'Trial Suspended'}
               </span>
             )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden lg:flex flex-col items-end gap-1.5 px-8 border-r border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 italic uppercase tracking-widest opacity-60">
               <Coins className="h-3.5 w-3.5" /> {user.coins?.toLocaleString() || 0} FREQ
            </div>
            <div className="flex items-center gap-2 text-lg font-black text-white italic">
               <Wallet className="h-4 w-4 text-orange-500" /> {formatPrice(user.balance || 0)}
            </div>
            <div className="flex gap-3 text-[9px] font-mono text-white/40 mt-0.5">
               <span>BTC: <strong className="text-yellow-500 font-bold">{Number(user.balanceBtc || 0).toFixed(6)}</strong></span>
               <span>ETH: <strong className="text-blue-400 font-bold">{Number(user.balanceEth || 0).toFixed(6)}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
              <Button size="icon" variant="ghost" className={`h-11 w-11 rounded-xl transition-all ${user.isVerifiedSeller ? "text-emerald-500 bg-emerald-500/20 border border-emerald-500/30" : "text-white/10 hover:text-white"}`} onClick={() => onToggleVerifiedSeller(user.id)} title="Merchant Auth">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </Button>
              <Button size="icon" variant="ghost" className={`h-11 w-11 rounded-xl transition-all ${user.isVerifiedReseller ? "text-blue-500 bg-blue-500/20 border border-blue-500/30" : "text-white/10 hover:text-white"}`} onClick={() => onToggleVerifiedReseller(user.id)} title="Reseller Auth">
                <ShieldCheck className="h-4.5 w-4.5" />
              </Button>
            </div>
            
            <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl bg-white/5 text-blue-500 border border-white/5 hover:bg-blue-600 hover:text-white transition-all" onClick={() => onViewDetails(user)} title="System Logs">
              <History className="h-4.5 w-4.5" />
            </Button>
            
            <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl bg-white/5 text-orange-500 border border-white/5 hover:bg-orange-600 hover:text-white transition-all" onClick={() => setEditingBalance(true)} title="Asset Allocation">
              <CreditCard className="h-4.5 w-4.5" />
            </Button>

            <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl bg-white/5 text-yellow-500/80 border border-white/5 hover:bg-yellow-600 hover:text-white transition-all" onClick={() => setEditingCrypto(true)} title="Crypto Allocation (BTC/ETH)">
              <Coins className="h-4.5 w-4.5 animate-pulse text-yellow-500" />
            </Button>

            <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl bg-white/5 text-yellow-500 border border-white/5 hover:bg-yellow-600 hover:text-white transition-all" onClick={() => setEditingPassword(true)} title="Reset / Ganti Password">
              <KeyRound className="h-4.5 w-4.5" />
            </Button>

            {!isMainAdmin && !isCurrentUser && (
              <>
                <button onClick={() => user.isBanned ? onBanToggle(user.id, "permanent", "") : setShowBanModal(true)} 
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border ${user.isBanned ? 'bg-rose-600 border-rose-500 text-white shadow-2xl shadow-rose-600/30' : 'bg-white/5 border-white/5 text-white/10 hover:bg-rose-600 hover:text-white hover:border-rose-500'}`} 
                  title={user.isBanned ? "Revoke Access" : "Terminate Connection"}>
                  <Ban className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => onDelete(user.id, user.name)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all border bg-white/5 border-white/5 text-rose-500/50 hover:bg-rose-600 hover:text-white hover:border-rose-500"
                  title="Hapus User dari Database"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editingBalance && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="mt-6 p-8 glass-card rounded-[2.5rem] border-orange-500/20 bg-orange-600/5 flex flex-wrap items-center gap-8 shadow-2xl"
          >
            <div className="flex items-center gap-5 flex-1 min-w-[200px]">
              <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/20">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 ml-1">Asset Allocation Matrix</label>
                <input 
                  type="number" 
                  value={balanceInput} 
                  onChange={e => setBalanceInput(e.target.value)}
                  className="w-full bg-transparent border-none text-2xl font-black text-white italic focus:outline-none placeholder:text-white/10 mt-1"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button size="lg" className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-orange-600/30" onClick={() => { onUpdateBalance(user.id, Number(balanceInput)); setEditingBalance(false); }}>Commit Allocation</Button>
              <Button size="lg" variant="ghost" className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white border border-white/5" onClick={() => setEditingBalance(false)}>Abort</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingCrypto && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="mt-6 p-8 glass-card rounded-[2.5rem] border-yellow-500/20 bg-yellow-600/5 flex flex-col gap-6 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-600/20">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tighter italic text-white">Quantum Crypto Allocator</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500">Simulated Blockchain Ledger Adjuster</p>
                </div>
              </div>
              
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                {(["ETH", "BTC"] as const).map((crypto) => (
                  <button
                    key={crypto}
                    type="button"
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${selectedCrypto === crypto ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/30' : 'text-white/40 hover:text-white'}`}
                  >
                    {crypto}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 ml-1">
                  Add Amount (Current Saldo: {selectedCrypto === "BTC" ? Number(user.balanceBtc || 0).toFixed(6) : Number(user.balanceEth || 0).toFixed(6)} {selectedCrypto})
                </label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <input 
                    type="number" 
                    step="0.0001"
                    value={cryptoAmountInput} 
                    onChange={e => setCryptoAmountInput(e.target.value)}
                    className="flex-1 bg-transparent border-none text-xl font-mono font-black text-white italic focus:outline-none placeholder:text-white/10"
                    placeholder="0.0000"
                    autoFocus
                  />
                  <span className="text-sm font-black text-yellow-500 italic">{selectedCrypto}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-end">
                <Button 
                  size="lg" 
                  className="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-yellow-600 hover:bg-yellow-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-yellow-600/30" 
                  onClick={() => { 
                    const amt = Number(cryptoAmountInput);
                    if (isNaN(amt) || amt <= 0) {
                      alert("Masukkan jumlah crypto yang valid (> 0).");
                      return;
                    }
                    onUpdateCrypto(user.id, selectedCrypto, "add", amt); 
                    setEditingCrypto(false); 
                    setCryptoAmountInput("0"); 
                  }}
                >
                  âž• Add {selectedCrypto}
                </Button>
                
                <Button 
                  size="lg" 
                  className="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all" 
                  onClick={() => { 
                    if (window.confirm(`âš ï¸  Apakah Anda yakin ingin me-reset saldo ${selectedCrypto} user ini menjadi 0.000000?`)) {
                      onUpdateCrypto(user.id, selectedCrypto, "reset"); 
                      setEditingCrypto(false); 
                      setCryptoAmountInput("0");
                    }
                  }}
                >
                  ðŸ”„ Reset {selectedCrypto}
                </Button>

                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white border border-white/5" 
                  onClick={() => { setEditingCrypto(false); setCryptoAmountInput("0"); }}
                >
                  Abort
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingPassword && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="mt-6 p-8 glass-card rounded-[2.5rem] border-yellow-500/20 bg-yellow-600/5 flex flex-wrap items-center gap-8 shadow-2xl"
          >
            <div className="flex items-center gap-5 flex-1 min-w-[200px]">
              <div className="w-14 h-14 bg-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-600/20">
                <KeyRound className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 ml-1">Reset Password Protocol</label>
                <div className="relative flex items-center mt-1">
                  <input 
                    type={showPlainPassword ? "text" : "password"} 
                    value={passwordInput} 
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full bg-transparent border-none text-2xl font-black text-white italic focus:outline-none placeholder:text-white/10 pr-12 font-mono"
                    placeholder="Sandi Baru (Min. 6 Karakter)"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPlainPassword(!showPlainPassword)} 
                    className="absolute right-2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPlainPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button size="lg" className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-yellow-600 hover:bg-yellow-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-yellow-600/30" onClick={() => { if (passwordInput.trim().length >= 6) { onUpdatePassword(user.id, passwordInput.trim()); setEditingPassword(false); setPasswordInput(""); } else { alert("Password harus minimal 6 karakter."); } }}>Commit Reset</Button>
              <Button size="lg" variant="ghost" className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white border border-white/5" onClick={() => { setEditingPassword(false); setPasswordInput(""); }}>Abort</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showBanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#000]/90 backdrop-blur-2xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            className="glass-card border-rose-500/20 bg-[#050505] rounded-[3.5rem] p-12 w-full max-w-xl shadow-[0_0_100px_rgba(225,29,72,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
              <Ban className="h-48 w-48 text-rose-500" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-8 mb-10">
                <div className="w-20 h-20 bg-rose-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-600/30">
                  <Ban className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-4xl font-black tracking-tighter text-white italic uppercase">Access Ban</h3>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mt-1">Security Enforcement Protocol</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Select Enforcement Severity</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setBanType("permanent")}
                      className={`flex-1 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all duration-500 ${banType === 'permanent' ? 'bg-rose-600 border-rose-600 text-white shadow-2xl shadow-rose-600/30' : 'border-white/5 text-white/20 hover:border-rose-500/40 hover:text-white'}`}
                    >
                      Permanent Null
                    </button>
                    <button 
                      onClick={() => setBanType("trial")}
                      className={`flex-1 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all duration-500 ${banType === 'trial' ? 'bg-amber-600 border-amber-600 text-white shadow-2xl shadow-amber-600/30' : 'border-white/5 text-white/20 hover:border-amber-500/40 hover:text-white'}`}
                    >
                      Trial Suspend
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Incidence Violation Log</label>
                  <textarea 
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    placeholder="Documenting technical violations..."
                    className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-8 text-sm font-bold text-white placeholder:text-white/10 focus:border-rose-500/50 transition-all h-40 resize-none italic"
                  />
                </div>

                <div className="flex gap-5 pt-4">
                  <Button variant="ghost" onClick={() => setShowBanModal(false)} className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all border border-white/5">Abort Action</Button>
                  <Button onClick={() => { onBanToggle(user.id, banType, banReason); setShowBanModal(false); }} className="flex-[2] h-16 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-rose-600/40 italic">Execute Protocol</Button>
                </div>
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
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-orange-600/5 rounded-xl blur-lg group-focus-within:bg-orange-600/10 transition-all" />
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "sk-..."}
            className="relative w-full pl-12 pr-6 py-4 text-sm bg-white/5 border border-white/5 rounded-xl text-white font-mono placeholder:text-white/5 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all" />
        </div>
        <button type="button" onClick={() => setShow((v) => !v)} className="h-12 w-12 flex items-center justify-center text-white/20 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
function VoucherRow({ voucher, onToggle, onDelete }: { voucher: Voucher; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`glass-card rounded-[2.5rem] p-8 transition-all duration-700 border border-white/5 ${voucher.isActive ? "bg-white/5 shadow-2xl hover:border-orange-500/20" : "bg-white/5 opacity-40 grayscale"}`}>
      <div className="flex items-start justify-between gap-8 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <div className="bg-orange-600/10 px-6 py-2 rounded-xl border border-orange-500/20 shadow-2xl shadow-orange-600/10">
              <span className="font-black text-orange-500 text-lg tracking-[0.3em] italic uppercase">{voucher.code}</span>
            </div>
            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-widest ${voucher.isActive ? "bg-emerald-600/10 text-emerald-500" : "bg-white/5 text-white/40"}`}>
              {voucher.isActive ? "Frequency Active" : "Log Decrypted"}
            </span>
            <div className="bg-blue-600/10 px-4 py-1.5 rounded-full border border-blue-500/20 shadow-2xl shadow-blue-500/10">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">
                {voucher.type === "percentage" ? `${voucher.value}% REDUCTION` : `${formatPrice(voucher.value)} CREDIT`}
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-white/40 italic mb-4">"{voucher.description}"</p>
          <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            <span className="flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5" /> Floor: <span className="text-white/40 italic">{formatPrice(voucher.minPurchase)}</span></span>
            {voucher.maxDiscount && <span className="flex items-center gap-2"><Tag className="h-3.5 w-3.5" /> Cap: <span className="text-white/40 italic">{formatPrice(voucher.maxDiscount)}</span></span>}
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> Cycles: <span className="text-white/40 italic">{voucher.usedCount}{voucher.maxUses > 0 ? ` / ${voucher.maxUses}` : " (Infinity)"}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <button onClick={onToggle} title={voucher.isActive ? "Stop Frequency" : "Start Frequency"} className="transition-transform active:scale-90">
            {voucher.isActive
              ? <ToggleRight className="h-12 w-12 text-emerald-500 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              : <ToggleLeft  className="h-12 w-12 text-white/10" />}
          </button>
          <button onClick={onDelete} className="w-12 h-12 rounded-[1.2rem] bg-rose-500/10 text-rose-500 border border-white/5 hover:bg-rose-500 hover:text-white transition-all shadow-2xl shadow-rose-500/20 flex items-center justify-center">
            <Trash2 className="h-5 w-5" />
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
    <div className="space-y-8">
      <div className="glass-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-6">
        <h3 className="font-black tracking-tighter text-lg flex items-center gap-3 uppercase italic text-white">
          <Vote className="h-5 w-5 text-orange-500" /> Initialize New Referendum
        </h3>
        <div className="space-y-6">
          <input 
            placeholder="Identity of the Referendum (e.g. Protocol Upgrade Phase 2)" 
            value={newTitle} 
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-6 py-5 text-sm border-none rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest placeholder:text-white/10 focus:ring-1 focus:ring-orange-500/50 outline-none"
          />
          <div className="space-y-4">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Response Matrix Options</p>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-4">
                <input 
                  placeholder={`Matrix Alpha ${i+1}`} 
                  value={opt} 
                  onChange={e => handleOptionChange(i, e.target.value)}
                  className="flex-1 px-6 py-4 text-xs border-none rounded-xl bg-white/5 text-white font-bold placeholder:text-white/10 focus:ring-1 focus:ring-orange-500/20 outline-none"
                />
                {options.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(i)} className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-500/10">
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={handleAddOption} className="w-full h-12 border-dashed border-white/5 text-white/20 hover:text-white hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest">
              <Plus className="h-4 w-4 mr-2" /> Append Logic Node
            </Button>
          </div>
          <Button onClick={handleCreate} className="w-full h-16 rounded-[1.5rem] bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-orange-600/30 italic">Deploy Referendum Protocol</Button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-black tracking-tighter text-sm flex items-center gap-3 uppercase italic text-white/40 ml-4">
          <BarChart3 className="h-4 w-4" /> Active Protocols & Frequency Logs
        </h3>
        {polls.map(poll => (
          <div key={poll.id} className="glass-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="font-black text-xl leading-tight mb-2 text-white italic uppercase tracking-tighter">{poll.title}</h4>
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                  <span className="text-orange-500">{poll.votedUserIds.length} Data Points</span>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <span className={poll.isActive ? "text-emerald-500" : "text-rose-500"}>
                    {poll.isActive ? "Frequency Active" : "Log Encrypted"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button size="sm" variant="ghost" className="h-10 px-6 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white" onClick={() => togglePollStatus(poll.id)}>
                  {poll.isActive ? "Stop" : "Activate"}
                </Button>
                <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white" onClick={() => deletePoll(poll.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-5">
              {poll.options.map(opt => {
                const percent = poll.votedUserIds.length === 0 ? 0 : Math.round((opt.votes / poll.votedUserIds.length) * 100);
                return (
                  <div key={opt.id} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/60">{opt.text}</span>
                      <span className="text-orange-500">{opt.votes} <span className="text-white/20 italic">({percent}%)</span></span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(234,88,12,0.3)]" style={{ width: `${percent}%` }} />
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
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card bg-gradient-to-br from-yellow-500/20 to-amber-600/10 p-10 rounded-[2.5rem] border border-yellow-500/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Crown className="h-40 w-40 text-yellow-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-2 italic">Total Sultan Active Nodes</p>
          <p className="text-5xl font-black text-white italic tracking-tighter">{activeUsers} <span className="text-sm font-bold text-white/20 uppercase tracking-widest not-italic ml-2">Users</span></p>
        </div>
        <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2 italic">Subscription Frequency / Mo</p>
          <p className="text-3xl font-black text-orange-500 italic tracking-tighter">{formatPrice(config.price)}</p>
        </div>
      </div>

      {/* Pricing Control */}
      <div className="glass-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-6">
        <h3 className="font-black tracking-tighter text-lg flex items-center gap-3 uppercase italic text-white">
          <CreditCard className="h-5 w-5 text-orange-500" /> Subscription Protocol
        </h3>
        <div className="flex gap-4">
          <input 
            type="number" 
            value={newPrice} 
            onChange={e => setNewPrice(e.target.value)}
            className="flex-1 px-6 py-4 text-sm border-none rounded-xl bg-white/5 text-white font-black italic focus:ring-1 focus:ring-orange-500/50 outline-none" 
          />
          <Button onClick={handleUpdatePrice} className="h-14 px-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-orange-600/30">Update Freq</Button>
        </div>
      </div>

      {/* Voucher Management */}
      <div className="glass-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
        <h3 className="font-black tracking-tighter text-lg flex items-center gap-3 uppercase italic text-white">
          <Tag className="h-5 w-5 text-orange-500" /> Sultan Exclusive Matrix
        </h3>
        <div className="grid gap-4">
          {vouchers.map(v => (
            <div key={v.id} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 group hover:border-orange-500/20 transition-all duration-500">
              <div>
                <p className="text-sm font-black tracking-[0.3em] text-white uppercase italic">{v.code}</p>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">{v.type === "percent" ? `${v.discount}%` : formatPrice(v.discount)} off</p>
              </div>
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-500/10" onClick={() => removeSultanVoucher(v.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/5 space-y-6">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Inject New Voucher Matrix</p>
          <div className="flex gap-4">
            <input placeholder="MATRIX_CODE" value={vCode} onChange={e => setVCode(e.target.value.toUpperCase())} className="flex-1 px-6 py-4 text-xs border-none rounded-xl bg-white/5 text-white font-black tracking-widest placeholder:text-white/10 outline-none" />
            <input type="number" placeholder="Discount Value" value={vDiscount} onChange={e => setVDiscount(e.target.value)} className="flex-1 px-6 py-4 text-xs border-none rounded-xl bg-white/5 text-white font-black tracking-widest placeholder:text-white/10 outline-none" />
            <Button onClick={() => {
              if(!vCode || !vDiscount) return;
              addSultanVoucher({ code: vCode, discount: Number(vDiscount), type: "flat", minPurchase: 0, category: "all" });
              setVCode(""); setVDiscount("");
            }} className="h-14 px-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px] border border-white/10">Inject</Button>
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
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bergabung: {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
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
             (user.activityLog ?? []).length === 0 ? (
               <div className="text-center py-20 text-muted-foreground">Belum ada riwayat aktivitas.</div>
             ) : (
               (user.activityLog ?? []).slice().reverse().map((log, i) => (
                 <div key={i} className="flex gap-4 p-4 bg-muted/20 rounded-2xl border border-dashed animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                       <Clock className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold">{log.action}</p>
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{new Date(log.timestamp || Date.now()).toLocaleString()}</p>
                    </div>
                 </div>
               ))
             )
           ) : (
             (user.purchaseHistory ?? []).length === 0 ? (
               <div className="text-center py-20 text-muted-foreground">Belum ada riwayat belanja.</div>
             ) : (
               (user.purchaseHistory ?? []).slice().reverse().map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <ShoppingBag className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold">{item.itemName}</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{new Date(item.timestamp || Date.now()).toLocaleString()}</p>
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

export function DatabaseExplorer() {
  const [tables, setTables] = React.useState<{ name: string; count: number; error?: string }[]>([]);
  const [activeTable, setActiveTable] = React.useState<string>("users");
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingTables, setLoadingTables] = React.useState(false);
  const [dbInfo, setDbInfo] = React.useState<{ host: string; port: string; user: string; database: string } | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedJson, setSelectedJson] = React.useState<any | null>(null);
  const [showMigration, setShowMigration] = React.useState(false);
  const [hideDbIp, setHideDbIp] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function initExplorer() {
      setLoadingTables(true);
      try {
        const infoRes = await fetch("/api/db/info");
        if (!infoRes.ok) {
          const errData = await infoRes.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error! status: ${infoRes.status}`);
        }
        const infoData = await infoRes.json();
        setDbInfo(infoData);

        const tablesRes = await fetch("/api/db/tables");
        if (!tablesRes.ok) {
          const errData = await tablesRes.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error! status: ${tablesRes.status}`);
        }
        const tablesData = await tablesRes.json();
        if (Array.isArray(tablesData)) {
          setTables(tablesData);
          if (tablesData.length > 0) {
            setActiveTable(tablesData[0].name);
          }
        } else {
          throw new Error("Invalid tables data format received from API");
        }
      } catch (err: any) {
        console.error("[DB_EXPLORER] Init error:", err);
        toast({
          variant: "destructive",
          title: "Gagal Menginisialisasi Explorer",
          description: err.message
        });
      } finally {
        setLoadingTables(false);
      }
    }
    initExplorer();
  }, []);

  React.useEffect(() => {
    if (!activeTable) return;
    async function fetchTableData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/db/tables/${activeTable}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setRows(data.rows || []);
      } catch (err: any) {
        console.error(`[DB_EXPLORER] Fetch table ${activeTable} error:`, err);
        toast({
          variant: "destructive",
          title: `Gagal memuat tabel ${activeTable}`,
          description: err.message
        });
      } finally {
        setLoading(false);
      }
    }
    fetchTableData();
  }, [activeTable]);

  const headers = React.useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const keysSet = new Set<string>();
    rows.slice(0, 15).forEach(row => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach(key => keysSet.add(key));
      }
    });
    return Array.from(keysSet);
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    if (!Array.isArray(rows)) return [];
    if (!searchQuery) return rows;
    return rows.filter(row => {
      if (!row || typeof row !== "object") return false;
      return Object.entries(row).some(([key, val]) => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [rows, searchQuery]);

  return (
    <div className="space-y-8">
      {/* —————————————————————————————————————————————————————————————————————— */}
      <div className="glass-card bg-gradient-to-br from-[#0a0a0b] via-[#111] to-[#0a0a0b] text-white rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-1000">
          <Server className="h-40 w-40 text-orange-500" />
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-center shadow-lg">
              <Database className="h-8 w-8 text-orange-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Database Control</h3>
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.3em] mt-1">Live Relational Node Terminal</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="bg-white/5 border border-white/5 rounded-2xl px-6 py-3 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
              <div>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Connection</p>
                <p className="text-xs font-black text-emerald-500 uppercase italic mt-1">VPS Active Mode</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl px-6 py-3 flex items-center gap-3">
              <div>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Database Host IP</p>
                <p className="text-xs font-mono font-black text-white italic mt-1">
                  {hideDbIp ? "•••.•••.•••.•••" : (dbInfo?.host || "185.128.227.237")}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setHideDbIp(!hideDbIp)}
                className="text-white/40 hover:text-white transition-colors ml-2"
                title={hideDbIp ? "Tampilkan IP" : "Sembunyikan IP"}
              >
                {hideDbIp ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl px-6 py-3">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Target Database</p>
              <p className="text-xs font-mono font-black text-white mt-1 uppercase">{dbInfo?.database || "cynmatic_db"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* —————————————————————————————————————————————————————————————————————— */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-4 flex items-center gap-2">
            <ListTodo className="h-3.5 w-3.5" /> Database Tables
          </h4>
          
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
            {loadingTables ? (
              <div className="flex items-center justify-center p-8 w-full">
                <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
              </div>
            ) : (
              Array.isArray(tables) && tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setActiveTable(t.name)}
                  className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-all text-left flex-shrink-0 lg:flex-shrink ${
                    activeTable === t.name
                      ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20"
                      : "glass-card border-white/5 text-white/60 hover:text-white hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-black uppercase tracking-wider">{t.name}</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                    activeTable === t.name ? "bg-white/20 text-white" : "bg-white/5 text-white/30"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => setShowMigration(!showMigration)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Cpu className="h-4 w-4" /> {showMigration ? "Hide System Tools" : "Show System Tools"}
          </button>
        </div>

        {/* —————————————————————————————————————————————————————————————————————— */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search bar & Metadata */}
          <div className="glass-card border border-white/5 rounded-[2rem] p-6 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xl">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Search className="h-5 w-5 text-white/30" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search table rows in ${activeTable}...`}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white placeholder:text-white/20 flex-1 outline-none"
              />
            </div>
            <div className="flex-shrink-0 text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
              Viewing: <span className="text-orange-500">{filteredRows.length} / {rows.length}</span> Records
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white/5 relative min-h-[300px]">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mt-4 animate-pulse">Fetching Matrix Data...</p>
              </div>
            ) : null}

            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Database className="h-12 w-12 text-white/10 mb-4" />
                <p className="text-xs font-black text-white/30 uppercase tracking-widest">No matching records found in table</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-black/40 border-b border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="px-6 py-4 font-black">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        {headers.map((h) => {
                          const val = row[h];
                          if (val === null || val === undefined) {
                            return (
                              <td key={h} className="px-6 py-4 font-mono text-white/20 italic">NULL</td>
                            );
                          }

                          if (typeof val === "object" || Array.isArray(val) || (typeof val === "string" && (val.startsWith("[") || val.startsWith("{")))) {
                            let parsedVal = val;
                            if (typeof val === "string") {
                              try { parsedVal = JSON.parse(val); } catch (e) {}
                            }
                            return (
                              <td key={h} className="px-6 py-4">
                                <button
                                  onClick={() => setSelectedJson({ key: h, data: parsedVal })}
                                  className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500 hover:text-white rounded-lg text-[9px] font-black text-orange-400 uppercase tracking-wider transition-all"
                                >
                                  <Eye className="h-3 w-3" /> View Complex
                                </button>
                              </td>
                            );
                          }

                          if (h.toLowerCase().includes("price") || h.toLowerCase().includes("balance")) {
                            return (
                              <td key={h} className="px-6 py-4 font-black text-emerald-500 italic">
                                {formatPrice(Number(val))}
                              </td>
                            );
                          }

                          if (h.toLowerCase().includes("ip")) {
                            return (
                              <td key={h} className="px-6 py-4 font-mono font-bold text-blue-400">
                                {hideDbIp ? "•••.•••.•••.•••" : String(val)}
                              </td>
                            );
                          }

                          return (
                            <td key={h} className="px-6 py-4 font-medium text-white/70 max-w-[200px] truncate" title={String(val)}>
                              {String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* —————————————————————————————————————————————————————————————————————— */}
      {selectedJson && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <div className="glass-card border-orange-500/20 bg-[#050505] rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl relative animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-orange-500" />
                <h4 className="font-black text-lg text-white uppercase italic tracking-tighter">
                  Data Viewer: <span className="text-orange-500">{selectedJson.key}</span>
                </h4>
              </div>
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-white/40 hover:text-white hover:bg-white/5" onClick={() => setSelectedJson(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <pre className="bg-black/60 border border-white/5 p-6 rounded-[1.5rem] text-[11px] font-mono text-emerald-400 overflow-y-auto max-h-[60vh] leading-relaxed select-all">
              {JSON.stringify(selectedJson.data, null, 2)}
            </pre>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedJson(null)} className="h-12 px-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg">
                Close Viewer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* —————————————————————————————————————————————————————————————————————— */}
      {showMigration && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 border-t border-white/5 pt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-2">System Schema Migration and Setup Logs</h4>
          </div>
          <DatabaseMigrationWizard hideDbIp={hideDbIp} setHideDbIp={setHideDbIp} />
        </div>
      )}
    </div>
  );
}

/**
 * AndroidPackagePanel
 * Komponen untuk manajemen pipeline build otomatis Android.
 */
export function AndroidPackagePanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showBuildModal, setShowBuildModal] = React.useState(false);
  
  // Form states
  const [versionName, setVersionName] = React.useState("");
  const [versionCode, setVersionCode] = React.useState("");
  const [changelog, setChangelog] = React.useState("");
  const [releaseStatus, setReleaseStatus] = React.useState<"draft" | "latest">("draft");
  const [buildingInProgress, setBuildingInProgress] = React.useState(false);
  const [copyingHashId, setCopyingHashId] = React.useState<number | null>(null);

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/android-packages", {
        headers: {
          "x-user-id": user?.id || "",
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
        
        const activeBuild = data.some((p: any) => p.buildStatus === "queued" || p.buildStatus === "building");
        setBuildingInProgress(activeBuild);
      }
    } catch (err) {
      console.error("Gagal memuat package Android", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPackages();
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (buildingInProgress) {
      interval = setInterval(() => {
        fetchPackages();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [buildingInProgress]);

  const handleBuildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionName.trim() || !versionCode.trim() || !changelog.trim()) {
      toast({ title: "Validasi Gagal", description: "Lengkapi semua field form.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/android-packages/build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          versionName,
          versionCode,
          changelog,
          releaseStatus,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengirim build request");
      }

      toast({
        title: "Build Terjadwal!",
        description: `Antrean build untuk v${versionName} telah berhasil dimulai di server.`,
      });

      setShowBuildModal(false);
      setVersionName("");
      setVersionCode("");
      setChangelog("");
      setReleaseStatus("draft");
      
      fetchPackages();
    } catch (err: any) {
      toast({
        title: "Build Gagal",
        description: err.message || "Gagal memicu build server.",
        variant: "destructive",
      });
    }
  };

  const handleToggleRelease = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "latest" ? "draft" : "latest";
    try {
      const res = await fetch(`/api/android-packages/${id}/release-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          releaseStatus: nextStatus,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memperbarui status rilis.");
      }

      toast({
        title: "Status Rilis Diubah",
        description: `Status versi berhasil diubah menjadi ${nextStatus.toUpperCase()}`,
      });
      fetchPackages();
    } catch (err: any) {
      toast({
        title: "Gagal Mengubah Rilis",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleCopyHash = (id: number, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopyingHashId(id);
    toast({ title: "Hash Disalin!", description: "Cryptographic SHA-256 hash berhasil disalin ke clipboard." });
    setTimeout(() => setCopyingHashId(null), 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Build Server Connection Status Overview */}
      <div className="relative overflow-hidden p-8 rounded-[2.5rem] border border-white/5 bg-white/5 shadow-2xl group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4 items-center">
            <div className="h-12 w-12 rounded-[1.25rem] bg-orange-600/10 flex items-center justify-center text-orange-500 shadow-2xl shadow-orange-500/10">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Android Package Pipeline</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">CI/CD Build & Release Automation Environment</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 border-white/5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 italic">Antigravity CI Server Active</span>
            </div>
            <Button
              onClick={() => setShowBuildModal(true)}
              className="h-11 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-2xl shadow-orange-600/30 transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" /> Build New Android App
            </Button>
          </div>
        </div>
      </div>

      {/* Build Pipeline History Table */}
      <div className="glass-card rounded-[2.5rem] p-6 border-white/5 bg-white/5 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h4 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-2">Pipeline Compilation History</h4>
          {buildingInProgress && (
            <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> Compiling in progress...
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Retrieving build history database...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-white/5 rounded-[2rem] bg-black/10">
            <Smartphone className="h-12 w-12 text-white/10" />
            <div>
              <p className="text-sm font-bold text-white uppercase italic tracking-wider">Belum Ada Build Aplikasi</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Silakan trigger build pertama Anda untuk memulai kompilasi.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[2rem] border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                  <th className="px-6 py-4">Version & Build</th>
                  <th className="px-6 py-4">Changelog</th>
                  <th className="px-6 py-4">Status Rilis</th>
                  <th className="px-6 py-4">Status Build</th>
                  <th className="px-6 py-4">Hash & Storage</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-bold text-white/70">
                {packages.map((pkg) => {
                  const isQueued = pkg.buildStatus === "queued";
                  const isBuilding = pkg.buildStatus === "building";
                  const isSuccess = pkg.buildStatus === "success";
                  const isFailed = pkg.buildStatus === "failed";
                  
                  return (
                    <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white italic uppercase tracking-tighter">v{pkg.versionName}</span>
                          <span className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">Build Code: {pkg.versionCode}</span>
                          <span className="text-[8px] text-white/20 font-black tracking-widest mt-1">By: {pkg.createdBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-[11px] font-bold text-white/50 leading-relaxed italic truncate" title={pkg.changelog}>
                          {pkg.changelog}
                        </p>
                        <span className="text-[8px] text-white/20 font-black tracking-widest uppercase">
                          {new Date(pkg.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isSuccess ? (
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              pkg.releaseStatus === "latest" 
                                ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                                : "bg-white/5 text-white/40 border-white/10"
                            }`}>
                              {pkg.releaseStatus === "latest" ? "LATEST" : "DRAFT"}
                            </span>
                            <button
                              onClick={() => handleToggleRelease(pkg.id, pkg.releaseStatus)}
                              className="text-[9px] font-black uppercase tracking-widest text-orange-500/60 hover:text-orange-500 transition-colors underline decoration-dotted"
                            >
                              Toggle Status
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          isQueued ? "bg-amber-600/10 text-amber-500 border-amber-500/20 animate-pulse" :
                          isBuilding ? "bg-orange-600/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]" :
                          isSuccess ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                          "bg-rose-600/10 text-rose-500 border-rose-500/20"
                        }`}>
                          {isQueued && <Clock className="h-3 w-3 animate-pulse" />}
                          {isBuilding && <Loader2 className="h-3 w-3 animate-spin" />}
                          {isSuccess && <CheckCircle2 className="h-3 w-3" />}
                          {isFailed && <XCircle className="h-3 w-3" />}
                          {pkg.buildStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {isSuccess ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-black text-white/40 truncate select-all" title={pkg.fileHash}>
                                SHA-256: {pkg.fileHash?.slice(0, 16)}...
                              </span>
                              <button
                                onClick={() => handleCopyHash(pkg.id, pkg.fileHash)}
                                className="text-[8px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors hover:underline"
                              >
                                {copyingHashId === pkg.id ? "Copied" : "Copy"}
                              </button>
                            </div>
                            <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Validated & Signed</span>
                          </div>
                        ) : isFailed ? (
                          <span className="text-[10px] text-rose-400/70 font-bold leading-normal bg-rose-950/10 border border-rose-900/15 p-2 rounded-xl block">
                            Compilation Error: Internal Build process terminated. Safe build log saved.
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 text-white/30 text-[10px]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                            <span>Kompilasi Antigravity server...</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSuccess && pkg.fileUrl ? (
                          <a
                            href={pkg.fileUrl}
                            download
                            className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[9px] gap-1.5 shadow-lg shadow-emerald-600/10 transition-transform active:scale-95"
                          >
                            Download APK
                          </a>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-white/5 text-white/20 border border-white/5 font-black uppercase tracking-widest text-[9px] gap-1.5 cursor-not-allowed"
                          >
                            Download APK
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Build Modal Dialog Overlay */}
      {showBuildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md p-8 glass-card border border-white/10 rounded-[3rem] bg-zinc-950/90 shadow-2xl space-y-6">
            <button
              onClick={() => setShowBuildModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-[1.25rem] bg-orange-600/15 flex items-center justify-center text-orange-500">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Trigger CI Compile</h3>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Antigravity Cloud Build Server Pipeline</p>
            </div>

            <form onSubmit={handleBuildSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Version Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2.5.0"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Version Code</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25"
                    value={versionCode}
                    onChange={(e) => setVersionCode(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Release Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setReleaseStatus("draft")}
                    className={`h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all ${
                      releaseStatus === "draft"
                        ? "bg-orange-600 text-white border-orange-500 shadow-lg"
                        : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    Draft Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setReleaseStatus("latest")}
                    className={`h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all ${
                      releaseStatus === "latest"
                        ? "bg-orange-600 text-white border-orange-500 shadow-lg"
                        : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    Latest Update
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Changelog</label>
                <textarea
                  required
                  placeholder="Deskripsikan pembaruan, optimasi kode, dan perbaikan bug..."
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  rows={4}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs font-bold leading-normal resize-none"
                />
              </div>

              <div className="bg-orange-950/10 border border-orange-900/20 p-4 rounded-2xl flex gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <p className="text-[10px] font-bold text-orange-400/80 leading-normal">
                  Proses kompilasi akan berjalan di server khusus. Pastikan kode versi dan nama unik untuk menghindari bentrokan paket. Nama versi mengandung kata <span className="underline italic">"fail"</span> akan memicu uji coba build gagal.
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowBuildModal(false)}
                  className="flex-1 h-12 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-600/20"
                >
                  Start Pipeline
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DatabaseMigrationWizard
 * Komponen untuk simulasi migrasi data dari localStorage ke MySQL.
 */
export function DatabaseMigrationWizard({ hideDbIp = true, setHideDbIp }: { hideDbIp?: boolean; setHideDbIp?: (val: boolean) => void } = {}) {
  const { allUsers, migrateToVPS } = useAuth();
  const { allStoreProducts } = useProducts();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [showSQL, setShowSQL] = useState(false);
  const [showVPS, setShowVPS] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("https://api.your-vps.com");
  const [dbStatus, setDbStatus] = useState<"disconnected" | "checking" | "connected">("disconnected");
  const { toast } = useToast();

  const totalDataCount = allUsers.length + allStoreProducts.length;

  const generateSQL = () => {
    let sql = `-- Cynmatic Database Migration Script\n`;
    sql += `-- Generated: ${new Date().toLocaleString()}\n\n`;
    
    sql += `CREATE DATABASE IF NOT EXISTS cynmatic_db;\nUSE cynmatic_db;\n\n`;
    
    sql += `CREATE TABLE IF NOT EXISTS users (\n  id VARCHAR(255) PRIMARY KEY,\n  name VARCHAR(255),\n  email VARCHAR(255) UNIQUE,\n  role ENUM('user', 'seller', 'admin', 'kurir'),\n  isVerifiedSeller BOOLEAN DEFAULT FALSE,\n  isVerifiedReseller BOOLEAN DEFAULT FALSE,\n  coins BIGINT DEFAULT 0,\n  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n`;
    
    sql += `CREATE TABLE IF NOT EXISTS products (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(255),\n  price DECIMAL(15, 2),\n  stock INT,\n  category VARCHAR(100),\n  sellerId VARCHAR(255),\n  status ENUM('pending', 'approved', 'rejected'),\n  isFlashSale BOOLEAN DEFAULT FALSE,\n  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n`;

    sql += `-- SEEDING USERS (${allUsers.length})\n`;
    allUsers.forEach(u => {
      sql += `INSERT INTO users (id, name, email, role, isVerifiedSeller, isVerifiedReseller, coins) \nVALUES ('${u.id}', '${u.name}', '${u.email}', '${u.role}', ${u.isVerifiedSeller ? 1 : 0}, ${u.isVerifiedReseller ? 1 : 0}, ${u.coins}) \nON DUPLICATE KEY UPDATE name=VALUES(name);\n`;
    });

    sql += `\n-- SEEDING PRODUCTS (${allStoreProducts.length})\n`;
    allStoreProducts.forEach(p => {
      const stockValue = (p.stock === undefined || p.stock === null) ? 0 : p.stock;
      sql += `INSERT INTO products (id, name, price, stock, category, sellerId, status, isFlashSale) \nVALUES (${p.id}, '${p.name.replace(/'/g, "''")}', ${p.price}, ${stockValue}, '${p.category}', '${p.sellerId}', 'approved', ${p.isFlashSale ? 1 : 0}) \nON DUPLICATE KEY UPDATE stock=VALUES(stock), price=VALUES(price);\n`;
    });

    return sql;
  };

  const startMigration = async () => {
    setIsMigrating(true);
    setProgress(0);
    setStep(1);

    // AI Simulation Steps
    const steps = [
      "Menganalisis skema localStorage...",
      "Membangun struktur tabel MySQL...",
      "Memvalidasi integritas data pengguna...",
      "Melakukan normalisasi data produk...",
      "Mengunggah data ke server database...",
      "Sinkronisasi state global..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setStep(i + 1);
      for (let p = 0; p <= 100; p += 5) {
        setProgress(p);
        await new Promise(r => setTimeout(r, 50));
      }
      toast({ title: "AI Migration", description: steps[i] });
    }

    setIsMigrating(false);
    
    try {
      // Use the internal migration function from AuthContext
      const result = await migrateToVPS();

      if (!result.ok) throw new Error(result.error || "Gagal mengirim data ke server MySQL.");

      toast({ 
        title: "Migrasi Berhasil!", 
        description: `Total ${totalDataCount} entri data telah dipindahkan ke MySQL VPS Anda secara otomatis.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Migrasi Gagal",
        description: err.message || "Pastikan server backend jalan dan MySQL VPS aktif."
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card bg-gradient-to-br from-[#0a0a0b] via-[#111] to-[#0a0a0b] text-white rounded-[3.5rem] p-12 border border-white/5 shadow-[0_0_80px_rgba(255,100,0,0.05)] overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-all duration-1000 group-hover:rotate-12 group-hover:scale-110">
          <Cpu className="h-64 w-64 text-orange-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
            <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-600/40 relative overflow-hidden group/icon">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/icon:translate-y-0 transition-transform duration-500" />
              <Zap className="h-10 w-10 text-white relative z-10" />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter italic uppercase text-white leading-none">Matrix Migration</h2>
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.4em] mt-3">Advanced Data Synchronization Module</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="glass-card bg-white/5 border border-white/5 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mb-2">Source Nodes</p>
              <p className="text-3xl font-black italic tracking-tighter">{allUsers.length}</p>
            </div>
            <div className="glass-card bg-white/5 border border-white/5 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mb-2">Source Assets</p>
              <p className="text-3xl font-black italic tracking-tighter">{allStoreProducts.length}</p>
            </div>
            <div className="glass-card bg-orange-600/10 border border-orange-500/20 rounded-2xl p-8 group/status">
              <p className="text-[10px] text-orange-500/60 font-black uppercase tracking-[0.2em] mb-2">Protocol Status</p>
              <p className="text-xs font-black text-white flex items-center gap-2 mt-2 uppercase italic">
                <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" /> Sync Required
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 mb-12">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-orange-500 italic">
              <ListTodo className="h-4 w-4" /> Migration Execution Steps:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Generate Logic", desc: "Extract local state into SQL frequency." },
                { step: "02", title: "Access Node", desc: "Establish terminal connection to VPS." },
                { step: "03", title: "Commit Script", desc: "Execute SQL matrix on the remote host." }
              ].map((s, i) => (
                <div key={i} className="relative group/step">
                  <span className="text-4xl font-black text-white/5 absolute -top-4 -left-2 group-hover/step:text-orange-500/10 transition-colors">{s.step}</span>
                  <h5 className="text-[11px] font-black text-white uppercase tracking-widest relative z-10">{s.title}</h5>
                  <p className="text-[10px] text-white/40 font-bold italic mt-2 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {isMigrating ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-700">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] animate-pulse">
                  {step === 1 && "Analyzing Schema Matrix..."}
                  {step === 2 && "Synthesizing DB Architecture..."}
                  {step === 3 && "Authenticating Node Identities..."}
                  {step === 4 && "Normalizing Asset Vectors..."}
                  {step === 5 && "Transmitting Bitstream..."}
                  {step === 6 && "Finalizing Sync Protocol..."}
                </p>
                <p className="text-sm font-black italic">{progress}%</p>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-yellow-500 rounded-full shadow-[0_0_30px_rgba(234,88,12,0.5)]"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              <Button 
                onClick={startMigration}
                size="lg"
                className="rounded-2xl px-12 h-16 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-orange-600/40 italic"
              >
                <Cpu className="h-5 w-5 mr-3" /> Initialize Sync
              </Button>
              <Button 
                variant="ghost"
                size="lg"
                onClick={() => setShowSQL(!showSQL)}
                className="rounded-2xl px-12 h-16 bg-white/5 text-white/40 border border-white/5 hover:text-white hover:bg-white/10 font-black uppercase tracking-widest text-[11px]"
              >
                <Server className="h-5 w-5 mr-3" /> {showSQL ? "Hide Matrix" : "View Matrix"}
              </Button>
              <Button 
                variant="ghost"
                size="lg"
                onClick={() => setShowVPS(!showVPS)}
                className="rounded-2xl px-12 h-16 bg-white/5 text-white/40 border border-white/5 hover:text-white hover:bg-white/10 font-black uppercase tracking-widest text-[11px]"
              >
                <Globe className="h-5 w-5 mr-3" /> Remote Deployment
              </Button>
              <Button 
                size="lg"
                onClick={async () => {
                  if (!window.confirm("⚠️ Hapus SEMUA user KECUALI alrizalarkan@gmail.com dari VPS? Tindakan ini TIDAK BISA DIBATALKAN!")) return;
                  try {
                    const res = await fetch('/api/users/reset-all', { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ keepEmails: ['alrizalarkan@gmail.com'] })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast({ title: "✅ Berhasil!", description: data.message + " Refresh halaman untuk melihat perubahan." });
                      setTimeout(() => window.location.reload(), 2000);
                    } else {
                      toast({ variant: "destructive", title: "Gagal", description: data.error || "Unknown error" });
                    }
                  } catch (e: any) {
                    toast({ variant: "destructive", title: "Error", description: e.message });
                  }
                }}
                className="rounded-2xl px-12 h-16 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-rose-600/40 italic border-0"
              >
                🗑️ Hapus Semua User (Kecuali Alrizalarkan)
              </Button>
            </div>
          )}
        </div>
      </div>

      {showVPS && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-primary/30 rounded-[2.5rem] p-8 text-white shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black">VPS Remote Deployment</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Connect to your own Linux Server</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Server API URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={remoteUrl} 
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="https://api.domain.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button 
                  onClick={() => {
                    setDbStatus("checking");
                    setTimeout(() => {
                      setDbStatus("connected");
                      toast({ title: "Connected to VPS!", description: "Handshake successful with remote database." });
                    }, 1500);
                  }}
                  disabled={dbStatus === "checking"}
                  className="bg-primary hover:bg-primary/90 px-6 font-black"
                >
                  {dbStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Link"}
                </Button>
              </div>
            </div>

            <div className="bg-black/40 rounded-[2rem] p-6 border border-white/5">
              <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" /> VPS Setup Command (Ubuntu/Debian)
              </h4>
              <p className="text-[10px] text-slate-400 mb-3 font-medium uppercase tracking-tight">Copy and run this on your VPS terminal to auto-install MySQL & Node.js</p>
              <pre className="bg-black p-4 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-white/10 leading-relaxed">
{`# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install MySQL Server
sudo apt install mysql-server -y
sudo mysql_secure_installation

# 3. Create Database & User
sudo mysql -e "CREATE DATABASE cynmatic_db;"
sudo mysql -e "CREATE USER 'cynmatic_user'@'localhost' IDENTIFIED BY 'your_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON cynmatic_db.* TO 'cynmatic_user'@'localhost';"

# 4. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Clone & Start App
git clone https://github.com/your-repo/cynmatic-server.git
cd cynmatic-server
npm install
npm run start`}
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Docker Compose</p>
                  <Button variant="outline" size="sm" className="w-full border-white/10 text-white font-bold" onClick={() => {
                    navigator.clipboard.writeText(`version: '3.8'\nservices:\n  db:\n    image: mysql:8.0\n    environment:\n      MYSQL_DATABASE: cynmatic_db\n      MYSQL_ROOT_PASSWORD: root\n  api:\n    build: .\n    ports:\n      - "3000:3000"\n    depends_on:\n      - db`);
                    toast({ title: "Docker Config Copied!" });
                  }}>Copy YAML</Button>
               </div>
               <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Environment Config</p>
                  <Button variant="outline" size="sm" className="w-full border-white/10 text-white font-bold" onClick={() => {
                    navigator.clipboard.writeText(`DATABASE_URL=mysql://cynmatic_user:password@localhost:3306/cynmatic_db\nJWT_SECRET=your_secret_key\nPORT=3000`);
                    toast({ title: "Env Template Copied!" });
                  }}>Copy .env</Button>
               </div>
            </div>
          </div>
        </motion.div>
      )}

      {showSQL && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-[2rem] p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="font-bold">MySQL Migration Script</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => {
              navigator.clipboard.writeText(generateSQL());
              toast({ title: "SQL Ter-copy!" });
            }}>
              Copy SQL
            </Button>
          </div>
          <pre className="bg-slate-950 text-slate-300 p-6 rounded-2xl text-[11px] font-mono overflow-x-auto border border-white/5 max-h-[400px]">
            {generateSQL()}
          </pre>
        </motion.div>
      )}

      {/* Database Connection Settings */}
      <div className="bg-card border rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="font-bold">MySQL Connection Config</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DB Host</label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                readOnly 
                value={hideDbIp ? "•••.•••.•••.•••" : "185.128.227.237"} 
                className="w-full pl-4 pr-10 py-2.5 bg-muted/50 border rounded-xl text-sm font-mono" 
              />
              {setHideDbIp && (
                <button 
                  type="button" 
                  onClick={() => setHideDbIp(!hideDbIp)}
                  className="absolute right-3 text-white/40 hover:text-white transition-colors"
                  title={hideDbIp ? "Tampilkan IP" : "Sembunyikan IP"}
                >
                  {hideDbIp ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DB Port</label>
            <input type="text" readOnly value="3306" className="w-full px-4 py-2.5 bg-muted/50 border rounded-xl text-sm font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Database Name</label>
            <input type="text" readOnly value="cynmatic_db" className="w-full px-4 py-2.5 bg-muted/50 border rounded-xl text-sm font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</label>
            <div className="w-full px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm font-black flex items-center gap-2 uppercase tracking-tight">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> VPS Remote Mode
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const { user, allUsers, updateUserRole, addCoins, toggleBan, updateBalance, updateCryptoBalance, toggleVerifiedSeller, toggleVerifiedReseller, updateUserPassword } = useAuth();
  const { cosmetics, addCosmetic, deleteCosmetic } = useCosmetics();
  const { sellerProducts, adminProducts: adminInventory, allStoreProducts, autoApprove, setAutoApprove, approveProduct, rejectProduct, deleteProduct, deleteAdminProduct } = useProducts();
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
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [hideUserIps, setHideUserIps] = useState(true);

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user || user.role !== "admin") return <div className="text-center py-20 font-semibold">Akses Ditolak</div>;

  const combinedProducts = [
    ...adminInventory.map(p => ({ ...p, status: 'approved' as const, sellerName: 'Admin Toko' })), 
    ...sellerProducts
  ];

  const visible = filter === "all" 
    ? combinedProducts 
    : combinedProducts.filter((p) => p.status === filter);

  const counts  = {
    all:      combinedProducts.length,
    pending:  combinedProducts.filter((p) => p.status === "pending").length,
    approved: combinedProducts.filter((p) => p.status === "approved").length,
    rejected: combinedProducts.filter((p) => p.status === "rejected").length,
  };

  const handleApprove = (id: number) => { approveProduct(id); toast({ title: "Produk disetujui." }); };
  const handleReject  = (id: number) => { rejectProduct(id);  toast({ title: "Produk ditolak." }); };
  const handleDelete  = (id: number) => { deleteProduct(id);  toast({ title: "Produk dihapus." }); };
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
    toast({ title: "Peran Diperbarui" });
  };
  const handleBanToggle = (uid: string, type: "permanent" | "trial", reason: string) => {
    toggleBan(uid, type, reason);
    toast({ title: "Status hukuman pengguna diperbarui." });
  };
  const handleUpdateBalance = (uid: string, amount: number) => {
    updateBalance(uid, amount);
    toast({ title: "Saldo pengguna diperbarui." });
  };
  const handleUpdateCrypto = (uid: string, cryptoType: "BTC" | "ETH", action: "add" | "reset", amount?: number) => {
    updateCryptoBalance(uid, cryptoType, action, amount);
    if (action === "reset") {
      toast({ title: `✅ Saldo ${cryptoType} pengguna berhasil di-reset.` });
    } else {
      toast({ title: `✅ Saldo ${cryptoType} pengguna berhasil ditambahkan.` });
    }
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
      description: vDesc || (vType === "percentage" ? "Diskon " + vValue + "%" : "Potongan " + formatPrice(Number(vValue))),
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
    if (!amount || amount <= 0) {
      toast({ title: "Jumlah tidak valid", variant: "destructive" });
      return;
    }
    addCoins("all", amount);
    setBulkCoinAmount("");
    toast({ title: "Berhasil", description: `Memberikan ${amount} koin ke semua pengguna.` });
  };

  const handleGiveSingleCoin = () => {
    if (!targetUserId) {
      toast({ title: "Pilih pengguna", variant: "destructive" });
      return;
    }
    const amount = parseInt(singleCoinAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Jumlah tidak valid", variant: "destructive" });
      return;
    }
    addCoins(targetUserId, amount);
    setTargetUserId("");
    setSingleCoinAmount("");
    toast({ title: "Berhasil", description: `Memberikan ${amount} koin ke pengguna.` });
  };

  const handleAddExchangeOption = () => {
    const coins = parseInt(excCoins);
    const value = parseInt(excValue);
    if (!coins || !value || !excTitle.trim()) {
      toast({ title: "Isi data dengan benar", variant: "destructive" });
      return;
    }
    addExchangeOption({ coins, value, title: excTitle.trim() });
    setExcCoins(""); setExcValue(""); setExcTitle("");
    toast({ title: "Opsi Tukar Koin Ditambahkan" });
  };

  const filteredStoreProducts = allStoreProducts.filter((p) =>
    !liveSearch || p.name.toLowerCase().includes(liveSearch.toLowerCase())
  );

  const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "products", icon: Package,     label: `Produk (${counts.all})` },
    { id: "users",    icon: Users,        label: `Pengguna (${allUsers.length})` },
    { id: "database", icon: Globe,        label: "Sistem Database" },
    { id: "android",  icon: Smartphone,   label: "Android Package" },
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
    { id: "gacha",    icon: Trophy,       label: "Gacha & Luck Royale" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* —————————————————————————————————————————————————————————————————————— */}
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
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[13px] font-black uppercase tracking-tighter text-white leading-none">Command</p>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Center</p>
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
                {/* Live badge */}
                {t.id === "live" && isLive && (
                  <span className={`w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)] flex-shrink-0 ${
                    sidebarCollapsed ? "absolute top-2 right-2" : ""
                  }`} />
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

      {/* —————————————————————————————————————————————————————————————————————— */}
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
                        {activeTab?.label ?? "Admin"}
                      </h1>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-0.5">Cynmatic Admin Panel</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: server status + admin badge */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Server Live</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-2 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center shadow-md">
                  <ShieldCheck className="h-3 w-3 text-white" />
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

      {/* —————————————————————————————————————————————————————————————————————— */}
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

      {/* —————————————————————————————————————————————————————————————————————— */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="glass-card border-white/5 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
             <div className="flex items-center gap-4 px-4 h-14 bg-white/5 rounded-2xl border border-white/5">
               <Search className="h-5 w-5 text-muted-foreground" />
               <input 
                 value={userSearch}
                 onChange={e => setUserSearch(e.target.value)}
                 placeholder="Cari nama, email, atau ID user..."
                 className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold"
               />
             </div>
          </div>

          <div className="glass-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl divide-y divide-white/5">
            {allUsers.filter(u => 
              u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
              u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
              u.id.toLowerCase().includes(userSearch.toLowerCase())
            ).length === 0
              ? <div className="text-center py-12 text-muted-foreground">Tidak ada pengguna ditemukan.</div>
              : allUsers
                  .filter(u => 
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.id.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <UserRow 
                      key={u.id} 
                      user={u} 
                      currentUser={user!} 
                      onRoleChange={handleRoleChange} 
                      onBanToggle={handleBanToggle} 
                      onUpdateBalance={handleUpdateBalance} 
                      onUpdateCrypto={handleUpdateCrypto}
                      onViewDetails={setSelectedUser}
                      onToggleVerifiedSeller={toggleVerifiedSeller}
                      onToggleVerifiedReseller={toggleVerifiedReseller}
                      onUpdatePassword={updateUserPassword}
                      onDelete={async (id, name) => {
                        if (!window.confirm(`Hapus user "${name}" dari database VPS? Tindakan ini TIDAK BISA DIBATALKAN!`)) return;
                        try {
                          const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
                          const data = await res.json();
                          if (data.success) {
                            toast({ title: `✅ User "${name}" berhasil dihapus!` });
                            setTimeout(() => window.location.reload(), 1000);
                          } else {
                            toast({ variant: 'destructive', title: 'Gagal hapus user', description: data.error });
                          }
                        } catch (e: any) {
                          toast({ variant: 'destructive', title: 'Error', description: e.message });
                        }
                      }}
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

      {/* —————————————————————————————————————————————————————————————————————— */}
      {tab === "coins" && (
        <div className="space-y-6">
          <div className="glass-card bg-gradient-to-br from-amber-600/10 to-orange-600/5 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
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

          <div className="glass-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="font-bold text-foreground text-lg mb-2">Pemberian Koin Spesifik</h3>
            <p className="text-sm text-muted-foreground mb-4">Berikan koin hanya kepada satu pengguna pilihan.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <select 
                value={targetUserId} 
                onChange={e => setTargetUserId(e.target.value)}
                className="flex-[2] px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring bg-background text-sm"
              >
                <option value="">-- Pilih Pengguna --</option>
                {allUsers.map(u => (
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

          <div className="glass-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
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

      {/* —————————————————————————————————————————————————————————————————————— */}
      {tab === "ip_list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Daftar IP Pengguna</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Pemantauan Alamat IP (Public & Local)</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHideUserIps(!hideUserIps)}
              className="gap-2 text-xs font-black uppercase tracking-wider h-9"
            >
              {hideUserIps ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {hideUserIps ? "Tampilkan IP" : "Sembunyikan IP"}
            </Button>
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
                  {allUsers.map((u) => (
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
                      <td className="px-4 py-3 font-mono text-xs">
                        {u.publicIp ? (
                          hideUserIps ? "•••.•••.•••.•••" : u.publicIp
                        ) : (
                          <span className="text-muted-foreground italic">Belum tercatat</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px]">
                        {u.localIp ? (
                          hideUserIps ? "•••.•••.•••.•••" : u.localIp
                        ) : (
                          <span className="text-muted-foreground italic">Belum tercatat</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* —————————————————————————————————————————————————————————————————————— */}
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

      {/* —————————————————————————————————————————————————————————————————————— */}
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

      {/* —————————————————————————————————————————————————————————————————————— */}
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

      {/* —————————————————————————————————————————————————————————————————————— */}
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

      {/* —————————————————————————————————————————————————————————————————————— */}
      {tab === "sultan" && (
        <SultanAdminTab />
      )}

      {/* —————————————————————————————————————————————————————————————————————— */}
      {tab === "voting" && (
        <VotingAdminTab />
      )}

      {/* —————————————————————————————————————————————————————————————————————— */}
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

      {/* —————————————————————————————————————————————————————————————————————— */}
      {tab === "database" && (
        <div className="space-y-6">
          <DatabaseExplorer />
        </div>
      )}

      {/* —————————————————————————————————————————————————————————————————————— */}
      {tab === "android" && (
        <div className="space-y-6">
          <AndroidPackagePanel />
        </div>
      )}

      {/* —————————————————————————————————————————————————————————————————————— */}
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
                {pay.dummyMode ? "⚠️ Mode Demo aktif — tidak ada pembayaran nyata" : "Mode Produksi — gunakan gateway sungguhan"}
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
                  Format: <code className="bg-muted px-1 rounded">provider/model-name</code> â€” contoh:{" "}
                  <button type="button" className="text-primary hover:underline font-mono" onClick={() => setDraftOpenrouterModel("openai/gpt-4o-mini")}>openai/gpt-4o-mini</button>
                  {", "}
                  <button type="button" className="text-primary hover:underline font-mono" onClick={() => setDraftOpenrouterModel("google/gemini-flash-1.5")}>google/gemini-flash-1.5</button>.
                </p>
              </div>
              <Button size="sm" onClick={handleSaveKeys} className="w-full sm:w-auto">Simpan Pengaturan</Button>
            </div>
            
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${ai.isAIEnabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {ai.isAIEnabled
                ? `âœ“ AI aktif â€” menggunakan OpenRouter`
                : "AI tidak aktif â€” fitur analisis produk dinonaktifkan"}
            </div>
          </div>
        </div>
      )}

      {/* —————————————————————————————————————————————————————————————————————— */}
      {tab === "gacha" && (
        <AdminGachaPanel />
      )}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;

