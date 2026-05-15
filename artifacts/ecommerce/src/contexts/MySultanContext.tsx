/**
 * MySultanContext.tsx
 * Kelola status keanggotaan premium "MySultan", harga, durasi, dan keuntungan.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";
import { useToast } from "../hooks/use-toast";

export interface SultanVoucher {
  id: string;
  code: string;
  discount: number;
  type: "percent" | "flat";
  minPurchase: number;
  category: "all" | "belanja" | "lelang" | "music";
}

export interface SultanConfig {
  price: number;
  durations: { label: string; months: number }[];
}

interface MySultanContextType {
  isSultan: boolean;
  sultanExpiry: string | null;
  config: SultanConfig;
  vouchers: SultanVoucher[];
  buySultan: (months: number) => boolean;
  updateConfig: (patch: Partial<SultanConfig>) => void;
  getSultanStats: () => { activeUsers: number };
  hasEarlyAccess: (startTime: string) => boolean;
  // Admin voucher management
  addSultanVoucher: (v: Omit<SultanVoucher, "id">) => void;
  removeSultanVoucher: (id: string) => void;
}

const SultanContext = createContext<MySultanContextType | undefined>(undefined);

const STORAGE_KEY = "toko_sultan_v1";
const CONFIG_KEY = "toko_sultan_config";
const VOUCHER_KEY = "toko_sultan_vouchers";

const DEFAULT_CONFIG: SultanConfig = {
  price: 50000, // Harga dasar per bulan
  durations: [
    { label: "1 Bulan", months: 1 },
    { label: "3 Bulan", months: 3 },
    { label: "6 Bulan", months: 6 },
    { label: "1 Tahun", months: 12 },
  ]
};

export function SultanProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const { spend } = useWallet();
  const { toast } = useToast();

  const [config, setConfig] = useState<SultanConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });

  const [vouchers, setVouchers] = useState<SultanVoucher[]>(() => {
    try {
      const saved = localStorage.getItem(VOUCHER_KEY);
      return saved ? JSON.parse(saved) : [
        { id: "sv-1", code: "SULTAN77", discount: 25, type: "percent", minPurchase: 0, category: "all" },
        { id: "sv-2", code: "RAJARAME", discount: 50000, type: "flat", minPurchase: 200000, category: "belanja" }
      ];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(VOUCHER_KEY, JSON.stringify(vouchers));
  }, [vouchers]);

  const isSultan = !!(user?.isSultan && user?.sultanExpiry && new Date(user.sultanExpiry) > new Date());
  const sultanExpiry = user?.sultanExpiry || null;

  const buySultan = useCallback((months: number) => {
    if (!user) return false;
    const totalCost = config.price * months;
    
    const success = spend(totalCost, `Berlangganan MySultan (${months} Bulan)`, "payment");
    if (!success) {
      toast({ title: "Saldo Tidak Cukup", description: "Silakan top up MyDompet kamu.", variant: "destructive" });
      return false;
    }

    const now = new Date();
    const expiry = new Date(sultanExpiry && new Date(sultanExpiry) > now ? sultanExpiry : now);
    expiry.setMonth(expiry.getMonth() + months);

    updateUser({ 
      isSultan: true, 
      sultanExpiry: expiry.toISOString() 
    });

    toast({ title: "Berhasil Menjadi Sultan!", description: `Akses MySultan aktif hingga ${expiry.toLocaleDateString("id-ID")}` });
    return true;
  }, [user, config, sultanExpiry, spend, updateUser, toast]);

  const updateConfig = (patch: Partial<SultanConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const hasEarlyAccess = (startTime: string) => {
    if (!isSultan) return false;
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const thirtyMinsInMs = 30 * 60 * 1000;
    return now >= start - thirtyMinsInMs && now < start;
  };

  const addSultanVoucher = (v: Omit<SultanVoucher, "id">) => {
    const newV: SultanVoucher = { ...v, id: `sv-${Date.now()}` };
    setVouchers(prev => [...prev, newV]);
  };

  const removeSultanVoucher = (id: string) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
  };

  const getSultanStats = () => {
    // In local storage app, we can't easily count all users without a global user registry
    // But we can mock or estimate based on current user + some randoms
    return { activeUsers: 124 }; 
  };

  return (
    <SultanContext.Provider value={{
      isSultan, sultanExpiry, config, vouchers, buySultan, updateConfig,
      getSultanStats, hasEarlyAccess, addSultanVoucher, removeSultanVoucher
    }}>
      {children}
    </SultanContext.Provider>
  );
}

export function useSultan() {
  const ctx = useContext(SultanContext);
  if (!ctx) throw new Error("useSultan must be within SultanProvider");
  return ctx;
}
