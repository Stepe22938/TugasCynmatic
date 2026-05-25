/**
 * App.tsx
 */
import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
import { TicketProvider } from "./contexts/TicketContext";
import { ExchangeSettingsProvider } from "./contexts/ExchangeSettingsContext";
import { AuctionProvider } from "./contexts/AuctionContext";
import { WalletProvider } from "./contexts/WalletContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RedeemProvider } from "./contexts/RedeemContext";
import { MusicProvider } from "./contexts/MusicContext";
import { SultanProvider } from "./contexts/MySultanContext";
import { MyCryptoProvider } from "./contexts/MyCryptoContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { VoteProvider } from "./contexts/VoteContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { LanguageProvider } from "./contexts/LanguageContext";


import { Navbar } from "./components/Navbar";
import { GlobalMusicPlayer } from "./components/GlobalMusicPlayer";
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
import { AdminPanel } from "./pages/AdminPage";
import { LivePage } from "./pages/LivePage";
import { CourierPage } from "./pages/CourierPage";
import { TicketDashboardPage } from "./pages/TicketDashboardPage";
import { TicketPage } from "./pages/TicketPage";
import { ExchangePage } from "./pages/ExchangePage";
import { FriendsPage } from "./pages/FriendsPage";
import { ProfileCustomizePage } from "./pages/ProfileCustomizePage";
import { MiniGamesPage } from "./pages/MiniGamesPage";
import { AuctionPage } from "./pages/AuctionPage";
import { MyDompetPage } from "./pages/MyDompetPage";
import { MyRedeemPage } from "./pages/MyRedeemPage";
import { MyMusicPage } from "./pages/MyMusicPage";
import { AIChatPage } from "./pages/AIChatPage";
import { FlashSalePage } from "./pages/FlashSalePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MySultanPage } from "./pages/MySultanPage";
import { WishlistPage } from "./pages/WishlistPage";
import { VotingPage } from "./pages/VotingPage";
import { BanLeaderboardPage } from "./pages/BanLeaderboardPage";
import { CosmeticPage } from "./pages/CosmeticPage";
import { MyCryptoPage } from "./pages/MyCryptoPage";

import { ChatPage } from "./pages/ChatPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AffiliatePage } from "./pages/AffiliatePage";
import { AboutUsPage } from "./pages/AboutUsPage";
import { GameTopUpPage } from "./pages/GameTopUpPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TopUpPage } from "./pages/TopUpPage";
import { CosmeticProvider } from "./contexts/CosmeticContext";
import { MessageProvider } from "./contexts/MessageContext";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  if (loading) return <FullPageLoader />;
  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main className="flex-1 relative pt-20 lg:pt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            <Component />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function RoleRoute({ component: Component, roles }: { component: React.ComponentType; roles: string[] }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) setLocation("/login");
      else if (!roles.includes(user.role)) setLocation("/");
    }
  }, [loading, user, roles, setLocation]);

  if (loading) return <FullPageLoader />;
  if (!user || !roles.includes(user.role)) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main className="flex-1 relative pt-20 lg:pt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
          >
            <Component />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-slate-950 z-[999] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-pulse" />
        <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary/20 rounded-lg animate-bounce" />
        </div>
      </div>
      <p className="mt-8 text-xs font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">Menghubungkan ke VPS MariaDB...</p>
    </div>
  );
}

