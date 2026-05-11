/**
 * LoginPage.tsx
 * Login screen with mock OAuth providers.
 */
import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { FaGoogle, FaGithub, FaFacebook } from "react-icons/fa";
import { Package } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = (provider: "google" | "github" | "facebook") => {
    login(provider);
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-lg overflow-hidden">
        {/* Banner */}
        <div className="bg-primary/10 px-4 py-3 text-center border-b border-primary/20">
          <p className="text-sm font-medium text-primary">Demo Mode Active</p>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
              <Package className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Masuk ke Toko Online</h1>
            <p className="text-muted-foreground text-sm">
              Gunakan salah satu akun di bawah untuk melanjutkan ke aplikasi demo.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={() => handleLogin("google")}
              data-testid="button-login-google"
            >
              <FaGoogle className="mr-3 w-5 h-5 text-red-500" />
              Lanjutkan dengan Google
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={() => handleLogin("github")}
              data-testid="button-login-github"
            >
              <FaGithub className="mr-3 w-5 h-5" />
              Lanjutkan dengan GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={() => handleLogin("facebook")}
              data-testid="button-login-facebook"
            >
              <FaFacebook className="mr-3 w-5 h-5 text-blue-600" />
              Lanjutkan dengan Facebook
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
