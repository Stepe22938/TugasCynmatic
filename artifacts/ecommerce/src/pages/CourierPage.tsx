/**
 * CourierPage.tsx
 * Halaman kurir — lihat pesanan yang siap dikirim, update status pengiriman.
 */
import React, { useState, useMemo } from "react";
import { Package, Truck, CheckCircle2, MapPin, User, Phone, Clock, ChevronDown, ChevronUp, MessageSquare, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="min-h-screen bg-[#050505] pt-4 pb-20 overflow-x-hidden">
      <div className="container mx-auto px-6 max-w-4xl space-y-10">
        
        {/* ── Premium Courier Header ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[3rem] p-10 border border-white/5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-950/20 via-background to-background shadow-2xl group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-purple-600/30 group-hover:rotate-6 transition-transform">
              <Truck className="h-12 w-12 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic text-gradient bg-gradient-to-r from-purple-400 to-indigo-600">Logistic Hub</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Elite Delivery Network v1.2</p>
            </div>
            <div className="flex gap-4">
               <div className="glass-card px-6 py-3 rounded-2xl text-center border-white/5 shadow-xl">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Active Fleet</p>
                  <p className="text-xl font-black text-white mt-1">{(counts.shipped + counts.in_delivery)}</p>
               </div>
            </div>
          </div>
        </div>

        {/* ── Fleet Stats ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Siap Diambil",     count: counts.shipped,     icon: Package,  color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Dalam Pengiriman", count: counts.in_delivery, icon: Truck,    color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Terkirim",         count: counts.delivered,   icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-6 rounded-[2.5rem] border-white/5 flex items-center gap-5 hover:border-white/10 transition-all">
              <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tighter text-white">{s.count}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Management Tabs ────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === t.id 
                  ? "bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/20" 
                  : "glass-card border-white/5 text-muted-foreground hover:border-white/20 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Active Fleet List ──────────────────────────────────────── */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeOrders.length === 0 ? (
            <div className="glass-card py-20 rounded-[3rem] border-white/5 text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Truck className="h-10 w-10 text-white/20" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest text-white/40 italic">Terminal Empty</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Awaiting new logistic assignment</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrders.map((order) => (
                <div key={order.id} className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col group hover:border-white/10 transition-all shadow-2xl">
                   {/* Card Header */}
                   <div className="p-6 bg-white/5 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Package className="h-4 w-4 text-purple-500" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">{order.orderNumber}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{formatDate(order.date)}</p>
                         </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_CONFIG[order.status].bg} ${STATUS_CONFIG[order.status].color}`}>
                        {STATUS_CONFIG[order.status].label}
                      </div>
                   </div>

                   {/* Shipping Details */}
                   <div className="p-6 flex-1 space-y-4">
                      <div className="space-y-3">
                         <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                               <MapPin className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex-1">
                               <p className="text-xs font-black text-white uppercase tracking-tight">{order.shippingInfo?.firstName} {order.shippingInfo?.lastName}</p>
                               <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{order.shippingInfo?.address}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Phone className="h-4 w-4 text-emerald-500" />
                            </div>
                            <p className="text-xs font-mono font-bold text-white/60 tracking-wider">{order.shippingInfo?.phone || "No Contact"}</p>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                         <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Parcel Value</p>
                            <p className="text-sm font-black text-orange-500 italic mt-1">{formatPrice(order.grandTotal)}</p>
                         </div>
                         <div className="flex -space-x-2">
                            {order.items.slice(0, 3).map((item, idx) => (
                               <div key={item.id} className="w-8 h-8 rounded-lg border-2 border-slate-900 overflow-hidden bg-slate-800" style={{ zIndex: 3 - idx }}>
                                  <img src={item.image} className="w-full h-full object-cover" />
                               </div>
                            ))}
                            {order.items.length > 3 && (
                               <div className="w-8 h-8 rounded-lg border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[9px] font-black text-white/40" style={{ zIndex: 0 }}>
                                  +{order.items.length - 3}
                               </div>
                            )}
                         </div>
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
                      {order.status === "shipped" && (
                        <Button 
                          onClick={() => handlePickup(order.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20"
                        >
                          Pickup Parcel
                        </Button>
                      )}
                      {order.status === "in_delivery" && (
                        <Button 
                          onClick={() => handleDeliver(order.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                        >
                          Confirm Delivery
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => setChatOrder(order)}
                        className="h-11 w-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                      >
                        <MessageSquare className="h-4 w-4 text-white" />
                      </Button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {chatOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-2xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-lg rounded-[3rem] overflow-hidden flex flex-col shadow-2xl h-[600px]"
          >
             <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tighter uppercase italic">Secure Channel</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order: {chatOrder.orderNumber}</p>
                </div>
                <button onClick={() => setChatOrder(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition">
                  <X className="h-5 w-5 text-white" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                {(chatOrder.messages ?? []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                    <MessageSquare className="h-12 w-12" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No communication established</p>
                  </div>
                ) : (chatOrder.messages ?? []).map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.id ? "items-end" : "items-start"}`}>
                    <span className="text-[8px] font-black uppercase text-white/20 mb-1 tracking-widest">{msg.senderName} · {msg.senderRole}</span>
                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-xs font-bold leading-relaxed ${
                      msg.senderId === user?.id
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                        : "glass-card border-white/10 text-white/80"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
             </div>

             <div className="p-6 bg-white/5 border-t border-white/5">
                <div className="flex gap-3 h-14 bg-white/5 rounded-2xl border border-white/5 px-4 items-center">
                   <input 
                     placeholder="Type a secure message..."
                     className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-white placeholder:text-white/20"
                     onKeyDown={(e) => {
                       if (e.key === "Enter") {
                         const val = (e.target as HTMLInputElement).value;
                         if (val.trim()) {
                            // Update logic here
                            (e.target as HTMLInputElement).value = "";
                         }
                       }
                     }}
                   />
                   <button className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center hover:bg-purple-700 transition">
                      <Send className="h-4 w-4 text-white" />
                   </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
