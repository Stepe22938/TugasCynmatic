/**
 * App.tsx
 * Root component — context providers dan routing aplikasi.
 *
 * Rute:
 *   /login             → Halaman login (publik)
 *   /register          → Daftar akun baru (publik)
 *   /                  → Beranda (harus login)
 *   /cart              → Keranjang (harus login)
 *   /orders            → Riwayat pesanan & ulasan (harus login)
 *   /product/:id       → Detail produk (harus login)
 *   /profile           → Profil pengguna (harus login)
 *   /seller            → Dashboard Seller (harus login + role seller)
 *   /admin             → Panel Admin (harus login + role admin)
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
import { ProductsProvider } from "./contexts/ProductsContext";

// Components & Pages
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { CartPage } from "./pages/CartPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SellerPage } from "./pages/SellerPage";
import { AdminPage } from "./pages/AdminPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// ─── Route Guards ─────────────────────────────────────────────────────────────

/** Halaman yang memerlukan login. Redirect ke /login jika belum masuk. */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (!isAuthenticated) setLocation("/login"); }, [isAuthenticated, setLocation]);
  if (!isAuthenticated) return null;
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1"><Component /></main>
    </div>
  );
}

/** Halaman yang memerlukan role tertentu. Redirect ke / jika role tidak cocok. */
function RoleRoute({
  component: Component,
  role,
}: {
  component: React.ComponentType;
  role: "seller" | "admin";
}) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
    else if (user?.role !== role) setLocation("/");
  }, [isAuthenticated, user, role, setLocation]);
  if (!isAuthenticated || user?.role !== role) return null;
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1"><Component /></main>
    </div>
  );
}

// ─── Route wrappers ───────────────────────────────────────────────────────────

const HomeRoute    = () => <ProtectedRoute component={HomePage} />;
const CartRoute    = () => <ProtectedRoute component={CartPage} />;
const OrdersRoute  = () => <ProtectedRoute component={OrderHistoryPage} />;
const SuccessRoute = () => <ProtectedRoute component={CheckoutSuccessPage} />;
const ProductRoute = () => <ProtectedRoute component={ProductDetailPage} />;
const ProfileRoute = () => <ProtectedRoute component={ProfilePage} />;
const SellerRoute  = () => <RoleRoute component={SellerPage}  role="seller" />;
const AdminRoute   = () => <RoleRoute component={AdminPage}   role="admin"  />;

function Router() {
  return (
    <Switch>
      <Route path="/login"             component={LoginPage} />
      <Route path="/register"          component={RegisterPage} />
      <Route path="/"                  component={HomeRoute} />
      <Route path="/cart"              component={CartRoute} />
      <Route path="/orders"            component={OrdersRoute} />
      <Route path="/product/:id"       component={ProductRoute} />
      <Route path="/profile"           component={ProfileRoute} />
      <Route path="/seller"            component={SellerRoute} />
      <Route path="/admin"             component={AdminRoute} />
      <Route path="/checkout-success"  component={SuccessRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <OrderHistoryProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </OrderHistoryProvider>
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
