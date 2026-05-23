import { useMemo } from "react";
import { useProducts } from "../contexts/ProductsContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";

export function useSellerStats(sellerId: string) {
  const { allStoreProducts } = useProducts();
  const { allReviews } = useOrderHistory();

  return useMemo(() => {
    // 1. Get all products from this seller
    const sellerProducts = allStoreProducts.filter(p => p.sellerId === sellerId);
    const sellerProductIds = new Set(sellerProducts.map(p => p.id));

    // 2. Get all reviews for these products
    const sellerReviews = allReviews.filter(r => sellerProductIds.has(r.productId));

    // 3. Calculate average rating
    const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = sellerReviews.length > 0 ? totalRating / sellerReviews.length : 0;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: sellerReviews.length,
      totalProducts: sellerProducts.length,
      products: sellerProducts
    };
  }, [sellerId, allStoreProducts, allReviews]);
}
