import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";
import { useToast } from "../hooks/use-toast";

export interface AIProConfig {
  price: number;
  durations: { label: string; months: number }[];
}

interface MyAIContextType {
  isAISubscriber: boolean;
  aiSubscriptionExpiry: string | null;
  config: AIProConfig;
  buyAISubscription: (months: number) => boolean;
  updateConfig: (patch: Partial<AIProConfig>) => void;
}

const MyAIContext = createContext<MyAIContextType | undefined>(undefined);
const CONFIG_KEY = "toko_ai_subscription_config";

const DEFAULT_CONFIG: AIProConfig = {
  price: 15000,
  durations: [
    { label: "1 Bulan", months: 1 },
    { label: "3 Bulan", months: 3 },
    { label: "6 Bulan", months: 6 },
    { label: "1 Tahun", months: 12 },
  ],
};

export function MyAIProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const { balance, transactions } = useWallet();
  const { toast } = useToast();
  const [config, setConfig] = useState<AIProConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    fetch("/api/ai/subscription-plan")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const durations = Array.isArray(data.durations) ? data.durations : DEFAULT_CONFIG.durations;
        const nextConfig = {
          price: Number.isFinite(Number(data.price)) ? Math.max(0, Math.floor(Number(data.price))) : DEFAULT_CONFIG.price,
          durations: durations
            .map((item: any) => ({
              label: String(item?.label || "").trim(),
              months: Math.max(1, Math.floor(Number(item?.months) || 1)),
            }))
            .filter((item: any) => item.label && item.months > 0),
        };
        setConfig(nextConfig.durations.length ? nextConfig : DEFAULT_CONFIG);
      })
      .catch(() => {});
  }, []);

  const aiSubscriptionExpiry = user?.aiSubscriptionExpiry || null;
  const isAISubscriber = !!(
    user?.isAISubscriber &&
    aiSubscriptionExpiry &&
    new Date(aiSubscriptionExpiry) > new Date()
  );

  const buyAISubscription = useCallback((months: number) => {
    if (!user) return false;
    const totalCost = config.price * months;
    if (balance < totalCost) {
      toast({
        title: "Saldo MyWallet kurang",
        description: "Top up saldo MyWallet dulu buat aktifin AI Pro.",
        variant: "destructive",
      });
      return false;
    }

    const now = new Date();
    const currentExpiry = aiSubscriptionExpiry ? new Date(aiSubscriptionExpiry) : null;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiry = new Date(baseDate);
    expiry.setMonth(expiry.getMonth() + months);

    const tx = {
      id: Math.random().toString(36).slice(2, 11),
      type: "payment" as const,
      amount: -totalCost,
      description: `Berlangganan AI Pro (${months} Bulan)`,
      date: new Date().toISOString(),
      senderId: user.id,
      senderName: user.name,
    };

    updateUser({
      balance: balance - totalCost,
      walletTransactions: [tx, ...transactions],
      isAISubscriber: true,
      aiSubscriptionExpiry: expiry.toISOString(),
    });

    toast({
      title: "AI Pro aktif",
      description: `Akses AI aktif sampai ${expiry.toLocaleDateString("id-ID")}.`,
    });
    return true;
  }, [user, config.price, aiSubscriptionExpiry, balance, transactions, updateUser, toast]);

  const updateConfig = (patch: Partial<AIProConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      fetch("/api/ai/subscription-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  };

  return (
    <MyAIContext.Provider value={{
      isAISubscriber,
      aiSubscriptionExpiry,
      config,
      buyAISubscription,
      updateConfig,
    }}>
      {children}
    </MyAIContext.Provider>
  );
}

export function useMyAI() {
  const ctx = useContext(MyAIContext);
  if (!ctx) throw new Error("useMyAI must be used inside MyAIProvider");
  return ctx;
}
