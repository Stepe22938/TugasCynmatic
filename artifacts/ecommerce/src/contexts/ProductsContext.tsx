/**
 * ProductsContext.tsx
 * Produk dinamis dari seller + produk Admin Toko (dapat dihapus).
 *
 * Admin products: pertama kali di-seed dari staticProducts ke localStorage,
 * setelah itu sepenuhnya dikelola dari sana (bisa dihapus/ditambah).
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { products as staticProducts, Product } from "../data/products";

export type ProductStatus = "pending" | "approved" | "rejected";

export interface SellerProduct {
  id: number;
  sellerId: string;
  sellerName: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  specs: { label: string; value: string }[];
  status: ProductStatus;
  createdAt: string;
  isFlashSale?: boolean;
  discountPercent?: number;
  stock: number;
  isPreOrder?: boolean;
  releaseDate?: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  specs: { label: string; value: string }[];
  sellerId: "admin-001";
  sellerName: "Admin Toko";
  createdAt: string;
  isFlashSale?: boolean;
  discountPercent?: number;
  stock: number;
  isPreOrder?: boolean;
  releaseDate?: string;
}

interface ProductsContextType {
  sellerProducts: SellerProduct[];
  adminProducts: AdminProduct[];
  approvedSellerProducts: Product[];
  allStoreProducts: Product[];
  autoApprove: boolean;
  setAutoApprove: (v: boolean) => void;
  submitProduct: (data: Omit<SellerProduct, "id" | "status" | "createdAt">) => void;
  approveProduct: (id: number) => void;
  rejectProduct: (id: number) => void;
  deleteProduct: (id: number) => void;
  /** Hapus produk Admin Toko */
  deleteAdminProduct: (id: number) => void;
  /** Tambah produk baru sebagai Admin Toko (langsung approved) */
  addAdminProduct: (data: Omit<AdminProduct, "id" | "sellerId" | "sellerName" | "createdAt">) => void;
  /** Toggle Flash Sale status and set discount */
  toggleFlashSale: (id: number, isFlashSale: boolean, discountPercent: number) => void;
  /** Update stock for a product */
  updateStock: (id: number, newStock: number) => void;
  /** Decrement stock after purchase */
  decrementStock: (id: number, quantity: number) => void;
  /** Update existing product details */
  updateProduct: (id: number, data: Partial<Omit<SellerProduct, "id" | "sellerId" | "createdAt">>) => void;
  /** Update existing admin product details */
  updateAdminProduct: (id: number, data: Partial<Omit<AdminProduct, "id" | "sellerId" | "createdAt">>) => void;
}

const PRODUCTS_KEY       = "toko_seller_products";
const ADMIN_PRODUCTS_KEY = "toko_admin_products";
const ADMIN_SEEDED_KEY   = "toko_admin_seeded_v2";
const AUTO_APPROVE_KEY   = "toko_auto_approve";

function loadSellerProducts(): SellerProduct[] {
  try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) ?? "[]"); }
  catch { return []; }
}

function loadAdminProducts(): AdminProduct[] {
  const saved = localStorage.getItem(ADMIN_PRODUCTS_KEY);
  if (saved && saved !== "[]") {
    try { return JSON.parse(saved); } catch { }
  }
  
  // Seed if missing or empty
  const seededProducts: AdminProduct[] = staticProducts.map((p) => ({
    ...p,
    sellerId: "admin-001" as const,
    sellerName: "Admin Toko" as const,
    createdAt: new Date().toISOString(),
  }));
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(seededProducts));
  localStorage.setItem(ADMIN_SEEDED_KEY, "true");
  return seededProducts;
}

function adminToProduct(ap: AdminProduct): Product {
  return {
    id: ap.id, name: ap.name,
    description: ap.description, longDescription: ap.longDescription,
    price: ap.price, image: ap.image,
    images: ap.images.length > 0 ? ap.images : [ap.image],
    category: ap.category, specs: ap.specs,
    sellerId: ap.sellerId, sellerName: ap.sellerName,
    isFlashSale: ap.isFlashSale, discountPercent: ap.discountPercent,
    stock: ap.stock,
    isPreOrder: ap.isPreOrder, releaseDate: ap.releaseDate,
  };
}

