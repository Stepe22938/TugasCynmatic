/**
 * RegisterPage.tsx
 * Royal Sultan Experience - Identity Generation.
 */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Crown, Eye, EyeOff, UserPlus, Sun, Moon, 
  ShieldCheck, User, Mail, Lock, Gift, ArrowLeft,
  ChevronRight, Fingerprint, Star, Diamond, Shield
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

export function RegisterPage() {
  const { register, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email.toLowerCase().trim() === "admin@cynmatic.com") {
      setError("Email ini telah diabadikan untuk Sang Legenda. Demi menghormati sejarah Cynmatic, Anda tidak diperkenankan mendaftar dengan email ini.");
      const card = document.getElementById('register-card');
      if (card) {
        card.classList.add('animate-shake');
        setTimeout(() => card.classList.remove('animate-shake'), 500);
      }
      return;
    }

    if (password !== confirm) {
      setError("Konfirmasi kunci akses tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const result = await register(name, email, password, referralCode);
      if (!result.ok) {
        setError(result.error ?? "Gagal mendaftarkan identitas baru.");
        const card = document.getElementById('register-card');
        if (card) {
          card.classList.add('animate-shake');
          setTimeout(() => card.classList.remove('animate-shake'), 500);
        }
      } else {
        setLocation("/");
      }
    } catch (err) {
      setError("Gagal menghubungi server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-[#050505] py-20 transition-colors duration-500">
      
      {/* Clean elegant background - minimal effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] transition-colors duration-500" />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50">
        <Link href="/login">
          <motion.button 
            whileHover={{ x: -5 }}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </motion.button>
        </Link>
        <button 
          type="button"
          onClick={toggleTheme}
          className="w-12 h-12 bg-white/80 dark:bg-[#0a0a0c]/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none backdrop-blur-xl"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-[#D4AF37]" /> : <Moon className="h-5 w-5 text-[#D4AF37]" />}
        </button>
      </div>

      <div className="w-full max-w-[480px] px-6 relative z-10">
        
        {/* Branding */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#8B732A] rounded-2xl flex items-center justify-center shadow-[0_15px_30px_-10px_rgba(212,175,55,0.4)] mb-6">
            <UserPlus className="h-8 w-8 text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2 transition-colors">
            Cynmatic
          </h1>
          <p className="text-[10px] text-[#D4AF37] dark:text-[#D4AF37]/80 font-bold uppercase tracking-[0.4em]">
            Daftar Identitas Sultan
          </p>
        </motion.div>

        {/* Register Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 p-8 rounded-3xl shadow-xl dark:shadow-2xl relative transition-colors"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 text-[11px] font-bold uppercase tracking-widest px-4 py-3 rounded-xl text-center mb-6 transition-colors">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Input */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] dark:text-[#D4AF37]/70 ml-1">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                  <Input
                    placeholder="Nama Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 font-medium text-xs focus:border-[#D4AF37] dark:focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-white/[0.05] transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] dark:text-[#D4AF37]/70 ml-1">Email Sultan</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                  <Input
                    type="email"
                    placeholder="Email Aktif"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 font-medium text-xs focus:border-[#D4AF37] dark:focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-white/[0.05] transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] dark:text-[#D4AF37]/70 ml-1">Kunci Akses Baru</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="Minimal 6 Karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-12 font-medium text-xs focus:border-[#D4AF37] dark:focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-white/[0.05] transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] dark:text-[#D4AF37]/70 ml-1">Verifikasi Kunci</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Ulangi Kata Sandi"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={`h-12 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-12 font-medium text-xs focus:border-[#D4AF37] dark:focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-white/[0.05] transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 ${confirm && confirm !== password ? 'border-red-500 dark:border-red-500/50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-2 pt-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] dark:text-[#D4AF37]/70 ml-1">Kode Referral (Opsional)</Label>
              <div className="relative">
                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                <Input
                  placeholder="CYN-XXXXX"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="h-12 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 font-medium text-xs focus:border-[#D4AF37] dark:focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-white/[0.05] transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 uppercase"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#D4AF37] hover:bg-[#F3CF66] text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl shadow-[0_10px_20px_-10px_rgba(212,175,55,0.4)] transition-all mt-6"
            >
              {loading ? "MEMPROSES..." : "BUAT IDENTITAS"}
            </Button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-gray-500 dark:text-white/40 font-medium transition-colors">
            Sudah Terdaftar?{" "}
            <Link href="/login" className="text-[#D4AF37] hover:text-[#B89A36] dark:hover:text-white transition-colors font-bold">
              Masuk Sekarang
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
