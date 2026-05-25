/**
 * LanguageContext.tsx
 * Global language context providing seamless UI translations.
 */
import React, { createContext, useContext, useState, ReactNode } from "react";

export type LanguageCode = "id" | "en";

interface LanguageContextType {
  languageCode: LanguageCode;
  setLanguageCode: (code: LanguageCode) => void;
  t: (idText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [languageCode, setLanguageCodeState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("app_language");
    return saved === "en" || saved === "id" ? saved : "id";
  });

  const setLanguageCode = (code: LanguageCode) => {
    setLanguageCodeState(code);
    localStorage.setItem("app_language", code);
  };

  const t = (idText: string, enText: string) => {
    return languageCode === "en" ? enText : idText;
  };

  return (
    <LanguageContext.Provider value={{ languageCode, setLanguageCode, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
