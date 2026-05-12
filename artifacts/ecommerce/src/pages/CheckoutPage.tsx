/**
 * CheckoutPage.tsx
 * Halaman checkout: info pengiriman + pilih metode pembayaran + konfirmasi dummy.
 */
import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, User, MapPin, CreditCard, CheckCircle2, Smartphone, QrCode, Loader2, ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { useAuth } from "../contexts/AuthContext";
import { usePaymentSettings } from "../contexts/PaymentSettingsContext";
import { useNotifications } from "../contexts/NotificationContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

const SHIPPING_FEE = 15000;

type PaymentMethod = "dana" | "qris";
type Step = "form" | "payment";

export function CheckoutPage() {
  const { state: { items }, dispatch, subtotal } = useCart();
  const { addOrder } = useOrderHistory();
  const { user } = useAuth();
  const pay = usePaymentSettings();
  const { addNotification } = useNotifications();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep]               = useState<Step>("form");
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [address, setAddress]         = useState("");
  const [phone, setPhone]             = useState("");
  const [payMethod, setPayMethod]     = useState<PaymentMethod | null>(pay.enabledMethods[0] ?? null);
  const [confirming, setConfirming]   = useState(false);

  const grandTotal = subtotal + SHIPPING_FEE;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Keranjang kosong</h2>
        <Link href="/"><Button>Mulai Belanja</Button></Link>
      </div>
    );
  }

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
    addOrder({
      id: `${Date.now()}`,
      userId: user?.id ?? "guest",
      orderNumber,
      date: new Date().toISOString(),
      items: [...items],
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
    });
    addNotification({
      type: "order_placed",
      title: "Pesanan Berhasil Dibuat!",
      message: `${orderNumber} senilai ${formatPrice(grandTotal)} sedang diproses.`,
      orderId: orderNumber,
    });
    dispatch({ type: "CLEAR_CART" });
    setLocation(`/checkout-success?order=${encodeURIComponent(orderNumber)}`);
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 1500));
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
              <div className="bg-card border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">Alamat Pengiriman</h2>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Alamat Lengkap *</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Sudirman No. 10, Kelurahan …, Kecamatan …, Kota …, Kode Pos …"
                    required rows={3}
                    className="w-full px-3 py-2 text-sm border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
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
                  </div>
                )}
                {pay.dummyMode && (
                  <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
                    ⚠ Mode Demo aktif — tidak ada transaksi nyata yang diproses.
                  </div>
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
              {items.map((item) => (
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
