/**
 * CartPage.tsx
 * Keranjang belanja — "Bayar Sekarang" mengarah ke /checkout.
 */
import React from "react";
import { useLocation, Link } from "wouter";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

const SHIPPING_FEE = 15000;

export function CartPage() {
  const { state: { items }, dispatch, subtotal } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleUpdateQty = (id: number, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });

  const handleRemove = (id: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
    toast({ description: "Item berhasil dihapus dari keranjang" });
  };

  const grandTotal = subtotal + (items.length > 0 ? SHIPPING_FEE : 0);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-muted-foreground mb-8">Anda belum menambahkan produk apapun ke keranjang.</p>
        <Link href="/"><Button>Mulai Belanja</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-2xl items-center"
              data-testid={`card-cart-item-${item.id}`}>
              <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl bg-muted" />
              <div className="flex-1 flex flex-col text-center sm:text-left w-full">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-primary font-medium">{formatPrice(item.price)}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center bg-muted/50 rounded-lg p-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1} data-testid={`button-decrease-qty-${item.id}`}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      data-testid={`button-increase-qty-${item.id}`}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(item.id)} data-testid={`button-remove-item-${item.id}`}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border rounded-2xl p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Ringkasan Belanja</h2>
            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Harga ({items.length} Barang)</span>
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
                <span className="font-bold text-xl text-primary" data-testid="text-cart-total">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
            <Button className="w-full h-12 text-base font-semibold" onClick={() => setLocation("/checkout")}
              data-testid="button-checkout">
              Lanjut ke Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
