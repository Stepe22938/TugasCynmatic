/**
 * CurrencyContext.tsx
 * Global currency format state — shared across all pages.
 * Rates: $1 = Rp 16.000 | €1 = Rp 17.500
 */
import React, { createContext, useContext, useState, ReactNode } from "react";

export type CurrencyCode = "IDR" | "USD" | "EUR";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Rate: how many IDR = 1 unit of this currency */
  rateFromIDR: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "IDR", symbol: "Rp", name: "Rupiah Indonesia", rateFromIDR: 1 },
  { code: "USD", symbol: "$", name: "US Dollar", rateFromIDR: 16000 },
  { code: "EUR", symbol: "€", name: "Euro Europe", rateFromIDR: 17500 },
];

interface CurrencyContextType {
  currency: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  /** Convert a price from IDR to the selected currency */
  convertPrice: (idrPrice: number) => number;
  /** Format a price (in IDR) to the current currency string */
  formatPrice: (idrPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("IDR");

  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  const setCurrency = (code: CurrencyCode) => setCurrencyCode(code);

  const convertPrice = (idrPrice: number): number => {
    if (currency.code === "IDR") return idrPrice;
    return idrPrice / currency.rateFromIDR;
  };

  const formatPrice = (idrPrice: number): string => {
    if (idrPrice === undefined || idrPrice === null) {
      return currency.code === "IDR" ? "Rp 0" : `${currency.symbol}0.00`;
    }

    const converted = convertPrice(idrPrice);

    switch (currency.code) {
      case "USD":
        return `$ ${converted.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      case "EUR":
        return `€ ${converted.toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      default: {
        // IDR
        const absPrice = Math.abs(idrPrice);
        if (absPrice >= 1e15) {
          return (idrPrice < 0 ? "-" : "") + "Rp " + idrPrice.toExponential(2).replace("e+", " x 10^");
        }
        return "Rp " + idrPrice.toLocaleString("id-ID");
      }
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
