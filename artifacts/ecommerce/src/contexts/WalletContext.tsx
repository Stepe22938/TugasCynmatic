/**
 * WalletContext.tsx
 * Konteks untuk mengelola saldo MyDompet (E-Wallet).
 */
import React, { createContext, useContext, useState, useEffect } from "react";
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
  const { user, addCoins } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load from localStorage on user change
  useEffect(() => {
    if (user) {
      const savedBalance = localStorage.getItem(`wallet_balance_${user.id}`);
      const savedTx = localStorage.getItem(`wallet_tx_${user.id}`);
      let currentBal = savedBalance ? Number(savedBalance) : 0;
      
      // Auto-repair: Enforce MAX_BALANCE for Admin/User with overflow
      if (currentBal > MAX_BALANCE) {
        const excess = currentBal - MAX_BALANCE;
        const compensation = Math.floor(excess / COIN_CONVERSION_RATE);
        addCoins(user.id, compensation);
        currentBal = MAX_BALANCE;
        localStorage.setItem(`wallet_balance_${user.id}`, MAX_BALANCE.toString());
      }
      
      setBalance(currentBal);
      setTransactions(savedTx ? JSON.parse(savedTx) : []);
    } else {
      setBalance(0);
      setTransactions([]);
    }
  }, [user]);

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`wallet_balance_${user.id}`, balance.toString());
      localStorage.setItem(`wallet_tx_${user.id}`, JSON.stringify(transactions));
    }
  }, [balance, transactions, user]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!user) return;
      if (e.key === `wallet_balance_${user.id}` && e.newValue) {
        setBalance(Number(e.newValue));
      }
      if (e.key === `wallet_tx_${user.id}` && e.newValue) {
        setTransactions(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user]);

  const topUp = (amount: number) => {
    let finalAmount = amount;
    let compensation = 0;
    
    if (balance + amount > MAX_BALANCE) {
      finalAmount = MAX_BALANCE - balance;
      compensation = Math.floor((amount - finalAmount) / COIN_CONVERSION_RATE);
      if (user) addCoins(user.id, compensation);
    }

    const newBalance = balance + finalAmount;
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

    setBalance(newBalance);
    setTransactions(prev => [newTx, ...prev]);

    if (user) {
      localStorage.setItem(`wallet_balance_${user.id}`, newBalance.toString());
      const currentTxs = JSON.parse(localStorage.getItem(`wallet_tx_${user.id}`) || "[]");
      localStorage.setItem(`wallet_tx_${user.id}`, JSON.stringify([newTx, ...currentTxs]));
    }
  };

  const spend = (amount: number, description: string, type: Transaction["type"] = "payment") => {
    if (balance < amount) return false;
    
    const newBalance = balance - amount;
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount: -amount,
      description,
      date: new Date().toISOString(),
      senderId: user?.id,
      senderName: user?.name,
    };

    setBalance(newBalance);
    setTransactions(prev => [newTx, ...prev]);

    // Force immediate save for redirect safety
    if (user) {
      localStorage.setItem(`wallet_balance_${user.id}`, newBalance.toString());
      const currentTxs = JSON.parse(localStorage.getItem(`wallet_tx_${user.id}`) || "[]");
      localStorage.setItem(`wallet_tx_${user.id}`, JSON.stringify([newTx, ...currentTxs]));
    }
    return true;
  };

  const transfer = (toId: string, toName: string, amount: number) => {
    if (balance < amount) return false;
    
    // 1. Update Sender (Current User)
    const newBalance = balance - amount;
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

    setBalance(newBalance);
    setTransactions(prev => [senderTx, ...prev]);

    if (user) {
      localStorage.setItem(`wallet_balance_${user.id}`, newBalance.toString());
      const currentTxs = JSON.parse(localStorage.getItem(`wallet_tx_${user.id}`) || "[]");
      localStorage.setItem(`wallet_tx_${user.id}`, JSON.stringify([senderTx, ...currentTxs]));
    }

    // 2. Update Recipient in LocalStorage
    const targetBalanceKey = `wallet_balance_${toId}`;
    const targetTxKey = `wallet_tx_${toId}`;
    const targetUserKey = "toko_users"; // To update coins in localStorage
    
    const targetBalance = Number(localStorage.getItem(targetBalanceKey) || "0");
    const targetTxs = JSON.parse(localStorage.getItem(targetTxKey) || "[]");
    
    let finalRecipientAmount = amount;
    let recipientCompensation = 0;

    if (targetBalance + amount > MAX_BALANCE) {
      finalRecipientAmount = MAX_BALANCE - targetBalance;
      recipientCompensation = Math.floor((amount - finalRecipientAmount) / COIN_CONVERSION_RATE);
      
      // Update coins for target user in localStorage
      const users = JSON.parse(localStorage.getItem(targetUserKey) || "[]");
      const updatedUsers = users.map((u: any) => u.id === toId ? { ...u, coins: (u.coins || 0) + recipientCompensation } : u);
      localStorage.setItem(targetUserKey, JSON.stringify(updatedUsers));
    }
    
    const recipientTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: "topup",
      amount: finalRecipientAmount,
      description: recipientCompensation > 0 
        ? `Terima dari ${user?.name} (Kompensasi: ${recipientCompensation} Koin)` 
        : `Terima dari ${user?.name}`,
      date: new Date().toISOString(),
      senderId: user?.id,
      senderName: user?.name,
      recipientId: toId,
      recipientName: toName,
    };
    
    localStorage.setItem(targetBalanceKey, (targetBalance + finalRecipientAmount).toString());
    localStorage.setItem(targetTxKey, JSON.stringify([recipientTx, ...targetTxs]));

    return true;
  };

  const request = (fromId: string, fromName: string, amount: number) => {
    // 1. Record for me (the requester)
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
    setTransactions(prev => [myTx, ...prev]);

    // Save requester's tx
    if (user) {
      const currentTxs = JSON.parse(localStorage.getItem(`wallet_tx_${user.id}`) || "[]");
      localStorage.setItem(`wallet_tx_${user.id}`, JSON.stringify([myTx, ...currentTxs]));
    }

    // 2. Add to recipient's transactions
    const targetTxKey = `wallet_tx_${fromId}`;
    const targetTxs = JSON.parse(localStorage.getItem(targetTxKey) || "[]");
    
    const requestNotif: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: "payment",
      amount: 0,
      description: `🚩 PERMINTAAN DANA: ${user?.name} meminta ${amount.toLocaleString()}`,
      date: new Date().toISOString(),
      senderId: user?.id,
      senderName: user?.name,
      recipientId: fromId,
      recipientName: fromName,
    };
    
    localStorage.setItem(targetTxKey, JSON.stringify([requestNotif, ...targetTxs]));
  };

  const refund = (amount: number, description: string, senderId?: string, senderName?: string) => {
    let finalAmount = amount;
    let compensation = 0;

    if (balance + amount > MAX_BALANCE) {
      finalAmount = MAX_BALANCE - balance;
      compensation = Math.floor((amount - finalAmount) / COIN_CONVERSION_RATE);
      if (user) addCoins(user.id, compensation);
    }

    const newBalance = balance + finalAmount;
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

    setBalance(newBalance);
    setTransactions(prev => [newTx, ...prev]);

    if (user) {
      localStorage.setItem(`wallet_balance_${user.id}`, newBalance.toString());
      const currentTxs = JSON.parse(localStorage.getItem(`wallet_tx_${user.id}`) || "[]");
      localStorage.setItem(`wallet_tx_${user.id}`, JSON.stringify([newTx, ...currentTxs]));
    }
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
