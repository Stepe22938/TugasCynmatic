/**
 * LoginPage.tsx
 * Premium Login Experience - Elite Cyber Authentication.
 */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Package, Eye, EyeOff, LogIn, Sun, Moon, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { motion } from "framer-motion";

export function LoginPage() {
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulated network delay for premium feel
    await new Promise((r) => setTimeout(r, 800));

    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? "Authentication failed. Check credentials.");
    } else {
      setLocation("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      
      {/* Premium Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse delay-1000" />
      </div>

      <button 
        type="button"
        onClick={toggleTheme}
        className="absolute top-10 right-10 z-30 glass-card w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-white/10 transition shadow-2xl"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="w-full max-w-lg px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_20px_50px_-15px_rgba(249,115,22,0.5)] mb-6 group">
            <ShieldCheck className="h-10 w-10 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-gradient">Cynmatic</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.4em] mt-3 opacity-50">Secure Access Point v2.0</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-10 rounded-[3rem] shadow-2xl border-white/5 relative overflow-hidden"
        >
          {/* Subtle light effect inside card */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 blur-3xl rounded-full" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-black uppercase tracking-widest px-4 py-3 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Elite Credentials</Label>
              <Input
                type="email"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-white/5 border-2 border-white/5 rounded-2xl px-6 font-bold text-sm focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Access Key</Label>
                <button type="button" className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:opacity-80">Recovery</button>
              </div>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 bg-white/5 border-2 border-white/5 rounded-2xl px-6 font-bold text-sm focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition"
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-br from-orange-500 to-orange-700 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(249,115,22,0.6)] transition-all active:scale-[0.98] mt-4"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Decrypting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Enter Platform</span>
                  <Zap className="h-4 w-4" />
                </div>
              )}
            </Button>

            <div className="pt-6 text-center border-t border-white/5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                New Citizen?{" "}
                <Link href="/register" className="text-white hover:text-orange-500 transition decoration-orange-500 underline underline-offset-8">
                  Register Identity
                </Link>
              </p>
            </div>
          </form>
        </motion.div>

        <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.5em] text-white/10">
          &copy; 2026 Cynmatic &bull; Node Sync Active
        </p>
      </div>
    </div>
  );
}
