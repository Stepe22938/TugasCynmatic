/**
 * useProductRatings.ts
 * Hook untuk menghitung rata-rata rating per produk dari semua ulasan user.
 *
 * Membaca semua pesanan dari OrderHistoryContext dan mengagregasi
 * semua review menjadi rata-rata rating per productId.
 *
 * Contoh output: { 1: { average: 4.5, count: 2 }, 2: { average: 3, count: 1 } }
 */
import { useMemo } from "react";
import { useOrderHistory } from "../contexts/OrderHistoryContext";

export interface ProductRatingInfo {
  /** Rata-rata rating (1–5), atau 0 jika belum ada review */
  average: number;
  /** Jumlah review yang masuk */
  count: number;
}

/**
 * Mengembalikan map dari productId ke info rating rata-ratanya.
 * Di-memoize agar tidak recompute tiap render.
 */
export function useProductRatings(): Record<number, ProductRatingInfo> {
  const { state } = useOrderHistory();

  return useMemo(() => {
    const ratingMap: Record<number, { total: number; count: number }> = {};

    // Iterasi semua pesanan dan semua review di dalamnya
    state.orders.forEach((order) => {
      Object.values(order.reviews).forEach((review) => {
        if (!ratingMap[review.productId]) {
          ratingMap[review.productId] = { total: 0, count: 0 };
        }
        ratingMap[review.productId].total += review.rating;
        ratingMap[review.productId].count += 1;
      });
    });

    // Konversi ke format { average, count }
    const result: Record<number, ProductRatingInfo> = {};
    Object.entries(ratingMap).forEach(([id, { total, count }]) => {
      result[Number(id)] = {
        average: Math.round((total / count) * 10) / 10, // bulatkan 1 desimal
        count,
      };
    });

    return result;
  }, [state.orders]);
}