function LiveRoute() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  if (loading) return <FullPageLoader />;
  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-foreground">
      <main className="flex-1">
        <LivePage />
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login"            component={LoginPage} />
      <Route path="/register"         component={RegisterPage} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={HomePage} />
      </Route>
      <Route path="/cart">
        <ProtectedRoute component={CartPage} />
      </Route>
      <Route path="/checkout">
        <ProtectedRoute component={CheckoutPage} />
      </Route>
      <Route path="/orders">
        <ProtectedRoute component={OrderHistoryPage} />
      </Route>
      <Route path="/product/:id">
        <ProtectedRoute component={ProductDetailPage} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/settings/:subpage">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/topup">
        <ProtectedRoute component={TopUpPage} />
      </Route>
      <Route path="/tickets">
        <ProtectedRoute component={TicketDashboardPage} />
      </Route>
      <Route path="/ticket/:id">
        <ProtectedRoute component={TicketPage} />
      </Route>
      <Route path="/exchange">
        <ProtectedRoute component={ExchangePage} />
      </Route>
      <Route path="/friends">
        <ProtectedRoute component={FriendsPage} />
      </Route>
      <Route path="/wishlist">
        <ProtectedRoute component={WishlistPage} />
      </Route>
      <Route path="/customize">
        <ProtectedRoute component={ProfileCustomizePage} />
      </Route>
      <Route path="/minigames">
        <ProtectedRoute component={MiniGamesPage} />
      </Route>
      <Route path="/auction">
        <ProtectedRoute component={AuctionPage} />
      </Route>
      <Route path="/mydompet">
        <ProtectedRoute component={MyDompetPage} />
      </Route>
      <Route path="/myredeem">
        <ProtectedRoute component={MyRedeemPage} />
      </Route>
      <Route path="/mymusic">
        <ProtectedRoute component={MyMusicPage} />
      </Route>
      <Route path="/flashsale">
        <ProtectedRoute component={FlashSalePage} />
      </Route>
      <Route path="/checkout-success">
        <ProtectedRoute component={CheckoutSuccessPage} />
      </Route>
      <Route path="/leaderboard">
        <ProtectedRoute component={LeaderboardPage} />
      </Route>
      <Route path="/mysultan">
        <ProtectedRoute component={MySultanPage} />
      </Route>
      <Route path="/voting">
        <ProtectedRoute component={VotingPage} />
      </Route>
      <Route path="/cosmetics">
        <ProtectedRoute component={CosmeticPage} />
      </Route>
      <Route path="/mycrypto">
        <ProtectedRoute component={MyCryptoPage} />
      </Route>
      <Route path="/mynft">
        <Redirect to="/profile#nft" replace />
      </Route>
      <Route path="/chat/:id">
        <ProtectedRoute component={ChatPage} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={NotificationsPage} />
      </Route>
      <Route path="/affiliate">
        <ProtectedRoute component={AffiliatePage} />
      </Route>
      <Route path="/ban-leaderboard">
        <ProtectedRoute component={BanLeaderboardPage} />
      </Route>
      <Route path="/about-us">
        <ProtectedRoute component={AboutUsPage} />
      </Route>
      <Route path="/game-topup">
        <ProtectedRoute component={GameTopUpPage} />
      </Route>

      {/* Role-Specific Routes */}
      <Route path="/seller">
        <RoleRoute component={SellerPage} roles={["seller", "admin"]} />
      </Route>
      <Route path="/admin">
        <RoleRoute component={AdminPanel} roles={["admin"]} />
      </Route>
      <Route path="/courier">
        <RoleRoute component={CourierPage} roles={["kurir", "admin"]} />
      </Route>

      {/* Special Routes */}
      <Route path="/live" component={LiveRoute} />
      <Route path="/aichat">
        <ProtectedRoute component={AIChatPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <CurrencyProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <PaymentSettingsProvider>
                <AISettingsProvider>
                  <VoucherProvider>
                    <ExchangeSettingsProvider>
                      <WalletProvider>
                        <LiveProvider>
                          <SultanProvider>
                            <MyCryptoProvider>
                              <NotificationProvider>
                              <ProductsProvider>
                                <WishlistProvider>
                                  <CartProvider>
                                    <OrderHistoryProvider>
                                      <AuctionProvider>
                                        <TicketProvider>
                                          <MessageProvider>
                                            <RedeemProvider>
                                              <CosmeticProvider>
                                                <MusicProvider>
                                                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                                                    <VoteProvider>
                                                      <Router />
                                                    </VoteProvider>
                                                  </WouterRouter>
                                                  <Toaster />
                                                  <GlobalMusicPlayer />
                                                </MusicProvider>
                                              </CosmeticProvider>
                                            </RedeemProvider>
                                          </MessageProvider>
                                        </TicketProvider>
                                      </AuctionProvider>
                                    </OrderHistoryProvider>
                                  </CartProvider>
                                </WishlistProvider>
                              </ProductsProvider>
                            </NotificationProvider>
                          </MyCryptoProvider>
                        </SultanProvider>
                      </LiveProvider>
                      </WalletProvider>
                    </ExchangeSettingsProvider>
                  </VoucherProvider>
                </AISettingsProvider>
              </PaymentSettingsProvider>
            </TooltipProvider>
          </QueryClientProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
