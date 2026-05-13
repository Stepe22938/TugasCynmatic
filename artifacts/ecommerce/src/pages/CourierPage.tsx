/**
 * CourierPage.tsx
 * Halaman kurir — lihat pesanan yang siap dikirim, update status pengiriman.
 */
import React, { useState, useMemo } from "react";
import { Package, Truck, CheckCircle2, MapPin, User, Phone, Clock, ChevronDown, ChevronUp, MessageSquare, Send } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useOrderHistory, PurchasedOrder, OrderStatus } from "../contexts/OrderHistoryContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  placed:      { label: "Pesanan Masuk",       color: "text-blue-700",   bg: "bg-blue-100" },
  processing:  { label: "Diproses Penjual",    color: "text-amber-700",  bg: "bg-amber-100" },
  shipped:     { label: "Siap Diambil Kurir",  color: "text-orange-700", bg: "bg-orange-100" },
  in_delivery: { label: "Dalam Pengiriman",    color: "text-purple-700", bg: "bg-purple-100" },
  delivered:   { label: "Terkirim",            color: "text-green-700",  bg: "bg-green-100" },
  completed:   { label: "Selesai",             color: "text-green-800",  bg: "bg-green-200" },
  problem:     { label: "Bermasalah",          color: "text-red-700",    bg: "bg-red-100" },
};

function OrderCard({ order, onPickup, onDeliver, onMessage }: {
  order: PurchasedOrder;
  onPickup:  (id: string) => void;
  onDeliver: (id: string) => void;
  onMessage: (order: PurchasedOrder) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status];

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-bold text-primary text-sm">{order.orderNumber}</span>
          <span className="text-xs text-muted-foreground">· {formatDate(order.date)}</span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Shipping info */}
      {order.shippingInfo && (
        <div className="px-4 py-3 bg-blue-50/50 border-b space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-blue-600" />
            <span>{order.shippingInfo.firstName} {order.shippingInfo.lastName}</span>
          </div>
          {order.shippingInfo.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /><span>{order.shippingInfo.phone}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{order.shippingInfo.address}</span>
          </div>
        </div>
      )}

      {/* Items summary */}
      <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/20 transition-colors text-xs text-primary font-semibold"
        onClick={() => setExpanded((v) => !v)}>
        <span>{order.items.length} produk · {formatPrice(order.grandTotal)}</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-2 items-center py-2">
              <img src={item.image} alt={item.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-muted"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=?"; }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">x{item.quantity} · {formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4 pt-2 flex-wrap">
        {order.status === "shipped" && (
          <Button size="sm" onClick={() => onPickup(order.id)}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs">
            <Truck className="h-3.5 w-3.5" />Ambil & Antar
          </Button>
        )}
        {order.status === "in_delivery" && (
          <Button size="sm" onClick={() => onDeliver(order.id)}
            className="bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />Konfirmasi Terkirim
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onMessage(order)}
          className="gap-1.5 text-xs ml-auto">
          <MessageSquare className="h-3.5 w-3.5" />Chat
        </Button>
      </div>
    </div>
  );
}

function ChatPanel({ order, onClose }: { order: PurchasedOrder; onClose: () => void }) {
  const { user } = useAuth();
  const { addMessage } = useOrderHistory();
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim() || !user) return;
    addMessage(order.id, {
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: text.trim(),
    });
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="font-bold text-sm">Pesan — {order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">Pembeli: {order.shippingInfo?.firstName} {order.shippingInfo?.lastName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl font-bold">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0" style={{ maxHeight: "300px" }}>
          {(order.messages ?? []).length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">Belum ada pesan.</p>
          ) : (order.messages ?? []).map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.id ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-muted-foreground mb-0.5">{msg.senderName} · {msg.senderRole}</span>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.senderId === user?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}>{msg.text}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3 border-t">
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Tulis pesan..."
            className="flex-1 px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={send}
            className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

type FilterTab = "all" | "shipped" | "in_delivery" | "delivered";

export function CourierPage() {
  const { user } = useAuth();
  const { getAllOrders, updateOrderStatus } = useOrderHistory();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>("shipped");
  const [chatOrder, setChatOrder] = useState<PurchasedOrder | null>(null);

  if (!user || (user.role !== "kurir" && user.role !== "admin")) return null;

  const allOrders = getAllOrders();
  const activeOrders = useMemo(() => {
    if (filter === "all") return allOrders.filter((o) => ["shipped", "in_delivery", "delivered", "completed", "problem"].includes(o.status));
    return allOrders.filter((o) => o.status === filter);
  }, [allOrders, filter]);

  const counts = {
    shipped:     allOrders.filter((o) => o.status === "shipped").length,
    in_delivery: allOrders.filter((o) => o.status === "in_delivery").length,
    delivered:   allOrders.filter((o) => o.status === "delivered").length,
  };

  const handlePickup = (orderId: string) => {
    updateOrderStatus(orderId, "in_delivery");
    toast({ title: "✅ Paket diambil!", description: "Status berubah menjadi 'Dalam Pengiriman'." });
  };

  const handleDeliver = (orderId: string) => {
    updateOrderStatus(orderId, "delivered");
    toast({ title: "✅ Terkirim!", description: "Pembeli akan mendapatkan notifikasi." });
  };

  const FILTER_TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: "shipped",     label: `Siap Diambil (${counts.shipped})` },
    { id: "in_delivery", label: `Dalam Pengiriman (${counts.in_delivery})` },
    { id: "delivered",   label: `Terkirim (${counts.delivered})` },
    { id: "all",         label: "Semua" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
          <Truck className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Halaman Kurir</h1>
          <p className="text-sm text-muted-foreground">Kelola pengiriman pesanan</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Siap Diambil",     count: counts.shipped,     color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          { label: "Dalam Pengiriman", count: counts.in_delivery, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
          { label: "Terkirim",         count: counts.delivered,   color: "text-green-600",  bg: "bg-green-50 border-green-200" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${bg}`}>
            <p className={`text-2xl font-extrabold ${color}`}>{count}</p>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_TABS.map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {activeOrders.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
          <Truck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">Tidak ada pesanan</p>
          <p className="text-xs text-muted-foreground mt-1">Pesanan akan muncul saat penjual mengirimkan barang ke kurir.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <OrderCard key={order.id} order={order}
              onPickup={handlePickup}
              onDeliver={handleDeliver}
              onMessage={(o) => setChatOrder(o)} />
          ))}
        </div>
      )}

      {chatOrder && <ChatPanel order={chatOrder} onClose={() => setChatOrder(null)} />}
    </div>
  );
}
