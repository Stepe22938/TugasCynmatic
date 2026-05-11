/**
 * App.tsx
 * Root component with Clerk Auth integration (Google login only).
 *
 * Routing:
 *   /              → HomePage (publik, semua user bisa melihat produk)
 *   /sign-in/*?    → Halaman login Clerk
 *   /cart          → CartPage (harus login)
 *   /orders        → OrderHistoryPage + ulasan (harus login)
 *   /checkout-success → Halaman sukses (harus login)
 */
import React, { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { ClerkProvider, SignIn, Show, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Context providers
import { CartProvider } from "./contexts/CartContext";
import { OrderHistoryProvider } from "./contexts/OrderHistoryContext";

// Components & Pages
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { CartPage } from "./pages/CartPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import NotFound from "@/pages/not-found";

// ─── Clerk Configuration ──────────────────────────────────────────────────────

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/**
 * Resolve the correct publishable key from the current hostname.
 * In production, this handles custom domain routing automatically.
 */
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

/** Proxy URL — set automatically in production, empty in development */
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY — pastikan Clerk sudah dikonfigurasi.");
}

/**
 * Clerk wouter router helper.
 * Clerk mengirim full path ke routerPush; wouter menambahkan basePath secara otomatis,
 * jadi kita perlu strip basePath agar tidak double.
 */
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

/**
 * Appearance Clerk yang dikustomisasi — mengikuti tema orange/amber Toko Online.
 * Menggunakan tema shadcn sebagai base, lalu override variabel warna.
 */
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    // Tombol sosial besar agar Google mudah ditemukan
    socialButtonsVariant: "blockButton" as const,
    socialButtonsPlacement: "top" as const,
  },
  variables: {
    colorPrimary: "hsl(24 95% 53%)",        // orange utama
    colorForeground: "hsl(20 14% 4%)",       // teks utama
    colorMutedForeground: "hsl(25 5% 45%)",  // teks abu-abu
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(60 5% 96%)",
    colorInputForeground: "hsl(20 14% 4%)",
    colorNeutral: "hsl(20 6% 90%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[420px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary font-semibold",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-foreground",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton: "border border-border bg-white hover:bg-muted/50 transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    formFieldInput: "bg-input border-border text-foreground",
    footerAction: "border-t border-border",
    dividerLine: "bg-border",
    alert: "border border-border",
    otpCodeFieldInput: "border-border",
    formFieldRow: "",
    main: "",
  },
};

// ─── Query Client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient();

/**
 * Menginvalidasi QueryClient cache saat user berganti (sign-in / sign-out).
 * Mencegah data dari user sebelumnya masih terlihat oleh user baru.
 */
function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

/**
 * Layout standar dengan Navbar untuk halaman yang dilindungi.
 */
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

/**
 * Membungkus halaman yang hanya bisa diakses user yang sudah login.
 * Jika belum login, redirect ke /sign-in.
 */
function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>{children}</AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

// ─── Sign-In Page ─────────────────────────────────────────────────────────────

/**
 * Halaman login menggunakan Clerk's built-in SignIn component.
 * path harus full browser path karena Clerk membaca window.location.pathname.
 */
function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12 gap-6">
      {/* Banner demo */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center max-w-sm w-full">
        <p className="text-sm font-semibold text-amber-800">Mode Demo</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Login menggunakan akun Google Anda untuk melanjutkan.
        </p>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

// ─── Route Wrappers ───────────────────────────────────────────────────────────

const HomeRoute = () => (
  <AppLayout>
    <HomePage />
  </AppLayout>
);

const CartRoute = () => (
  <ProtectedPage>
    <CartPage />
  </ProtectedPage>
);

const OrdersRoute = () => (
  <ProtectedPage>
    <OrderHistoryPage />
  </ProtectedPage>
);

const SuccessRoute = () => (
  <ProtectedPage>
    <CheckoutSuccessPage />
  </ProtectedPage>
);

// ─── Main App ─────────────────────────────────────────────────────────────────

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signInFallbackRedirectUrl={`${basePath}/`}
      localization={{
        signIn: {
          start: {
            title: "Masuk ke Toko Online",
            subtitle: "Gunakan akun Google Anda untuk melanjutkan",
            actionText: "",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <OrderHistoryProvider>
              <ClerkCacheInvalidator />
              <Switch>
                {/* Halaman publik */}
                <Route path="/" component={HomeRoute} />
                <Route path="/sign-in/*?" component={SignInPage} />

                {/* Halaman yang memerlukan login */}
                <Route path="/cart" component={CartRoute} />
                <Route path="/orders" component={OrdersRoute} />
                <Route path="/checkout-success" component={SuccessRoute} />

                <Route component={NotFound} />
              </Switch>
              <Toaster />
            </OrderHistoryProvider>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
