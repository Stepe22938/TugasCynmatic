/**
 * CartPage.tsx
 * Halaman keranjang belanja dan ringkasan pesanan.
 *
 * Fitur:
 * - Tampilkan semua item di keranjang
 * - Kontrol jumlah barang (+ / -)
 * - Hapus item dari keranjang
 * - Hitung subtotal, ongkos kirim, dan total tagihan
 * - Tombol "Bayar Sekarang" → simpan ke riwayat pesanan → redirect ke halaman sukses
 */
import React from "react";
import { useLocation, Link } from "wouter";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

/** Ongkos kirim flat (demo) */
const SHIPPING_FEE = 15000;

export function CartPage() {
  const { state: { items }, dispatch, subtotal } = useCart();
  const { addOrder } = useOrderHistory();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  /**
   * Ubah jumlah item di keranjang.
   * Tidak bisa kurang dari 1 (dikontrol di reducer juga).
   */
  const handleUpdateQty = (id: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  };

  /** Hapus item dari keranjang dan tampilkan notifikasi */
  const handleRemove = (id: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
    toast({ description: "Item berhasil dihapus dari keranjang" });
  };

  /**
   * Proses checkout:
   * 1. Buat nomor pesanan acak
   * 2. Simpan pesanan ke riwayat (OrderHistoryContext)
   * 3. Kosongkan keranjang
   * 4. Redirect ke halaman sukses
   */
  const handleCheckout = () => {
    if (items.length === 0) return;

    // Buat nomor pesanan unik
    const orderNumber = `#TKO-${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`;

    const grandTotal = subtotal + SHIPPING_FEE;

    // Simpan ke riwayat pesanan agar bisa di-review nanti
    addOrder({
      id: `${Date.now()}`,
      orderNumber,
      date: new Date().toISOString(),
      items: [...items], // salin array agar tidak terpengaruh saat cart dikosongkan
      subtotal,
      shippingFee: SHIPPING_FEE,
      grandTotal,
      reviews: {},
    });

    // Kosongkan keranjang
    dispatch({ type: "CLEAR_CART" });

    // Arahkan ke halaman sukses dengan nomor pesanan
    setLocation(`/checkout-success?order=${encodeURIComponent(orderNumber)}`);
  };

  const grandTotal = subtotal + (items.length > 0 ? SHIPPING_FEE : 0);

  // Tampilan keranjang kosong
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-muted-foreground mb-8">
          Anda belum menambahkan produk apapun ke keranjang.
        </p>
        <Link href="/">
          <Button>Mulai Belanja</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daftar item di keranjang */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-2xl items-center"
              data-testid={`card-cart-item-${item.id}`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-xl bg-muted"
              />
              <div className="flex-1 flex flex-col text-center sm:text-left w-full">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-primary font-medium">{formatPrice(item.price)}</p>

                <div className="flex items-center justify-between mt-4">
                  {/* Kontrol jumlah */}
                  <div className="flex items-center bg-muted/50 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      data-testid={`button-decrease-qty-${item.id}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      data-testid={`button-increase-qty-${item.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Tombol hapus */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(item.id)}
                    data-testid={`button-remove-item-${item.id}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ringkasan belanja (sticky di desktop) */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-2xl p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Ringkasan Belanja</h2>

            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Total Harga ({items.length} Barang)
                </span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span className="font-medium">{formatPrice(SHIPPING_FEE)}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Tagihan</span>
                <span
                  className="font-bold text-xl text-primary"
                  data-testid="text-cart-total"
                >
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleCheckout}
              data-testid="button-checkout"
            >
              Bayar Sekarang
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
