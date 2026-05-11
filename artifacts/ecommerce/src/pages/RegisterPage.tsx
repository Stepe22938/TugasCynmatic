/**
 * RegisterPage.tsx
 * Halaman pendaftaran akun baru.
 * Validasi form di sisi klien, auto-login setelah berhasil daftar.
 */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Package, Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

    const result = register(name, email, password);
    if (!result.ok) {
      setError(result.error ?? "Pendaftaran gagal.");
    } else {
      setLocation("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="w-full max-w-sm">

        <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-orange-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold mb-1">Buat Akun</h1>
            <p className="text-orange-100 text-sm">Daftar dan mulai berbelanja</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-7 space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Nama */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold">Nama Lengkap</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Nama kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
                data-testid="input-name"
              />
            </div>

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
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
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

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length < 6
                          ? i === 1 ? "bg-red-400" : "bg-muted"
                          : password.length < 10
                          ? i <= 2 ? "bg-amber-400" : "bg-muted"
                          : "bg-green-500"
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {password.length < 6 ? "Lemah" : password.length < 10 ? "Sedang" : "Kuat"}
                  </span>
                </div>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-sm font-semibold">Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={`h-11 pr-10 ${
                    confirm.length > 0 && confirm !== password
                      ? "border-red-400 focus-visible:ring-red-300"
                      : ""
                  }`}
                  data-testid="input-confirm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirm.length > 0 && confirm !== password && (
                <p className="text-xs text-red-500">Password tidak cocok</p>
              )}
            </div>

            {/* Tombol Daftar */}
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-base mt-1"
              disabled={loading}
              data-testid="button-register"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Mendaftar...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Buat Akun
                </span>
              )}
            </Button>

            {/* Link ke Login */}
            <p className="text-center text-sm text-muted-foreground pt-1">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
