/**
 * LoginPage.tsx
 * Royal Sultan Experience - Elite Authentication.
 */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Crown, Eye, EyeOff, LogIn, Sun, Moon, 
  ShieldCheck, Zap, ArrowLeft, Mail, Lock, 
  ChevronRight, Fingerprint, Chrome, Github,
  Diamond, Star, Shield
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

export function LoginPage() {
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  useEffect(() => {
    const checkDB = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/db");
        if (res.ok) setDbStatus('connected');
        else setDbStatus('error');
      } catch {
        setDbStatus('error');
      }
    };
    checkDB();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Real authentication call (now async)
      const result = await login(email, password);
      
      if (!result.ok) {
        setError(result.error ?? "Akses ditolak. Periksa kembali kredensial Anda.");
        const card = document.getElementById('login-card');
        if (card) {
          card.classList.add('animate-shake');
          setTimeout(() => card.classList.remove('animate-shake'), 500);
        }
      } else {
        // Success handled by useEffect user change, but just in case:
        setLocation("/");
      }
    } catch (err: any) {
      setError("Gagal menghubungi server. Pastikan API Server berjalan.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-[#050505] transition-colors duration-500">
      {/* Clean elegant background - minimal effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] transition-colors duration-500" />
      </div>

      {/* Floating Status Bar & Theme Toggle */}
      <div className="absolute top-8 w-full px-8 flex justify-between items-center z-50">
        <div className="w-12" /> {/* Spacer */}
        <div className="flex items-center gap-4 px-6 py-2.5 bg-white/80 dark:bg-[#0a0a0c]/80 rounded-full border border-gray-200 dark:border-white/5 backdrop-blur-xl shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
              dbStatus === 'checking' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/50">
              Database: <span className={dbStatus === 'connected' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
                {dbStatus === 'connected' ? 'CONNECTED' : dbStatus === 'checking' ? 'CHECKING' : 'DISCONNECTED'}
              </span>
            </span>
          </div>
        </div>
        <button 
          type="button"
          onClick={toggleTheme}
          className="w-12 h-12 bg-white/80 dark:bg-[#0a0a0c]/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none backdrop-blur-xl"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-[#D4AF37]" /> : <Moon className="h-5 w-5 text-[#D4AF37]" />}
        </button>
      </div>

      <div className="w-full max-w-[420px] px-6 relative z-10">
        
        {/* Branding */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#8B732A] rounded-2xl flex items-center justify-center shadow-[0_15px_30px_-10px_rgba(212,175,55,0.4)] mb-6">
            <Crown className="h-10 w-10 text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2 transition-colors">
            TokoArthur
          </h1>
          <p className="text-[10px] text-[#D4AF37] dark:text-[#D4AF37]/80 font-bold uppercase tracking-[0.4em]">
            Sultan Authentication
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 p-8 rounded-3xl shadow-xl dark:shadow-2xl relative transition-colors"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] dark:text-[#D4AF37]/70 ml-1">Email Sultan</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                  <Input
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 font-medium text-sm focus:border-[#D4AF37] dark:focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-white/[0.05] transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] dark:text-[#D4AF37]/70">Kata Sandi</Label>
                  <button type="button" className="text-[10px] font-bold text-[#D4AF37] hover:text-[#B89A36] dark:hover:text-white transition-colors">Lupa Sandi?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-12 font-medium text-sm focus:border-[#D4AF37] dark:focus:border-[#D4AF37]/50 focus:bg-white dark:focus:bg-white/[0.05] transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20"
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
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#D4AF37] hover:bg-[#F3CF66] text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-xl shadow-[0_10px_20px_-10px_rgba(212,175,55,0.4)] transition-all mt-4"
            >
              {loading ? "MEMVERIFIKASI..." : "MASUK SEKARANG"}
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
            Belum memiliki identitas?{" "}
            <Link href="/register" className="text-[#D4AF37] hover:text-[#B89A36] dark:hover:text-white transition-colors font-bold">
              Daftar Disini
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

