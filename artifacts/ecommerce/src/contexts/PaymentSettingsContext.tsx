/**
 * PaymentSettingsContext.tsx
 * Pengaturan payment gateway — disimpan di localStorage, bisa diatur admin.
 */
import React, { createContext, useContext, useState, useCallback } from "react";

export interface PaymentSettings {
  danaEnabled: boolean;
  qrisEnabled: boolean;
  mydompetEnabled: boolean;
  dummyMode: boolean;
  danaNumber: string;
}

interface PaymentSettingsContextValue extends PaymentSettings {
  update: (patch: Partial<PaymentSettings>) => void;
  enabledMethods: Array<"dana" | "qris" | "mydompet">;
}

const STORAGE_KEY = "payment_settings_v1";

function load(): PaymentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

const defaultSettings: PaymentSettings = {
  danaEnabled: true,
  qrisEnabled: true,
  mydompetEnabled: true,
  dummyMode: true,
  danaNumber: "0812-3456-7890",
};

const PaymentSettingsContext = createContext<PaymentSettingsContextValue | null>(null);

export function PaymentSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PaymentSettings>(load);

  const update = useCallback((patch: Partial<PaymentSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const enabledMethods: Array<"dana" | "qris" | "mydompet"> = [
    ...(settings.danaEnabled ? (["dana"] as const) : []),
    ...(settings.qrisEnabled ? (["qris"] as const) : []),
    ...(settings.mydompetEnabled ? (["mydompet"] as const) : []),
  ];

  return (
    <PaymentSettingsContext.Provider value={{ ...settings, update, enabledMethods }}>
      {children}
    </PaymentSettingsContext.Provider>
  );
}

export function usePaymentSettings() {
  const ctx = useContext(PaymentSettingsContext);
  if (!ctx) throw new Error("usePaymentSettings must be inside PaymentSettingsProvider");
  return ctx;
}
