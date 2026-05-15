import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CosmeticType = "tag" | "visual";

export interface Cosmetic {
  id: string;
  name: string;
  type: CosmeticType;
  value: string; // Misal: "#BETA" untuk tag atau URL image untuk visual
  price: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface CosmeticContextType {
  cosmetics: Cosmetic[];
  addCosmetic: (cosmetic: Omit<Cosmetic, "id">) => void;
  deleteCosmetic: (id: string) => void;
  getCosmeticById: (id: string) => Cosmetic | undefined;
}

const COSMETICS_KEY = "cynmatic_cosmetics";

const DEFAULT_COSMETICS: Cosmetic[] = [
  { id: "tag-beta", name: "Beta Tester", type: "tag", value: "#BETA", price: 0, rarity: "legendary" },
  { id: "tag-eta", name: "Early Access", type: "tag", value: "#ETA", price: 0, rarity: "epic" },
  { id: "tag-tester", name: "System Tester", type: "tag", value: "#TESTER", price: 0, rarity: "rare" },
  { id: "visual-beard", name: "Jenggot BNL", type: "visual", value: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=beard", price: 500, rarity: "legendary" },
];

const CosmeticContext = createContext<CosmeticContextType | undefined>(undefined);

export function CosmeticProvider({ children }: { children: ReactNode }) {
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>(() => {
    const saved = localStorage.getItem(COSMETICS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with default to ensure basics exist
      const merged = [...DEFAULT_COSMETICS];
      parsed.forEach((c: Cosmetic) => {
        if (!merged.find(m => m.id === c.id)) merged.push(c);
      });
      return merged;
    }
    return DEFAULT_COSMETICS;
  });

  useEffect(() => {
    localStorage.setItem(COSMETICS_KEY, JSON.stringify(cosmetics));
  }, [cosmetics]);

  const addCosmetic = (data: Omit<Cosmetic, "id">) => {
    const newCosmetic = { ...data, id: `cosm-${Date.now()}` };
    setCosmetics([...cosmetics, newCosmetic]);
  };

  const deleteCosmetic = (id: string) => {
    if (DEFAULT_COSMETICS.find(c => c.id === id)) return; // Don't delete defaults
    setCosmetics(cosmetics.filter(c => c.id !== id));
  };

  const getCosmeticById = (id: string) => cosmetics.find(c => c.id === id);

  return (
    <CosmeticContext.Provider value={{ cosmetics, addCosmetic, deleteCosmetic, getCosmeticById }}>
      {children}
    </CosmeticContext.Provider>
  );
}

export function useCosmetics() {
  const ctx = useContext(CosmeticContext);
  if (!ctx) throw new Error("useCosmetics must be used within CosmeticProvider");
  return ctx;
}
