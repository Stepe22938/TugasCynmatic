/**
 * VoucherContext.tsx
 * Sistem voucher/kupon diskon — disimpan di localStorage.
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type VoucherType = "percentage" | "fixed";

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;          // percent (1-100) or fixed rupiah
  minPurchase: number;
  maxDiscount?: number;   // cap for percentage vouchers
  expiresAt?: string;     // ISO string
  maxUses: number;        // 0 = unlimited
  usedCount: number;
  isActive: boolean;
  description: string;
}

interface VoucherContextValue {
  vouchers: Voucher[];
  validateVoucher: (code: string, subtotal: number) => { ok: true; voucher: Voucher; discount: number } | { ok: false; message: string };
  useVoucher: (code: string) => void;
  addVoucher: (v: Omit<Voucher, "id" | "usedCount">) => void;
  toggleVoucher: (id: string) => void;
  deleteVoucher: (id: string) => void;
}

const STORAGE_KEY = "toko_vouchers_v1";
const SEEDED_KEY  = "toko_vouchers_seeded_v1";

const DEFAULT_VOUCHERS: Omit<Voucher, "id" | "usedCount">[] = [
  { code: "TOKO10",   type: "percentage", value: 10, minPurchase: 50000,  maxDiscount: 30000, maxUses: 100, isActive: true, description: "Diskon 10% maks Rp30.000" },
  { code: "TOKO20",   type: "percentage", value: 20, minPurchase: 100000, maxDiscount: 50000, maxUses: 50,  isActive: true, description: "Diskon 20% maks Rp50.000" },
  { code: "HEMAT50",  type: "fixed",      value: 50000, minPurchase: 150000, maxUses: 30, isActive: true, description: "Potongan langsung Rp50.000" },
  { code: "NEWUSER",  type: "fixed",      value: 25000, minPurchase: 75000,  maxUses: 0,  isActive: true, description: "Voucher pengguna baru Rp25.000" },
  { code: "LIVE25",   type: "percentage", value: 25, minPurchase: 80000, maxDiscount: 60000, maxUses: 200, isActive: true, description: "Voucher khusus Live Shopping — diskon 25%" },
];

function load(): Voucher[] {
  if (!localStorage.getItem(SEEDED_KEY)) {
    const seeded: Voucher[] = DEFAULT_VOUCHERS.map((v, i) => ({ ...v, id: `default-${i}`, usedCount: 0 }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(SEEDED_KEY, "true");
    return seeded;
  }
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

function save(vouchers: Voucher[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
}

const VoucherContext = createContext<VoucherContextValue | null>(null);

export function VoucherProvider({ children }: { children: ReactNode }) {
  const [vouchers, setVouchers] = useState<Voucher[]>(load);

  const set = (updated: Voucher[]) => { setVouchers(updated); save(updated); };

  const validateVoucher = useCallback((code: string, subtotal: number) => {
    const v = vouchers.find((x) => x.code.toUpperCase() === code.toUpperCase());
    if (!v)          return { ok: false as const, message: "Kode voucher tidak ditemukan." };
    if (!v.isActive) return { ok: false as const, message: "Voucher ini sudah tidak aktif." };
    if (v.maxUses > 0 && v.usedCount >= v.maxUses) return { ok: false as const, message: "Voucher sudah habis digunakan." };
    if (v.expiresAt && new Date(v.expiresAt) < new Date()) return { ok: false as const, message: "Voucher sudah kadaluarsa." };
    if (subtotal < v.minPurchase) return { ok: false as const, message: `Minimum pembelian ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v.minPurchase)}.` };

    let discount = v.type === "percentage"
      ? Math.round((subtotal * v.value) / 100)
      : v.value;
    if (v.type === "percentage" && v.maxDiscount) discount = Math.min(discount, v.maxDiscount);
    discount = Math.min(discount, subtotal); // never exceed subtotal

    return { ok: true as const, voucher: v, discount };
  }, [vouchers]);

  const useVoucher = useCallback((code: string) => {
    set(vouchers.map((v) =>
      v.code.toUpperCase() === code.toUpperCase() ? { ...v, usedCount: v.usedCount + 1 } : v
    ));
  }, [vouchers]);

  const addVoucher = useCallback((data: Omit<Voucher, "id" | "usedCount">) => {
    const newV: Voucher = { ...data, id: `v-${Date.now()}`, usedCount: 0 };
    set([...vouchers, newV]);
  }, [vouchers]);

  const toggleVoucher = useCallback((id: string) => {
    set(vouchers.map((v) => v.id === id ? { ...v, isActive: !v.isActive } : v));
  }, [vouchers]);

  const deleteVoucher = useCallback((id: string) => {
    set(vouchers.filter((v) => v.id !== id));
  }, [vouchers]);

  return (
    <VoucherContext.Provider value={{ vouchers, validateVoucher, useVoucher, addVoucher, toggleVoucher, deleteVoucher }}>
      {children}
    </VoucherContext.Provider>
  );
}

export function useVouchers() {
  const ctx = useContext(VoucherContext);
  if (!ctx) throw new Error("useVouchers must be inside VoucherProvider");
  return ctx;
}
