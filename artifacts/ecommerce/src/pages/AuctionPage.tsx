/**
 * AuctionPage.tsx
 * Halaman Lelang (Auction) — Bid barang impianmu!
 */
import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  ChevronLeft, Gavel, Timer, TrendingUp, Users, 
  ArrowUpRight, AlertCircle, ShoppingBag, Clock,
  ChevronRight, Search, Filter, History
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAuction, Auction } from "../contexts/AuctionContext";
import { useWallet } from "../contexts/WalletContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

export function AuctionPage() {
  const { user } = useAuth();
  const { auctions, placeBid } = useAuction();
  const { balance, spend } = useWallet();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "ended">("active");
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState("");

  const filtered = auctions.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || a.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handlePlaceBid = (auction: Auction) => {
    const amount = Number(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Masukkan jumlah bid yang valid" });
      return;
    }

    if (amount > balance) {
      toast({ 
        variant: "destructive", 
        title: "Saldo Tidak Cukup", 
        description: "Silakan isi saldo MyDompet kamu terlebih dahulu." 
      });
      return;
    }

    const result = placeBid(auction.id, amount);
    if (result.ok) {
      // Deduct from wallet (actually in auction it's usually held, but for simplicity let's just spend it or just check balance)
      // For this system, we'll just check balance. Real payment happens at end.
      toast({ title: "Bid Berhasil!", description: `Kamu menawar ${formatPrice(amount)}` });
      setBidAmount("");
    } else {
      toast({ variant: "destructive", title: "Bid Gagal", description: result.error });
    }
  };

  const getTimeLeft = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return "Berakhir";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}j ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f9fafb] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white pb-14 pt-8 px-4 shadow-xl">
        <div className="max-w-3xl mx-auto">
          <Link href="/profile" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6 font-medium text-sm">
            <ChevronLeft className="h-5 w-5 mr-1" /> Kembali ke Profil
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
                <Gavel className="h-8 w-8 text-amber-500" /> Pusat Lelang
              </h1>
              <p className="text-gray-400 text-sm">Bid barang impian dengan harga terbaik!</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
               <p className="text-[10px] text-gray-500 font-bold uppercase">MyDompet</p>
               <p className="text-lg font-black text-amber-400">{formatPrice(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        
        {/* Search & Filter */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari barang lelang..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:outline-none focus:border-amber-500 transition"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(["active", "ended", "all"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                  filter === f ? "bg-gray-900 border-gray-900 text-white" : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f === "active" ? "Lelang Aktif" : f === "ended" ? "Sudah Berakhir" : "Semua"}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Auction Detail */}
        {selectedAuction && (
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-amber-500 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative h-64">
              <img src={selectedAuction.imageUrl} alt={selectedAuction.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <button onClick={() => setSelectedAuction(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                <ChevronLeft className="h-5 w-5 rotate-180" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex justify-between items-end">
                   <div>
                      <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase mb-2 inline-block tracking-wider">
                        Sedang Berlangsung
                      </span>
                      <h2 className="text-2xl font-black leading-tight">{selectedAuction.title}</h2>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] opacity-70 font-bold uppercase">Harga Saat Ini</p>
                      <p className="text-2xl font-black text-amber-400">{formatPrice(selectedAuction.currentPrice)}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                 <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <Timer className="h-4 w-4 text-amber-600 mb-1" />
                    <p className="text-[10px] text-gray-500 font-bold">SISA WAKTU</p>
                    <p className="text-sm font-black text-gray-800">{getTimeLeft(selectedAuction.endTime)}</p>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <TrendingUp className="h-4 w-4 text-amber-600 mb-1" />
                    <p className="text-[10px] text-gray-500 font-bold">BID MINIMAL</p>
                    <p className="text-sm font-black text-gray-800">+{formatPrice(selectedAuction.minStep)}</p>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <Users className="h-4 w-4 text-amber-600 mb-1" />
                    <p className="text-[10px] text-gray-500 font-bold">PENAMBAL</p>
                    <p className="text-sm font-black text-gray-800">{selectedAuction.bids.length} Bid</p>
                 </div>
              </div>

              {selectedAuction.status === "active" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      placeholder={`Min: ${selectedAuction.currentPrice + selectedAuction.minStep}`}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-black focus:outline-none focus:border-amber-500 transition"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                       <Button 
                         onClick={() => handlePlaceBid(selectedAuction)}
                         className="bg-amber-500 hover:bg-amber-600 text-black font-black px-8 rounded-xl shadow-lg"
                       >
                         BID SEKARANG
                       </Button>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground">
                    Pastikan saldo MyDompet kamu mencukupi sebelum melakukan penawaran.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl text-center">
                   <p className="font-bold text-amber-900">Pemenang Lelang:</p>
                   <p className="text-2xl font-black text-amber-700">{selectedAuction.winnerName || "Tidak Ada Pemenang"}</p>
                </div>
              )}

              {/* Bid History */}
              <div className="space-y-3">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <History className="h-4 w-4 text-amber-600" /> Riwayat Bid
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {selectedAuction.bids.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground py-4 italic">Belum ada penawaran.</p>
                  ) : (
                    selectedAuction.bids.map((bid, i) => (
                      <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${i === 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-bold border border-gray-200">
                              {bid.userName.charAt(0)}
                            </div>
                            <span className="text-xs font-bold">{bid.userName}</span>
                            {i === 0 && <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Tertinggi</span>}
                         </div>
                         <span className="text-xs font-black">{formatPrice(bid.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auction List */}
        <div className="grid grid-cols-1 gap-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
               <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
               <p className="text-gray-400 font-bold">Tidak ada lelang yang tersedia saat ini.</p>
            </div>
          ) : (
            filtered.map(auction => (
              <div 
                key={auction.id} 
                onClick={() => { setSelectedAuction(auction); setBidAmount(""); }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row h-full">
                  <div className="w-full sm:w-48 h-48 sm:h-auto relative overflow-hidden">
                    <img 
                      src={auction.imageUrl} 
                      alt={auction.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                       <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                         auction.status === "active" ? "bg-amber-500 text-black" : "bg-gray-500 text-white"
                       }`}>
                         {auction.status === "active" ? "LIVE" : "ENDED"}
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                       <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">{auction.sellerName}</p>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                             <Clock className="h-3 w-3" /> {getTimeLeft(auction.endTime)}
                          </div>
                       </div>
                       <h3 className="text-lg font-black text-gray-900 group-hover:text-amber-600 transition-colors">{auction.title}</h3>
                       <p className="text-xs text-muted-foreground line-clamp-1 mb-4">{auction.description}</p>
                    </div>

                    <div className="flex items-end justify-between border-t border-gray-50 pt-4">
                       <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Harga Sekarang</p>
                          <p className="text-xl font-black text-gray-900">{formatPrice(auction.currentPrice)}</p>
                       </div>
                       <div className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold group-hover:bg-amber-500 group-hover:text-black transition-colors">
                          Lihat Lelang
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
