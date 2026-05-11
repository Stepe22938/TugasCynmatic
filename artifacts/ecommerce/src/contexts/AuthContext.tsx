/**
 * AuthContext.tsx
 * Manages global user authentication state.
 * Stores dummy user data based on provider clicked. Persists to localStorage.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export interface User {
  name: string;
  email: string;
  avatar: string;
  provider: "google" | "github" | "facebook";
}

interface AuthContextType {
  user: User | null;
  login: (provider: User["provider"]) => void;
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
    } catch (error) {
      console.error("Failed to parse auth state", error);
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

  // Mock login function
  const login = (provider: User["provider"]) => {
    // Generate dummy user
    setUser({
      name: `User ${provider}`,
      email: `demo@${provider}.com`,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=User+${provider}`,
      provider
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
