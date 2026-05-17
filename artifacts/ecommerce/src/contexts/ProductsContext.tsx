/**
 * ProductsContext.tsx
 * Global products store — Fully synced to VPS MariaDB.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { products as staticProducts, Product } from "../data/products";
import { fetchAllProductsFromVPS, syncProductToVPS } from "../lib/sync";

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
  refreshProducts: () => Promise<void>;
  submitProduct: (data: Omit<SellerProduct, "id" | "status" | "createdAt">) => void;
  approveProduct: (id: number) => void;
  rejectProduct: (id: number) => void;
  deleteProduct: (id: number) => void;
  deleteAdminProduct: (id: number) => void;
  addAdminProduct: (data: Omit<AdminProduct, "id" | "sellerId" | "sellerName" | "createdAt">) => void;
  toggleFlashSale: (id: number, isFlashSale: boolean, discountPercent: number) => void;
  updateStock: (id: number, newStock: number) => void;
  decrementStock: (id: number, quantity: number) => void;
  updateProduct: (id: number, data: Partial<Omit<SellerProduct, "id" | "sellerId" | "createdAt">>) => void;
  updateAdminProduct: (id: number, data: Partial<Omit<AdminProduct, "id" | "sellerId" | "createdAt">>) => void;
}

function adminToProduct(ap: AdminProduct): Product {
  return {
    id: ap.id, name: ap.name,
    description: ap.description, longDescription: ap.longDescription,
    price: Number(ap.price), image: ap.image,
    images: (ap.images && Array.isArray(ap.images) && ap.images.length > 0) ? ap.images : [ap.image],
    category: ap.category, specs: ap.specs || [],
    sellerId: ap.sellerId, sellerName: ap.sellerName,
    isFlashSale: ap.isFlashSale, discountPercent: ap.discountPercent,
    stock: Number(ap.stock),
    isPreOrder: ap.isPreOrder, releaseDate: ap.releaseDate,
  };
}

function sellerToProduct(sp: SellerProduct): Product {
  return {
    id: sp.id, name: sp.name,
    description: sp.description, longDescription: sp.longDescription,
    price: Number(sp.price), image: sp.image,
    images: (sp.images && Array.isArray(sp.images) && sp.images.length > 0) ? sp.images : [sp.image],
    category: sp.category, specs: sp.specs || [],
    sellerId: sp.sellerId, sellerName: sp.sellerName,
    isFlashSale: sp.isFlashSale, discountPercent: sp.discountPercent,
    stock: Number(sp.stock),
    isPreOrder: sp.isPreOrder, releaseDate: sp.releaseDate,
  };
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [adminProducts,  setAdminProducts]  = useState<AdminProduct[]>([]);
  const [autoApprove, setAutoApproveState]  = useState<boolean>(true);

  // Initial Fetch from VPS
  useEffect(() => {
    const init = async () => {
      const vpsProducts = await fetchAllProductsFromVPS();
      if (vpsProducts && vpsProducts.length > 0) {
        // Cast types from API
        const casted = vpsProducts.map((p: any) => ({
          ...p,
          price: Number(p.price),
          stock: Number(p.stock)
        }));
        
        const admins = casted.filter((p: any) => p.sellerId === "admin-001");
        const sellers = casted.filter((p: any) => p.sellerId !== "admin-001");
        setAdminProducts(admins);
        setSellerProducts(sellers);
      } else {
        // If VPS is empty, seed from static (Admin only)
        const seeded: AdminProduct[] = staticProducts.map((p) => ({
          ...p,
          sellerId: "admin-001",
          sellerName: "Admin Toko",
          createdAt: new Date().toISOString(),
        }));
        setAdminProducts(seeded);
        seeded.forEach(p => syncProductToVPS(p));
      }
    };
    init();
  }, []);

  const refreshProducts = async () => {
    const vpsProducts = await fetchAllProductsFromVPS();
    if (vpsProducts) {
      const casted = vpsProducts.map((p: any) => ({
        ...p,
        price: Number(p.price),
        stock: Number(p.stock)
      }));
      setAdminProducts(casted.filter((p: any) => p.sellerId === "admin-001"));
      setSellerProducts(casted.filter((p: any) => p.sellerId !== "admin-001"));
    }
  };

  const setAutoApprove = (v: boolean) => setAutoApproveState(v);

  const approvedSellerProducts: Product[] = sellerProducts
    .filter((p) => p.status === "approved").map(sellerToProduct);

  const allStoreProducts: Product[] = [
    ...adminProducts.map(adminToProduct),
    ...approvedSellerProducts,
  ];

  const submitProduct = (data: Omit<SellerProduct, "id" | "status" | "createdAt">) => {
    const allIds = [...adminProducts.map(p => p.id), ...sellerProducts.map(p => p.id), 9999];
    const maxId = Math.max(...allIds);
    const newProduct: SellerProduct = {
      ...data, id: maxId + 1,
      status: autoApprove ? "approved" : "pending",
      createdAt: new Date().toISOString(),
    };
    setSellerProducts((prev) => [newProduct, ...prev]);
    syncProductToVPS(newProduct);
  };

  const approveProduct = (id: number) => {
    setSellerProducts((prev) => prev.map((p) => {
      if (p.id === id) {
        const updated = { ...p, status: "approved" as ProductStatus };
        syncProductToVPS(updated);
        return updated;
      }
      return p;
    }));
  };

  const rejectProduct = (id: number) => {
    setSellerProducts((prev) => prev.map((p) => {
      if (p.id === id) {
        const updated = { ...p, status: "rejected" as ProductStatus };
        syncProductToVPS(updated);
        return updated;
      }
      return p;
    }));
  };

  const deleteProduct = (id: number) => setSellerProducts((prev) => prev.filter((p) => p.id !== id));
  const deleteAdminProduct = (id: number) => setAdminProducts((prev) => prev.filter((p) => p.id !== id));

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
    syncProductToVPS(newProduct);
  };
  
  const toggleFlashSale = (id: number, isFlashSale: boolean, discountPercent: number) => {
    const update = (p: any) => p.id === id ? { ...p, isFlashSale, discountPercent } : p;
    setSellerProducts(prev => prev.map(p => {
      const u = update(p);
      if (u !== p) syncProductToVPS(u);
      return u;
    }));
    setAdminProducts(prev => prev.map(p => {
      const u = update(p);
      if (u !== p) syncProductToVPS(u);
      return u;
    }));
  };

  const updateStock = (id: number, newStock: number) => {
    const update = (p: any) => p.id === id ? { ...p, stock: newStock } : p;
    setSellerProducts(prev => prev.map(p => {
      const u = update(p);
      if (u !== p) syncProductToVPS(u);
      return u;
    }));
    setAdminProducts(prev => prev.map(p => {
      const u = update(p);
      if (u !== p) syncProductToVPS(u);
      return u;
    }));
  };

  const decrementStock = (id: number, quantity: number) => {
    const update = (p: any) => p.id === id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p;
    setSellerProducts(prev => prev.map(p => {
      const u = update(p);
      if (u !== p) syncProductToVPS(u);
      return u;
    }));
    setAdminProducts(prev => prev.map(p => {
      const u = update(p);
      if (u !== p) syncProductToVPS(u);
      return u;
    }));
  };

  const updateProduct = (id: number, data: Partial<Omit<SellerProduct, "id" | "sellerId" | "createdAt">>) => {
    setSellerProducts(prev => prev.map(p => {
      if (p.id === id) {
        const u = { ...p, ...data };
        syncProductToVPS(u);
        return u;
      }
      return p;
    }));
  };

  const updateAdminProduct = (id: number, data: Partial<Omit<AdminProduct, "id" | "sellerId" | "createdAt">>) => {
    setAdminProducts(prev => prev.map(p => {
      if (p.id === id) {
        const u = { ...p, ...data };
        syncProductToVPS(u);
        return u;
      }
      return p;
    }));
  };

  return (
    <ProductsContext.Provider value={{
      sellerProducts, adminProducts, approvedSellerProducts, allStoreProducts,
      autoApprove, setAutoApprove, refreshProducts,
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
