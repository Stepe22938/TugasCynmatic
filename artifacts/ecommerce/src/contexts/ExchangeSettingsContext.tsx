import React, { createContext, useContext, useState, ReactNode } from "react";

export interface ExchangeOption {
  id: string;
  coins: number;
  value: number;
  title: string;
}

interface ExchangeSettingsContextValue {
  options: ExchangeOption[];
  addOption: (opt: Omit<ExchangeOption, "id">) => void;
  deleteOption: (id: string) => void;
}

const STORAGE_KEY = "toko_exchange_opts_v1";

const DEFAULT_OPTIONS: ExchangeOption[] = [
  { id: "e1", coins: 5000, value: 5000, title: "Potongan Rp5.000" },
  { id: "e2", coins: 10000, value: 10000, title: "Potongan Rp10.000" },
  { id: "e3", coins: 25000, value: 25000, title: "Potongan Rp25.000" },
  { id: "e4", coins: 50000, value: 50000, title: "Potongan Rp50.000" },
];

function load(): ExchangeOption[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_OPTIONS;
    return JSON.parse(data);
  } catch {
    return DEFAULT_OPTIONS;
  }
}

function save(opts: ExchangeOption[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
}

const ExchangeSettingsContext = createContext<ExchangeSettingsContextValue | null>(null);

export function ExchangeSettingsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ExchangeOption[]>(load);

  const addOption = (opt: Omit<ExchangeOption, "id">) => {
    const newOpts = [...options, { ...opt, id: `e-${Date.now()}` }];
    setOptions(newOpts);
    save(newOpts);
  };

  const deleteOption = (id: string) => {
    const newOpts = options.filter(o => o.id !== id);
    setOptions(newOpts);
    save(newOpts);
  };

  return (
    <ExchangeSettingsContext.Provider value={{ options, addOption, deleteOption }}>
      {children}
    </ExchangeSettingsContext.Provider>
  );
}

export function useExchangeSettings() {
  const ctx = useContext(ExchangeSettingsContext);
  if (!ctx) throw new Error("useExchangeSettings must be inside ExchangeSettingsProvider");
  return ctx;
}
