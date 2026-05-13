/**
 * OrderHistoryPage.tsx
 * Riwayat pesanan per-user — dengan progress bar status pengiriman,
 * tombol selesaikan / laporkan masalah, dan chat ke seller.
 */
import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Package, Star, CheckCircle2, AlertCircle, ArrowLeft,
         ShoppingBag, MessageSquarePlus, Video, Receipt, Send,
         Truck, MapPin, CheckCheck, Flag, MessageSquare, X } from "lucide-react";
import { useOrderHistory, Review, PurchasedOrder, OrderStatus } from "../contexts/OrderHistoryContext";
import { useAuth } from "../contexts/AuthContext";
import { ReviewForm } from "../components/ReviewForm";
import { ReceiptModal } from "../components/ReceiptModal";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

function StaticStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const PROGRESS_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: "placed",      label: "Pesanan Masuk",   icon: <Package className="h-3.5 w-3.5" /> },
  { status: "processing",  label: "Diproses",        icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { status: "shipped",     label: "Dikirim",         icon: <Truck className="h-3.5 w-3.5" /> },
  { status: "in_delivery", label: "Dalam Pengiriman", icon: <MapPin className="h-3.5 w-3.5" /> },
  { status: "delivered",   label: "Terkirim",        icon: <CheckCheck className="h-3.5 w-3.5" /> },
];

const STATUS_ORDER: OrderStatus[] = ["placed","processing","shipped","in_delivery","delivered","completed","problem"];

function getStepIndex(status: OrderStatus): number {
  if (status === "completed") return PROGRESS_STEPS.length - 1;
  if (status === "problem")   return PROGRESS_STEPS.length - 1;
  return PROGRESS_STEPS.findIndex((s) => s.status === status);
}

