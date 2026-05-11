/**
 * AuthContext.tsx
 * Manages global user authentication state (demo mode).
 * Stores dummy user data based on provider clicked. Persists to localStorage.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export interface User {
  name: string;
  email: string;
  avatar: string;
  provider: "google";
}

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const localData = localStorage.getItem("toko_auth");
      return localData ? JSON.parse(localData) : null;
    } catch {
      return null;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("toko_auth", JSON.stringify(user));
    } else {
      localStorage.removeItem("toko_auth");
    }
  }, [user]);

  /**
   * Dummy Google login — langsung login tanpa OAuth sungguhan.
   * Menggunakan data akun demo untuk keperluan presentasi/belajar.
   */
  const login = () => {
    setUser({
      name: "Demo User",
      email: "demo@gmail.com",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Demo+User",
      provider: "google",
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
