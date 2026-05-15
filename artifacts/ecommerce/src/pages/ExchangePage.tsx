import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, Coins, Gift, ArrowRight, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useVouchers } from "../contexts/VoucherContext";
import { useExchangeSettings } from "../contexts/ExchangeSettingsContext";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

export function ExchangePage() {
  const { user, addCoins } = useAuth();
  const { addVoucher } = useVouchers();
  const { options } = useExchangeSettings();
  const { toast } = useToast();

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!user) return <div className="p-8 text-center">Harap login terlebih dahulu.</div>;

  const currentCoins = user.coins || 0;

  const handleExchange = (cost: number, value: number, title: string) => {
    if (currentCoins < cost) {
      toast({ title: "Koin Tidak Cukup", description: "Kumpulkan lebih banyak koin untuk menukar voucher ini.", variant: "destructive" });
      return;
    }

    // Deduct coins
    addCoins(user.id, -cost);

    // Generate unique voucher code
    const uniqueCode = `TUKAR${value}-${Math.floor(Math.random() * 90000) + 10000}`;
    
    // Add voucher globally (1 use only)
    addVoucher({
      code: uniqueCode,
      type: "fixed",
      value: value,
      minPurchase: value, // no minimum purchase technically, just slightly more than value
      maxUses: 1,
      isActive: true,
      description: `Voucher Penukaran Koin - ${title}`
    });

    setGeneratedCode(uniqueCode);
    setCopied(false);
    toast({ title: "Penukaran Berhasil!", description: `Kamu mendapatkan voucher: ${uniqueCode}` });
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white pb-16 pt-8 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <Link href="/profile" className="inline-flex items-center text-orange-100 hover:text-white transition-colors mb-6 font-medium text-sm">
            <ChevronLeft className="h-5 w-5 mr-1" /> Kembali ke Profil
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold mb-1">Tukar Koin</h1>
              <p className="text-orange-100">Tukarkan koinmu dengan voucher diskon belanja!</p>
            </div>
            <div className="bg-card/20 px-4 py-3 rounded-2xl border border-white/30 backdrop-blur-sm text-center">
              <p className="text-xs text-orange-100 mb-1 font-semibold uppercase tracking-wider">Koin Saya</p>
              <div className="flex items-center gap-2 justify-center">
                <Coins className="h-6 w-6 text-amber-200" />
                <span className="text-2xl font-extrabold">{currentCoins.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
        
        {/* Success Modal / Result */}
        {generatedCode && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6 shadow-lg shadow-green-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-1">Penukaran Berhasil!</h3>
                <p className="text-green-700 text-sm mb-4">Gunakan kode voucher di bawah ini saat checkout untuk mendapatkan potongan harga.</p>
                
                <div className="bg-card border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <span className="font-mono text-lg font-extrabold text-green-800 tracking-wider pl-2">{generatedCode}</span>
                  <Button variant="outline" size="sm" onClick={handleCopy} className={`border-green-200 hover:bg-green-50 ${copied ? "text-green-600 border-green-500 bg-green-50" : "text-green-700"}`}>
                    {copied ? <><CheckCircle2 className="h-4 w-4 mr-1"/>Tersalin</> : <><Copy className="h-4 w-4 mr-1"/>Salin Kode</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Options */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" />
            Pilihan Voucher
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {options.map((opt) => {
              const canAfford = currentCoins >= opt.coins;
              return (
                <div key={opt.id} className={`border-2 rounded-xl p-5 transition-all ${canAfford ? "border-amber-200 bg-amber-50/30 hover:border-amber-400" : "border-border bg-muted/50 opacity-70"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">Voucher Diskon</div>
                    <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                      <Coins className="h-4 w-4" /> {opt.coins.toLocaleString("id-ID")}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-card-foreground mb-1">{opt.title}</h3>
                  <p className="text-xs text-gray-500 mb-6">Berlaku untuk semua produk di toko.</p>
                  
                  <Button 
                    className={`w-full font-bold ${canAfford ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                    onClick={() => handleExchange(opt.coins, opt.value, opt.title)}
                    disabled={!canAfford}
                  >
                    {canAfford ? "Tukar Sekarang" : "Koin Kurang"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
