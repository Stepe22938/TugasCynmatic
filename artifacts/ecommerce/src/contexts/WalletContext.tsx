/**
 * WalletContext.tsx
 * Konteks untuk mengelola saldo MyDompet (E-Wallet).
 */
import React, { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

export interface Transaction {
  id: string;
  type: "topup" | "payment" | "refund" | "auction_bid" | "auction_win";
  amount: number;
  description: string;
  date: string;
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  recipientName?: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  topUp: (amount: number) => void;
  spend: (amount: number, description: string, type?: Transaction["type"]) => boolean;
  refund: (amount: number, description: string, senderId?: string, senderName?: string) => void;
  transfer: (toId: string, toName: string, amount: number) => boolean;
  request: (fromId: string, fromName: string, amount: number) => void;
}

const MAX_BALANCE = 999_999_999_999_999; // 999 Triliun
const COIN_CONVERSION_RATE = 1_000_000_000; // 1 Miliar = 1 Coin

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser, addWalletTransaction } = useAuth();
  
  // Helper to ensure JSON fields are arrays
  const ensureArray = (data: any) => {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Ambil data langsung dari objek user (Source of Truth: VPS)
  const balance = Number(user?.balance || 0);
  const transactions = ensureArray(user?.walletTransactions);

  const topUp = (amount: number) => {
    let finalAmount = amount;
    let compensation = 0;
    
    if (balance + amount > MAX_BALANCE) {
      finalAmount = MAX_BALANCE - balance;
      compensation = Math.floor((amount - finalAmount) / COIN_CONVERSION_RATE);
    }

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: "topup",
      amount: finalAmount,
      description: compensation > 0 
        ? `Isi saldo (Limit tercapai! Kompensasi: ${compensation} Koin)` 
        : "Isi saldo MyDompet",
      date: new Date().toISOString(),
      recipientId: user?.id,
      recipientName: user?.name,
    };

    updateUser({
      balance: balance + finalAmount,
      walletTransactions: [newTx, ...transactions],
      coins: (user?.coins || 0) + compensation
    });
  };

  const spend = (amount: number, description: string, type: Transaction["type"] = "payment") => {
    if (balance < amount) return false;
    
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount: -amount,
      description,
      date: new Date().toISOString(),
      senderId: user?.id,
      senderName: user?.name,
    };

    updateUser({
      balance: balance - amount,
      walletTransactions: [newTx, ...transactions]
    });
    return true;
  };

  const transfer = (toId: string, toName: string, amount: number) => {
    if (balance < amount) return false;
    
    // Deduct from sender
    const senderTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: "payment",
      amount: -amount,
      description: `Kirim ke ${toName}`,
      date: new Date().toISOString(),
      senderId: user?.id,
      senderName: user?.name,
      recipientId: toId,
      recipientName: toName,
    };

    updateUser({
      balance: balance - amount,
      walletTransactions: [senderTx, ...transactions]
    });
    
    // Add to receiver
    if (addWalletTransaction) {
      addWalletTransaction(toId, amount, `Terima dana dari ${user?.name || "User"}`, "payment", user?.id, user?.name);
    }
    
    // Send Notification to receiver
    try {
      const notifKey = `toko_notifs_${toId}`;
      const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || "[]");
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: "system",
        title: "Dana Masuk!",
        message: `Kamu menerima transfer ${amount.toLocaleString("id-ID")} dari ${user?.name || "User"}.`,
        createdAt: new Date().toISOString(),
        read: false
      };
      localStorage.setItem(notifKey, JSON.stringify([newNotif, ...existingNotifs].slice(0, 50)));
    } catch(e) {}

    return true;
  };

  const request = (fromId: string, fromName: string, amount: number) => {
    // We can add a notification to the requested user
    try {
      const notifKey = `toko_notifs_${fromId}`;
      const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || "[]");
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: "system",
        title: "Permintaan Dana!",
        message: `${user?.name || "Seseorang"} meminta dana sebesar ${amount.toLocaleString("id-ID")} kepada kamu.`,
        createdAt: new Date().toISOString(),
        read: false
      };
      localStorage.setItem(notifKey, JSON.stringify([newNotif, ...existingNotifs].slice(0, 50)));
    } catch(e) {}
    
    const myTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: "payment",
      amount: 0,
      description: `Minta dana ke ${fromName}`,
      date: new Date().toISOString(),
      senderId: fromId,
      senderName: fromName,
      recipientId: user?.id,
      recipientName: user?.name,
    };
    updateUser({
      walletTransactions: [myTx, ...transactions]
    });
  };

  const refund = (amount: number, description: string, senderId?: string, senderName?: string) => {
    let finalAmount = amount;
    let compensation = 0;

    if (balance + amount > MAX_BALANCE) {
      finalAmount = MAX_BALANCE - balance;
      compensation = Math.floor((amount - finalAmount) / COIN_CONVERSION_RATE);
    }

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: "refund",
      amount: finalAmount,
      description: compensation > 0 
        ? `${description} (Limit dompet! Kompensasi: ${compensation} Koin)` 
        : description,
      date: new Date().toISOString(),
      senderId,
      senderName,
      recipientId: user?.id,
      recipientName: user?.name,
    };

    updateUser({
      balance: balance + finalAmount,
      walletTransactions: [newTx, ...transactions],
      coins: (user?.coins || 0) + compensation
    });
  };

  return (
    <WalletContext.Provider value={{ balance, transactions, topUp, spend, refund, transfer, request }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
