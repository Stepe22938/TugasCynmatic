/**
 * TopUpPage.tsx
 * Halaman Top Up Saldo MyDompet dengan desain premium dan elegan.
 */
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  ChevronLeft, CreditCard, Smartphone, Banknote, 
  ShieldCheck, Zap, Star, Crown, ChevronRight,
  ArrowRight, CheckCircle2, Wallet, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

const PRESET_AMOUNTS = [
  { value: 50000, label: "50rb", icon: Banknote },
  { value: 100000, label: "100rb", icon: Banknote },
  { value: 250000, label: "250rb", icon: Zap },
  { value: 500000, label: "500rb", icon: Zap },
  { value: 1000000, label: "1jt", icon: Star },
  { value: 2500000, label: "2.5jt", icon: Crown },
];

const PAYMENT_METHODS = [
  { 
    id: "va", 
    name: "Virtual Account", 
    sub: "BCA, Mandiri, BNI, BRI", 
    icon: CreditCard,
    color: "from-blue-500 to-indigo-600"
  },
  { 
    id: "qris", 
    name: "QRIS & E-Wallet", 
    sub: "Gopay, ShopeePay, Dana", 
    icon: Smartphone,
    color: "from-pink-500 to-rose-600"
  },
  { 
    id: "bank", 
    name: "Transfer Bank", 
    sub: "Verifikasi Manual 5-10 mnt", 
    icon: Banknote,
    color: "from-emerald-500 to-teal-600"
  }
];

export function TopUpPage() {
  const { user } = useAuth();
  const { balance, topUp } = useWallet();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [amount, setAmount] = useState<string>("");
  const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleNextToPayment = () => {
    const numAmt = Number(amount);
    if (!amount || isNaN(numAmt) || numAmt < 10000) {
      toast({ 
        variant: "destructive", 
        title: "Jumlah Tidak Valid", 
        description: "Minimal top up adalah Rp 10.000" 
      });
      return;
    }
    setStep("payment");
  };

  const handleProcessTopUp = () => {
    if (!selectedMethod) {
      toast({ 
        variant: "destructive", 
        title: "Pilih Metode", 
        description: "Silakan pilih metode pembayaran terlebih dahulu" 
      });
      return;
    }

    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      topUp(Number(amount));
      setIsLoading(false);
      setStep("success");
      toast({
        title: "Pembayaran Berhasil",
        description: `Saldo sebesar ${formatPrice(Number(amount))} telah ditambahkan.`,
      });
    }, 2000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-slate-900 pt-6 pb-24 px-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent_60%)] opacity-30" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,#8b5cf6,transparent_50%)] opacity-20" />
        </div>

        <div className="max-w-xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8 text-white">
            <button 
              onClick={() => step === "amount" ? setLocation("/profile") : step === "payment" ? setStep("amount") : setLocation("/profile")}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all border border-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-black uppercase tracking-[0.2em]">Top Up Saldo</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="text-center text-white space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Saldo Saat Ini</p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                <Wallet className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-4xl font-black tracking-tighter">{formatPrice(balance)}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-12 relative z-10">
        <AnimatePresence mode="wait">
          {step === "amount" && (
            <motion.div 
              key="step-amount"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/5 border border-slate-200 dark:border-slate-800">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-6">Pilih Nominal Top Up</label>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {PRESET_AMOUNTS.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setAmount(item.value.toString())}
                      className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 group overflow-hidden ${
                        amount === item.value.toString() 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" 
                          : "border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900"
                      }`}
                    >
                      {amount === item.value.toString() && (
                        <div className="absolute top-0 right-0 p-1.5 bg-blue-500 text-white rounded-bl-xl">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                      <item.icon className={`h-6 w-6 mb-2 transition-transform group-hover:scale-110 ${amount === item.value.toString() ? "text-blue-500" : "text-slate-400"}`} />
                      <span className={`text-lg font-black tracking-tight ${amount === item.value.toString() ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Nominal Kustom (Rp)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 font-black text-lg group-focus-within:text-blue-500 transition-colors">
                      Rp
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Masukkan jumlah lainnya..."
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-3xl text-xl font-black focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1 font-medium italic">*Minimal Top Up Rp 10.000</p>
                </div>
              </div>

              <Button 
                onClick={handleNextToPayment}
                disabled={!amount}
                className="w-full h-16 rounded-[2rem] bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-base shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all group"
              >
                LANJUT PILIH PEMBAYARAN
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* Security Banner */}
              <div className="flex items-center justify-center gap-3 text-slate-400 py-4">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Transaksi Aman & Terenkripsi</span>
              </div>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div 
              key="step-payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/5 border border-slate-200 dark:border-slate-800">
                <div className="mb-8">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">Total Pembayaran</label>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatPrice(Number(amount))}</span>
                    <span className="text-xs font-bold text-slate-400 mb-1.5 ml-1">TERMASUK PPN</span>
                  </div>
                </div>

                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-4">Pilih Metode Pembayaran</label>
                
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`w-full flex items-center gap-4 p-5 rounded-[1.8rem] border-2 transition-all duration-300 relative group overflow-hidden ${
                        selectedMethod === m.id 
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/5" 
                          : "border-slate-50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${m.color} text-white shadow-lg transition-transform group-hover:rotate-3`}>
                        <m.icon className="h-7 w-7" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-black text-sm tracking-tight ${selectedMethod === m.id ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>
                          {m.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.sub}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedMethod === m.id ? "border-blue-500 bg-blue-500" : "border-slate-200 dark:border-slate-700"}`}>
                        {selectedMethod === m.id && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handleProcessTopUp}
                  disabled={!selectedMethod || isLoading}
                  className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      MEMPROSES...
                    </div>
                  ) : (
                    <>BAYAR SEKARANG</>
                  )}
                </Button>
                
                <button 
                  onClick={() => setStep("amount")}
                  disabled={isLoading}
                  className="w-full py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  BATAL & UBAH NOMINAL
                </button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div 
              key="step-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-2xl shadow-emerald-900/5 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Top Up Berhasil!</h3>
                <p className="text-slate-400 text-sm font-medium mb-8">Saldo kamu telah berhasil diperbarui dan siap digunakan untuk berbelanja.</p>
                
                <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 mb-8 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Ditambahkan</span>
                    <span className="font-black text-emerald-500">{formatPrice(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metode Pembayaran</span>
                    <span className="font-black text-slate-700 dark:text-slate-300">{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => setLocation("/profile")}
                    className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black hover:scale-[1.02] transition-all"
                  >
                    KEMBALI KE PROFIL
                  </Button>
                  <Link href="/orders">
                    <button className="w-full py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      LIHAT RIWAYAT TRANSAKSI
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Benefits Section */}
      {step !== "success" && (
        <div className="max-w-xl mx-auto px-8 mt-12">
          <div className="bg-blue-600/5 dark:bg-blue-500/5 rounded-[2rem] p-8 border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Keuntungan Top Up MyDompet
            </h4>
            <div className="space-y-5">
              {[
                { title: "Instan & Otomatis", desc: "Saldo masuk secara real-time setelah pembayaran terverifikasi.", icon: Zap },
                { title: "Bebas Biaya Layanan", desc: "Nikmati top up tanpa biaya admin (khusus Virtual Account).", icon: Star },
                { title: "Keamanan Terjamin", desc: "Setiap transaksi dilindungi oleh sistem enkripsi tingkat tinggi.", icon: ShieldCheck }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-800">
                    <item.icon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-0.5">{item.title}</p>
                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
