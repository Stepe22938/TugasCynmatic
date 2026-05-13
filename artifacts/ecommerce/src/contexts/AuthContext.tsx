/**
 * AuthContext.tsx
 * Sistem autentikasi lokal berbasis localStorage.
 *
 * Role:
 *   "user"   — pembeli biasa
 *   "seller" — penjual, akses halaman seller
 *   "admin"  — kelola produk, kelola user
 *   "kurir"  — kurir, akses halaman pengiriman
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "user" | "seller" | "admin" | "kurir";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateName: (newName: string) => void;
  getAllUsers: () => User[];
  updateUserRole: (userId: string, role: UserRole) => void;
}

const USERS_KEY   = "toko_users";
const SESSION_KEY = "toko_session_id";

function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"); }
  catch { return []; }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublic(u: StoredUser): User {
  const { password: _p, ...safe } = u;
  return safe;
}

function findUserById(id: string): User | null {
  const found = getStoredUsers().find((u) => u.id === id);
  return found ? toPublic(found) : null;
}

function seedSystemAccounts() {
  const users = getStoredUsers();
  const seeds: StoredUser[] = [
    {
      id: "admin-001",
      name: "Admin Toko",
      email: "alrizalarkan@gmail.com",
      password: "Admin123",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
    {
      id: "kurir-001",
      name: "Kurir Express",
      email: "kurir@toko.com",
      password: "Kurir123",
      role: "kurir",
      createdAt: new Date().toISOString(),
    },
  ];
  let changed = false;
  const merged = [...users];
  for (const seed of seeds) {
    if (!merged.some((u) => u.id === seed.id)) {
      merged.push(seed);
      changed = true;
    }
  }
  if (changed) saveUsers(merged);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => { seedSystemAccounts(); }, []);

  const [user, setUser] = useState<User | null>(() => {
    const id = localStorage.getItem(SESSION_KEY);
    return id ? findUserById(id) : null;
  });

  const register = (name: string, email: string, password: string): { ok: boolean; error?: string } => {
    const trimName  = name.trim();
    const trimEmail = email.trim().toLowerCase();
    if (!trimName)  return { ok: false, error: "Nama tidak boleh kosong." };
    if (!trimEmail) return { ok: false, error: "Email tidak boleh kosong." };
    if (password.length < 6) return { ok: false, error: "Password minimal 6 karakter." };

    const users = getStoredUsers();
    if (users.some((u) => u.email === trimEmail))
      return { ok: false, error: "Email sudah terdaftar. Silakan login." };

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      name: trimName, email: trimEmail, password,
      role: "user", createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    localStorage.setItem(SESSION_KEY, newUser.id);
    setUser(toPublic(newUser));
    return { ok: true };
  };

  const login = (email: string, password: string): { ok: boolean; error?: string } => {
    const trimEmail = email.trim().toLowerCase();
    const found = getStoredUsers().find((u) => u.email === trimEmail);
    if (!found)                    return { ok: false, error: "Email tidak ditemukan." };
    if (found.password !== password) return { ok: false, error: "Password salah." };
    localStorage.setItem(SESSION_KEY, found.id);
    setUser(toPublic(found));
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const updateName = (newName: string) => {
    if (!user || !newName.trim()) return;
    const users = getStoredUsers();
    saveUsers(users.map((u) => u.id === user.id ? { ...u, name: newName.trim() } : u));
    setUser({ ...user, name: newName.trim() });
  };

  const getAllUsers = (): User[] => getStoredUsers().map(toPublic);

  const updateUserRole = (userId: string, role: UserRole) => {
    if (user?.role !== "admin") return;
    if (userId === "admin-001") return;
    const users = getStoredUsers();
    saveUsers(users.map((u) => u.id === userId ? { ...u, role } : u));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, logout, updateName, getAllUsers, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
