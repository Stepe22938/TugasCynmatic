/**
 * OrderHistoryContext.tsx
 * Global order store — Fully synced to VPS MariaDB.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem } from "./CartContext";
import { useAuth } from "./AuthContext";
import { 
  fetchAllOrdersFromVPS, 
  fetchAllReviewsFromVPS, 
  syncOrderToVPS, 
  syncReviewToVPS 
} from "../lib/sync";

export type OrderStatus =
  | "placed"       
  | "processing"   
  | "pending_po"   
  | "shipped"      
  | "in_delivery"  
  | "delivered"    
  | "completed"    
  | "problem";     

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
  paymentMethod?: "dana" | "qris" | "mydompet";
  voucherCode?: string;
  voucherDiscount?: number;
  sellerVoucherCode?: string;
  sellerVoucherDiscount?: number;
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
  allReviews: Review[];
}

const OrderHistoryContext = createContext<OrderHistoryContextType | undefined>(undefined);

export function OrderHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<PurchasedOrder[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  // Initial Fetch from VPS & Polling every 10s
  useEffect(() => {
    const init = async () => {
      const orders = await fetchAllOrdersFromVPS();
      const reviews = await fetchAllReviewsFromVPS();
      if (orders) {
        const parsedOrders = orders.map((o: any) => {
          const ensureArray = (val: any) => {
            if (Array.isArray(val)) return val;
            if (typeof val === "string") {
              try { return JSON.parse(val); } catch (e) { return []; }
            }
            return [];
          };
          const ensureObject = (val: any) => {
            if (typeof val === "object" && val !== null) return val;
            if (typeof val === "string") {
              try { return JSON.parse(val); } catch (e) { return {}; }
            }
            return {};
          };
          return {
            ...o,
            subtotal: Number(o.subtotal || 0),
            shippingFee: Number(o.shippingFee || 0),
            grandTotal: Number(o.grandTotal || 0),
            items: ensureArray(o.items),
            reviews: ensureObject(o.reviews),
            shippingInfo: ensureObject(o.shippingInfo),
            messages: ensureArray(o.messages)
          };
        });
        setAllOrders(parsedOrders);
      }
      if (reviews) {
        const parsedReviews = reviews.map((r: any) => {
          const ensureArray = (val: any) => {
            if (Array.isArray(val)) return val;
            if (typeof val === "string") {
              try { return JSON.parse(val); } catch (e) { return []; }
            }
            return [];
          };
          return { ...r, mediaFiles: ensureArray(r.mediaFiles) };
        });
        setAllReviews(parsedReviews);
      }
    };
    init();
    const interval = setInterval(init, 3000);
    return () => clearInterval(interval);
  }, []);

  const addOrder = (order: PurchasedOrder) => {
    setAllOrders((prev) => [order, ...prev]);
    syncOrderToVPS(order);
  };

  const addReview = (orderId: string, review: Review) => {
    const updatedOrders = allOrders.map((o) =>
      o.id === orderId ? { ...o, reviews: { ...o.reviews, [review.productId]: review } } : o
    );
    setAllOrders(updatedOrders);
    
    const targetOrder = updatedOrders.find(o => o.id === orderId);
    if (targetOrder) syncOrderToVPS(targetOrder);

    setAllReviews(prev => [...prev, review]);
    syncReviewToVPS(review);
  };

  const getOrder = (orderId: string) => allOrders.find((o) => o.id === orderId);

  const getProductReviews = (productId: number): Review[] =>
    allReviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    setAllOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== orderId) return o;
        const update: Partial<PurchasedOrder> = { status };
        if (note && status === "in_delivery") update.courierNote = note;
        const newOrder = { ...o, ...update };
        syncOrderToVPS(newOrder); // Sync changes to VPS
        return newOrder;
      });
      return updated;
    });
  };

  const addMessage = (orderId: string, msg: Omit<OrderMessage, "id" | "createdAt">) => {
    const message: OrderMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    setAllOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newOrder = { ...o, messages: [...(o.messages ?? []), message] };
        syncOrderToVPS(newOrder);
        return newOrder;
      })
    );
  };

  const getAllOrders = () => allOrders;

  const reportProblem = (orderId: string, report: string) => {
    setAllOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newOrder = { ...o, status: "problem", problemReport: report } as PurchasedOrder;
        syncOrderToVPS(newOrder);
        return newOrder;
      })
    );
  };

  // Buyer's own orders view
  const myOrders = user
    ? allOrders.filter((o) => o.userId === user.id)
    : [];

  return (
    <OrderHistoryContext.Provider value={{
      state: { orders: myOrders },
      addOrder, addReview, getOrder, getProductReviews,
      updateOrderStatus, addMessage, getAllOrders, reportProblem,
      allReviews
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
