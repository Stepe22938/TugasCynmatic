/**
 * ProfilePage.tsx
 * Profil pengguna: statistik, koin, edit nama, quick links ke halaman role.
 * Koin: 1.000 rupiah = 1 koin (dibulatkan ke bawah dari total belanja).
 */
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  User, Mail, Calendar, ShoppingBag, Edit2, Check, X, LogOut,
  ShieldCheck, Package, Store, Coins, Truck, Send, Globe, Wifi, 
  Ticket, Users, Palette, Sparkles, Gamepad2, Gavel, Wallet,
  Layout, LayoutGrid, Heart, Bell, Trophy, Crown, ShieldAlert,
  Vote as VoteIcon, Bot, Music, Star, Gift
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useTickets } from "../contexts/TicketContext";
import { useNotifications } from "../contexts/NotificationContext";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f97316&fontColor=ffffff&fontSize=40`;
}

const ROLE_LABEL: Record<string, string> = { user: "Pelanggan", seller: "Seller", admin: "Administrator" };
const ROLE_COLOR: Record<string, string> = {
  user:   "bg-blue-100 text-blue-700",
  seller: "bg-purple-100 text-purple-700",
  admin:  "bg-orange-100 text-orange-700",
};

export function ProfilePage() {
  const { user, logout, updateName, updateIps, toggleLayout } = useAuth();
  const { state: orderState } = useOrderHistory();
  const { getUserTickets, createTicket } = useTickets();
  const { unreadCount } = useNotifications();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(user?.name ?? "");
  
  // Real-time Display Counters (Simulated delay-like reactivity)
  const [displaySpend, setDisplaySpend] = useState(0);
  const [displayOrders, setDisplayOrders] = useState(0);
  const [displayItems, setDisplayItems] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayFollowers, setDisplayFollowers] = useState(0);
  const [displayFollowing, setDisplayFollowing] = useState(0);
  const [displayFriends, setDisplayFriends] = useState(0);

  useEffect(() => {
    if (user && !user.publicIp) {
      fetch("https://api.ipify.org?format=json")
        .then(r => r.json())
        .then(data => {
          updateIps(data.ip, "Dilindungi oleh Browser (WebRTC Leak Prevent)");
        })
        .catch(console.error);
    }

    if (user) {
      // Counter Animation Logic
      const spend = orderState.orders.reduce((s, o) => s + o.grandTotal, 0);
      const orders = orderState.orders.length;
      const items = orderState.orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);
      
      setDisplaySpend(spend);
      setDisplayOrders(orders);
      setDisplayItems(items);
      setDisplayCoins(user.coins || 0);
      setDisplayFollowers((user.friendRequests || []).length + (user.friends || []).length); 
      setDisplayFollowing((user.sentRequests || []).length + (user.friends || []).length);
      setDisplayFriends((user.friends || []).length);
    }
  }, [user, orderState]);

  if (!user) return null;

  const handleSaveName = () => {
    if (nameInput.trim()) updateName(nameInput.trim());
    setEditingName(false);
  };

  const handleLogout = () => { logout(); setLocation("/login"); };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Layout Toggle */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={toggleLayout}
          className="flex items-center gap-2 bg-muted/50 hover:bg-muted p-1.5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground"
        >
          <div className={`p-2 rounded-xl transition-all ${user.profileLayout === 'premium' ? 'bg-primary text-white shadow-lg shadow-primary/20' : ''}`}>
            <Layout className="h-4 w-4" />
          </div>
          <div className={`p-2 rounded-xl transition-all ${user.profileLayout === 'simple' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : ''}`}>
            <LayoutGrid className="h-4 w-4" />
          </div>
          <span className="pr-3 pl-1">Layout Mode</span>
        </button>
      </div>

      {user.profileLayout === "premium" ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* ── Kartu header (Premium) ────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-[3rem] shadow-2xl min-h-[400px] group">
            {user.useAnimation && user.youtubeId ? (
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black">
                <iframe
                  className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 aspect-video brightness-[0.6] blur-[0.5px]"
                  src={`https://www.youtube.com/embed/${user.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${user.youtubeId}&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
                  allow="autoplay; encrypted-media"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
            ) : (
              <div className={`absolute inset-0 z-0 bg-gradient-to-br ${user.theme || "from-slate-900 to-black"} transition-all duration-500`} />
            )}

            <div className="relative z-10 p-10 sm:p-16 text-white min-h-[400px] flex items-end">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-10 w-full text-center sm:text-left">
                <div className="relative group">
                   <div className="absolute -inset-4 bg-white/20 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   
                   {/* Sultan Aura Glow */}
                   {user.isSultan && user.sultanGlowEffect && (
                     <div className={`absolute -inset-8 bg-${user.sultanBadgeColor || 'yellow'}-500/30 rounded-full blur-[3rem] animate-pulse z-0`} />
                   )}

                   <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2.8rem] overflow-hidden border-4 border-white/20 relative z-10 shadow-2xl bg-slate-900 transition-all hover:scale-105 duration-500">
                     <img src={user.avatar || avatarUrl(user.name)} alt={user.name} className="w-full h-full object-cover" />
                   </div>
                </div>
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start mb-2">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tighter drop-shadow-lg">{user.name}</h1>
                    {user.isSultan && (
                      <div className={`flex flex-col items-center sm:items-start`}>
                        <div className={`flex items-center gap-1.5 bg-gradient-to-r from-${user.sultanBadgeColor || 'yellow'}-400 via-${user.sultanBadgeColor || 'yellow'}-500 to-${user.sultanBadgeColor || 'yellow'}-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xl border border-white/20 animate-pulse`}>
                          <Crown className="h-3.5 w-3.5 fill-white" /> SULTAN
                        </div>
                        {user.sultanCustomTag && (
                          <p className={`text-[10px] font-black text-${user.sultanBadgeColor || 'yellow'}-400 tracking-[0.2em] mt-1 drop-shadow-md uppercase`}>
                            {user.sultanCustomTag}
                          </p>
                        )}
                      </div>
                    )}
                    <span className={`flex items-center gap-1 bg-white/10 text-white text-[11px] font-black px-3 py-1 rounded-full border border-white/20 backdrop-blur-md uppercase tracking-widest`}>
                       {user.role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" /> : user.role === 'seller' ? <Store className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                       {user.role}
                    </span>
                  </div>
                  <p className="text-white/70 text-base font-medium drop-shadow-md">{user.email}</p>
                  
                  {/* Social Counters */}
                  <div className="flex gap-6 mt-6 justify-center sm:justify-start">
                    <div className="text-center group cursor-help">
                      <p className="text-xl font-black leading-none">{displayFriends}</p>
                      <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">Teman</p>
                    </div>
                    <div className="text-center group cursor-help border-l border-white/10 pl-6">
                      <p className="text-xl font-black leading-none">{displayFollowers >= 1000 ? (displayFollowers/1000).toFixed(1)+"k" : displayFollowers}</p>
                      <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">Pengikut</p>
                    </div>
                    <div className="text-center group cursor-help border-l border-white/10 pl-6">
                      <p className="text-xl font-black leading-none">{displayFollowing}</p>
                      <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">Mengikuti</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Shopping Statistics (Premium Glass Style) ────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-1000 delay-100">
            {[
              { icon: ShoppingBag, label: "Total Pesanan", value: displayOrders.toString(), color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: Package,     label: "Item Dibeli",   value: displayItems.toString(),  color: "text-purple-400", bg: "bg-purple-400/10" },
              { icon: ShoppingBag, label: "Total Belanja", value: formatPrice(displaySpend), color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { icon: Coins,       label: "Koin Saya",     value: displayCoins.toLocaleString(), color: "text-amber-400", bg: "bg-amber-400/10" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`bg-slate-900/40 border-2 border-white/5 backdrop-blur-xl rounded-[2rem] p-5 text-center shadow-lg group hover:border-white/20 transition-all`}>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className={`text-xl font-black ${color} leading-tight mb-1 truncate px-2`}>{value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Premium Glass Grid (Matching Image) ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PremiumCard 
              href="/exchange" 
              title="Tukar Koin" 
              subtitle={`Saldo: ${user.coins?.toLocaleString() || 0} koin`} 
              icon={Coins} 
              color="text-amber-500" 
              bgColor="bg-amber-500/10"
              borderColor="border-amber-500/20"
            />
            <PremiumCard 
              href="/wishlist" 
              title="Wishlist Saya" 
              subtitle="Produk yang kamu simpan" 
              icon={Heart} 
              color="text-red-500" 
              bgColor="bg-red-500/10"
              borderColor="border-red-500/20"
            />
            <PremiumCard 
              href="/friends" 
              title={`Teman (${(user.friends || []).length})`} 
              subtitle="Lihat & tambah teman" 
              icon={Users} 
              color="text-violet-500" 
              bgColor="bg-violet-500/10"
              borderColor="border-violet-500/20"
            />
            <PremiumCard 
              href="/notifications" 
              title="Notifikasi" 
              subtitle="Pesan & Aktivitas" 
              icon={Bell} 
              color="text-orange-500" 
              bgColor="bg-orange-500/10"
              borderColor="border-orange-500/20"
              count={unreadCount}
            />
            <PremiumCard 
              href="/customize" 
              title="Kustomisasi Profil" 
              subtitle="Ubah bio & tema banner" 
              icon={Palette} 
              color="text-pink-500" 
              bgColor="bg-pink-500/10"
              borderColor="border-pink-500/20"
            />
            <PremiumCard 
              href="/minigames" 
              title="MiniGames" 
              subtitle="Main & dapatkan koin!" 
              icon={Gamepad2} 
              color="text-indigo-500" 
              bgColor="bg-indigo-500/10"
              borderColor="border-indigo-500/20"
            />
            <PremiumCard 
              href="/mysultan" 
              title="MySultan Premium" 
              subtitle={user.isSultan ? "Status: Aktif" : "Cek Keuntungan Elit"} 
              icon={Crown} 
              color="text-yellow-500" 
              bgColor="bg-yellow-500/10"
              borderColor="border-yellow-500/20"
            />
            <PremiumCard 
              href="/mydompet" 
              title="MyDompet" 
              subtitle="Saldo & Transaksi" 
              icon={Wallet} 
              color="text-blue-500" 
              bgColor="bg-blue-500/10"
              borderColor="border-blue-500/20"
            />
            <PremiumCard 
              href="/auction" 
              title="Pusat Lelang" 
              subtitle="Bid barang impian" 
              icon={Gavel} 
              color="text-amber-600" 
              bgColor="bg-amber-600/10"
              borderColor="border-amber-600/20"
            />
            <PremiumCard 
              href="/tickets" 
              title="Pusat Bantuan" 
              subtitle="Dashboard Tiket" 
              icon={Ticket} 
              color="text-teal-500" 
              bgColor="bg-teal-500/10"
              borderColor="border-teal-500/20"
            />
            <PremiumCard 
              href="/myredeem" 
              title="Tukar Kode" 
              subtitle="Redeem hadiah dari admin" 
              icon={Gift} 
              color="text-emerald-500" 
              bgColor="bg-emerald-500/10"
              borderColor="border-emerald-500/20"
            />
            <PremiumCard 
              href="/mymusic" 
              title="MyMusic" 
              subtitle="Dengarkan lagu favoritmu" 
              icon={Music} 
              color="text-rose-500" 
              bgColor="bg-rose-500/10"
              borderColor="border-rose-500/20"
            />
            <PremiumCard 
              href="/aichat" 
              title="Cynmatic AI Chat" 
              subtitle="Tanya asisten cerdasmu" 
              icon={Bot} 
              color="text-indigo-600" 
              bgColor="bg-indigo-600/10"
              borderColor="border-indigo-600/20"
            />
            <PremiumCard 
              href="/leaderboard" 
              title="Leaderboard" 
              subtitle="Lihat top seller & pembeli" 
              icon={Trophy} 
              color="text-yellow-600" 
              bgColor="bg-yellow-600/10"
              borderColor="border-yellow-600/20"
            />
            <PremiumCard 
              href="/ban-leaderboard" 
              title="Ban Leaderboard" 
              subtitle="Daftar pengguna bermasalah" 
              icon={ShieldAlert} 
              color="text-red-600" 
              bgColor="bg-red-600/10"
              borderColor="border-red-600/20"
            />
            <PremiumCard 
              href="/voting" 
              title="Sistem Voting" 
              subtitle="Ikuti poling & suara rakyat" 
              icon={VoteIcon} 
              color="text-cyan-500" 
              bgColor="bg-cyan-500/10"
              borderColor="border-cyan-500/20"
            />
            <PremiumCard 
              href="/cosmetics" 
              title="Cynmatic Cosmetics" 
              subtitle="Kustomisasi Identity Tag" 
              icon={Palette} 
              color="text-indigo-400" 
              bgColor="bg-indigo-400/10"
              borderColor="border-indigo-400/20"
            />
            <PremiumCard 
              href="/affiliate" 
              title="Cynmatic Affiliate" 
              subtitle="Ajak teman & dapet koin" 
              icon={Users} 
              color="text-blue-600" 
              bgColor="bg-blue-600/10"
              borderColor="border-blue-600/20"
            />
            <PremiumCard 
              href="/about-us" 
              title="Tentang Kami" 
              subtitle="Cerita dibalik Cynmatic" 
              icon={Sparkles} 
              color="text-indigo-400" 
              bgColor="bg-indigo-400/10"
              borderColor="border-indigo-400/20"
            />
          </div>

          {/* Role Dashboard Access */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {user.role === "admin" && (
              <Link href="/admin">
                <div className="bg-orange-500/10 border-2 border-orange-500/20 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-orange-500/20 transition-all">
                  <ShieldCheck className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="font-black text-sm text-orange-500 uppercase tracking-widest">Admin Panel</p>
                </div>
              </Link>
            )}
            {(user.role === "seller" || user.role === "admin") && (
              <Link href="/seller">
                <div className="bg-purple-500/10 border-2 border-purple-500/20 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-purple-500/20 transition-all">
                  <Store className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="font-black text-sm text-purple-500 uppercase tracking-widest">Seller Dashboard</p>
                </div>
              </Link>
            )}
            {(user.role === "kurir" || user.role === "admin") && (
              <Link href="/courier">
                <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-[2rem] p-6 text-center cursor-pointer hover:bg-blue-500/20 transition-all">
                  <Truck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-black text-sm text-blue-500 uppercase tracking-widest">Kurir Dashboard</p>
                </div>
              </Link>
            )}
          </div>

        </div>
      ) : (
        <SimpleProfileLayout 
          user={user} 
          displaySpend={displaySpend} 
          displayOrders={displayOrders} 
          displayItems={displayItems}
          displayFriends={displayFriends}
          displayFollowers={displayFollowers}
          displayFollowing={displayFollowing}
        />
      )}

      {/* ── Shared Account Information (Restored) ────────────────────────────────── */}
      <div className="bg-card border-2 rounded-[2.5rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
        <div className="px-8 py-5 bg-muted/20 border-b flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Informasi Akun & Keamanan</h2>
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="divide-y-2 divide-muted/50">
          <InfoRow icon={Mail} label="Alamat Email" value={user.email} />
          <InfoRow icon={ShieldCheck} label="Status Akun" value={ROLE_LABEL[user.role]} badge={ROLE_COLOR[user.role]} />
          <InfoRow icon={Calendar} label="Tanggal Bergabung" value={formatDate(user.createdAt)} />
          <InfoRow icon={Globe} label="IP Publik" value={user.publicIp || "Mendeteksi..."} />
          <InfoRow icon={Wifi} label="IP Lokal" value={user.localIp || "Mendeteksi..."} />
        </div>
      </div>

      {/* Logout Button (Global - Bottom) */}
      <Button variant="outline" className="w-full h-14 rounded-3xl border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs" 
        onClick={handleLogout} data-testid="button-logout-profile">
        <LogOut className="h-4 w-4 mr-2" />Keluar dari Akun
      </Button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, badge }: any) {
  return (
    <div className="flex items-center gap-6 px-8 py-5 hover:bg-muted/10 transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">{label}</p>
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm truncate">{value}</p>
          {badge && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${badge}`}>
              {value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleProfileLayout({ user, displaySpend, displayOrders, displayItems, displayFriends, displayFollowers, displayFollowing }: any) {
  const { unreadCount } = useNotifications();
  const menuItems = [
    { label: "MyDompet", icon: Wallet, color: "bg-blue-500", href: "/mydompet" },
    { label: "MySultan", icon: Crown, color: "bg-amber-500", href: "/mysultan" },
    { label: "Teman", icon: Users, color: "bg-violet-500", href: "/friends", count: displayFriends },
    { label: "Customize", icon: Palette, color: "bg-pink-500", href: "/customize" },
    { label: "MiniGames", icon: Gamepad2, color: "bg-indigo-500", href: "/minigames" },
    { label: "Wishlist", icon: Heart, color: "bg-red-500", href: "/wishlist" },
    { label: "Lelang", icon: Gavel, color: "bg-amber-600", href: "/auction" },
    { label: "Tukar Koin", icon: Coins, color: "bg-orange-500", href: "/exchange" },
    { label: "Affiliate", icon: Users, color: "bg-blue-600", href: "/affiliate" },
    { label: "Notifikasi", icon: Bell, color: "bg-orange-500", href: "/notifications", count: unreadCount },
    { label: "Tukar Kode", icon: Gift, color: "bg-emerald-500", href: "/myredeem" },
    { label: "MyMusic", icon: Music, color: "bg-rose-500", href: "/mymusic" },
    { label: "AI Chat", icon: Bot, color: "bg-indigo-600", href: "/aichat" },
    { label: "Leaderboard", icon: Trophy, color: "bg-yellow-600", href: "/leaderboard" },
    { label: "Ban List", icon: ShieldAlert, color: "bg-red-600", href: "/ban-leaderboard" },
    { label: "Voting", icon: VoteIcon, color: "bg-cyan-500", href: "/voting" },
    { label: "Cosmetic", icon: Palette, color: "bg-indigo-400", href: "/cosmetics" },
    { label: "Bantuan", icon: Ticket, color: "bg-teal-500", href: "/tickets" },
    { label: "Tentang Kami", icon: Sparkles, color: "bg-indigo-400", href: "/about-us" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header Summary */}
      <div className="flex items-center gap-5 p-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm">
            <img src={avatarUrl(user.name)} alt={user.name} className="w-full h-full object-cover" />
          </div>
          {user.isSultan && (
            <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-lg shadow-lg">
              <Crown className="h-3 w-3 fill-current" />
            </div>
          )}
        </div>
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight">{user.name}</h2>
            {user.isSultan && user.sultanCustomTag && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-${user.sultanBadgeColor || 'yellow'}-500/10 text-${user.sultanBadgeColor || 'yellow'}-600 border border-${user.sultanBadgeColor || 'yellow'}-500/20 uppercase tracking-widest`}>
                {user.sultanCustomTag}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
              {user.role}
            </span>
            <p className="text-xs text-muted-foreground font-medium truncate max-w-[150px]">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Grid Menu (DANA Style) */}
      <div className="bg-card border-2 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 ml-1">Layanan Utama</h3>
        <div className="grid grid-cols-4 gap-y-10 gap-x-4">
          {menuItems.map((item, idx) => (
            <Link key={idx} href={item.href}>
              <div className="flex flex-col items-center gap-3 group cursor-pointer">
                <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-300 relative`}>
                  <item.icon className="h-6 w-6" />
                  {item.count !== undefined && item.count > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {item.count}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-bold text-center leading-tight text-slate-700 dark:text-slate-300 transition-colors group-hover:text-primary">
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Pesanan</p>
            <p className="text-xl font-black">{displayOrders}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Belanja</p>
            <p className="text-xl font-black truncate px-2">{formatPrice(displaySpend).replace('Rp', '')}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Pengikut</p>
            <p className="text-xl font-black">{displayFollowers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PremiumCard({ href, title, subtitle, icon: Icon, color, bgColor, borderColor, count }: any) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-4 p-5 bg-card border-2 ${borderColor} rounded-[2rem] hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer shadow-sm group h-full relative overflow-hidden`}>
        {/* Glow effect on hover */}
        <div className={`absolute inset-0 ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -z-10`} />
        
        <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-6 relative`}>
          <Icon className={`h-7 w-7 ${color}`} />
          {count !== undefined && count > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg">
              {count}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm tracking-tight truncate group-hover:text-primary transition-colors">{title}</p>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate opacity-70 group-hover:opacity-100">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
