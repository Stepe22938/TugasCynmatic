/**
 * ThemeContext.tsx
 * Mengelola tema aplikasi (Light/Dark mode).
 */
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Ambil tema dari localStorage atau default ke 'light'
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("app_theme");
    if (saved === "light" || saved === "dark") return saved;
    
    // Auto-detect preference user
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Hapus kelas lama dan tambah kelas baru
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Simpan ke localStorage
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
