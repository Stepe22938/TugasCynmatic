/**
 * OrderHistoryContext.tsx
 * Riwayat pesanan per-user + global reviews store.
 *
 * Pesanan disimpan per-user: `toko_orders_<userId>`
 * Reviews semua user disimpan global: `toko_all_reviews`
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem } from "./CartContext";
import { useAuth } from "./AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

interface OrderHistoryState { orders: PurchasedOrder[]; }

interface OrderHistoryContextType {
  state: OrderHistoryState;
  addOrder: (order: PurchasedOrder) => void;
  addReview: (orderId: string, review: Review) => void;
  getOrder: (orderId: string) => PurchasedOrder | undefined;
  getProductReviews: (productId: number) => Review[];
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const ALL_REVIEWS_KEY = "toko_all_reviews";

function storageKey(userId?: string) {
  return `toko_orders_${userId ?? "guest"}`;
}

function loadOrders(userId?: string): PurchasedOrder[] {
  try { return JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]"); }
  catch { return []; }
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

// ─── Context ──────────────────────────────────────────────────────────────────

const OrderHistoryContext = createContext<OrderHistoryContextType | undefined>(undefined);

export function OrderHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [orders, setOrders] = useState<PurchasedOrder[]>(() => loadOrders(user?.id));

  useEffect(() => {
    setOrders(loadOrders(user?.id));
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem(storageKey(user?.id), JSON.stringify(orders));
  }, [orders, user?.id]);

  const addOrder = (order: PurchasedOrder) =>
    setOrders((prev) => [order, ...prev]);

  const addReview = (orderId: string, review: Review) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, reviews: { ...o.reviews, [review.productId]: review } }
          : o
      )
    );
    upsertGlobalReview(review);
  };

  const getOrder = (orderId: string) => orders.find((o) => o.id === orderId);

  const getProductReviews = (productId: number): Review[] =>
    loadAllReviews()
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <OrderHistoryContext.Provider value={{ state: { orders }, addOrder, addReview, getOrder, getProductReviews }}>
      {children}
    </OrderHistoryContext.Provider>
  );
}

export function useOrderHistory() {
  const ctx = useContext(OrderHistoryContext);
  if (!ctx) throw new Error("useOrderHistory must be within OrderHistoryProvider");
  return ctx;
}
