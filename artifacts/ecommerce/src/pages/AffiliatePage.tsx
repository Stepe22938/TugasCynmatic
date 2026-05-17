import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Gift, Award, Share2, Copy, 
  CheckCircle, ArrowRight, Sparkles, 
  Coins, Star, ShieldCheck, ChevronRight, X
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

export function AffiliatePage() {
  const { user, updateUser, allUsers } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);

  // Dynamic Leaderboard Calculation
  const leaderboard = allUsers
    .map(u => {
      const invitedCount = allUsers.filter(other => other.referredBy === u.id).length;
      return { 
        name: u.name, 
        invited: invitedCount, 
        reward: (invitedCount * 1000).toLocaleString("id-ID"),
        color: invitedCount > 0 ? (invitedCount > 10 ? "bg-amber-500" : "bg-blue-500") : "bg-slate-400"
      };
    })
    .filter(u => u.invited > 0)
    .sort((a, b) => b.invited - a.invited)
    .slice(0, 5);

  const myReferralsCount = allUsers.filter(u => u.referredBy === user?.id).length;
  const myTotalCommission = (myReferralsCount * 1000).toLocaleString("id-ID");

  const copyReferral = () => {
    if (!user) return;
    const text = user.referralCode;

    const onSuccess = () => {
      setCopied(true);
      toast({
        title: "Berhasil!",
        description: "Kode referral disalin ke clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
        // Fallback if promise fails
        fallbackCopy(text, onSuccess);
      });
    } else {
      fallbackCopy(text, onSuccess);
    }
  };

  const fallbackCopy = (text: string, cb: () => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      cb();
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const shareLink = () => {
    const text = `Ayo gabung di Cynmatic! Gunakan kode referral saya: ${user?.referralCode} untuk dapet bonus koin!`;
    if (navigator.share) {
      navigator.share({ title: "Cynmatic Affiliate", text, url: window.location.origin });
    } else {
      copyReferral();
    }
  };

  const rewards = [
    { id: "r1", title: "Voucher Belanja Rp5rb", cost: 500, icon: Gift, color: "text-rose-500", bgColor: "bg-rose-500/10" },
    { id: "r2", title: "Voucher Belanja Rp15rb", cost: 1000, icon: Gift, color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { id: "r3", title: "Badge 'Master Referrer'", cost: 5000, icon: Award, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { id: "r4", title: "Saldo Dompet Rp100rb", cost: 10000, icon: Coins, color: "text-green-500", bgColor: "bg-green-500/10" },
  ];

  const handleRedeem = (reward: any) => {
    if (!user) return;
    if ((user.points || 0) < reward.cost) {
      toast({
        variant: "destructive",
        title: "Points Tidak Cukup!",
        description: `Kamu butuh ${reward.cost} Points untuk menukar ini.`,
      });
      return;
    }

    updateUser({
      points: (user.points || 0) - reward.cost,
      activityLog: [
        { action: `Tukar Points: ${reward.title}`, timestamp: new Date().toISOString() },
        ...(user.activityLog || [])
      ]
    });

    toast({
      title: "Penukaran Berhasil!",
      description: `Kamu berhasil menukar ${reward.title}. Hadiah akan segera dikirim ke akunmu!`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-violet-600 to-indigo-900 pt-6 pb-32 px-6 relative overflow-hidden">
        {/* Background Sparkles */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-500 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-8"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Cynmatic Affiliate Program</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-[0.9]">
            AJAK TEMAN,<br />DAPET <span className="text-amber-400">CUAN!</span>
          </h1>
          <p className="text-white/70 text-lg font-medium max-w-xl mx-auto mb-10 leading-relaxed">
            Dapatkan komisi koin dan Cynmatic Points untuk setiap teman yang kamu ajak bergabung.
          </p>

          <div className="max-w-md mx-auto bg-white rounded-[2.5rem] p-3 shadow-2xl flex items-center gap-4">
             <div className="flex-1 px-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Kode Referral Kamu</p>
                <p className="text-2xl font-black tracking-tighter text-slate-900 text-left uppercase">{user?.referralCode || "---"}</p>
             </div>
             <Button 
               onClick={copyReferral}
               className={`h-14 px-8 rounded-[2rem] font-black uppercase tracking-widest transition-all ${copied ? "bg-green-500 hover:bg-green-600" : "bg-slate-900 hover:bg-slate-800"}`}
             >
               {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5 mr-2" />}
               {copied ? "Copied" : "Copy"}
             </Button>
          </div>
          
          <button onClick={shareLink} className="mt-8 text-white/50 hover:text-white transition-colors flex items-center gap-2 mx-auto font-black text-xs uppercase tracking-widest">
            <Share2 className="h-4 w-4" /> Share Link Referral
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto -mt-16 px-6 relative z-20 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-white/10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-3xl font-black tracking-tight">{myReferralsCount}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Teman Diajak</p>
           </div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-white/10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Coins className="h-6 w-6 text-amber-500" />
              </div>
              <p className="text-3xl font-black tracking-tight">{myTotalCommission}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Komisi Didapat</p>
           </div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-white/10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-violet-500" />
              </div>
              <p className="text-3xl font-black tracking-tight">{user?.points || 0}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cynmatic Points</p>
           </div>
        </div>

        {/* How it Works */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-xl border border-white/10">
          <h2 className="text-2xl font-black tracking-tight mb-8">Cara Kerja Referral</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-5 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Gift className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight">Bonus Pendaftaran</h4>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">Dapatkan 1.000 Koin untuk setiap teman yang mendaftar menggunakan kodemu.</p>
              </div>
              <div className="ml-auto bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full">+1.000</div>
            </div>

            <div className="flex items-start gap-5 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight">Komisi Belanja</h4>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">Dapatkan 1% komisi dari setiap transaksi yang dilakukan temanmu selamanya!</p>
              </div>
              <div className="ml-auto bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full">1%</div>
            </div>

            <div className="flex items-start gap-5 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg">
              <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <ShieldCheck className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight">Bonus Teman</h4>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">Teman yang kamu ajak juga akan langsung mendapatkan 500 Koin saldo awal.</p>
              </div>
              <div className="ml-auto bg-violet-500 text-white text-[10px] font-black px-3 py-1 rounded-full">+500</div>
            </div>
          </div>
        </div>

        {/* Points Redemption (Teaser) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-black tracking-tighter mb-3">Tukarkan Points Kamu</h2>
                <p className="text-white/60 font-medium leading-relaxed mb-6">
                  Cynmatic Points bisa ditukarkan dengan Voucher Diskon, Merchandise, atau Role Eksklusif di platform kami.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                   <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Exclusives</span>
                   </div>
                   <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                      <Gift className="h-4 w-4 text-pink-400" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Vouchers</span>
                   </div>
                </div>
              </div>
               <Button 
                 onClick={() => setIsRedeemOpen(true)}
                 className="h-16 px-10 rounded-[1.5rem] bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 flex-shrink-0"
               >
                 Tukar Sekarang <ArrowRight className="h-5 w-5" />
               </Button>
            </div>
         </div>

         {/* Redeem Modal */}
         <AnimatePresence>
            {isRedeemOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsRedeemOpen(false)}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative z-10 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Tukar Points</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Saldo: {user?.points || 0} Points</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsRedeemOpen(false)} className="rounded-full">
                       <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {rewards.map((r) => (
                      <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-primary/20 transition-all group">
                        <div className={`w-12 h-12 ${r.bgColor} rounded-xl flex items-center justify-center`}>
                          <r.icon className={`h-6 w-6 ${r.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm tracking-tight">{r.title}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{r.cost} Points</p>
                        </div>
                        <Button 
                          onClick={() => handleRedeem(r)}
                          disabled={(user?.points || 0) < r.cost}
                          className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest"
                        >
                          Tukar
                        </Button>
                      </div>
                    ))}
                  </div>

                  <p className="text-center mt-8 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                    Syarat & Ketentuan Berlaku
                  </p>
                </motion.div>
              </div>
            )}
         </AnimatePresence>

        {/* Leaderboard Teaser */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-xl border border-white/10">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Award className="h-7 w-7 text-amber-500" /> Top Referrer
              </h2>
              <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-muted-foreground group">
                Lihat Semua <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
           </div>
           <div className="space-y-4">
              {leaderboard.length > 0 ? (
                leaderboard.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className={`w-8 h-8 ${r.color} text-white rounded-lg flex items-center justify-center font-black text-sm`}>{i+1}</div>
                    <div className="flex-1">
                      <p className="font-black tracking-tight">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{r.invited} Teman</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-amber-600">+{r.reward}</p>
                      <p className="text-[8px] text-muted-foreground font-black uppercase tracking-tighter">Koin Bonus</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-40">
                  <p className="text-xs font-black uppercase tracking-widest italic">Belum ada user yang mengajak teman...</p>
                  <p className="text-[9px] font-bold mt-1">Jadilah yang pertama di leaderboard!</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
