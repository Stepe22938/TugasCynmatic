import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";

export interface RedeemCode {
  id: string;
  code: string;
  type: "coin" | "balance";
  value: number;
  maxUses: number;
  usedBy: string[]; // List of user IDs who have used this code
  isActive: boolean;
  createdAt: string;
}

interface RedeemContextType {
  codes: RedeemCode[];
  addCode: (code: Omit<RedeemCode, "id" | "usedBy" | "createdAt">) => void;
  deleteCode: (id: string) => void;
  toggleCode: (id: string) => void;
  redeemCode: (codeStr: string) => { success: boolean; message: string };
}

const STORAGE_KEY = "toko_redeem_codes";

const RedeemContext = createContext<RedeemContextType | undefined>(undefined);

export function RedeemProvider({ children }: { children: React.ReactNode }) {
  const { user, addCoins } = useAuth();
  const { topUp } = useWallet();
  const [codes, setCodes] = useState<RedeemCode[]>([]);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCodes(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to parse redeem codes:", error);
    }
  }, []);

  // Save to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  }, [codes]);

  const addCode = (code: Omit<RedeemCode, "id" | "usedBy" | "createdAt">) => {
    const newCode: RedeemCode = {
      ...code,
      id: Math.random().toString(36).substr(2, 9),
      usedBy: [],
      createdAt: new Date().toISOString(),
    };
    setCodes((prev) => [newCode, ...prev]);
  };

  const deleteCode = (id: string) => {
    setCodes((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleCode = (id: string) => {
    setCodes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const redeemCode = (codeStr: string) => {
    if (!user) return { success: false, message: "Anda harus login untuk menukar kode." };
    
    const targetCode = codes.find(c => c.code === codeStr);
    
    if (!targetCode) {
      return { success: false, message: "Kode redeem tidak ditemukan." };
    }
    
    if (!targetCode.isActive) {
      return { success: false, message: "Kode redeem sudah tidak aktif." };
    }
    
    if (targetCode.maxUses > 0 && targetCode.usedBy.length >= targetCode.maxUses) {
      return { success: false, message: "Kode redeem sudah mencapai batas penggunaan." };
    }
    
    if (targetCode.usedBy.includes(user.id)) {
      return { success: false, message: "Anda sudah menukar kode ini." };
    }

    // Process redemption
    if (targetCode.type === "coin") {
      addCoins(user.id, targetCode.value);
    } else if (targetCode.type === "balance") {
      topUp(targetCode.value);
    }

    // Update code usage
    setCodes(prev => prev.map(c => {
      if (c.id === targetCode.id) {
        return { ...c, usedBy: [...c.usedBy, user.id] };
      }
      return c;
    }));

    return { 
      success: true, 
      message: `Berhasil menukar kode! Anda mendapatkan ${targetCode.value.toLocaleString("id-ID")} ${targetCode.type === "coin" ? "Koin" : "Saldo"}.`
    };
  };

  return (
    <RedeemContext.Provider value={{ codes, addCode, deleteCode, toggleCode, redeemCode }}>
      {children}
    </RedeemContext.Provider>
  );
}

export function useRedeem() {
  const context = useContext(RedeemContext);
  if (!context) throw new Error("useRedeem must be used within RedeemProvider");
  return context;
}
