import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";
import { fetchAllRedeemCodesFromVPS, syncRedeemCodeToVPS } from "../lib/sync";

export interface RedeemCode {
  id: string;
  code: string;
  type: "coin" | "balance";
  value: number;
  maxUses: number;
  usedBy: string[]; 
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

const RedeemContext = createContext<RedeemContextType | undefined>(undefined);

export function RedeemProvider({ children }: { children: React.ReactNode }) {
  const { user, addCoins } = useAuth();
  const { topUp } = useWallet();
  const [codes, setCodes] = useState<RedeemCode[]>([]);

  // Initial Fetch from VPS
  useEffect(() => {
    const init = async () => {
      const vpsCodes = await fetchAllRedeemCodesFromVPS();
      if (vpsCodes) {
        setCodes(vpsCodes.map((c: any) => ({
          ...c,
          value: Number(c.value),
          usedBy: c.usedBy || []
        })));
      }
    };
    init();
  }, []);

  const addCode = (code: Omit<RedeemCode, "id" | "usedBy" | "createdAt">) => {
    const newCode: RedeemCode = {
      ...code,
      id: Math.random().toString(36).substr(2, 9),
      usedBy: [],
      createdAt: new Date().toISOString(),
    };
    setCodes((prev) => [newCode, ...prev]);
    syncRedeemCodeToVPS(newCode);
  };

  const deleteCode = (id: string) => {
    setCodes((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleCode = (id: string) => {
    setCodes((prev) => prev.map((c) => {
      if (c.id === id) {
        const updated = { ...c, isActive: !c.isActive };
        syncRedeemCodeToVPS(updated);
        return updated;
      }
      return c;
    }));
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
    const updated = { ...targetCode, usedBy: [...targetCode.usedBy, user.id] };
    setCodes(prev => prev.map(c => c.id === targetCode.id ? updated : c));
    syncRedeemCodeToVPS(updated);

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
