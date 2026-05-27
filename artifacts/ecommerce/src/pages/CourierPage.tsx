/**
 * CourierPage.tsx
 * Halaman kurir untuk mengambil paket, update status, dan chat pembeli.
 */
import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useOrderHistory, OrderStatus, PurchasedOrder } from "../contexts/OrderHistoryContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

type FilterTab = "shipped" | "in_delivery" | "delivered" | "all";

const COURIER_STATUSES: OrderStatus[] = ["shipped", "in_delivery", "delivered", "completed", "problem"];

const STATUS_CONFIG: Record<OrderStatus, { label: string; tone: string; dot: string }> = {
  placed: { label: "Pesanan Masuk", tone: "bg-sky-500/10 text-sky-300 border-sky-400/20", dot: "bg-sky-400" },
  processing: { label: "Diproses", tone: "bg-amber-500/10 text-amber-300 border-amber-400/20", dot: "bg-amber-400" },
  pending_po: { label: "Pending PO", tone: "bg-cyan-500/10 text-cyan-300 border-cyan-400/20", dot: "bg-cyan-400" },
  shipped: { label: "Siap Diambil", tone: "bg-orange-500/10 text-orange-300 border-orange-400/20", dot: "bg-orange-400" },
  in_delivery: { label: "Dalam Pengiriman", tone: "bg-teal-500/10 text-teal-300 border-teal-400/20", dot: "bg-teal-400" },
  delivered: { label: "Terkirim", tone: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20", dot: "bg-emerald-400" },
  completed: { label: "Selesai", tone: "bg-lime-500/10 text-lime-300 border-lime-400/20", dot: "bg-lime-400" },
  problem: { label: "Bermasalah", tone: "bg-red-500/10 text-red-300 border-red-400/20", dot: "bg-red-400" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCustomerName(order: PurchasedOrder) {
  const firstName = order.shippingInfo?.firstName?.trim();
  const lastName = order.shippingInfo?.lastName?.trim();
  return [firstName, lastName].filter(Boolean).join(" ") || order.userName || "Pelanggan";
}

function CourierHero({ ready, active, delivered }: { ready: number; active: number; delivered: number }) {
  const totalLive = ready + active;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/70 to-transparent" />
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-8">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-orange-200">
            <Sparkles className="h-3.5 w-3.5" />
            Cynmatic Express
          </div>

          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-black leading-none tracking-normal text-white sm:text-5xl">
              Kurir Control Center
            </h1>
            <p className="max-w-xl text-sm font-medium leading-6 text-white/55">
              Pantau paket siap ambil, jalankan pengiriman, dan jaga komunikasi pembeli dari satu layar yang lebih cepat dipindai.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Live Route</p>
              <p className="mt-1 text-2xl font-black text-white">{totalLive}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Selesai</p>
              <p className="mt-1 text-2xl font-black text-emerald-300">{delivered}</p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[210px] overflow-hidden rounded-2xl border border-white/10 bg-[#171717] p-5">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.14),transparent_38%,rgba(20,184,166,0.12))]" />
          <div className="relative flex h-full flex-col justify-between gap-5">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-950/40">
                <Truck className="h-6 w-6" />
              </div>
              <div className="rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-teal-200">
                Online
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.8)]" />
                <div className="h-px flex-1 bg-white/15" />
                <Navigation className="h-4 w-4 text-white/35" />
                <div className="h-px flex-1 bg-white/15" />
                <div className="h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.7)]" />
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                <span>Pickup</span>
                <span>Delivery</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Ready</p>
                <p className="mt-1 text-lg font-black text-orange-200">{ready} Paket</p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">On Road</p>
                <p className="mt-1 text-lg font-black text-teal-200">{active} Paket</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const steps = [
    { id: "shipped", label: "Pickup" },
    { id: "in_delivery", label: "On road" },
    { id: "delivered", label: "Drop" },
  ];
  const activeIndex = status === "shipped" ? 0 : status === "in_delivery" ? 1 : 2;

  return (
    <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2">
      {steps.map((step, index) => {
        const done = index <= activeIndex;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${done ? "border-orange-300/30 bg-orange-500 text-white" : "border-white/10 bg-white/5 text-white/25"}`}>
                {index === 0 ? <Package className="h-4 w-4" /> : index === 1 ? <Truck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-px ${index < activeIndex ? "bg-orange-300/60" : "bg-white/10"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CourierOrderCard({
  order,
  onPickup,
  onDeliver,
  onMessage,
}: {
  order: PurchasedOrder;
  onPickup: (id: string) => void;
  onDeliver: (id: string) => void;
  onMessage: (order: PurchasedOrder) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const customerName = getCustomerName(order);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-xl shadow-black/30"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.03] p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-white">{order.orderNumber}</p>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${cfg.tone}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-white/40">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDate(order.date)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onMessage(order)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-orange-300/30 hover:bg-orange-500/10 hover:text-orange-200"
          aria-label="Buka chat"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5 p-4">
        <OrderTimeline status={order.status} />

        <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-200">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white">{customerName}</p>
              <p className="mt-1 text-xs font-medium leading-5 text-white/50">
                {order.shippingInfo?.address || "Alamat pengiriman belum tersedia."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/10 text-orange-200">
              <Phone className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold tracking-wide text-white/60">{order.shippingInfo?.phone || "Nomor belum tersedia"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Isi Paket</p>
            <p className="mt-1 text-sm font-black text-white">
              {order.items.length} produk <span className="text-orange-300">{formatPrice(order.grandTotal)}</span>
            </p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-white/45" /> : <ChevronDown className="h-4 w-4 text-white/45" />}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-11 w-11 shrink-0 rounded-lg bg-white/5 object-cover"
                      onError={(event) => {
                        event.currentTarget.src = "https://placehold.co/80x80/171717/f97316?text=C";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-white">{item.name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-white/40">
                        x{item.quantity} - {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3 border-t border-white/10 bg-white/[0.03] p-4">
        {order.status === "shipped" && (
          <Button onClick={() => onPickup(order.id)} className="h-11 flex-1 rounded-xl bg-orange-600 text-xs font-black uppercase tracking-widest text-white hover:bg-orange-500">
            <Truck className="mr-2 h-4 w-4" />
            Ambil Paket
          </Button>
        )}
        {order.status === "in_delivery" && (
          <Button onClick={() => onDeliver(order.id)} className="h-11 flex-1 rounded-xl bg-emerald-600 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-500">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Terkirim
          </Button>
        )}
        {order.status !== "shipped" && order.status !== "in_delivery" && (
          <div className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/35">
            Status terkunci
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => onMessage(order)}
          className="h-11 w-11 rounded-xl border-white/10 bg-white/[0.04] p-0 text-white hover:bg-white/[0.08]"
          aria-label="Chat pembeli"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </motion.article>
  );
}

function ChatModal({ order, onClose }: { order: PurchasedOrder; onClose: () => void }) {
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 backdrop-blur-xl sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="flex h-[78vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] p-4">
          <div className="min-w-0">
            <p className="truncate text-base font-black text-white">Chat Pengiriman</p>
            <p className="mt-1 truncate text-xs font-semibold text-white/40">
              {order.orderNumber} - {getCustomerName(order)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/65 transition hover:text-white"
            aria-label="Tutup chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {(order.messages ?? []).length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-white/25">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/35">Belum ada pesan</p>
            </div>
          ) : (
            (order.messages ?? []).map((msg) => {
              const mine = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <span className="mb-1 text-[10px] font-bold text-white/30">
                    {msg.senderName} - {msg.senderRole}
                  </span>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${mine ? "bg-orange-600 text-white" : "bg-white/[0.06] text-white/75"}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && send()}
              placeholder="Tulis pesan ke pembeli..."
              className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-white outline-none placeholder:text-white/25"
            />
            <button
              type="button"
              onClick={send}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white transition hover:bg-orange-500"
              aria-label="Kirim pesan"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function CourierPage() {
  const { user } = useAuth();
  const { getAllOrders, updateOrderStatus } = useOrderHistory();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>("shipped");
  const [query, setQuery] = useState("");
  const [chatOrder, setChatOrder] = useState<PurchasedOrder | null>(null);

  const allOrders = getAllOrders();
  const courierOrders = useMemo(
    () => allOrders.filter((order) => COURIER_STATUSES.includes(order.status)),
    [allOrders],
  );

  const counts = useMemo(
    () => ({
      shipped: courierOrders.filter((order) => order.status === "shipped").length,
      in_delivery: courierOrders.filter((order) => order.status === "in_delivery").length,
      delivered: courierOrders.filter((order) => order.status === "delivered" || order.status === "completed").length,
      problem: courierOrders.filter((order) => order.status === "problem").length,
    }),
    [courierOrders],
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courierOrders.filter((order) => {
      const matchesTab = filter === "all" || order.status === filter || (filter === "delivered" && order.status === "completed");
      if (!matchesTab) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        order.orderNumber,
        getCustomerName(order),
        order.shippingInfo?.address,
        order.shippingInfo?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [courierOrders, filter, query]);

  const filterTabs: { id: FilterTab; label: string; count?: number; icon: React.ElementType }[] = [
    { id: "shipped", label: "Pickup", count: counts.shipped, icon: Package },
    { id: "in_delivery", label: "On Road", count: counts.in_delivery, icon: Truck },
    { id: "delivered", label: "Drop", count: counts.delivered, icon: CheckCircle2 },
    { id: "all", label: "Semua", count: courierOrders.length, icon: Route },
  ];

  const handlePickup = (orderId: string) => {
    updateOrderStatus(orderId, "in_delivery");
    toast({ title: "Paket diambil", description: "Status berubah menjadi Dalam Pengiriman." });
  };

  const handleDeliver = (orderId: string) => {
    updateOrderStatus(orderId, "delivered");
    toast({ title: "Paket terkirim", description: "Pembeli akan mendapatkan update status." });
  };

  if (!user || (user.role !== "kurir" && user.role !== "admin")) return null;

  return (
    <div className="min-h-screen bg-[#080808] pb-20 pt-3 text-white">
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 sm:px-6">
        <CourierHero ready={counts.shipped} active={counts.in_delivery} delivered={counts.delivered} />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Siap Ambil", value: counts.shipped, icon: Package, color: "text-orange-200", bg: "bg-orange-500/10" },
            { label: "On Road", value: counts.in_delivery, icon: Navigation, color: "text-teal-200", bg: "bg-teal-500/10" },
            { label: "Terkirim", value: counts.delivered, icon: ShieldCheck, color: "text-emerald-200", bg: "bg-emerald-500/10" },
            { label: "Issue", value: counts.problem, icon: User, color: "text-red-200", bg: "bg-red-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="sticky top-20 z-20 space-y-3 rounded-2xl border border-white/10 bg-[#101010]/90 p-3 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-black uppercase tracking-widest transition ${
                    active
                      ? "border-orange-300/30 bg-orange-600 text-white shadow-lg shadow-orange-950/30"
                      : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/15" : "bg-white/[0.06]"}`}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <Search className="h-4 w-4 text-white/30" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari order, nama, alamat, atau nomor HP"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25"
            />
            <ArrowRight className="h-4 w-4 text-white/25" />
          </label>
        </section>

        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.section
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-16 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] text-white/20">
                <Truck className="h-8 w-8" />
              </div>
              <p className="mt-5 text-sm font-black uppercase tracking-widest text-white/45">Tidak ada paket</p>
              <p className="mt-2 text-xs font-semibold text-white/35">Coba ganti filter atau kata pencarian.</p>
            </motion.section>
          ) : (
            <motion.section layout className="grid gap-4 lg:grid-cols-2">
              {filteredOrders.map((order) => (
                <CourierOrderCard
                  key={order.id}
                  order={order}
                  onPickup={handlePickup}
                  onDeliver={handleDeliver}
                  onMessage={setChatOrder}
                />
              ))}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {chatOrder && <ChatModal order={chatOrder} onClose={() => setChatOrder(null)} />}
      </AnimatePresence>
    </div>
  );
}
