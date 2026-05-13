/**
 * FriendsPage.tsx
 * Halaman teman — sistem Friend Request (Kirim, Terima, Tolak, Hapus).
 */
import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ChevronLeft, Search, UserPlus, UserMinus, Coins, ShoppingBag,
  Crown, Shield, Truck, User as UserIcon, Star, Sparkles, Check, X as CloseIcon, Clock
} from "lucide-react";
import { useAuth, User, UserRole } from "../contexts/AuthContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
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

export function FriendsPage() {
  const { 
    user, getAllUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend 
  } = useAuth();
  const { state } = useOrderHistory();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"friends" | "requests" | "discover">("friends");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const allUsers = useMemo(() => getAllUsers(), [user]);
  const myFriends = user?.friends || [];
  const myRequests = user?.friendRequests || [];
  const mySent = user?.sentRequests || [];

  const friendUsers = allUsers.filter(u => myFriends.includes(u.id));
  const requestUsers = allUsers.filter(u => myRequests.includes(u.id));
  const discoverUsers = allUsers.filter(u => u.id !== user?.id && !myFriends.includes(u.id) && !myRequests.includes(u.id));

  const filtered = useMemo(() => {
    let base = [];
    if (tab === "friends") base = friendUsers;
    else if (tab === "requests") base = requestUsers;
    else base = discoverUsers;

    return base.filter(u =>
      !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [tab, search, friendUsers, requestUsers, discoverUsers]);

  const getUserStats = (userId: string) => {
    const orders = state.orders.filter(o => o.userId === userId);
    return {
      totalOrders: orders.length,
      totalSpend: orders.reduce((sum, o) => sum + o.grandTotal, 0),
      totalItems: orders.reduce((sum, o) => o.items.reduce((s, i) => s + i.quantity, s), 0),
    };
  };

  const handleSendRequest = (id: string, name: string) => {
    sendFriendRequest(id);
    toast({ title: "Permintaan Terkirim", description: `Permintaan pertemanan dikirim ke ${name}.` });
  };

  const handleAccept = (id: string, name: string) => {
    acceptFriendRequest(id);
    toast({ title: "Permintaan Diterima", description: `Kamu sekarang berteman dengan ${name}!` });
  };

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
              <p className="text-purple-200">Kelola pertemanan dan permintaan di Toko Online!</p>
            </div>
            <div className="flex gap-2">
              <div className="bg-white/20 px-4 py-3 rounded-2xl border border-white/30 backdrop-blur-sm text-center">
                <p className="text-2xl font-extrabold">{myFriends.length}</p>
                <p className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider">Teman</p>
              </div>
              {myRequests.length > 0 && (
                <div className="bg-orange-500/80 px-4 py-3 rounded-2xl border border-orange-400 backdrop-blur-sm text-center animate-pulse">
                  <p className="text-2xl font-extrabold">{myRequests.length}</p>
                  <p className="text-[10px] text-orange-100 font-semibold uppercase tracking-wider">Request</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10 space-y-5">
        {/* Search & Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama atau email..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(["friends", "requests", "discover"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedUser(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === t ? "bg-purple-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {t === "friends" ? `Teman (${friendUsers.length})` : 
                 t === "requests" ? `Permintaan (${requestUsers.length})` : 
                 `Jelajahi`}
              </button>
            ))}
          </div>
        </div>

        {/* Selected User Profile Card */}
        {selectedUser && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className={`bg-gradient-to-r ${selectedUser.theme || "from-violet-500 to-purple-600"} h-28 relative`}>
              <button onClick={() => setSelectedUser(null)} className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-white/40 transition">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 pb-6 -mt-10">
              <div className="flex items-end gap-4 mb-4">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUser.name)}&backgroundColor=6d28d9&fontColor=ffffff&fontSize=40`}
                  alt={selectedUser.name}
                  className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg"
                />
                <div className="flex-1 min-w-0 pb-1">
                  <h2 className="text-xl font-extrabold truncate">{selectedUser.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                
                {/* Actions based on relationship */}
                <div className="flex gap-2">
                  {myFriends.includes(selectedUser.id) ? (
                    <Button
                      onClick={() => removeFriend(selectedUser.id)}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4 mr-1" /> Hapus
                    </Button>
                  ) : myRequests.includes(selectedUser.id) ? (
                    <>
                      <Button onClick={() => handleAccept(selectedUser.id, selectedUser.name)} className="bg-green-600 hover:bg-green-700 text-white">
                        <Check className="h-4 w-4 mr-1" /> Terima
                      </Button>
                      <Button onClick={() => rejectFriendRequest(selectedUser.id)} variant="outline" className="text-red-600 border-red-200">
                        <CloseIcon className="h-4 w-4" />
                      </Button>
                    </>
                  ) : mySent.includes(selectedUser.id) ? (
                    <Button disabled variant="outline" className="bg-gray-50 text-gray-400">
                      <Clock className="h-4 w-4 mr-1" /> Menunggu
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSendRequest(selectedUser.id, selectedUser.name)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-1" /> Tambah
                    </Button>
                  )}
                </div>
              </div>

              {selectedUser.bio && (
                <p className="text-sm text-muted-foreground mb-4 italic border-l-4 border-purple-200 pl-3">"{selectedUser.bio}"</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${ROLE_COLOR[selectedUser.role]}`}>
                  {ROLE_ICON[selectedUser.role]} {ROLE_LABEL[selectedUser.role]}
                </span>
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Coins className="h-3 w-3 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-700">{(selectedUser.coins || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Stats */}
              {(() => {
                const stats = getUserStats(selectedUser.id);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                      <ShoppingBag className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                      <p className="text-lg font-extrabold text-purple-700">{stats.totalOrders}</p>
                      <p className="text-[10px] text-purple-500 font-medium">Pesanan</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                      <ShoppingBag className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-extrabold text-blue-700">{stats.totalItems}</p>
                      <p className="text-[10px] text-blue-500 font-medium">Item</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                      <Coins className="h-4 w-4 text-green-500 mx-auto mb-1" />
                      <p className="text-lg font-extrabold text-green-700">{formatPrice(stats.totalSpend)}</p>
                      <p className="text-[10px] text-green-500 font-medium">Belanja</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <UserIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-muted-foreground">
                {tab === "friends" ? "Belum ada teman." : 
                 tab === "requests" ? "Tidak ada permintaan masuk." : 
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
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(u)}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=6d28d9&fontColor=ffffff&fontSize=40`}
                      alt={u.name}
                      className="w-11 h-11 rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{u.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLOR[u.role]}`}>
                          {ROLE_LABEL[u.role]}
                        </span>
                        {u.bio && <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{u.bio}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {isFriend ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-red-100 text-red-500 hover:bg-red-50"
                          onClick={() => removeFriend(u.id)}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
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
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
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
