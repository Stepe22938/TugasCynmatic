/**
 * MyDompetPage.tsx
 * Halaman E-Wallet MyDompet — mirip DANA.
 */
import React, { useState } from "react";
import { Link } from "wouter";
import { 
  ChevronLeft, Wallet, Plus, ArrowUpRight, ArrowDownLeft, 
  History, ShieldCheck, CreditCard, Smartphone, Banknote,
  Coins, HelpCircle, ChevronRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useWallet, Transaction } from "../contexts/WalletContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

export function MyDompetPage() {
  const { user, getAllUsers } = useAuth();
  const { balance, transactions, topUp, transfer, request } = useWallet();
  const { toast } = useToast();
  
  // Derive friends objects
  const allUsers = getAllUsers();
  const friends = allUsers.filter(u => user?.friends?.includes(u.id));
  
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpStep, setTopUpStep] = useState<"amount" | "payment">("amount");
  
  const [sendData, setSendData] = useState({ toId: "", toName: "", amount: "" });
  const [requestData, setRequestData] = useState({ fromId: "", fromName: "", amount: "" });

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleTopUpConfirm = () => {
    const amount = Number(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Masukkan jumlah yang valid" });
      return;
    }
    topUp(amount);
    setIsTopUpOpen(false);
    setTopUpAmount("");
    setTopUpStep("amount");
    toast({ title: "Top Up Berhasil!", description: `Saldo ${formatPrice(amount)} telah ditambahkan via Virtual Account.` });
  };

  const handleTransfer = () => {
    const amt = Number(sendData.amount);
    if (!sendData.toId || isNaN(amt) || amt <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Lengkapi data pengiriman" });
      return;
    }
    const success = transfer(sendData.toId, sendData.toName || "User", amt);
    if (success) {
      setIsSendOpen(false);
      setSendData({ toId: "", toName: "", amount: "" });
      toast({ title: "Uang Terkirim!", description: `Berhasil mengirim ${formatPrice(amt)} ke ${sendData.toName || sendData.toId}` });
    } else {
      toast({ variant: "destructive", title: "Saldo Kurang", description: "Saldo kamu tidak cukup untuk transfer ini." });
    }
  };

  const handleRequest = () => {
    const amt = Number(requestData.amount);
    if (!requestData.fromId || isNaN(amt) || amt <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Lengkapi data permintaan" });
      return;
    }
    request(requestData.fromId, requestData.fromName || "User", amt);
    setIsRequestOpen(false);
    setRequestData({ fromId: "", fromName: "", amount: "" });
    toast({ title: "Permintaan Dikirim", description: `Menunggu konfirmasi dari ${requestData.fromName || requestData.fromId}` });
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background pb-24">
      {/* Blue Header - Dana Style */}
      <div className="bg-[#108ee9] text-white pt-8 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link href="/profile" className="p-2 hover:bg-white/10 rounded-full transition">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-bold">MyDompet</h1>
            <HelpCircle className="h-6 w-6 opacity-80" />
          </div>

          <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20">
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium">Saldo MyDompet</span>
            </div>
            <div className="text-4xl font-black mb-6">
              {formatPrice(balance)}
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Plus, label: "Isi Saldo", onClick: () => setIsTopUpOpen(true) },
                { icon: ArrowUpRight, label: "Kirim", onClick: () => setIsSendOpen(true) },
                { icon: ArrowDownLeft, label: "Minta", onClick: () => setIsRequestOpen(true) },
                { icon: History, label: "Riwayat", onClick: () => {} }
              ].map((btn, i) => {
                const Icon = btn.icon;
                return (
                  <button 
                    key={i} 
                    onClick={btn.onClick}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition shadow-sm border border-white/10">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        
        {/* Top Up Modal (Simulated) */}
        {isTopUpOpen && (
          <div className="bg-card rounded-3xl shadow-xl p-6 border border-[#108ee9]/20 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-card-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#108ee9]" /> Isi Saldo MyDompet
              </h3>
              <button onClick={() => { setIsTopUpOpen(false); setTopUpStep("amount"); }} className="text-gray-400 hover:text-muted-foreground"><Plus className="h-5 w-5 rotate-45" /></button>
            </div>

            {topUpStep === "amount" ? (
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">Rp</span>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-4 bg-muted/50 border-2 border-border rounded-2xl text-2xl font-black focus:outline-none focus:border-[#108ee9] transition"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[50000, 100000, 200000, 500000, 1000000, 2000000].map(amt => (
                    <button 
                      key={amt} 
                      onClick={() => setTopUpAmount(amt.toString())}
                      className="py-3 px-1 border-2 border-border rounded-xl text-xs font-bold hover:bg-blue-50 hover:border-blue-200 transition"
                    >
                      {amt.toLocaleString("id-ID")}
                    </button>
                  ))}
                </div>
                <Button onClick={() => setTopUpStep("payment")} disabled={!topUpAmount} className="w-full h-12 rounded-xl bg-[#108ee9] hover:bg-[#0c7cd5] font-black">LANJUT KE PEMBAYARAN</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-bold text-muted-foreground">Pilih Metode Pembayaran:</p>
                <div className="space-y-2">
                  {[
                    { id: "va", name: "Transfer Bank (VA)", sub: "BCA, Mandiri, BNI, BRI", icon: <CreditCard className="h-5 w-5" /> },
                    { id: "qris", name: "QRIS", sub: "Gopay, ShopeePay, LinkAja", icon: <Smartphone className="h-5 w-5" /> },
                    { id: "retail", name: "Gerai Retail", sub: "Alfamart, Indomaret", icon: <History className="h-5 w-5" /> }
                  ].map(m => (
                    <button key={m.id} onClick={handleTopUpConfirm} className="w-full flex items-center gap-4 p-4 border-2 border-border rounded-2xl hover:border-[#108ee9] hover:bg-blue-50 transition group">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center group-hover:bg-card">{m.icon}</div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-sm">{m.name}</p>
                        <p className="text-[10px] text-gray-400">{m.sub}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </button>
                  ))}
                </div>
                <button onClick={() => setTopUpStep("amount")} className="w-full py-2 text-xs font-bold text-[#108ee9]">Kembali ubah nominal</button>
              </div>
            )}
          </div>
        )}

        {/* Send Modal */}
        {isSendOpen && (
          <div className="bg-card rounded-3xl shadow-xl p-6 border border-[#108ee9]/20 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-card-foreground flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-[#108ee9]" /> Kirim Dana
              </h3>
              <button onClick={() => setIsSendOpen(false)} className="text-gray-400 hover:text-muted-foreground"><Plus className="h-5 w-5 rotate-45" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Pilih Teman atau Masukkan ID</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {friends.map(f => (
                    <button key={f.id} onClick={() => setSendData({...sendData, toId: f.id, toName: f.name})}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${sendData.toId === f.id ? "border-[#108ee9] bg-blue-50" : "border-border"}`}>
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xs font-bold">{f.name.charAt(0)}</div>
                      <span className="text-[9px] font-bold">{f.name}</span>
                    </button>
                  ))}
                </div>
                <input 
                  placeholder="Atau masukkan Player ID..."
                  value={sendData.toId}
                  onChange={e => setSendData({...sendData, toId: e.target.value})}
                  className="w-full px-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-[#108ee9]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Jumlah Kirim</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={sendData.amount}
                    onChange={e => setSendData({...sendData, amount: e.target.value})}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-lg font-black focus:outline-none focus:border-[#108ee9]"
                  />
                </div>
              </div>
              <Button onClick={handleTransfer} className="w-full h-12 rounded-xl bg-[#108ee9] hover:bg-[#0c7cd5] font-black">KIRIM SEKARANG</Button>
            </div>
          </div>
        )}

        {/* Request Modal */}
        {isRequestOpen && (
          <div className="bg-card rounded-3xl shadow-xl p-6 border border-[#108ee9]/20 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-card-foreground flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5 text-[#108ee9]" /> Minta Dana
              </h3>
              <button onClick={() => setIsRequestOpen(false)} className="text-gray-400 hover:text-muted-foreground"><Plus className="h-5 w-5 rotate-45" /></button>
            </div>
            <div className="space-y-4">
              <input 
                placeholder="Masukkan Player ID Teman..."
                value={requestData.fromId}
                onChange={e => setRequestData({...requestData, fromId: e.target.value, fromName: "User " + e.target.value})}
                className="w-full px-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-[#108ee9]"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                <input
                  type="number"
                  value={requestData.amount}
                  onChange={e => setRequestData({...requestData, amount: e.target.value})}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-lg font-black focus:outline-none focus:border-[#108ee9]"
                />
              </div>
              <Button onClick={handleRequest} className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 font-black">MINTA SEKARANG</Button>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Dana Kamu Terlindungi</p>
            <p className="text-[11px] text-muted-foreground">MyDompet menjamin keamanan transaksi dengan enkripsi mutakhir.</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-black text-card-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-[#108ee9]" /> Transaksi Terakhir
            </h3>
            <button className="text-[11px] font-bold text-[#108ee9] flex items-center">
              Lihat Semua <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Belum ada transaksi di MyDompet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.slice(0, 10).map(tx => (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 flex items-center gap-4 hover:bg-muted/50/50 transition cursor-pointer active:bg-muted"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === "topup" ? "bg-green-100 text-green-600" :
                    tx.type === "payment" ? "bg-blue-100 text-blue-600" :
                    tx.type === "auction_bid" ? "bg-purple-100 text-purple-600" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {tx.type === "topup" ? <Banknote className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className={`text-sm font-black ${
                    tx.amount > 0 ? "text-green-600 dark:text-green-400" : 
                    tx.amount < 0 ? "text-red-600 dark:text-red-400" : 
                    "text-muted-foreground"
                  }`}>
                    {tx.amount > 0 ? "+" : ""}{formatPrice(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-[#108ee9] p-8 text-white text-center relative">
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-card/20 rounded-full hover:bg-card/30 transition"
                >
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
                <div className="w-16 h-16 bg-card/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Status Berhasil</p>
                <h4 className="text-3xl font-black">{formatPrice(Math.abs(selectedTx.amount))}</h4>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Deskripsi</span>
                    <span className="text-sm font-bold text-right max-w-[60%]">{selectedTx.description}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Waktu</span>
                    <span className="text-sm font-bold text-gray-700">
                      {new Date(selectedTx.date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Tanggal</span>
                    <span className="text-sm font-bold text-gray-700">
                      {new Date(selectedTx.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="h-px bg-muted my-2" />
                  
                  {selectedTx.senderName && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase">Pengirim</span>
                      <span className="text-sm font-bold text-blue-600">{selectedTx.senderName}</span>
                    </div>
                  )}
                  {selectedTx.recipientName && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase">Penerima</span>
                      <span className="text-sm font-bold text-[#108ee9]">{selectedTx.recipientName}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">ID Transaksi</span>
                    <span className="text-[10px] font-mono font-bold text-gray-300">{selectedTx.id}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => setSelectedTx(null)}
                  className="w-full h-12 rounded-2xl bg-[#108ee9] hover:bg-[#0c7cd5] font-black shadow-lg shadow-blue-200"
                >
                  TUTUP DETAIL
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-5 rounded-3xl shadow-sm border border-border">
             <Coins className="h-8 w-8 text-amber-500 mb-3" />
             <p className="font-bold text-sm">Tukar Koin</p>
             <p className="text-[10px] text-muted-foreground">Konversi koin menjadi saldo MyDompet.</p>
          </div>
          <div className="bg-card p-5 rounded-3xl shadow-sm border border-border">
             <Smartphone className="h-8 w-8 text-blue-500 mb-3" />
             <p className="font-bold text-sm">Pulsa & Data</p>
             <p className="text-[10px] text-muted-foreground">Beli kebutuhan komunikasi kamu.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
