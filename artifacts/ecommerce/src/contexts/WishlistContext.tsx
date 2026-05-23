/**
 * WishlistContext.tsx
 * Mengelola produk yang disimpan oleh user.
 * Disimpan di localStorage per user.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { Product } from "../data/products";
import { useNotifications } from "./NotificationContext";
import { useProducts } from "./ProductsContext";

interface WishlistItem extends Product {
  priceAtAddition: number;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: number) => boolean;
  getWishlistCountForProduct: (productId: number) => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const { addNotification } = useNotifications();
  const { allStoreProducts } = useProducts();
  const storageKey = user ? `wishlist_${user.id}` : "wishlist_guest";
  
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    if (user && user.wishlist) return user.wishlist;
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  });

  // Global counts map for sellers (simulated since we don't have a real DB)
  // We'll store this in a separate global key so sellers can see it
  const [globalCounts, setGlobalCounts] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem("global_wishlist_counts") ?? "{}");
    } catch {
      return {};
    }
  });

  // Load wishlist whenever storageKey changes (user logs in/out) or when user db wishlist changes
  useEffect(() => {
    if (user) {
      setWishlist(user.wishlist || []);
    } else {
      try {
        const saved = localStorage.getItem(storageKey);
        setWishlist(saved ? JSON.parse(saved) : []);
      } catch {
        setWishlist([]);
      }
    }
  }, [storageKey, user?.wishlist]);

  useEffect(() => {
    // Only save if storageKey is valid (avoiding clearing data during rapid switching)
    if (wishlist.length > 0 || (localStorage.getItem(storageKey) && wishlist.length === 0)) {
      localStorage.setItem(storageKey, JSON.stringify(wishlist));
    }
  }, [wishlist, storageKey]);

  useEffect(() => {
    localStorage.setItem("global_wishlist_counts", JSON.stringify(globalCounts));
  }, [globalCounts]);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      let newWishlist;
      if (exists) {
        newWishlist = prev.filter((p) => p.id !== product.id);
        // Update global count
        setGlobalCounts(gc => ({
          ...gc,
          [product.id]: Math.max(0, (gc[product.id] || 0) - 1)
        }));
      } else {
        newWishlist = [...prev, { ...product, priceAtAddition: product.price }];
        // Update global count
        setGlobalCounts(gc => ({
          ...gc,
          [product.id]: (gc[product.id] || 0) + 1
        }));
        
        addNotification({
          type: "system",
          title: "Wishlist Diupdate",
          message: `${product.name} telah disimpan ke wishlist kamu.`,
        });
      }
      
      // Sync database if logged in
      if (user) {
        updateUser({ wishlist: newWishlist });
      }
      
      return newWishlist;
    });
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((p) => p.id === productId);
  };

  // Watch for price drops or low stock
  useEffect(() => {
    wishlist.forEach(item => {
      const current = allStoreProducts.find(p => p.id === item.id);
      if (!current) return;

      // Price Drop Notification
      if (current.price < item.priceAtAddition) {
        addNotification({
          type: "system",
          title: "Harga Turun!",
          message: `${item.name} sekarang hanya ${current.price.toLocaleString("id-ID")}. Buruan cek!`,
        });
        // Update base price so we don't spam
        setWishlist(prev => prev.map(p => p.id === item.id ? { ...p, priceAtAddition: current.price } : p));
      }

      // Low Stock Notification
      if (current.stock > 0 && current.stock <= 5 && item.stock > 5) {
         addNotification({
          type: "system",
          title: "Stok Hampir Habis!",
          message: `Produk ${item.name} di wishlist kamu tersisa ${current.stock} lagi!`,
        });
        // Update local stock to avoid spam
        setWishlist(prev => prev.map(p => p.id === item.id ? { ...p, stock: current.stock } : p));
      }
    });
  }, [allStoreProducts, wishlist, addNotification]);

  const getWishlistCountForProduct = (productId: number) => {
    return globalCounts[productId] || 0;
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, getWishlistCountForProduct }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
}
