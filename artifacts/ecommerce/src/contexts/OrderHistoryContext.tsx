/**
 * OrderHistoryContext.tsx
 * Manages riwayat pesanan (order history) dan review produk.
 *
 * Fitur:
 * - Menyimpan semua pesanan yang sudah dibayar
 * - Menyimpan review per produk dalam setiap pesanan
 * - Semua data dipersist ke localStorage
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { CartItem } from "./CartContext";

// ─── Types ───────────────────────────────────────────────────────────────────

/** File media yang diupload sebagai bukti (dummy — hanya preview lokal) */
export interface MediaFile {
  name: string;
  type: "image" | "video";
  /** Base64 atau object URL untuk preview di browser */
  preview: string;
}

/** Review/komentar untuk satu produk dalam satu pesanan */
export interface Review {
  productId: number;
  orderId: string;
  /** Rating bintang 1–5 */
  rating: number;
  /** Apakah barang sesuai atau tidak */
  status: "sesuai" | "tidak_sesuai";
  /** Isi komentar / keluhan */
  comment: string;
  /** File gambar/video sebagai bukti (dummy) */
  mediaFiles: MediaFile[];
  createdAt: string;
}

/** Satu pesanan yang sudah dibayar */
export interface PurchasedOrder {
  id: string;
  orderNumber: string;
  date: string; // ISO date string
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  /** Map dari productId → Review */
  reviews: Record<number, Review>;
}

interface OrderHistoryState {
  orders: PurchasedOrder[];
}

type OrderHistoryAction =
  | { type: "ADD_ORDER"; payload: PurchasedOrder }
  | {
      type: "ADD_REVIEW";
      payload: { orderId: string; review: Review };
    };

interface OrderHistoryContextType {
  state: OrderHistoryState;
  /** Tambah pesanan baru setelah checkout berhasil */
  addOrder: (order: PurchasedOrder) => void;
  /** Simpan review untuk produk tertentu dalam pesanan */
  addReview: (orderId: string, review: Review) => void;
  /** Ambil satu pesanan berdasarkan id */
  getOrder: (orderId: string) => PurchasedOrder | undefined;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: OrderHistoryState = { orders: [] };

function initState(initial: OrderHistoryState): OrderHistoryState {
  try {
    const data = localStorage.getItem("toko_orders");
    return data ? JSON.parse(data) : initial;
  } catch {
    return initial;
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(
  state: OrderHistoryState,
  action: OrderHistoryAction
): OrderHistoryState {
  switch (action.type) {
    case "ADD_ORDER":
      return { ...state, orders: [action.payload, ...state.orders] };

    case "ADD_REVIEW": {
      const { orderId, review } = action.payload;
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                reviews: { ...order.reviews, [review.productId]: review },
              }
            : order
        ),
      };
    }

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const OrderHistoryContext = createContext<OrderHistoryContextType | undefined>(
  undefined
);

export function OrderHistoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, initState);

  // Sinkronisasi ke localStorage setiap kali state berubah
  useEffect(() => {
    localStorage.setItem("toko_orders", JSON.stringify(state));
  }, [state]);

  const addOrder = (order: PurchasedOrder) =>
    dispatch({ type: "ADD_ORDER", payload: order });

  const addReview = (orderId: string, review: Review) =>
    dispatch({ type: "ADD_REVIEW", payload: { orderId, review } });

  const getOrder = (orderId: string) =>
    state.orders.find((o) => o.id === orderId);

  return (
    <OrderHistoryContext.Provider
      value={{ state, addOrder, addReview, getOrder }}
    >
      {children}
    </OrderHistoryContext.Provider>
  );
}

/** Hook untuk mengakses OrderHistoryContext */
export function useOrderHistory() {
  const ctx = useContext(OrderHistoryContext);
  if (!ctx)
    throw new Error("useOrderHistory must be used within OrderHistoryProvider");
  return ctx;
}
