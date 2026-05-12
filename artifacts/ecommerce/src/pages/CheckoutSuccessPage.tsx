/**
 * CheckoutSuccessPage.tsx
 * Halaman konfirmasi pembayaran sukses + tombol Lihat Struk.
 */
import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, ClipboardList, ShoppingBag, Package, Truck, Receipt } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { ReceiptModal } from "../components/ReceiptModal";
import { Button } from "../components/ui/button";

const ORDER_STEPS = [
  { icon: CheckCircle2, label: "Pembayaran", desc: "Berhasil dikonfirmasi", done: true,  color: "text-green-600 bg-green-100" },
  { icon: Package,      label: "Dikemas",    desc: "Sedang diproses",       done: true,  color: "text-blue-600 bg-blue-100" },
  { icon: Truck,        label: "Pengiriman", desc: "Estimasi 2–3 hari",     done: false, color: "text-slate-400 bg-slate-100" },
];

export function CheckoutSuccessPage() {
  const { toast }          = useToast();
  const { state }          = useOrderHistory();
  const [showReceipt, setShowReceipt] = useState(false);

  const searchParams  = new URLSearchParams(window.location.search);
  const orderNumber   = searchParams.get("order") || "#TKO-00000";

  // Look up the order from context using the order number in the URL
  const order = state.orders.find((o) => o.orderNumber === orderNumber);

  useEffect(() => {
    toast({ title: "Pembayaran Berhasil!", description: "Pesanan Anda sedang kami proses." });
  }, [toast]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-3xl overflow-hidden shadow-lg">

          {/* Header hijau */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold mb-1">Pembayaran Berhasil!</h1>
            <p className="text-green-100 text-sm">Terima kasih telah berbelanja di Toko Online</p>
          </div>

          {/* Nomor pesanan */}
          <div className="px-6 py-5 border-b bg-muted/20 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Nomor Pesanan</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{orderNumber}</p>
          </div>

          {/* Status langkah */}
          <div className="px-6 py-5 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Status Pesanan</p>
            <div className="space-y-3">
              {ORDER_STEPS.map(({ icon: Icon, label, desc, done, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  {done && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Selesai</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info ulasan */}
          <div className="px-6 py-4 border-b bg-blue-50">
            <p className="text-sm font-semibold text-blue-800 mb-1">Barang sudah sampai?</p>
            <p className="text-xs text-blue-700">
              Kunjungi <strong>Riwayat Pesanan</strong> untuk memberikan ulasan,
              atau laporkan ketidaksesuaian dengan melampirkan foto/video sebagai bukti.
            </p>
          </div>

          {/* Tombol aksi */}
          <div className="px-6 py-5 flex flex-col gap-3">
            {order && (
              <Button
                onClick={() => setShowReceipt(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                size="lg"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Lihat &amp; Cetak Struk
              </Button>
            )}
            <Link href="/orders">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg" data-testid="button-view-orders">
                <ClipboardList className="h-4 w-4 mr-2" />Lihat Riwayat Pesanan
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="w-full border-green-500 text-green-700 hover:bg-green-50" data-testid="button-back-to-shop">
                <ShoppingBag className="h-4 w-4 mr-2" />Kembali Belanja
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Simpan struk sebagai bukti transaksi (mode demo).
        </p>
      </div>

      {showReceipt && order && (
        <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}
