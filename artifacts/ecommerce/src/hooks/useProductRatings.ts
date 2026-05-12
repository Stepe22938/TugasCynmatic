/**
 * useProductRatings.ts
 * Menghitung rata-rata rating per produk dari global reviews store
 * (semua ulasan semua user, bukan hanya user yang sedang login).
 */
import { useMemo } from "react";

export interface ProductRatingInfo {
  average: number;
  count: number;
}

const ALL_REVIEWS_KEY = "toko_all_reviews";

function loadAllReviews(): { productId: number; rating: number }[] {
  try { return JSON.parse(localStorage.getItem(ALL_REVIEWS_KEY) ?? "[]"); }
  catch { return []; }
}

export function useProductRatings(): Record<number, ProductRatingInfo> {
  return useMemo(() => {
    const reviews = loadAllReviews();
    const map: Record<number, { total: number; count: number }> = {};

    reviews.forEach(({ productId, rating }) => {
      if (!map[productId]) map[productId] = { total: 0, count: 0 };
      map[productId].total += rating;
      map[productId].count += 1;
    });

    const result: Record<number, ProductRatingInfo> = {};
    Object.entries(map).forEach(([id, { total, count }]) => {
      result[Number(id)] = { average: Math.round((total / count) * 10) / 10, count };
    });
    return result;
  }, []);
}
