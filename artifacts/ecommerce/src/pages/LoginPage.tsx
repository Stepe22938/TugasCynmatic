/**
 * LoginPage.tsx
 * Halaman login dengan email + password.
 * Terhubung ke sistem auth lokal (AuthContext).
 */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Package, Eye, EyeOff, LogIn, Sun, Moon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? "Email atau password salah.");
    } else {
      setLocation("/");
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0a0a0b]' : 'bg-slate-50'}`}>
      {/* Theme Toggle Button */}
      <button 
        type="button"
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-20 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${
          theme === 'dark' ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20' : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>

      {/* Dynamic Background Elements */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse ${theme === 'dark' ? 'bg-primary/20' : 'bg-primary/10'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse delay-700 ${theme === 'dark' ? 'bg-orange-600/10' : 'bg-orange-600/5'}`} />
      
      <div className="w-full max-w-md px-6 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary to-orange-600 shadow-2xl shadow-primary/20 mb-4 animate-bounce duration-[3000ms]">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h1 className={`text-4xl font-black tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Selamat Datang</h1>
          <p className="text-muted-foreground font-medium">Masuk untuk melanjutkan belanja</p>
        </div>

        {/* Glass Card */}
        <div className={`${theme === 'dark' ? 'bg-card/40 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'bg-white/80 border-slate-200 shadow-xl shadow-slate-200/50'} backdrop-blur-2xl border rounded-[2.5rem] overflow-hidden transition-all duration-700`}>
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-2xl animate-in shake-in duration-300 text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className={`text-sm font-bold ml-1 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>Email Address</Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`h-13 border rounded-2xl transition-all duration-300 ${
                    theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 placeholder:text-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className={`text-sm font-bold ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>Password</Label>
                <button type="button" className="text-xs font-bold text-primary hover:text-primary/80 transition">Lupa?</button>
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`h-13 border rounded-2xl transition-all duration-300 ${
                    theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 placeholder:text-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={`absolute inset-y-0 right-4 flex items-center transition ${
                    theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-4"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Masuk Akun</span>
                  <LogIn className="h-5 w-5" />
                </div>
              )}
            </Button>

            <div className="pt-4 text-center">
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                Belum punya akun?{" "}
                <Link href="/register" className={`font-bold transition underline-offset-4 hover:underline ${theme === 'dark' ? 'text-white hover:text-primary' : 'text-primary'}`}>
                  Daftar Sekarang
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className={`text-center mt-10 text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>
          &copy; 2026 Toko Online &bull; Secure Connection
        </p>
      </div>
    </div>
  );
}
