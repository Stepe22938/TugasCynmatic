/**
 * ProfilePage.tsx
 * Premium Profile Experience - VIP Lounge Aesthetics.
 */
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  User, Mail, Calendar, ShoppingBag, Edit2, Check, X, LogOut,
  ShieldCheck, Package, Store, Coins, Truck, Send, Globe, Wifi, 
  Ticket, Users, Palette, Sparkles, Gamepad2, Gavel, Wallet,
  Layout, LayoutGrid, Heart, Bell, Trophy, Crown, ShieldAlert, Plus, ClipboardList,
  Vote as VoteIcon, Bot, Music, Star, Gift, Smartphone, TrendingUp, ArrowRight, Zap,
  Radio, HelpCircle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSultan } from "../contexts/MySultanContext";
import { useMyCrypto } from "../contexts/MyCryptoContext";
import { CryptoBadge } from "../components/CryptoBadge";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useTickets } from "../contexts/TicketContext";
import { useNotifications } from "../contexts/NotificationContext";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`;
}

const ROLE_COLOR: Record<string, string> = {
  user:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
  seller: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  admin:  "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20",
};

export function ProfilePage() {
  const { user, logout, updateName, toggleLayout } = useAuth();
  const { isSultan, sultanExpiry } = useSultan();
  const { isCryptoMember, cryptoExpiry } = useMyCrypto();
  const { state: orderState } = useOrderHistory();
  const { unreadCount } = useNotifications();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(user?.name ?? "");
  
  const spend = orderState.orders.reduce((s, o) => s + o.grandTotal, 0);
  const orders = orderState.orders.length;
  const items = orderState.orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const coins = user?.coins || 0;

  if (!user) return null;

  const handleSaveName = () => {
    if (nameInput.trim()) updateName(nameInput.trim());
    setEditingName(false);
    toast({ title: "Profile Updated", description: "Your identity has been synchronized." });
  };

  const handleLogout = () => { logout(); setLocation("/login"); };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      
      {/* ── Premium Layout Toggle ─────────────────────────────────── */}
      <div className="container mx-auto px-6 pt-10 flex justify-end relative z-30">
        <button 
          onClick={toggleLayout}
          className="glass-card p-1 rounded-2xl flex items-center gap-1 border-white/10 shadow-2xl"
        >
          <div className={`p-2.5 rounded-xl transition-all ${user.profileLayout === 'premium' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/30' : 'text-muted-foreground'}`}>
            <Crown className="h-4 w-4" />
          </div>
          <div className={`p-2.5 rounded-xl transition-all ${user.profileLayout !== 'premium' ? 'bg-white/10 text-white' : 'text-muted-foreground'}`}>
            <LayoutGrid className="h-4 w-4" />
          </div>
        </button>
      </div>

      <div className="container mx-auto px-6 max-w-5xl mt-6 space-y-10">
        
        {/* ── Elite Header Section ─────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative rounded-[3.5rem] overflow-hidden min-h-[400px] border border-white/5 shadow-2xl ${!user.useAnimation && user.theme ? `bg-gradient-to-br ${user.theme}` : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-background to-background'}`}
        >
          {/* Custom Background or Animated Elements */}
          {user.useAnimation && user.youtubeId ? (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <iframe
                className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 aspect-video brightness-[0.6] blur-[1px]"
                src={`https://www.youtube.com/embed/${user.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${user.youtubeId}&showinfo=0&rel=0&modestbranding=1`}
                allow="autoplay; encrypted-media"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40" />
            </div>
          ) : (
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 blur-[100px] rounded-full animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/5 blur-[100px] rounded-full animate-pulse delay-1000" />
            </div>
          )}

          <div className="relative z-10 p-10 lg:p-16 h-full flex flex-col justify-end">
            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-10 text-center lg:text-left">
              
              {/* Avatar with Aura */}
              <div className="relative group">
                <div className={`absolute -inset-6 bg-[#D4AF37]/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                {isSultan && (
                   <div className="absolute -inset-10 bg-[#D4AF37]/5 rounded-full blur-[4rem] animate-pulse" />
                )}
                <div className="w-40 h-40 lg:w-52 lg:h-52 rounded-[3rem] overflow-hidden border-4 border-[#D4AF37]/20 relative z-10 shadow-2xl bg-slate-900 group-hover:scale-105 transition-transform duration-500">
                  <img src={user.avatar || avatarUrl(user.name)} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Identity Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic text-white drop-shadow-2xl">
                      {user.name}
                    </h1>
                    <button onClick={() => setEditingName(true)} className="w-8 h-8 flex items-center justify-center glass-card rounded-lg hover:bg-white/10 transition text-white/50 hover:text-white">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
                    {isSultan && (
                      <div className="px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#8B732A] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border border-white/20 flex items-center gap-2">
                        <Crown className="h-3.5 w-3.5" /> Sultan Member
                      </div>
                    )}
                    {isCryptoMember && <CryptoBadge />}
                    <div className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${ROLE_COLOR[user.role]}`}>
                      <ShieldCheck className="h-3.5 w-3.5" /> {user.role}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-xs font-bold text-white/40 tracking-widest uppercase">
                  <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {user.email}</span>
                  <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Joined {formatDate(user.createdAt)}</span>
                </div>

                {/* Counter Stats */}
                <div className="flex gap-8 justify-center lg:justify-start pt-4">
                   <div className="text-center lg:text-left">
                     <p className="text-2xl font-black text-white leading-none">{(user.friends || []).length}</p>
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">Friends</p>
                   </div>
                   <div className="w-px h-8 bg-white/5" />
                   <div className="text-center lg:text-left">
                     <p className="text-2xl font-black text-white leading-none">{(user.friendRequests || []).length}</p>
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">Followers</p>
                   </div>
                   <div className="w-px h-8 bg-white/5" />
                   <div className="text-center lg:text-left">
                     <p className="text-2xl font-black text-white leading-none">{(user.sentRequests || []).length}</p>
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">Following</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Financial Stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShoppingBag, label: "Orders", value: orders, color: "text-blue-400" },
            { icon: Package, label: "Items", value: items, color: "text-purple-400" },
            { icon: Wallet, label: "Spending", value: formatPrice(spend), color: "text-emerald-400" },
            { icon: Coins, label: "Elite Coins", value: coins.toLocaleString(), color: "text-orange-500" }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card p-6 rounded-[2rem] text-center space-y-2 group hover:border-white/20 transition-all"
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className={`text-xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Core Assets ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-2">Vault & Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PremiumLink href="/mydompet" title="Elite Wallet" sub="Balance & Vault" icon={Wallet} color="text-blue-500" />
            <PremiumLink href="/mysultan" title="Sultan Membership" sub="Privilege Center" icon={Crown} color="text-orange-500" />
            <PremiumLink href="/mycrypto" title="MyCrypto Signals" sub="AI Market Insights" icon={TrendingUp} color="text-emerald-500" />
            <PremiumLink href="/orders" title="Purchase Logs" sub="Track your assets" icon={ClipboardList} color="text-purple-500" />
            <PremiumLink href="/wishlist" title="Vaulted Items" sub="Saved for later" icon={Heart} color="text-red-500" />
            <PremiumLink href="/myredeem" title="Redemption Vault" sub="Bonus Assets" icon={Gift} color="text-amber-500" />
          </div>
        </div>

        {/* ── Economy & Social ─────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-2">Economy & Social</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PremiumLink href="/game-topup" title="Direct Game TopUp" sub="Instant Recharge" icon={Gamepad2} color="text-yellow-500" />
            <PremiumLink href="/exchange" title="Asset Exchange" sub="Token & Coin Swap" icon={Coins} color="text-blue-400" />
            <PremiumLink href="/friends" title="Social Hub" sub="Connect with elite" icon={Users} color="text-violet-500" />
            <PremiumLink href="/affiliate" title="Affiliate Program" sub="Earn 5% Commission" icon={Zap} color="text-yellow-500" />
            <PremiumLink href="/auction" title="Global Auction" sub="Bid on rare gems" icon={Gavel} color="text-amber-500" />
            <PremiumLink href="/flashsale" title="Flash Ops" sub="Limited Time Deals" icon={Zap} color="text-orange-500" />
          </div>
        </div>

        {/* ── Gaming & Community ───────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-2">Gaming & Community</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PremiumLink href="/minigames" title="Elite Arcade" sub="Win more coins" icon={Gamepad2} color="text-indigo-500" />
            <PremiumLink href="/leaderboard" title="Hall of Fame" sub="Global Rankings" icon={Trophy} color="text-yellow-400" />
            <PremiumLink href="/live" title="Broadcasting Hub" sub="Live Events" icon={Radio} color="text-red-500" />
            <PremiumLink href="/aichat" title="AI Companion" sub="Smart Assistant" icon={Bot} color="text-cyan-500" />
            <PremiumLink href="/voting" title="Governance" sub="Community Votes" icon={VoteIcon} color="text-blue-600" />
            <PremiumLink href="/cosmetics" title="Aura Gallery" sub="Visual Assets" icon={Sparkles} color="text-pink-500" />
            <PremiumLink href="/mymusic" title="Elite Audio" sub="Acoustic Player" icon={Music} color="text-purple-400" />
          </div>
        </div>

        {/* ── Management & Control ─────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-2">Management & Control</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(user.role === 'seller' || user.role === 'admin') && (
              <PremiumLink href="/seller" title="Merchant Dashboard" sub="Sales & Inventory" icon={Store} color="text-emerald-500" />
            )}
            {(user.role === 'kurir' || user.role === 'admin') && (
              <PremiumLink href="/courier" title="Courier Dashboard" sub="Delivery Management" icon={Truck} color="text-orange-500" />
            )}
            {user.role === 'admin' && (
              <PremiumLink href="/admin" title="Admin Command" sub="System Control" icon={ShieldCheck} color="text-rose-500" />
            )}
            {user.role === 'admin' && (
              <PremiumLink href="/ban-leaderboard" title="Enforcement Log" sub="Security Matrix" icon={ShieldAlert} color="text-slate-500" />
            )}
          </div>
        </div>

        {/* ── System & Support ─────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-2">System & Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PremiumLink href="/tickets" title="Support Center" sub="Help & Assistance" icon={HelpCircle} color="text-blue-500" />
            <PremiumLink href="/customize" title="Personalization" sub="Visual Settings" icon={Palette} color="text-pink-500" />
            <PremiumLink href="/notifications" title="Signal Alerts" sub="Notification Logs" icon={Bell} color="text-orange-400" />
            <PremiumLink href="/about-us" title="Cynmatic Story" sub="Identity Protocol" icon={Globe} color="text-white" />
          </div>
        </div>

        {/* ── System Details ─────────────────────────────────────── */}
        <div className="glass-card rounded-[3rem] overflow-hidden">
          <div className="px-10 py-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Vault Security & System Details</h3>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="divide-y divide-white/5">
            <SystemRow label="Authentication ID" value={user.id.toUpperCase()} />
            <SystemRow label="Authorized IP" value={user.publicIp || "Scanning..."} />
            <SystemRow label="System Role" value={user.role.toUpperCase()} />
            <SystemRow label="Network Node" value="MariaDB VPS Node-1" />
          </div>
        </div>

        {/* ── Action Footer ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="flex-1 h-16 rounded-[2rem] border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/50 text-red-500 font-black uppercase tracking-widest text-[10px] transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" /> Terminate Session
          </Button>
        </div>

      </div>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {editingName && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Update Identity</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Synchronizing name across VPS nodes</p>
              </div>
              
              <input 
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="New Identity Name"
                className="w-full h-16 bg-white/5 border-2 border-white/10 rounded-2xl px-6 text-xl font-black focus:outline-none focus:border-orange-500/50"
              />

              <div className="flex gap-3">
                <Button onClick={() => setEditingName(false)} variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                <Button onClick={handleSaveName} className="flex-1 h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 font-black uppercase tracking-widest text-[10px]">Save & Sync</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function PremiumLink({ href, title, sub, icon: Icon, color }: any) {
  return (
    <Link href={href}>
      <motion.div 
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="glass-card p-6 rounded-[2.5rem] flex items-center gap-5 cursor-pointer group hover:border-white/20 transition-all shadow-lg"
      >
        <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-inner`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black tracking-tight text-white group-hover:text-orange-500 transition-colors uppercase italic">{title}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">{sub}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </motion.div>
    </Link>
  );
}

function SystemRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-10 py-5 group hover:bg-white/5 transition-colors">
      <span className="text-[9px] font-black uppercase tracking-widest text-white/20">{label}</span>
      <span className="text-[11px] font-mono font-bold text-white/60 group-hover:text-white transition-colors">{value}</span>
    </div>
  );
}

