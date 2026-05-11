/**
 * CheckoutSuccessPage.tsx
 * Halaman konfirmasi setelah pembayaran berhasil.
 *
 * Menampilkan:
 * - Nomor pesanan dari query parameter URL
 * - Pesan sukses dan instruksi langkah berikutnya
 * - Tombol ke Riwayat Pesanan (untuk menulis ulasan)
 * - Tombol kembali ke belanja
 */
import React, { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, ClipboardList, ShoppingBag } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

export function CheckoutSuccessPage() {
  const { toast } = useToast();

  // Ambil nomor pesanan dari query string URL
  const searchParams = new URLSearchParams(window.location.search);
  const orderNumber = searchParams.get("order") || "#TKO-00000";

  // Tampilkan toast notifikasi sukses saat halaman pertama kali dimuat
  useEffect(() => {
    toast({
      title: "Sukses!",
      description: "Pesanan berhasil dibuat! Terima kasih telah berbelanja.",
    });
  }, [toast]);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center max-w-lg">
      {/* Ikon sukses */}
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <CheckCircle2 className="h-10 w-10" />
      </div>

      <h1 className="text-3xl font-bold mb-3">Pembayaran Berhasil!</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Terima kasih telah berbelanja di Toko Online. Pesanan Anda sedang kami
        proses dan akan segera dikirim.
      </p>

      {/* Nomor pesanan */}
      <div className="bg-card border rounded-2xl p-6 mb-4 w-full">
        <p className="text-sm text-muted-foreground mb-1">Nomor Pesanan</p>
        <p className="text-2xl font-bold tracking-tight text-primary">
          {orderNumber}
        </p>
      </div>

      {/* Info ulasan */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 w-full text-left">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          Bagaimana pesanan Anda?
        </p>
        <p className="text-xs text-amber-700">
          Setelah barang tiba, kunjungi Riwayat Pesanan untuk memberikan ulasan
          dan melaporkan jika ada ketidaksesuaian barang — lengkap dengan foto
          atau video sebagai bukti.
        </p>
      </div>

      {/* Tombol aksi */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {/* Tombol ke riwayat pesanan (untuk menulis ulasan) */}
        <Link href="/orders" className="flex-1">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            data-testid="button-view-orders"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Riwayat Pesanan
          </Button>
        </Link>

        {/* Tombol kembali belanja */}
        <Link href="/" className="flex-1">
          <Button
            size="lg"
            className="w-full"
            data-testid="button-back-to-shop"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Kembali Belanja
          </Button>
        </Link>
      </div>
    </div>
  );
}
