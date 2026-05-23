/**
 * useProductRatings.ts
 * Menghitung rata-rata rating per produk dari global reviews store
 * (mengambil data dari OrderHistoryContext yang tersinkron VPS).
 */
import { useMemo } from "react";
import { useOrderHistory } from "../contexts/OrderHistoryContext";

export interface ProductRatingInfo {
  average: number;
  count: number;
}

export function useProductRatings(): Record<number, ProductRatingInfo> {
  const { allReviews } = useOrderHistory();

  return useMemo(() => {
    const map: Record<number, { total: number; count: number }> = {};

    allReviews.forEach(({ productId, rating }) => {
      if (!map[productId]) map[productId] = { total: 0, count: 0 };
      map[productId].total += rating;
      map[productId].count += 1;
    });

    const result: Record<number, ProductRatingInfo> = {};
    Object.entries(map).forEach(([id, { total, count }]) => {
      result[Number(id)] = { average: Math.round((total / count) * 10) / 10, count };
    });
    return result;
  }, [allReviews]);
}