function OrderProgressBar({ status }: { status: OrderStatus }) {
  const currentIdx = getStepIndex(status);
  const isProblem  = status === "problem";
  const isComplete = status === "completed";

  return (
    <div className="px-5 py-4 border-b">
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-3">
        {isProblem ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
            <AlertCircle className="h-3.5 w-3.5" />Pesanan Bermasalah
          </span>
        ) : isComplete ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />Pesanan Selesai
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
            <Truck className="h-3.5 w-3.5" />{PROGRESS_STEPS[Math.min(currentIdx, PROGRESS_STEPS.length - 1)]?.label ?? "Dalam Proses"}
          </span>
        )}
      </div>

      {/* Step bar */}
      <div className="flex items-center gap-0 w-full">
        {PROGRESS_STEPS.map((step, i) => {
          const done    = i <= currentIdx && !isProblem;
          const active  = i === currentIdx && !isProblem && !isComplete;
          const last    = i === PROGRESS_STEPS.length - 1;
          return (
            <React.Fragment key={step.status}>
              {/* Node */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  isProblem && i === currentIdx   ? "border-red-500 bg-red-100 text-red-600"
                  : isComplete || (done && !active) ? "border-green-500 bg-green-500 text-white"
                  : active                           ? "border-primary bg-primary text-primary-foreground animate-pulse"
                  : "border-muted-foreground/30 bg-muted text-muted-foreground/50"
                }`}>
                  {step.icon}
                </div>
                <span className={`text-[9px] font-semibold mt-1 text-center leading-tight max-w-[52px] ${done || isComplete ? "text-green-700" : active ? "text-primary" : "text-muted-foreground/50"}`}>
                  {step.label}
                </span>
              </div>
              {/* Connector */}
              {!last && (
                <div className={`flex-1 h-0.5 mb-4 transition-all ${(isComplete || done) && i < currentIdx ? "bg-green-500" : "bg-muted"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chat Modal ───────────────────────────────────────────────────────────────
function ChatModal({ order, onClose }: { order: PurchasedOrder; onClose: () => void }) {
  const { user } = useAuth();
  const { addMessage } = useOrderHistory();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [order.messages?.length]);

  const send = () => {
    if (!text.trim() || !user) return;
    addMessage(order.id, { senderId: user.id, senderName: user.name, senderRole: user.role, text: text.trim() });
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="font-bold text-sm">Pesan — {order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">Chat dengan penjual</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0" style={{ maxHeight: "300px" }}>
          {(order.messages ?? []).length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">Belum ada pesan. Kirim pesan ke penjual!</p>
          ) : (order.messages ?? []).map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.id ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-muted-foreground mb-0.5">{msg.senderName}</span>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 p-3 border-t">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Tulis pesan ke penjual…"
            className="flex-1 px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={send} className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Problem Modal ─────────────────────────────────────────────────────
function ReportModal({ order, onClose, onReport }: { order: PurchasedOrder; onClose: () => void; onReport: (report: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="font-bold text-sm text-red-600 flex items-center gap-2"><Flag className="h-4 w-4" />Laporkan Masalah</p>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Jelaskan kendala yang kamu alami dengan pesanan <strong>{order.orderNumber}</strong>:</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Contoh: Barang tidak sesuai deskripsi, rusak saat diterima, dll."
            className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
            <Button onClick={() => { if (text.trim()) onReport(text.trim()); }} disabled={!text.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              <Flag className="h-4 w-4 mr-1" />Kirim Laporan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function OrderHistoryPage() {
  const { state, addReview, updateOrderStatus, reportProblem } = useOrderHistory();
  const { user } = useAuth();
  const { toast } = useToast();

  const [reviewTarget, setReviewTarget] = useState<{
    orderId: string;
    product: { id: number; name: string; image: string };
    existingReview?: Review;
  } | null>(null);

  const [receiptOrder, setReceiptOrder] = useState<PurchasedOrder | null>(null);
  const [chatOrder, setChatOrder]       = useState<PurchasedOrder | null>(null);
  const [reportOrder, setReportOrder]   = useState<PurchasedOrder | null>(null);

  const handleReviewSubmit = (review: Review) => {
    addReview(review.orderId, review);
    setReviewTarget(null);
    toast({ title: "Ulasan Berhasil Dikirim!" });
  };

  const handleComplete = (orderId: string) => {
    updateOrderStatus(orderId, "completed");
    toast({ title: "Pesanan diselesaikan!", description: "Terima kasih sudah berbelanja." });
  };

  const handleReport = (orderId: string, report: string) => {
    reportProblem(orderId, report);
    setReportOrder(null);
    toast({ title: "Laporan terkirim", description: "Penjual akan segera menghubungi kamu.", variant: "destructive" });
  };

  if (state.orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Belum Ada Pesanan</h2>
        <p className="text-muted-foreground mb-8">Mulai belanja sekarang!</p>
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
                <button onClick={() => setReceiptOrder(order)}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors">
                  <Receipt className="h-3.5 w-3.5" />Struk
                </button>
                <button onClick={() => setChatOrder(order)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" />Chat Penjual
                  {(order.messages ?? []).length > 0 && (
                    <span className="bg-blue-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {(order.messages ?? []).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <OrderProgressBar status={order.status} />

            {/* Action buttons (delivered) */}
            {order.status === "delivered" && (
              <div className="px-5 py-3 border-b bg-green-50/50 flex flex-wrap gap-3">
                <p className="text-xs text-green-700 font-semibold flex-1">🎉 Paket sudah tiba! Konfirmasi penerimaan:</p>
                <Button size="sm" onClick={() => handleComplete(order.id)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs">
                  <CheckCheck className="h-3.5 w-3.5" />Selesaikan Pesanan
                </Button>
                <Button size="sm" variant="outline" onClick={() => setReportOrder(order)}
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 text-xs">
                  <Flag className="h-3.5 w-3.5" />Laporkan Masalah
                </Button>
              </div>
            )}

            {/* Problem report display */}
            {order.status === "problem" && order.problemReport && (
              <div className="px-5 py-3 border-b bg-red-50">
                <p className="text-xs text-red-700 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />Laporan masalah:
                </p>
                <p className="text-xs text-red-600 mt-1 italic">"{order.problemReport}"</p>
              </div>
            )}

            {/* Shipping info */}
            {order.shippingInfo && (
              <div className="px-5 py-3 border-b bg-muted/10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>📦 <strong>Penerima:</strong> {order.shippingInfo.firstName} {order.shippingInfo.lastName}</span>
                {order.shippingInfo.phone && <span>📱 {order.shippingInfo.phone}</span>}
                <span>📍 {order.shippingInfo.address}</span>
                {order.paymentMethod && (
                  <span className="font-semibold text-orange-600 uppercase">💳 {order.paymentMethod === "dana" ? "DANA" : "QRIS"}</span>
                )}
              </div>
            )}

            {/* Items */}
            <div className="divide-y">
              {order.items.map((item) => {
                const review = order.reviews[item.id];
                const canReview = order.status === "completed";
                return (
                  <div key={item.id} className="p-4 sm:p-5" data-testid={`item-order-product-${item.id}`}>
                    <div className="flex gap-3 items-start">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} barang × {formatPrice(item.price)}</p>
                        <p className="text-sm font-medium text-primary mt-1">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                      {canReview && (
                        <div className="flex-shrink-0">
                          {!review ? (
                            <Button size="sm" variant="outline" className="text-xs"
                              onClick={() => setReviewTarget({ orderId: order.id, product: { id: item.id, name: item.name, image: item.image } })}
                              data-testid={`button-write-review-${item.id}`}>
                              <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />Ulasan
                            </Button>
                          ) : (
                            <button onClick={() => setReviewTarget({ orderId: order.id, product: { id: item.id, name: item.name, image: item.image }, existingReview: review })}
                              className="text-xs text-primary underline underline-offset-2">
                              Lihat Ulasan
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {review && (
                      <div className="mt-3 p-3 rounded-xl bg-muted/40 border" data-testid={`review-summary-${item.id}`}>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          {review.userName && <span className="text-xs font-semibold">{review.userName}</span>}
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
                                      <span className="text-[8px] text-muted-foreground">video</span>
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

            {/* Footer */}
            <div className="px-5 py-4 border-t bg-muted/20 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Pembayaran</span>
              <span className="font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                {formatPrice(order.grandTotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {reviewTarget && (
        <ReviewForm orderId={reviewTarget.orderId} product={reviewTarget.product}
          existingReview={reviewTarget.existingReview} userName={user?.name ?? "Pengguna"}
          onSubmit={handleReviewSubmit} onClose={() => setReviewTarget(null)} />
      )}
      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
      {chatOrder    && <ChatModal    order={chatOrder}    onClose={() => setChatOrder(null)} />}
      {reportOrder  && <ReportModal  order={reportOrder}  onClose={() => setReportOrder(null)}
          onReport={(report) => handleReport(reportOrder.id, report)} />}
    </div>
  );
}
