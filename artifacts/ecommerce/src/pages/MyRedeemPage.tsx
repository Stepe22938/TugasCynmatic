import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRedeem } from "../contexts/RedeemContext";
import { Gift, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";

export function MyRedeemPage() {
  const { user } = useAuth();
  const { redeemCode } = useRedeem();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleRedeem = () => {
    if (!code.trim()) {
      toast({ title: "Masukkan kode redeem", variant: "destructive" });
      return;
    }

    setLoading(true);
    setSuccessMsg("");

    setTimeout(() => {
      const res = redeemCode(code.trim());
      if (res.success) {
        setSuccessMsg(res.message);
        setCode("");
      } else {
        toast({ title: res.message, variant: "destructive" });
      }
      setLoading(false);
    }, 800);
  };

  if (!user) return <div className="text-center py-20 font-semibold">Harap login terlebih dahulu.</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border rounded-[2rem] p-8 shadow-xl shadow-primary/5 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Gift className="w-40 h-40" />
        </div>
        
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
          <Gift className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-3xl font-black mb-2 relative z-10">Tukar Kode</h1>
        <p className="text-muted-foreground mb-8 text-sm relative z-10">
          Punya kode redeem dari admin? Masukkan di bawah ini untuk mendapatkan hadiah spesial!
        </p>

        {successMsg ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 relative z-10"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-green-800">{successMsg}</p>
            <Button variant="outline" className="mt-4 w-full" onClick={() => setSuccessMsg("")}>
              Tukar Kode Lain
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4 relative z-10">
            <div className="relative">
              <input 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="CONTOH: REWARD100"
                className="w-full pl-6 pr-6 py-4 text-center font-mono text-xl tracking-widest font-black uppercase border-2 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background"
                disabled={loading}
              />
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl gap-2 shadow-lg hover:shadow-xl transition-all" 
              onClick={handleRedeem}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Tukar Sekarang
                </>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
