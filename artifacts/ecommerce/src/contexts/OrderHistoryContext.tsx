/**
 * OrderHistoryContext.tsx
 * Global order store — semua pesanan disimpan di satu key.
 * Seller & kurir bisa lihat semua pesanan.
 * Buyer hanya lihat pesanan miliknya.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem } from "./CartContext";
import { useAuth } from "./AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "placed"       // Pesanan masuk
  | "processing"   // Seller sedang memproses
  | "shipped"      // Dikirim ke kurir
  | "in_delivery"  // Kurir sedang mengantar
  | "delivered"    // Sudah sampai
  | "completed"    // Buyer konfirmasi terima
  | "problem";     // Buyer lapor masalah

export interface OrderMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

export interface MediaFile {
  name: string;
  type: "image" | "video";
  preview: string;
}

export interface Review {
  productId: number;
  orderId: string;
  userName: string;
  rating: number;
  status: "sesuai" | "tidak_sesuai";
  comment: string;
  mediaFiles: MediaFile[];
  createdAt: string;
}

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  address: string;
  phone?: string;
}

export interface PurchasedOrder {
  id: string;
  userId: string;
  userName?: string;
  orderNumber: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  reviews: Record<number, Review>;
  shippingInfo?: ShippingInfo;
  paymentMethod?: "dana" | "qris";
  voucherCode?: string;
  voucherDiscount?: number;
  coinDiscount?: number;
  status: OrderStatus;
  messages: OrderMessage[];
  problemReport?: string;
  courierNote?: string;
}

interface OrderHistoryContextType {
  state: { orders: PurchasedOrder[] };
  addOrder: (order: PurchasedOrder) => void;
  addReview: (orderId: string, review: Review) => void;
  getOrder: (orderId: string) => PurchasedOrder | undefined;
  getProductReviews: (productId: number) => Review[];
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  addMessage: (orderId: string, msg: Omit<OrderMessage, "id" | "createdAt">) => void;
  getAllOrders: () => PurchasedOrder[];
  reportProblem: (orderId: string, report: string) => void;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const ALL_ORDERS_KEY  = "toko_all_orders_v2";
const ALL_REVIEWS_KEY = "toko_all_reviews";

function loadAllOrders(): PurchasedOrder[] {
  try {
    const data = JSON.parse(localStorage.getItem(ALL_ORDERS_KEY) ?? "[]");
    return data.map((o: any) => ({
      ...o,
      status: o.status || "placed",
      messages: o.messages || []
    }));
  }
  catch { return []; }
}

function saveAllOrders(orders: PurchasedOrder[]) {
  localStorage.setItem(ALL_ORDERS_KEY, JSON.stringify(orders));
}

function loadAllReviews(): Review[] {
  try { return JSON.parse(localStorage.getItem(ALL_REVIEWS_KEY) ?? "[]"); }
  catch { return []; }
}

function saveAllReviews(reviews: Review[]) {
  localStorage.setItem(ALL_REVIEWS_KEY, JSON.stringify(reviews));
}

function upsertGlobalReview(review: Review) {
  const all = loadAllReviews();
  const filtered = all.filter((r) => !(r.orderId === review.orderId && r.productId === review.productId));
  saveAllReviews([...filtered, review]);
}

// ─── Context ─────────────────────────────────────────────────────────────────

const OrderHistoryContext = createContext<OrderHistoryContextType | undefined>(undefined);

export function OrderHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchasedOrder[]>(loadAllOrders);

  // Sync to localStorage on every change
  useEffect(() => {
    saveAllOrders(orders);
  }, [orders]);

  const addOrder = (order: PurchasedOrder) =>
    setOrders((prev) => [order, ...prev]);

  const addReview = (orderId: string, review: Review) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, reviews: { ...o.reviews, [review.productId]: review } } : o
      )
    );
    upsertGlobalReview(review);
  };

  const getOrder = (orderId: string) => orders.find((o) => o.id === orderId);

  const getProductReviews = (productId: number): Review[] =>
    loadAllReviews()
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const update: Partial<PurchasedOrder> = { status };
        if (note && status === "in_delivery") update.courierNote = note;
        return { ...o, ...update };
      })
    );
  };

  const addMessage = (orderId: string, msg: Omit<OrderMessage, "id" | "createdAt">) => {
    const message: OrderMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, messages: [...(o.messages ?? []), message] } : o
      )
    );
  };

  const getAllOrders = () => orders;

  const reportProblem = (orderId: string, report: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "problem", problemReport: report } : o
      )
    );
  };

  // Buyer's own orders
  const myOrders = user
    ? orders.filter((o) => o.userId === user.id)
    : [];

  return (
    <OrderHistoryContext.Provider value={{
      state: { orders: myOrders },
      addOrder, addReview, getOrder, getProductReviews,
      updateOrderStatus, addMessage, getAllOrders, reportProblem,
    }}>
      {children}
    </OrderHistoryContext.Provider>
  );
}

export function useOrderHistory() {
  const ctx = useContext(OrderHistoryContext);
  if (!ctx) throw new Error("useOrderHistory must be within OrderHistoryProvider");
  return ctx;
}
