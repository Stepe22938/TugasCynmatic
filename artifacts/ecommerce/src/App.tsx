/**
 * App.tsx
 * Root component — context providers dan routing aplikasi.
 *
 * Rute:
 *   /login             → Halaman login (publik)
 *   /                  → Beranda / produk (harus login)
 *   /cart              → Keranjang (harus login)
 *   /orders            → Riwayat pesanan & ulasan (harus login)
 *   /product/:id       → Detail produk (harus login)
 *   /checkout-success  → Konfirmasi pembayaran (harus login)
 */
import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Context providers
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { OrderHistoryProvider } from "./contexts/OrderHistoryContext";

// Components & Pages
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { CartPage } from "./pages/CartPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

/**
 * ProtectedRoute — membungkus halaman yang memerlukan autentikasi.
 * Redirect ke /login jika user belum login.
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

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

// Wrapper tipis agar <Route component> bisa menerima komponen tanpa prop
const HomeRoute    = () => <ProtectedRoute component={HomePage} />;
const CartRoute    = () => <ProtectedRoute component={CartPage} />;
const OrdersRoute  = () => <ProtectedRoute component={OrderHistoryPage} />;
const SuccessRoute = () => <ProtectedRoute component={CheckoutSuccessPage} />;
const ProductRoute = () => <ProtectedRoute component={ProductDetailPage} />;

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/"                 component={HomeRoute} />
      <Route path="/cart"             component={CartRoute} />
      <Route path="/orders"           component={OrdersRoute} />
      <Route path="/product/:id"       component={ProductRoute} />
      <Route path="/checkout-success" component={SuccessRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
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
