/**
 * App.tsx
 * Komponen root yang menyediakan semua context dan mendefinisikan routing aplikasi.
 *
 * Struktur provider (dari luar ke dalam):
 *   QueryClientProvider → TooltipProvider → AuthProvider → CartProvider → OrderHistoryProvider
 *
 * Rute yang tersedia:
 *   /login             - Halaman login (publik)
 *   /                  - Beranda / daftar produk (harus login)
 *   /cart              - Keranjang belanja (harus login)
 *   /orders            - Riwayat pesanan & review (harus login)
 *   /checkout-success  - Konfirmasi pembayaran (harus login)
 */
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import React, { useEffect } from "react";

// Context providers
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { OrderHistoryProvider } from "./contexts/OrderHistoryContext";

// Komponen layout dan halaman
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { CartPage } from "./pages/CartPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

/**
 * ProtectedRoute — membungkus halaman yang memerlukan autentikasi.
 * Jika user belum login, redirect otomatis ke /login.
 * Jika sudah login, render komponen dengan Navbar di atas.
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  // Jangan render apapun jika belum authenticated
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Component />
      </main>
    </div>
  );
}

/**
 * Wrapper components untuk setiap rute yang dilindungi.
 * Wouter tidak mendukung prop `render`, jadi kita buat komponen pembungkus tipis.
 */
const HomeRoute = () => <ProtectedRoute component={HomePage} />;
const CartRoute = () => <ProtectedRoute component={CartPage} />;
const OrdersRoute = () => <ProtectedRoute component={OrderHistoryPage} />;
const SuccessRoute = () => <ProtectedRoute component={CheckoutSuccessPage} />;

/**
 * Router — mendefinisikan semua rute aplikasi.
 * Menggunakan wouter Switch untuk pencocokan rute eksklusif.
 */
function Router() {
  return (
    <Switch>
      {/* Halaman publik */}
      <Route path="/login" component={LoginPage} />

      {/* Halaman yang dilindungi (harus login) */}
      <Route path="/" component={HomeRoute} />
      <Route path="/cart" component={CartRoute} />
      <Route path="/orders" component={OrdersRoute} />
      <Route path="/checkout-success" component={SuccessRoute} />

      {/* Fallback 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * App — komponen utama.
 * Menyusun semua provider dan router.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* AuthProvider harus paling luar agar CartProvider bisa akses user jika perlu */}
        <AuthProvider>
          {/* CartProvider mengelola keranjang belanja */}
          <CartProvider>
            {/* OrderHistoryProvider mengelola riwayat pesanan & review */}
            <OrderHistoryProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </OrderHistoryProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
