/**
 * ProductsContext.tsx
 * Mengelola produk dinamis yang disubmit oleh seller.
 *
 * Alur:
 *   Seller submit → status "pending"
 *   Admin setujui → status "approved" → muncul di toko
 *   Admin tolak   → status "rejected"
 *   Admin/Seller hapus → dihapus permanen
 *
 * Produk statis dari products.ts selalu tersedia (sudah dianggap approved).
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { products as staticProducts, Product } from "../data/products";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductStatus = "pending" | "approved" | "rejected";

export interface SellerProduct {
  /** ID unik mulai 10000 untuk menghindari tabrakan dengan produk statis (1–4) */
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
}

interface ProductsContextType {
  /** Semua produk seller (semua status) — untuk admin & seller */
  sellerProducts: SellerProduct[];
  /** Hanya produk seller yang sudah disetujui — dikonversi ke Product */
  approvedSellerProducts: Product[];
  /** Gabungan: produk statis + produk seller yang approved */
  allStoreProducts: Product[];
  /** Seller: tambah produk baru (status "pending") */
  submitProduct: (data: Omit<SellerProduct, "id" | "status" | "createdAt">) => void;
  /** Admin: setujui produk */
  approveProduct: (id: number) => void;
  /** Admin: tolak produk */
  rejectProduct: (id: number) => void;
  /** Admin atau seller (produk sendiri): hapus produk */
  deleteProduct: (id: number) => void;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "toko_seller_products";

function loadProducts(): SellerProduct[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

function save(products: SellerProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

/** Konversi SellerProduct ke Product agar bisa dipakai ProductCard & ProductDetailPage */
function toProduct(sp: SellerProduct): Product {
  return {
    id: sp.id,
    name: sp.name,
    description: sp.description,
    longDescription: sp.longDescription,
    price: sp.price,
    image: sp.image,
    images: sp.images.length > 0 ? sp.images : [sp.image],
    category: sp.category,
    specs: sp.specs,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>(loadProducts);

  useEffect(() => { save(sellerProducts); }, [sellerProducts]);

  const approvedSellerProducts: Product[] = sellerProducts
    .filter((p) => p.status === "approved")
    .map(toProduct);

  const allStoreProducts: Product[] = [...staticProducts, ...approvedSellerProducts];

  const submitProduct = (data: Omit<SellerProduct, "id" | "status" | "createdAt">) => {
    const existing = loadProducts();
    const maxId = existing.reduce((m, p) => Math.max(m, p.id), 9999);
    const newProduct: SellerProduct = {
      ...data,
      id: maxId + 1,
      status: "pending",
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

  return (
    <ProductsContext.Provider value={{
      sellerProducts,
      approvedSellerProducts,
      allStoreProducts,
      submitProduct,
      approveProduct,
      rejectProduct,
      deleteProduct,
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