function sellerToProduct(sp: SellerProduct): Product {
  return {
    id: sp.id, name: sp.name,
    description: sp.description, longDescription: sp.longDescription,
    price: sp.price, image: sp.image,
    images: sp.images.length > 0 ? sp.images : [sp.image],
    category: sp.category, specs: sp.specs,
    sellerId: sp.sellerId, sellerName: sp.sellerName,
    isFlashSale: sp.isFlashSale, discountPercent: sp.discountPercent,
    stock: sp.stock,
    isPreOrder: sp.isPreOrder, releaseDate: sp.releaseDate,
  };
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>(loadSellerProducts);
  const [adminProducts,  setAdminProducts]  = useState<AdminProduct[]>(loadAdminProducts);
  const [autoApprove, setAutoApproveState]  = useState<boolean>(() =>
    localStorage.getItem(AUTO_APPROVE_KEY) === "true"
  );

  useEffect(() => { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(sellerProducts)); }, [sellerProducts]);
  useEffect(() => { localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(adminProducts)); }, [adminProducts]);

  const setAutoApprove = (v: boolean) => {
    setAutoApproveState(v);
    localStorage.setItem(AUTO_APPROVE_KEY, String(v));
  };

  // Sync with other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PRODUCTS_KEY) {
        setSellerProducts(loadSellerProducts());
      }
      if (e.key === ADMIN_PRODUCTS_KEY) {
        setAdminProducts(loadAdminProducts());
      }
      if (e.key === AUTO_APPROVE_KEY) {
        setAutoApproveState(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const approvedSellerProducts: Product[] = sellerProducts
    .filter((p) => p.status === "approved").map(sellerToProduct);

  const allStoreProducts: Product[] = [
    ...adminProducts.map(adminToProduct),
    ...approvedSellerProducts,
  ];

  const submitProduct = (data: Omit<SellerProduct, "id" | "status" | "createdAt">) => {
    const existing = loadSellerProducts();
    const adminMax = adminProducts.reduce((m, p) => Math.max(m, p.id), 0);
    const sellerMax = existing.reduce((m, p) => Math.max(m, p.id), 0);
    const maxId = Math.max(adminMax, sellerMax, 9999);
    const newProduct: SellerProduct = {
      ...data, id: maxId + 1,
      status: autoApprove ? "approved" : "pending",
      createdAt: new Date().toISOString(),
    };
    setSellerProducts((prev) => [newProduct, ...prev]);
  };

  const approveProduct = (id: number) =>
    setSellerProducts((prev) => prev.map((p) => p.id === id ? { ...p, status: "approved" } : p));

  const rejectProduct = (id: number) =>
    setSellerProducts((prev) => prev.map((p) => p.id === id ? { ...p, status: "rejected" } : p));

  const deleteProduct = (id: number) =>
    setSellerProducts((prev) => prev.filter((p) => p.id !== id));

  const deleteAdminProduct = (id: number) =>
    setAdminProducts((prev) => prev.filter((p) => p.id !== id));

  const addAdminProduct = (data: Omit<AdminProduct, "id" | "sellerId" | "sellerName" | "createdAt">) => {
    const allIds = [...adminProducts.map((p) => p.id), ...sellerProducts.map((p) => p.id), 9999];
    const maxId = Math.max(...allIds);
    const newProduct: AdminProduct = {
      ...data,
      id: maxId + 1,
      sellerId: "admin-001",
      sellerName: "Admin Toko",
      createdAt: new Date().toISOString(),
    };
    setAdminProducts((prev) => [newProduct, ...prev]);
  };
  
  const toggleFlashSale = (id: number, isFlashSale: boolean, discountPercent: number) => {
    setSellerProducts((prev) => prev.map((p) => p.id === id ? { ...p, isFlashSale, discountPercent } : p));
    setAdminProducts((prev) => prev.map((p) => p.id === id ? { ...p, isFlashSale, discountPercent } : p));
  };

  const updateStock = (id: number, newStock: number) => {
    setSellerProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: newStock } : p));
    setAdminProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: newStock } : p));
  };

  const decrementStock = (id: number, quantity: number) => {
    // Reload from localStorage to get the absolute latest state
    const currentSellers = loadSellerProducts();
    const currentAdmins = loadAdminProducts();
    
    const isSellerProduct = currentSellers.some(p => p.id === id);
    if (isSellerProduct) {
      const updated = currentSellers.map((p) => 
        p.id === id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
      );
      setSellerProducts(updated);
    } else {
      const updated = currentAdmins.map((p) => 
        p.id === id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
      );
      setAdminProducts(updated);
    }
  };

  const updateProduct = (id: number, data: Partial<Omit<SellerProduct, "id" | "sellerId" | "createdAt">>) => {
    setSellerProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p));
  };

  const updateAdminProduct = (id: number, data: Partial<Omit<AdminProduct, "id" | "sellerId" | "createdAt">>) => {
    setAdminProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p));
  };

  return (
    <ProductsContext.Provider value={{
      sellerProducts, adminProducts, approvedSellerProducts, allStoreProducts,
      autoApprove, setAutoApprove,
      submitProduct, approveProduct, rejectProduct, deleteProduct,
      deleteAdminProduct, addAdminProduct,
      toggleFlashSale, updateStock, decrementStock,
      updateProduct, updateAdminProduct,
    }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
