/**
 * FriendsPage.tsx
 * Halaman teman — sistem Friend Request (Kirim, Terima, Tolak, Hapus).
 */
import React, { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { 
  ChevronLeft, Search, UserPlus, UserMinus, Coins, ShoppingBag,
  Crown, Shield, Truck, User as UserIcon, Star, Sparkles, Check, X as CloseIcon, Clock, MessageSquare,
  TrendingUp
} from "lucide-react";
import { useAuth, User, UserRole } from "../contexts/AuthContext";
import { CryptoBadge } from "../components/CryptoBadge";
import { useCosmetics } from "../contexts/CosmeticContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useNotifications } from "../contexts/NotificationContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

const ROLE_ICON: Record<UserRole, React.ReactNode> = {
  admin: <Crown className="h-3 w-3" />,
  seller: <Star className="h-3 w-3" />,
  kurir: <Truck className="h-3 w-3" />,
  user: <UserIcon className="h-3 w-3" />,
};
const ROLE_LABEL: Record<UserRole, string> = { user: "User", seller: "Seller", admin: "Admin", kurir: "Kurir" };
const ROLE_COLOR: Record<UserRole, string> = {
  user: "bg-blue-100 text-blue-700",
  seller: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
  kurir: "bg-teal-100 text-teal-700",
};

/** Komponen terpisah untuk menghindari Hook Violation */
function FriendProfileCard({ 
  selectedUser, 
  onClose, 
  myFriends, 
  myRequests, 
  mySent, 
  removeFriend, 
  handleAccept, 
  rejectFriendRequest, 
  getUserStats,
  handleSendRequest
}: { 
  selectedUser: User, 
  onClose: () => void,
  myFriends: string[],
  myRequests: string[],
  mySent: string[],
  removeFriend: (id: string) => void,
  handleAccept: (id: string, name: string) => void,
  rejectFriendRequest: (id: string) => void,
  getUserStats: (id: string, role: string) => any,
  handleSendRequest: (id: string, name: string) => void
}) {
  const { cosmetics } = useCosmetics();
  const equippedTags = (selectedUser.equippedCosmetics || [])
    .map(id => cosmetics.find(c => c.id === id))
    .filter(c => c?.type === "tag");
  
  const stats = getUserStats(selectedUser.id, selectedUser.role);
  
  // Real-time animation hook logic
  const [dOrders, setDOrders] = useState(0);
  const [dItems, setDItems] = useState(0);
  const [dSpend, setDSpend] = useState(0);
  const [dCoins, setDCoins] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;
    
    // Reset counters when user changes
    setDOrders(0); setDItems(0); setDSpend(0); setDCoins(0);
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setDOrders(Math.floor(stats.totalOrders * progress));
      setDItems(Math.floor(stats.totalItems * progress));
      setDSpend(Math.floor(stats.totalSpend * progress));
      setDCoins(Math.floor((selectedUser.coins || 0) * progress));
      if (currentStep >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, [selectedUser.id, stats.totalOrders, stats.totalItems, stats.totalSpend, selectedUser.coins]);

  return (
    <div className="bg-[#120f11] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden animate-in fade-in zoom-in-95 transition-all duration-500 mb-8 max-w-2xl mx-auto">
      {/* Header / Banner Area */}
      <div className="relative h-64 overflow-hidden group">
        {selectedUser.useAnimation && selectedUser.youtubeId ? (
          <div className="absolute inset-0 z-0">
            <iframe
              className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 aspect-video brightness-[0.6] blur-[1px]"
              src={`https://www.youtube.com/embed/${selectedUser.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${selectedUser.youtubeId}&showinfo=0&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120f11] via-transparent to-black/20" />
          </div>
        ) : (
          <div className={`absolute inset-0 z-0 bg-gradient-to-br ${selectedUser.theme || "from-violet-600 to-indigo-900"}`} />
        )}
        
        <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-xl rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-all border border-white/10">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Profile Info Overlay */}
      <div className="px-10 pb-10 -mt-20 relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 mb-8">
          <div className="relative">
             {/* Sultan Aura Glow */}
             {selectedUser.isSultan && selectedUser.sultanGlowEffect && (
               <div className={`absolute -inset-6 bg-${selectedUser.sultanBadgeColor || 'yellow'}-500/20 rounded-[3rem] blur-2xl animate-pulse z-0`} />
             )}
             <img
              src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUser.name)}&backgroundColor=6d28d9&fontColor=ffffff&fontSize=40`}
              alt={selectedUser.name}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] border-4 border-white shadow-2xl relative z-10 bg-slate-900 object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0 pb-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap mb-1">
              <h2 className="text-3xl font-black text-white drop-shadow-lg tracking-tighter">{selectedUser.name}</h2>
              {selectedUser.isSultan && (
                <div className={`flex items-center gap-1.5 bg-gradient-to-r from-${selectedUser.sultanBadgeColor || 'yellow'}-400 to-${selectedUser.sultanBadgeColor || 'yellow'}-600 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-xl border border-white/20 animate-pulse`}>
                  <Crown className="h-3.5 w-3.5 fill-white" /> SULTAN
                </div>
              )}
              {selectedUser.isMyCryptoMember && <CryptoBadge />}
            </div>
            <p className="text-sm text-white/40 font-bold mb-4">{selectedUser.email}</p>
            
            <div className="flex justify-center sm:justify-start">
              {myFriends.includes(selectedUser.id) ? (
                <Button onClick={() => removeFriend(selectedUser.id)} variant="outline" className="rounded-2xl border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white h-12 px-8 font-black uppercase tracking-widest text-[10px]">
                  Hapus Teman
                </Button>
              ) : myRequests.includes(selectedUser.id) ? (
                <div className="flex gap-2">
                  <Button onClick={() => handleAccept(selectedUser.id, selectedUser.name)} className="rounded-2xl bg-green-600 hover:bg-green-700 text-white h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-600/20">
                    Terima
                  </Button>
                  <Button onClick={() => rejectFriendRequest(selectedUser.id)} variant="outline" className="rounded-2xl border-white/10 text-white/60 h-12 px-4 font-black">
                    <CloseIcon className="h-5 w-5" />
                  </Button>
                </div>
              ) : mySent.includes(selectedUser.id) ? (
                <Button disabled className="rounded-2xl bg-black border border-red-900/50 text-red-600/80 h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-900/10">
                   DIKIRIM (MENUNGGU)
                </Button>
              ) : (
                <Button onClick={() => handleSendRequest(selectedUser.id, selectedUser.name)} className="rounded-2xl bg-violet-600 hover:bg-violet-700 text-white h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-violet-600/30 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Tambah Teman
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio & Expiry */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
           <div className="flex-1">
              <p className="text-sm text-white/30 italic border-l-2 border-white/10 pl-4 py-1">"{selectedUser.bio || "Tidak ada bio"}"</p>
           </div>
           {selectedUser.isSultan && selectedUser.sultanExpiry && (
             <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <Clock className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Sultan aktif: {(() => {
                  const diff = new Date(selectedUser.sultanExpiry).getTime() - Date.now();
                  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  return days > 0 ? `${days} Hari` : "Habis";
                })()}</span>
             </div>
           )}
           {selectedUser.isMyCryptoMember && selectedUser.myCryptoExpiry && (
             <div className="flex items-center gap-2 bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-600/20 shadow-lg shadow-blue-900/10">
                <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Crypto aktif: {(() => {
                  const diff = new Date(selectedUser.myCryptoExpiry).getTime() - Date.now();
                  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  return days > 0 ? `${days} Hari` : "Habis";
                })()}</span>
             </div>
           )}
        </div>

        {/* Role & Social Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${ROLE_COLOR[selectedUser.role]}`}>
             {ROLE_LABEL[selectedUser.role]}
          </span>
          <div className="flex items-center gap-1.5 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 shadow-sm">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-black text-amber-500 tracking-widest">{dCoins.toLocaleString("id-ID")}</span>
          </div>
          {selectedUser.isSultan && selectedUser.sultanCustomTag && (
             <span className={`text-[10px] font-black px-4 py-1.5 rounded-full bg-${selectedUser.sultanBadgeColor || 'yellow'}-500/10 text-${selectedUser.sultanBadgeColor || 'yellow'}-400 border border-${selectedUser.sultanBadgeColor || 'yellow'}-500/20 uppercase tracking-widest`}>
                {selectedUser.sultanCustomTag}
             </span>
          )}

          <div className="flex gap-2 ml-auto">
             {[
               { label: "Teman", count: (selectedUser.friends || []).length },
               { label: "Pengikut", count: (selectedUser.friendRequests || []).length + (selectedUser.friends || []).length },
               { label: "Mengikuti", count: (selectedUser.sentRequests || []).length + (selectedUser.friends || []).length },
             ].map((s, idx) => (
               <div key={idx} className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-center min-w-[70px]">
                 <p className="text-sm font-black text-white leading-none">{s.count}</p>
                 <p className="text-[8px] uppercase font-black text-white/30 tracking-tighter mt-1">{s.label}</p>
               </div>
             ))}
          </div>
        </div>

        {/* 3 Large Stats Boxes (From Image) */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-[2rem] p-6 text-center border border-white/5 group animate-in zoom-in-95 duration-500">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-purple-400 leading-none mb-1">{dOrders.toLocaleString()}</p>
            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{selectedUser.role === "admin" || selectedUser.role === "seller" ? "Penjualan" : "Pesanan"}</p>
          </div>
          <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-[2rem] p-6 text-center border border-white/5 group animate-in zoom-in-95 duration-700">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-blue-400 leading-none mb-1">{dItems.toLocaleString()}</p>
            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">Item</p>
          </div>
          <div className="bg-white/10 rounded-[2rem] p-6 text-center border-2 border-green-500/20 group animate-in zoom-in-95 duration-1000 shadow-xl shadow-green-900/10">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Coins className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-green-400 leading-none mb-1 truncate">{formatPrice(dSpend)}</p>
            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{selectedUser.role === "admin" || selectedUser.role === "seller" ? "Omzet" : "Belanja"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FriendsPage() {
  const { 
    user, getAllUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend 
  } = useAuth();
  const { cosmetics } = useCosmetics();
  const { getAllOrders } = useOrderHistory();
  const { addNotification } = useNotifications();
  const allOrders = getAllOrders();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"friends" | "followers" | "following" | "discover">("friends");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const allUsers = useMemo(() => getAllUsers(), [user]);
  const myFriends = user?.friends || [];
  const myRequests = user?.friendRequests || [];
  const mySent = user?.sentRequests || [];

  const followersCount = (user?.friendRequests || []).length + (user?.friends || []).length;
  const followingCount = (user?.sentRequests || []).length + (user?.friends || []).length;
  const friendsCount = (user?.friends || []).length;

  const friendUsers = allUsers.filter(u => myFriends.includes(u.id));
  const followerUsers = allUsers.filter(u => myRequests.includes(u.id));
  const followingUsers = allUsers.filter(u => mySent.includes(u.id));
  const discoverUsers = allUsers.filter(u => 
    u.id !== user?.id && 
    !myFriends.includes(u.id) && 
    !myRequests.includes(u.id) && 
    !mySent.includes(u.id)
  );

  const filtered = useMemo(() => {
    let base = [];
    if (tab === "friends") base = friendUsers;
    else if (tab === "followers") base = followerUsers;
    else if (tab === "following") base = followingUsers;
    else base = discoverUsers;

    return base.filter(u =>
      !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [tab, search, friendUsers, followerUsers, followingUsers, discoverUsers]);

  const getUserStats = (userId: string, role: UserRole) => {
    // If Admin or Seller, show SALES stats to look pro
    if (role === "admin" || role === "seller") {
      // Admin Toko gets "Global Stats" simulation to look active
      if (userId === "admin-001") { 
        return {
          totalOrders: 1250 + allOrders.length,
          totalSpend: 15750000 + allOrders.reduce((s, o) => s + o.grandTotal, 0),
          totalItems: 3400 + allOrders.reduce((s, o) => o.items.reduce((ss, i) => ss + i.quantity, 0), 0),
        };
      }
      // Other sellers
      return {
        totalOrders: 42 + allOrders.filter(o => o.items.some(i => i.sellerName === "Seller")).length,
        totalSpend: 850000 + allOrders.reduce((s, o) => s + o.grandTotal, 0),
        totalItems: 120,
      };
    }

    // Regular users show PURCHASE stats
    const orders = allOrders.filter(o => o.userId === userId);
    return {
      totalOrders: orders.length,
      totalSpend: orders.reduce((sum, o) => sum + o.grandTotal, 0),
      totalItems: orders.reduce((sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0), 0),
    };
  };

  const handleSendRequest = (id: string, name: string) => {
    if (mySent.includes(id)) return; // Anti-spam
    sendFriendRequest(id);
    
    // UI Toast
    toast({ 
      title: "Berhasil Mengikuti!", 
      description: `Kamu sekarang mengikuti ${name}. Menunggu konfirmasi...` 
    });

    // Global Notification
    addNotification({
      type: "friend_request",
      title: "Permintaan Pertemanan",
      message: `Kamu mengirim permintaan pertemanan ke ${name}.`,
    });
  };

  const handleAccept = (id: string, name: string) => {
    acceptFriendRequest(id);
    toast({ title: "Permintaan Diterima", description: `Kamu sekarang berteman dengan ${name}!` });
  };

  const [displayFriends, setDisplayFriends] = useState(0);
  const [displayRequests, setDisplayRequests] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setDisplayFriends(Math.floor(myFriends.length * progress));
      setDisplayRequests(Math.floor(myRequests.length * progress));
      if (currentStep >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, [myFriends.length, myRequests.length]);

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f9fafb] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white pb-14 pt-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/profile" className="inline-flex items-center text-purple-200 hover:text-white transition-colors mb-6 font-medium text-sm">
            <ChevronLeft className="h-5 w-5 mr-1" /> Kembali ke Profil
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-purple-200" /> Teman Saya
              </h1>
              <p className="text-purple-200 font-medium">Kelola pertemanan dan permintaan di Toko Online!</p>
            </div>
            <div className="flex gap-2">
              <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-md text-center shadow-lg transition-transform hover:scale-105 duration-300">
                <p className="text-3xl font-black text-white drop-shadow-md">{displayFriends}</p>
                <p className="text-[9px] text-purple-200 font-bold uppercase tracking-widest">Teman</p>
              </div>
              {myRequests.length > 0 && (
                <div className="bg-orange-500/30 px-5 py-3 rounded-2xl border border-orange-400/50 backdrop-blur-md text-center shadow-lg animate-pulse transition-transform hover:scale-105 duration-300">
                  <p className="text-3xl font-black text-orange-400 drop-shadow-md">{displayRequests}</p>
                  <p className="text-[9px] text-orange-200 font-bold uppercase tracking-widest">Request</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10 space-y-5">
        {/* Search & Tabs */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama atau email..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-background text-foreground"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(["friends", "followers", "following", "discover"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedUser(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === t ? "bg-purple-600 text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
              >
                {t === "friends" ? `Teman (${friendUsers.length})` : 
                 t === "followers" ? `Pengikut (${followerUsers.length})` : 
                 t === "following" ? `Mengikuti (${followingUsers.length})` : 
                 "Jelajahi"}
              </button>
            ))}
          </div>
        </div>

        {/* Selected User Profile Card */}
        {selectedUser && (
          <FriendProfileCard 
            selectedUser={selectedUser}
            onClose={() => setSelectedUser(null)}
            myFriends={myFriends}
            myRequests={myRequests}
            mySent={mySent}
            removeFriend={removeFriend}
            handleAccept={handleAccept}
            rejectFriendRequest={rejectFriendRequest}
            getUserStats={getUserStats}
            handleSendRequest={handleSendRequest}
          />
        )}

        {/* User List */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <UserIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-muted-foreground">
                {tab === "friends" ? "Belum ada teman." : 
                 tab === "followers" ? "Tidak ada pengikut baru." : 
                 tab === "following" ? "Anda tidak sedang mengikuti siapapun." : 
                 "Tidak ada user ditemukan."}
              </p>
              {tab !== "discover" && (
                <Button onClick={() => setTab("discover")} variant="link" className="text-purple-600 mt-2">
                  Jelajahi User Lain
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(u => {
                const isFriend = myFriends.includes(u.id);
                const isRequest = myRequests.includes(u.id);
                const isSent = mySent.includes(u.id);

                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/80 transition-colors cursor-pointer relative"
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="relative flex-shrink-0">
                      {/* Friend Sultan Aura */}
                      {u.isSultan && u.sultanGlowEffect && (
                        <div className={`absolute -inset-2 bg-${u.sultanBadgeColor || 'amber'}-500/20 rounded-full blur-md animate-pulse z-0`} />
                      )}
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=6d28d9&fontColor=ffffff&fontSize=40`}
                        alt={u.name}
                        className="w-11 h-11 rounded-xl object-cover bg-white relative z-10 border border-muted"
                      />
                      {u.isSultan && (
                        <div className={`absolute -top-1 -right-1 bg-${u.sultanBadgeColor || 'amber'}-500 text-white p-0.5 rounded-md shadow-sm border border-white z-20`}>
                          <Crown className="h-2 w-2 fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{u.name}</p>
                        {u.isSultan && u.sultanCustomTag && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-${u.sultanBadgeColor || 'amber'}-500/10 text-${u.sultanBadgeColor || 'amber'}-600 border border-${u.sultanBadgeColor || 'amber'}-500/20 uppercase tracking-widest`}>
                            {u.sultanCustomTag}
                          </span>
                        )}
                        {u.isMyCryptoMember && <CryptoBadge className="scale-75 origin-left" />}
                        {(u.equippedCosmetics || []).map(cid => {
                          const c = cosmetics.find(cosm => cosm.id === cid);
                          return c?.type === "tag" ? (
                            <span key={cid} className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-widest border border-primary/10">
                              {c.value}
                            </span>
                          ) : null;
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLOR[u.role]}`}>
                          {ROLE_LABEL[u.role]}
                        </span>
                        {u.isSultan && (
                           <div className="flex items-center gap-1.5">
                             <span className={`text-[9px] font-black text-${u.sultanBadgeColor || 'amber'}-600 uppercase tracking-widest bg-${u.sultanBadgeColor || 'amber'}-50 px-1 rounded border border-${u.sultanBadgeColor || 'amber'}-200 flex items-center gap-0.5`}>
                               <Crown className="h-2 w-2" /> Sultan
                             </span>
                             {u.sultanExpiry && (
                               <span className="text-[8px] font-black text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                 <Clock className="h-2 w-2" /> {(() => {
                                   const diff = new Date(u.sultanExpiry).getTime() - Date.now();
                                   const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                   return days > 0 ? `${days}h` : "Habis";
                                 })()}
                               </span>
                             )}
                           </div>
                        )}
                        {u.isMyCryptoMember && (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1 rounded border border-blue-200 flex items-center gap-0.5`}>
                                <TrendingUp className="h-2 w-2" /> Crypto
                              </span>
                              {u.myCryptoExpiry && (
                                <span className="text-[8px] font-black text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock className="h-2 w-2" /> {(() => {
                                    const diff = new Date(u.myCryptoExpiry).getTime() - Date.now();
                                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                    return days > 0 ? `${days}h` : "Habis";
                                  })()}
                                </span>
                              )}
                            </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {isFriend ? (
                        <div className="flex gap-1">
                          <Link href={`/chat/${u.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-red-100 text-red-500 hover:bg-red-50"
                            onClick={() => removeFriend(u.id)}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : isRequest ? (
                        <div className="flex gap-1">
                          <Button size="sm" className="h-8 w-8 p-0 bg-green-600" onClick={() => handleAccept(u.id, u.name)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-200 text-red-500" onClick={() => rejectFriendRequest(u.id)}>
                            <CloseIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : isSent ? (
                        <span className="text-[9px] font-black text-red-600/70 bg-black border border-red-900/40 px-3 py-1.5 rounded-xl uppercase tracking-tighter shadow-sm">
                          Menunggu
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleSendRequest(u.id, u.name)}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" /> Tambah
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
