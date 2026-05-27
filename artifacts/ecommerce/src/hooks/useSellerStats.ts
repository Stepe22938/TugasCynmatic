import { useMemo } from "react";
import { useProducts } from "../contexts/ProductsContext";
import { useOrderHistory } from "../contexts/OrderHistoryContext";

export interface MonthlyDataPoint {
  month: string;    // "Jan", "Feb", etc.
  revenue: number;
  orders: number;
}

export interface ProductStat {
  id: number;
  name: string;
  image: string;
  price: number;
  stock: number;
  revenue: number;
  unitsSold: number;
  margin: number;  // estimated margin
  status: string;
}

export function useSellerStats(sellerId: string) {
  const { allStoreProducts } = useProducts();
  const { allReviews, getAllOrders } = useOrderHistory();

  return useMemo(() => {
    // 1. Get all products from this seller
    const sellerProducts = allStoreProducts.filter(p => p.sellerId === sellerId);
    const sellerProductIds = new Set(sellerProducts.map(p => p.id));

    // 2. Get all reviews for these products
    const sellerReviews = allReviews.filter(r => sellerProductIds.has(r.productId));
    const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = sellerReviews.length > 0 ? totalRating / sellerReviews.length : 0;

    // 3. Compute order-based stats
    const allOrders = getAllOrders();
    let totalRevenue = 0;
    let totalUnitsSold = 0;
    const revenuePerProduct: Record<number, { revenue: number; units: number }> = {};
    const monthlyMap: Record<string, { revenue: number; orders: number }> = {};

    const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap[key] = { revenue: 0, orders: 0 };
    }

    allOrders.forEach(order => {
      let orderSellerRevenue = 0;
      let orderHasSellerItem = false;

      order.items.forEach(item => {
        if (sellerProductIds.has(item.id)) {
          const rev = item.price * item.quantity;
          orderSellerRevenue += rev;
          totalRevenue += rev;
          totalUnitsSold += item.quantity;
          orderHasSellerItem = true;

          if (!revenuePerProduct[item.id]) {
            revenuePerProduct[item.id] = { revenue: 0, units: 0 };
          }
          revenuePerProduct[item.id].revenue += rev;
          revenuePerProduct[item.id].units += item.quantity;
        }
      });

      if (orderHasSellerItem && order.date) {
        const d = new Date(order.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key].revenue += orderSellerRevenue;
          monthlyMap[key].orders += 1;
        }
      }
    });

    // 4. Build monthly chart data (last 6 months)
    const monthlyData: MonthlyDataPoint[] = Object.entries(monthlyMap).map(([key, val]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        month: MONTHS[month],
        revenue: val.revenue,
        orders: val.orders,
      };
    });

    // 5. Build product stats
    const MARGIN_RATE = 0.28; // 28% estimated margin
    const productStats: ProductStat[] = sellerProducts.map(p => {
      const stats = revenuePerProduct[p.id] ?? { revenue: 0, units: 0 };
      return {
        id: p.id,
        name: p.name,
        image: p.image,
        price: p.price,
        stock: p.stock,
        revenue: stats.revenue,
        unitsSold: stats.units,
        margin: Math.round(stats.revenue * MARGIN_RATE),
        status: (p as any).status ?? "approved",
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalMargin = Math.round(totalRevenue * MARGIN_RATE);
    const maxMonthRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: sellerReviews.length,
      totalProducts: sellerProducts.length,
      products: sellerProducts,
      // Extended
      totalRevenue,
      totalMargin,
      totalUnitsSold,
      totalOrders: allOrders.filter(o =>
        o.items.some(i => sellerProductIds.has(i.id))
      ).length,
      monthlyData,
      maxMonthRevenue,
      productStats,
      approvedCount: sellerProducts.filter(p => (p as any).status === "approved").length,
      pendingCount: sellerProducts.filter(p => (p as any).status === "pending").length,
      rejectedCount: sellerProducts.filter(p => (p as any).status === "rejected").length,
    };
  }, [sellerId, allStoreProducts, allReviews, getAllOrders]);
}
