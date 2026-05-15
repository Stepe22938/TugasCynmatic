/**
 * CheckoutPage.tsx
 * Halaman checkout: info pengiriman + voucher + metode pembayaran + konfirmasi dummy.
 */
import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, User, MapPin, CreditCard, CheckCircle2, Smartphone, QrCode,
         Loader2, ShoppingBag, Tag, X, Coins } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useAuth } from "../contexts/AuthContext";
import { usePaymentSettings } from "../contexts/PaymentSettingsContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useVouchers } from "../contexts/VoucherContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { useProducts } from "../contexts/ProductsContext";
import { useWallet } from "../contexts/WalletContext";
import { Wallet, Clock } from "lucide-react";
import { useSultan } from "../contexts/MySultanContext";

const SHIPPING_FEE = 15000;

type PaymentMethod = "dana" | "qris" | "mydompet";
type Step = "form" | "payment";

export function CheckoutPage() {
  const { state: { items }, dispatch, subtotal: cartSubtotal, processPayouts, directItem, setDirectItem } = useCart();
  const { addOrder } = useOrderHistory();
  const { user, addCoins } = useAuth();
  const { decrementStock } = useProducts();
  const pay = usePaymentSettings();
  const { addNotification } = useNotifications();
  const { validateVoucher, useVoucher: markVoucherUsed } = useVouchers();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { balance, spend } = useWallet();
  const { isSultan } = useSultan();

  const checkoutItems = directItem ? [directItem] : items;
  const subtotal = directItem ? directItem.price * directItem.quantity : cartSubtotal;

  // 1. All States First

  const [step, setStep]               = useState<Step>("form");
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [address, setAddress]         = useState("");
  const [phone, setPhone]             = useState("");
  const [addressMethod, setAddressMethod] = useState<"manual" | "map">("manual");
  const [markerPos, setMarkerPos] = useState({ x: 50, y: 50 }); // percentage
  const [mapZoom, setMapZoom] = useState(15);
  const [payMethod, setPayMethod]     = useState<PaymentMethod | null>(pay.enabledMethods[0] ?? null);
  const [confirming, setConfirming]   = useState(false);

  // Voucher state
  const [voucherInput, setVoucherInput]   = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError]   = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [useCoins, setUseCoins] = useState(false);

  const currentCoins = user?.coins || 0;

  const discount   = appliedVoucher?.discount ?? 0;
  const maxCoinsCanUse = Math.min(currentCoins, subtotal + SHIPPING_FEE - discount);
  const coinDiscount = useCoins ? maxCoinsCanUse : 0;
  const grandTotal = subtotal + SHIPPING_FEE - discount - coinDiscount;

  // 2. All Effects Next
  // WASD Map Control
  React.useEffect(() => {
    if (addressMethod !== "map") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 3; // sensitivity
      const key = e.key.toLowerCase();
      
      if (["w", "a", "s", "d"].includes(key)) {
        // Prevent scrolling with WASD when using map
        if (["w", "s"].includes(key)) e.preventDefault();
        
        setMarkerPos(prev => ({
          x: key === "a" ? Math.max(5, prev.x - step) : key === "d" ? Math.min(95, prev.x + step) : prev.x,
          y: key === "w" ? Math.max(5, prev.y - step) : key === "s" ? Math.min(95, prev.y + step) : prev.y
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addressMethod]);

  // Sync Address with Marker Position in Real-time
  React.useEffect(() => {
    if (addressMethod === "map") {
      // Mock Geocoding Logic: Change address based on marker position
      const regions = ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara"];
      const regionIndex = Math.floor(markerPos.x / 21); // Simple mapping to regions
      const streetNo = Math.floor((markerPos.x * markerPos.y) / 50) + 1;
      const block = String.fromCharCode(65 + Math.floor(markerPos.y / 10)); // A, B, C...
      
      const simulatedAddress = `Kawasan Sudirman Central, Blok ${block} No. ${streetNo}, ${regions[regionIndex] || "Jakarta Selatan"}, DKI Jakarta (Pinpoint GPS)`;
      setAddress(simulatedAddress);
    }
  }, [markerPos, addressMethod, setAddress]);

  // Clear directItem on unmount
  React.useEffect(() => {
    return () => {
    };
  }, []);

  if (checkoutItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Keranjang kosong</h2>
        <Link href="/"><Button>Mulai Belanja</Button></Link>
      </div>
    );
  }

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    setVoucherLoading(true);
    setVoucherError("");
    await new Promise((r) => setTimeout(r, 400));
    const result = validateVoucher(code, subtotal);
    setVoucherLoading(false);
    if (result.ok) {
      setAppliedVoucher({ code: result.voucher.code, discount: result.discount });
      setVoucherError("");
      toast({ title: "Voucher berhasil!", description: `Hemat ${formatPrice(result.discount)}` });
    } else {
      setVoucherError(result.message);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !address.trim()) {
      toast({ title: "Lengkapi semua data", description: "Nama dan alamat wajib diisi.", variant: "destructive" });
      return;
    }
    if (!payMethod) {
      toast({ title: "Pilih metode pembayaran", variant: "destructive" });
      return;
    }
    if (pay.dummyMode) {
      setStep("payment");
    } else {
      placeOrder();
    }
  };

  const placeOrder = () => {
    const orderNumber = `#TKO-${Math.floor(Math.random() * 100000).toString().padStart(5, "0")}`;
    if (appliedVoucher) markVoucherUsed(appliedVoucher.code);
    // REAL PAYMENT LOGIC: MyDompet
    if (payMethod === "mydompet") {
      const success = spend(grandTotal, `Pembelian ${orderNumber}`, "payment");
      if (!success) {
        toast({
          variant: "destructive",
          title: "Saldo Kurang!",
          description: "Saldo MyDompet kamu tidak cukup untuk pesanan ini."
        });
        return; 
      }

      // Payout to Sellers (Helper from CartContext handles sellerId logic)
      processPayouts(checkoutItems);
    }

    addOrder({
      id: `${Date.now()}`,
      userId: user?.id ?? "guest",
      userName: user?.name || "Guest User",
      orderNumber,
      date: new Date().toISOString(),
      items: [...checkoutItems],
      subtotal,
      shippingFee: SHIPPING_FEE,
      grandTotal,
      reviews: {},
      shippingInfo: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        phone: phone.trim(),
      },
      paymentMethod: payMethod ?? "dana",
      voucherCode: appliedVoucher?.code,
      voucherDiscount: appliedVoucher?.discount,
      coinDiscount: coinDiscount > 0 ? coinDiscount : undefined,
      status: (() => {
        // Find if any item is a pre-order not yet released
        const poItem = items.find(it => it.isPreOrder && it.releaseDate);
        if (poItem) {
          const release = new Date(poItem.releaseDate!);
          const now = new Date();
          const timeToRelease = release.getTime() - now.getTime();
          
          // If within 30 mins window
          if (timeToRelease > 0 && timeToRelease <= 30 * 60 * 1000) {
            return isSultan ? "placed" : "pending_po";
          }
          // If already released
          if (timeToRelease <= 0) return "placed";
          
          // If way before 30 mins (shouldn't happen if button disabled, but just in case)
          return "pending_po";
        }
        return "placed";
      })(),
      messages: [],
    });
    
    const isPO = items.some(it => it.isPreOrder && it.releaseDate);
    const orderStatus = isPO && !isSultan ? "Pending Pre-Order" : "Berhasil Dibuat";

    addNotification({
      type: "order_placed",
      title: `Pesanan ${orderStatus}!`,
      message: `${orderNumber} senilai ${formatPrice(grandTotal)} ${isPO && !isSultan ? "akan diproses setelah rilis." : "sedang diproses."}`,
      orderId: orderNumber,
    });
    
    // Potong koin yang dipakai
    if (useCoins && coinDiscount > 0 && user?.id) {
      addCoins(user.id, -coinDiscount);
    }

    // Potong stok barang
    items.forEach((item) => {
      decrementStock(item.id, item.quantity);
    });

    // Berikan koin dari total belanja
    const coinsEarned = Math.floor(grandTotal / 1000);
    if (user?.id && coinsEarned > 0) {
      addCoins(user.id, coinsEarned);
    }

    if (directItem) {
      setDirectItem(null);
    } else {
      dispatch({ type: "CLEAR_CART" });
    }
    setLocation(`/checkout-success?order=${encodeURIComponent(orderNumber)}`);
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 1000));
    setConfirming(false);
    placeOrder();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => step === "payment" ? setStep("form") : history.back()}
          className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">
          {step === "form" ? "Detail Pengiriman" : "Konfirmasi Pembayaran"}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { label: "Info Pengiriman", step: "form" as Step },
          { label: "Pembayaran", step: "payment" as Step },
        ].map((s, i) => (
          <React.Fragment key={s.step}>
            {i > 0 && <div className={`flex-1 h-0.5 ${step === "payment" ? "bg-primary" : "bg-muted"}`} />}
            <div className={`flex items-center gap-2 text-sm font-semibold ${step === s.step ? "text-primary" : step === "payment" && i === 0 ? "text-green-600" : "text-muted-foreground"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s.step ? "bg-primary text-white" : step === "payment" && i === 0 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {step === "payment" && i === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: form / payment instructions ─────────────────────────── */}
        <div className="lg:col-span-3">

          {step === "form" && (
            <form onSubmit={handleFormSubmit} className="space-y-5">

              {/* Info Pribadi */}
              <div className="bg-card border rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">Informasi Penerima</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">First Name *</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Budi" required
                      className="w-full px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Last Name *</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder="Santoso" required
                      className="w-full px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">No. HP</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx" type="tel"
                    className="w-full px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              {/* Alamat */}
              <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h2 className="font-bold text-sm">Alamat Pengiriman</h2>
                  </div>
                  <div className="flex bg-muted p-1 rounded-xl">
                    <button 
                      type="button"
                      onClick={() => setAddressMethod("manual")}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${addressMethod === "manual" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Ketik Manual
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAddressMethod("map")}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${addressMethod === "map" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Pilih via Peta
                    </button>
                  </div>
                </div>

                {addressMethod === "manual" ? (
                  <div className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                    <label className="text-xs font-semibold text-muted-foreground">Alamat Lengkap *</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="Jl. Sudirman No. 10, Kelurahan …, Kecamatan …, Kota …, Kode Pos …"
                      required rows={3}
                      className="w-full px-4 py-3 text-sm border border-input rounded-2xl bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-all" />
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                     <div 
                       className="relative rounded-[2rem] overflow-hidden border-2 border-muted aspect-video bg-slate-100 group shadow-inner cursor-crosshair"
                       onWheel={(e) => {
                         // Scroll to Zoom logic
                         if (e.deltaY < 0) setMapZoom(prev => Math.min(21, prev + 1));
                         else setMapZoom(prev => Math.max(10, prev - 1));
                       }}
                     >
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps?q=-6.229728,106.7891583&z=${mapZoom}&output=embed&iwloc=near`}
                          allowFullScreen
                          className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 pointer-events-none"
                        ></iframe>
                        
                        {/* Zoom Indicator */}
                        <div className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                           Zoom: {mapZoom}x
                        </div>

                        <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                           <Button 
                             type="button" 
                             className="rounded-full gap-2 shadow-2xl bg-white text-slate-900 hover:bg-slate-100 h-12 px-6 font-black text-xs uppercase tracking-widest border-none" 
                             onClick={() => {
                                setAddressMethod("manual");
                                toast({ 
                                  title: "Lokasi Terkunci!", 
                                  description: "Alamat telah disinkronkan dari titik peta.",
                                  duration: 3000 
                                });
                             }}
                           >
                              <MapPin className="h-4 w-4 text-primary" /> Gunakan Alamat Ini
                           </Button>
                        </div>
                        {/* Map Overlay Pointer (WASD Controlled) */}
                        <div 
                          className="absolute pointer-events-none transition-all duration-100 ease-out z-20"
                          style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%` }}
                        >
                           <div className="relative -translate-x-1/2 -translate-y-full mb-1">
                              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                              <MapPin className="h-10 w-10 text-primary drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
                              <div className="w-2 h-2 bg-black/40 rounded-full blur-[1.5px] mx-auto mt-[-4px]" />
                           </div>
                        </div>

                        {/* Controls Guide */}
                        <div className="absolute bottom-4 left-4 z-30 flex gap-2">
                           <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                              <div className="grid grid-cols-3 gap-1">
                                 <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold text-white">W</div>
                                 <div className="w-6 h-6" />
                                 <div className="w-6 h-6" />
                                 <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold text-white">A</div>
                                 <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold text-white">S</div>
                                 <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold text-white">D</div>
                              </div>
                              <p className="text-[9px] font-black text-white uppercase tracking-tighter leading-tight">
                                Gunakan WASD<br/>untuk Navigasi
                              </p>
                           </div>
                        </div>
                     </div>
                     <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest opacity-60">
                       Arahkan Pin ke Lokasi Anda & Klik Konfirmasi
                     </p>
                  </div>
                )}
              </div>

              {/* Metode Pembayaran */}
              <div className="bg-card border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">Metode Pembayaran</h2>
                </div>
                {pay.enabledMethods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada metode pembayaran yang aktif. Hubungi admin.</p>
                ) : (
                  <div className="space-y-2">
                    {pay.enabledMethods.includes("dana") && (
                      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${payMethod === "dana" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <input type="radio" name="payment" value="dana" checked={payMethod === "dana"}
                          onChange={() => setPayMethod("dana")} className="sr-only" />
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">DANA</p>
                          <p className="text-xs text-muted-foreground">Dompet digital DANA</p>
                        </div>
                        {payMethod === "dana" && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                      </label>
                    )}
                    {pay.enabledMethods.includes("qris") && (
                      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${payMethod === "qris" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <input type="radio" name="payment" value="qris" checked={payMethod === "qris"}
                          onChange={() => setPayMethod("qris")} className="sr-only" />
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <QrCode className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">QRIS</p>
                          <p className="text-xs text-muted-foreground">Scan QR dari semua e-wallet</p>
                        </div>
                        {payMethod === "qris" && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                      </label>
                    )}
                    {pay.enabledMethods.includes("mydompet") && (
                      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${payMethod === "mydompet" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <input type="radio" name="payment" value="mydompet" checked={payMethod === "mydompet"}
                          onChange={() => setPayMethod("mydompet")} className="sr-only" />
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">MyDompet</p>
                          <p className="text-xs text-muted-foreground">Saldo: {formatPrice(balance)}</p>
                        </div>
                        {payMethod === "mydompet" && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                      </label>
                    )}
                  </div>
                )}
                {pay.dummyMode && (
                  <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
                    ⚠ Mode Demo aktif — tidak ada transaksi nyata yang diproses.
                  </div>
                )}
              </div>

              {/* ── Voucher ─────────────────────────────────────────────── */}
              <div className="bg-card border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">Kode Voucher</h2>
                  <span className="text-xs text-muted-foreground">(opsional)</span>
                </div>

                {appliedVoucher ? (
                  /* Applied state */
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-green-800 tracking-wider">{appliedVoucher.code}</p>
                      <p className="text-xs text-green-700">Hemat {formatPrice(appliedVoucher.discount)}</p>
                    </div>
                    <button onClick={handleRemoveVoucher}
                      className="p-1 text-green-600 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Input state */
                  <>
                    <div className="flex gap-2">
                      <input
                        value={voucherInput}
                        onChange={(e) => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyVoucher())}
                        placeholder="Masukkan kode voucher"
                        className="flex-1 px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-wider uppercase"
                      />
                      <Button type="button" onClick={handleApplyVoucher}
                        disabled={!voucherInput.trim() || voucherLoading}
                        variant="outline" className="px-4 border-primary text-primary hover:bg-primary/5 font-semibold text-sm flex-shrink-0">
                        {voucherLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pakai"}
                      </Button>
                    </div>
                    {voucherError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" />{voucherError}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Contoh: <button type="button" onClick={() => setVoucherInput("TOKO10")} className="font-mono text-primary hover:underline">TOKO10</button>
                      {" · "}
                      <button type="button" onClick={() => setVoucherInput("HEMAT50")} className="font-mono text-primary hover:underline">HEMAT50</button>
                      {" · "}
                      <button type="button" onClick={() => setVoucherInput("LIVE25")} className="font-mono text-primary hover:underline">LIVE25</button>
                    </p>
                  </>
                )}
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={pay.enabledMethods.length === 0}>
                {pay.dummyMode ? "Lanjut ke Pembayaran" : "Bayar Sekarang"}
              </Button>
            </form>
          )}

          {step === "payment" && (
            <div className="space-y-5">
              {/* DANA dummy */}
              {payMethod === "dana" && (
                <div className="bg-card border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold">Bayar via DANA</h2>
                      <p className="text-xs text-muted-foreground">Transfer tepat sesuai jumlah tagihan</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Nomor DANA Tujuan</p>
                    <p className="text-2xl font-bold text-blue-800 tracking-widest">{pay.danaNumber}</p>
                    <p className="text-xs text-blue-600">a.n. <strong>Toko Online</strong></p>
                  </div>
                  <div className="flex justify-between items-center bg-muted/40 rounded-xl px-4 py-3">
                    <span className="text-sm font-semibold">Total Transfer</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(grandTotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Setelah transfer, klik tombol <strong>"Konfirmasi Pembayaran"</strong> di bawah.</p>
                </div>
              )}

              {/* QRIS dummy */}
              {payMethod === "qris" && (
                <div className="bg-card border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold">Bayar via QRIS</h2>
                      <p className="text-xs text-muted-foreground">Scan QR dari aplikasi e-wallet apapun</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center py-4 space-y-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TOKO-ONLINE-DUMMY-QRIS-${grandTotal}&color=ea580c`}
                      alt="QRIS Code"
                      className="w-44 h-44 rounded-2xl border-4 border-orange-200 shadow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/176x176/ea580c/ffffff?text=QRIS";
                      }}
                    />
                    <p className="text-xs text-muted-foreground text-center">QR Code berlaku 15 menit (demo)</p>
                  </div>
                  <div className="flex justify-between items-center bg-muted/40 rounded-xl px-4 py-3">
                    <span className="text-sm font-semibold">Total Pembayaran</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                ⚠ <strong>Mode Demo</strong> — pembayaran ini simulasi. Klik konfirmasi untuk melanjutkan.
              </div>

              <Button onClick={handleConfirmPayment} disabled={confirming} className="w-full h-12 text-base font-semibold">
                {confirming
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses…</>
                  : <><CheckCircle2 className="h-4 w-4 mr-2" />Konfirmasi Pembayaran</>}
              </Button>
            </div>
          )}
        </div>

        {/* ── RIGHT: order summary ───────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-2xl p-5 sticky top-24 space-y-4">
            <h2 className="font-bold text-sm">Ringkasan Pesanan</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {checkoutItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <img src={item.image} alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=?"; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Ongkos Kirim</span>
                <span>{formatPrice(SHIPPING_FEE)}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />{appliedVoucher.code}
                  </span>
                  <span>-{formatPrice(appliedVoucher.discount)}</span>
                </div>
              )}
              {currentCoins > 0 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useCoins} 
                      onChange={(e) => setUseCoins(e.target.checked)} 
                      className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5" /> Pakai {currentCoins.toLocaleString("id-ID")} Koin
                    </span>
                  </label>
                  {useCoins && (
                    <span className="text-amber-600 font-semibold text-sm">
                      -{formatPrice(coinDiscount)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg text-primary">{formatPrice(grandTotal)}</span>
            </div>
            {step === "form" && firstName && lastName && (
              <div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground text-xs">Penerima:</p>
                <p>{firstName} {lastName}</p>
                {phone && <p>{phone}</p>}
                {address && <p className="leading-relaxed">{address}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
