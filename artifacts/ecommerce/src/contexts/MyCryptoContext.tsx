/**
 * MyCryptoContext.tsx
 * Kelola status keanggotaan premium "MyCrypto", harga, durasi, dan keuntungan khusus crypto.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";
import { useToast } from "../hooks/use-toast";

export interface CryptoConfig {
  price: number;
  durations: { label: string; months: number }[];
}

interface MyCryptoContextType {
  isCryptoMember: boolean;
  cryptoExpiry: string | null;
  config: CryptoConfig;
  buyCryptoMembership: (months: number) => boolean;
  updateConfig: (patch: Partial<CryptoConfig>) => void;
  getCryptoStats: () => { activeTraders: number };
}

const CryptoContext = createContext<MyCryptoContextType | undefined>(undefined);

const CONFIG_KEY = "cynmatic_crypto_config";

const DEFAULT_CONFIG: CryptoConfig = {
  price: 25000, // Harga dasar per bulan (lebih murah dari MySultan)
  durations: [
    { label: "1 Bulan", months: 1 },
    { label: "3 Bulan", months: 3 },
    { label: "6 Bulan", months: 6 },
    { label: "1 Tahun", months: 12 },
  ]
};

export function MyCryptoProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const { spend } = useWallet();
  const { toast } = useToast();

  const [config, setConfig] = useState<CryptoConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  const isCryptoMember = !!(user?.isMyCryptoMember && user?.myCryptoExpiry && new Date(user.myCryptoExpiry) > new Date());
  const cryptoExpiry = user?.myCryptoExpiry || null;

  const buyCryptoMembership = useCallback((months: number) => {
    if (!user) return false;
    const totalCost = config.price * months;
    
    const success = spend(totalCost, `Berlangganan MyCrypto Premium (${months} Bulan)`, "payment");
    if (!success) {
      toast({ title: "Saldo Tidak Cukup", description: "Silakan top up MyDompet kamu co.", variant: "destructive" });
      return false;
    }

    const now = new Date();
    const currentExpiry = cryptoExpiry ? new Date(cryptoExpiry) : null;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    
    const expiry = new Date(baseDate);
    expiry.setMonth(expiry.getMonth() + months);

    updateUser({ 
      isMyCryptoMember: true, 
      myCryptoExpiry: expiry.toISOString() 
    });

    toast({ 
      title: "Selamat Bergabung, Trader!", 
      description: `Akses MyCrypto Premium aktif hingga ${expiry.toLocaleDateString("id-ID")}` 
    });
    return true;
  }, [user, config, cryptoExpiry, spend, updateUser, toast]);

  const updateConfig = (patch: Partial<CryptoConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const getCryptoStats = () => {
    return { activeTraders: 856 }; 
  };

  return (
    <CryptoContext.Provider value={{
      isCryptoMember, cryptoExpiry, config, buyCryptoMembership, updateConfig, getCryptoStats
    }}>
      {children}
    </CryptoContext.Provider>
  );
}

export function useMyCrypto() {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error("useMyCrypto must be within MyCryptoProvider");
  return ctx;
}
