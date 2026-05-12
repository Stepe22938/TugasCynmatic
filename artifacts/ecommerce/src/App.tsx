/**
 * App.tsx — route seller diizinkan untuk admin DAN seller.
 */
import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { OrderHistoryProvider } from "./contexts/OrderHistoryContext";
import { ProductsProvider } from "./contexts/ProductsContext";
import { AISettingsProvider } from "./contexts/AISettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { PaymentSettingsProvider } from "./contexts/PaymentSettingsContext";
import { VoucherProvider } from "./contexts/VoucherContext";
import { LiveProvider } from "./contexts/LiveContext";

import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SellerPage } from "./pages/SellerPage";
import { AdminPage } from "./pages/AdminPage";
import { LivePage } from "./pages/LivePage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (!isAuthenticated) setLocation("/login"); }, [isAuthenticated, setLocation]);
  if (!isAuthenticated) return null;
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar /><main className="flex-1"><Component /></main>
    </div>
  );
}

function RoleRoute({ component: Component, roles }: { component: React.ComponentType; roles: string[] }) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
    else if (!user || !roles.includes(user.role)) setLocation("/");
  }, [isAuthenticated, user, roles, setLocation]);
  if (!isAuthenticated || !user || !roles.includes(user.role)) return null;
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar /><main className="flex-1"><Component /></main>
    </div>
  );
}

function LiveRoute() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (!isAuthenticated) setLocation("/login"); }, [isAuthenticated, setLocation]);
  if (!isAuthenticated) return null;
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-foreground">
      <main className="flex-1"><LivePage /></main>
    </div>
  );
}

const HomeRoute     = () => <ProtectedRoute component={HomePage} />;
const CartRoute     = () => <ProtectedRoute component={CartPage} />;
const CheckoutRoute = () => <ProtectedRoute component={CheckoutPage} />;
const OrdersRoute   = () => <ProtectedRoute component={OrderHistoryPage} />;
const SuccessRoute  = () => <ProtectedRoute component={CheckoutSuccessPage} />;
const ProductRoute  = () => <ProtectedRoute component={ProductDetailPage} />;
const ProfileRoute  = () => <ProtectedRoute component={ProfilePage} />;
const SellerRoute   = () => <RoleRoute component={SellerPage}  roles={["seller", "admin"]} />;
const AdminRoute    = () => <RoleRoute component={AdminPage}   roles={["admin"]} />;

function Router() {
  return (
    <Switch>
      <Route path="/login"            component={LoginPage} />
      <Route path="/register"         component={RegisterPage} />
      <Route path="/"                 component={HomeRoute} />
      <Route path="/cart"             component={CartRoute} />
      <Route path="/checkout"         component={CheckoutRoute} />
      <Route path="/orders"           component={OrdersRoute} />
      <Route path="/product/:id"      component={ProductRoute} />
      <Route path="/profile"          component={ProfileRoute} />
      <Route path="/seller"           component={SellerRoute} />
      <Route path="/admin"            component={AdminRoute} />
      <Route path="/checkout-success" component={SuccessRoute} />
      <Route path="/live"             component={LiveRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PaymentSettingsProvider>
        <AISettingsProvider>
        <VoucherProvider>
        <LiveProvider>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <OrderHistoryProvider>
                <NotificationProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <Router />
                  </WouterRouter>
                  <Toaster />
                </NotificationProvider>
              </OrderHistoryProvider>
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
        </LiveProvider>
        </VoucherProvider>
        </AISettingsProvider>
        </PaymentSettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
