/**
 * OrderHistoryPage.tsx
 * Riwayat pesanan per-user — hanya tampilkan pesanan milik user yang sedang login.
 * Setiap pesanan bisa dicetak struk-nya.
 */
import React, { useState } from "react";
import { Link } from "wouter";
import { Package, Star, CheckCircle2, AlertCircle, ArrowLeft,
         ShoppingBag, MessageSquarePlus, Video, Receipt } from "lucide-react";
import { useOrderHistory, Review, PurchasedOrder } from "../contexts/OrderHistoryContext";
import { useAuth } from "../contexts/AuthContext";
import { ReviewForm } from "../components/ReviewForm";
import { ReceiptModal } from "../components/ReceiptModal";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

function StaticStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function OrderHistoryPage() {
  const { state, addReview } = useOrderHistory();
  const { user } = useAuth();
  const { toast } = useToast();

  const [reviewTarget, setReviewTarget] = useState<{
    orderId: string;
    product: { id: number; name: string; image: string };
    existingReview?: Review;
  } | null>(null);

  const [receiptOrder, setReceiptOrder] = useState<PurchasedOrder | null>(null);

  const handleReviewSubmit = (review: Review) => {
    addReview(review.orderId, review);
    setReviewTarget(null);
    toast({ title: "Ulasan Berhasil Dikirim!", description: "Terima kasih atas ulasan Anda." });
  };

  if (state.orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Belum Ada Pesanan</h2>
        <p className="text-muted-foreground mb-8">Anda belum pernah melakukan pembelian. Mulai belanja sekarang!</p>
        <Link href="/"><Button>Mulai Belanja</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Riwayat Pesanan</h1>
        <span className="ml-2 text-sm text-muted-foreground">({state.orders.length} pesanan)</span>
      </div>

      <div className="space-y-6" data-testid="list-orders">
        {state.orders.map((order) => (
          <div key={order.id} className="border rounded-2xl overflow-hidden bg-card" data-testid={`card-order-${order.id}`}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-bold text-primary">{order.orderNumber}</span>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{formatDate(order.date)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Pembayaran Sukses</span>
                </div>
                {/* Tombol struk */}
                <button
                  onClick={() => setReceiptOrder(order)}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors"
                  title="Lihat & Cetak Struk"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Struk
                </button>
              </div>
            </div>

            {/* Info pengiriman jika ada */}
            {order.shippingInfo && (
              <div className="px-5 py-3 border-b bg-muted/10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>📦 <strong>Penerima:</strong> {order.shippingInfo.firstName} {order.shippingInfo.lastName}</span>
                {order.shippingInfo.phone && <span>📱 {order.shippingInfo.phone}</span>}
                <span>📍 {order.shippingInfo.address}</span>
                {order.paymentMethod && (
                  <span className="font-semibold text-orange-600 uppercase">
                    💳 {order.paymentMethod === "dana" ? "DANA" : "QRIS"}
                  </span>
                )}
              </div>
            )}

            {/* Items */}
            <div className="divide-y">
              {order.items.map((item) => {
                const review = order.reviews[item.id];
                return (
                  <div key={item.id} className="p-4 sm:p-5" data-testid={`item-order-product-${item.id}`}>
                    <div className="flex gap-3 items-start">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} barang × {formatPrice(item.price)}</p>
                        <p className="text-sm font-medium text-primary mt-1">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {!review ? (
                          <Button size="sm" variant="outline" className="text-xs"
                            onClick={() => setReviewTarget({ orderId: order.id, product: { id: item.id, name: item.name, image: item.image } })}
                            data-testid={`button-write-review-${item.id}`}>
                            <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />Tulis Ulasan
                          </Button>
                        ) : (
                          <button onClick={() => setReviewTarget({ orderId: order.id, product: { id: item.id, name: item.name, image: item.image }, existingReview: review })}
                            className="text-xs text-primary underline underline-offset-2" data-testid={`button-edit-review-${item.id}`}>
                            Lihat / Edit Ulasan
                          </button>
                        )}
                      </div>
                    </div>

                    {review && (
                      <div className="mt-3 p-3 rounded-xl bg-muted/40 border" data-testid={`review-summary-${item.id}`}>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          {review.userName && (
                            <span className="text-xs font-semibold text-foreground">{review.userName}</span>
                          )}
                          <StaticStars rating={review.rating} />
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            review.status === "sesuai" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {review.status === "sesuai" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {review.status === "sesuai" ? "Barang Sesuai" : "Barang Tidak Sesuai"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        {review.mediaFiles.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.mediaFiles.map((file, i) => (
                              <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border bg-muted">
                                {file.type === "image"
                                  ? <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                                      <Video className="h-5 w-5 text-muted-foreground" />
                                      <span className="text-[8px] text-muted-foreground px-1">video</span>
                                    </div>}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2">Diulas pada {formatDate(review.createdAt)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer total */}
            <div className="px-5 py-4 border-t bg-muted/20 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Pembayaran</span>
              <span className="font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                {formatPrice(order.grandTotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewForm
          orderId={reviewTarget.orderId}
          product={reviewTarget.product}
          existingReview={reviewTarget.existingReview}
          userName={user?.name ?? "Pengguna"}
          onSubmit={handleReviewSubmit}
          onClose={() => setReviewTarget(null)}
        />
      )}

      {/* Receipt modal */}
      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
    </div>
  );
}
