/**
 * MyDompetPage.tsx
 * Premium E-Wallet Experience - Luxury Cyber Design.
 */
import React, { useState } from "react";
import { Link } from "wouter";
import { 
  ChevronLeft, Wallet, Plus, ArrowUpRight, ArrowDownLeft, 
  History, ShieldCheck, CreditCard, Smartphone, Banknote,
  Coins, HelpCircle, ChevronRight, Zap, Gem, ArrowRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useWallet, Transaction } from "../contexts/WalletContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function MyDompetPage() {
  const { user, allUsers } = useAuth();
  const { balance, transactions, topUp, transfer, request } = useWallet();
  const { toast } = useToast();
  
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
      toast({ variant: "destructive", title: "Invalid Amount", description: "Nominal Top Up harus lebih besar dari 0." });
      return;
    }
    topUp(amount);
    setIsTopUpOpen(false);
    setTopUpAmount("");
    setTopUpStep("amount");
    toast({ title: "Premium Top Up Successful", description: `Added ${formatPrice(amount)} to your vault.` });
  };

  const handleTransfer = () => {
    const amt = Number(sendData.amount);
    if (!sendData.toId) {
      toast({ variant: "destructive", title: "Invalid Target", description: "Harap isi ID tujuan transfer." });
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Nominal transfer tidak valid." });
      return;
    }
    
    // Check if target exists
    const targetExists = allUsers.find(u => u.id === sendData.toId);
    if (!targetExists) {
      toast({ variant: "destructive", title: "User Not Found", description: "ID tujuan tidak terdaftar." });
      return;
    }

    const success = transfer(sendData.toId, sendData.toName || targetExists.name, amt);
    if (success) {
      setIsSendOpen(false);
      setSendData({ toId: "", toName: "", amount: "" });
      toast({ title: "Funds Transferred", description: `Sent ${formatPrice(amt)} successfully.` });
    } else {
      toast({ variant: "destructive", title: "Insufficient Balance" });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-24 overflow-hidden">
      
      {/* ── Premium Luxury Header ─────────────────────────────────── */}
      <div className="relative pt-12 pb-24 px-6 overflow-hidden border-b border-white/5 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-950/30 via-background to-background">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-10">
            <Link href="/profile" className="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:bg-white/10 transition">
              <ChevronLeft className="h-5 w-5 text-white" />
            </Link>
            <h1 className="text-sm font-black uppercase tracking-[0.4em] text-gradient">MyDompet Elite</h1>
            <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center">
              <Gem className="h-5 w-5 text-orange-500" />
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-[3rem] relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="h-20 w-20" />
            </div>
            
            <div className="space-y-1 mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Available Balance</p>
              <h2 className="text-5xl font-black tracking-tighter text-white">
                {formatPrice(balance)}
              </h2>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Plus, label: "Top Up", color: "text-orange-500", onClick: () => setIsTopUpOpen(true) },
                { icon: ArrowUpRight, label: "Send", color: "text-emerald-500", onClick: () => setIsSendOpen(true) },
                { icon: ArrowDownLeft, label: "Request", color: "text-blue-500", onClick: () => setIsRequestOpen(true) },
                { icon: History, label: "Logs", color: "text-white", onClick: () => {} }
              ].map((btn, i) => (
                <button 
                  key={i} 
                  onClick={btn.onClick}
                  className="flex flex-col items-center gap-3 group/btn"
                >
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover/btn:bg-white/10 transition-all shadow-lg">
                    <btn.icon className={`h-6 w-6 ${btn.color}`} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover/btn:text-white">{btn.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-10 relative z-20 space-y-8">
        
        {/* Quick Actions / Modals */}
        <AnimatePresence>
          {(isTopUpOpen || isSendOpen || isRequestOpen) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-card p-8 rounded-[2.5rem] shadow-2xl border-orange-500/20"
            >
              {isTopUpOpen && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black tracking-tighter uppercase italic">Refill Balance</h3>
                    <button onClick={() => setIsTopUpOpen(false)}><XIcon className="h-5 w-5 opacity-50" /></button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-orange-500/50 italic">Rp</span>
                    <input 
                      type="number" 
                      value={topUpAmount}
                      onChange={e => setTopUpAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white/5 border-2 border-white/5 rounded-[1.5rem] py-6 pl-16 pr-6 text-3xl font-black focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[100000, 250000, 500000, 1000000, 2000000, 5000000].map(amt => (
                      <button key={amt} onClick={() => setTopUpAmount(amt.toString())} className="py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black hover:bg-white/10 transition">
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleTopUpConfirm} className="w-full h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 font-black uppercase tracking-widest text-xs">Confirm Payment</Button>
                </div>
              )}

              {isSendOpen && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black tracking-tighter uppercase italic text-emerald-500">Send Funds</h3>
                    <button onClick={() => setIsSendOpen(false)}><XIcon className="h-5 w-5 opacity-50" /></button>
                  </div>
                  <input 
                    placeholder="Receiver Player ID"
                    value={sendData.toId}
                    onChange={e => setSendData({...sendData, toId: e.target.value})}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                  />
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-500 italic">Rp</span>
                    <input 
                      type="number" 
                      value={sendData.amount}
                      onChange={e => setSendData({...sendData, amount: e.target.value})}
                      placeholder="0"
                      className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-6 text-2xl font-black focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <Button onClick={handleTransfer} className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-xs">Execute Transfer</Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elite Banner */}
        <div className="bg-gradient-to-r from-orange-600/20 to-orange-950/30 p-6 rounded-[2rem] border border-orange-500/20 flex items-center gap-6 relative overflow-hidden group">
          <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-white italic">Vault Protection Active</p>
            <p className="text-[10px] font-bold text-orange-500/60 uppercase tracking-widest">End-to-End Encryption Enabled</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-orange-600/20 to-transparent" />
        </div>

        {/* Transaction History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Recent Ledger</h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1">Full Statement <ArrowRight className="h-3 w-3" /></button>
          </div>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="p-12 glass-card rounded-[2.5rem] text-center">
                <History className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Empty Vault Logs</p>
              </div>
            ) : transactions.slice(0, 5).map(tx => (
              <motion.div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)}
                className="glass-card p-5 rounded-[2rem] flex items-center justify-between hover:bg-white/5 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    tx.amount > 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-red-500/10 border-red-500/30 text-red-500"
                  }`}>
                    {tx.amount > 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-black tracking-tight">{tx.description}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-50">
                      {new Date(tx.date).toLocaleDateString()} &bull; {new Date(tx.date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-black tracking-tighter ${tx.amount > 0 ? "text-emerald-500" : "text-white"}`}>
                  {tx.amount > 0 ? "+" : ""}{formatPrice(tx.amount)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-6 rounded-[2rem] space-y-3 group hover:border-orange-500/50 transition-colors">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Coins className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight italic">Coin Swap</p>
              <p className="text-[9px] font-bold text-muted-foreground opacity-60">Exchange tokens for MyDompet balance</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-[2rem] space-y-3 group hover:border-blue-500/50 transition-colors">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight italic">Utility Pay</p>
              <p className="text-[9px] font-bold text-muted-foreground opacity-60">Recharge mobile data & elite services</p>
            </div>
          </div>
        </div>

      </div>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-background/80 backdrop-blur-xl">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="glass-card w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl"
             >
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-10 text-center text-white relative">
                  <button onClick={() => setSelectedTx(null)} className="absolute right-6 top-6"><XIcon className="h-5 w-5 text-white/50" /></button>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2 italic">Transfer Success</p>
                  <h4 className="text-4xl font-black tracking-tighter">{formatPrice(Math.abs(selectedTx.amount))}</h4>
                </div>
                <div className="p-10 space-y-6">
                  <div className="space-y-4">
                    {[
                      { label: "Description", value: selectedTx.description },
                      { label: "Transaction ID", value: selectedTx.id.toUpperCase(), mono: true },
                      { label: "Execution Time", value: new Date(selectedTx.date).toLocaleString() }
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-start gap-4">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</span>
                        <span className={`text-[11px] font-bold text-right ${item.mono ? 'font-mono opacity-50' : ''}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setSelectedTx(null)} className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-white/10">Close Record</Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return <Plus className={`${className} rotate-45`} />;
}
