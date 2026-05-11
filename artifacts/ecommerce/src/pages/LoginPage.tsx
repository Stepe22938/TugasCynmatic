/**
 * LoginPage.tsx
 * Halaman login dengan tombol Google (demo/dummy — tidak memerlukan OAuth sungguhan).
 *
 * Tampilan menyerupai halaman login Google yang sesungguhnya,
 * namun login langsung terjadi saat tombol diklik (tanpa server/OAuth).
 * Cocok untuk keperluan demo dan belajar alur login.
 */
import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { FaGoogle } from "react-icons/fa";
import { Package, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Jika sudah login, langsung redirect ke beranda
  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  /** Klik tombol Google → login dummy → redirect ke Home */
  const handleGoogleLogin = () => {
    login();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="w-full max-w-sm">

        {/* Kartu login */}
        <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">

          {/* Header kartu */}
          <div className="bg-gradient-to-br from-primary to-orange-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold mb-1">Toko Online</h1>
            <p className="text-orange-100 text-sm">Masuk untuk mulai berbelanja</p>
          </div>

          {/* Badan kartu */}
          <div className="px-6 py-8 space-y-5">

            {/* Banner mode demo */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
              <p className="text-xs font-semibold text-amber-800 mb-0.5">Mode Demo</p>
              <p className="text-xs text-amber-700">
                Klik tombol Google di bawah untuk masuk secara instan tanpa konfigurasi OAuth.
              </p>
            </div>

            {/* Tombol login Google */}
            <Button
              variant="outline"
              className="w-full h-12 text-sm font-semibold border-2 hover:border-primary hover:bg-orange-50 transition-all gap-3"
              onClick={handleGoogleLogin}
              data-testid="button-login-google"
            >
              {/* Logo Google asli SVG */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Lanjutkan dengan Google
            </Button>

            {/* Keterangan keamanan */}
            <div className="flex items-center gap-2 text-muted-foreground justify-center">
              <ShieldCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-xs">Data Anda aman. Tidak ada data yang dikirim ke server.</p>
            </div>
          </div>
        </div>

        {/* Catatan di bawah kartu */}
        <p className="text-center text-xs text-muted-foreground mt-5">
          Ini adalah aplikasi demo untuk tujuan belajar React + TailwindCSS.
        </p>
      </div>
    </div>
  );
}
