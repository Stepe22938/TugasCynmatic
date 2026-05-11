/**
 * LoginPage.tsx
 * Halaman login dengan email + password.
 * Terhubung ke sistem auth lokal (AuthContext).
 */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Package, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
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

    // Simulasi jeda kecil supaya terasa nyata
    await new Promise((r) => setTimeout(r, 300));

    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? "Login gagal.");
    } else {
      setLocation("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="w-full max-w-sm">

        {/* Kartu */}
        <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-orange-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold mb-1">Toko Online</h1>
            <p className="text-orange-100 text-sm">Masuk ke akun kamu</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-7 space-y-4">

            {/* Error global */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                data-testid="input-email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Login */}
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-base mt-1"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Masuk...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Masuk
                </span>
              )}
            </Button>

            {/* Link ke Register */}
            <p className="text-center text-sm text-muted-foreground pt-1">
              Belum punya akun?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
