/**
 * AuthContext.tsx
 * Sistem autentikasi lokal berbasis localStorage.
 *
 * Tiga role:
 *   "user"   — pembeli biasa, hanya bisa belanja
 *   "seller" — dapat akses halaman seller untuk menambah produk
 *   "admin"  — kelola produk (setujui/tolak/hapus) dan kelola role user
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "seller" | "admin";

/** Akun tersimpan di localStorage (termasuk password — hanya untuk demo lokal) */
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

/** Data user yang tersedia ke komponen (password tidak diekspos) */
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
  /** Admin only: ambil semua user */
  getAllUsers: () => User[];
  /** Admin only: ubah role user lain */
  updateUserRole: (userId: string, role: UserRole) => void;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

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

/** Seed akun admin jika belum ada */
function seedAdminIfNeeded() {
  const users = getStoredUsers();
  const adminEmail = "alrizalarkan@gmail.com";
  if (users.some((u) => u.email === adminEmail)) return;
  const admin: StoredUser = {
    id: "admin-001",
    name: "Admin Toko",
    email: adminEmail,
    password: "Admin123",
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  saveUsers([admin, ...users]);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => { seedAdminIfNeeded(); }, []);

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
      name: trimName,
      email: trimEmail,
      password,
      role: "user",
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    localStorage.setItem(SESSION_KEY, newUser.id);
    setUser(toPublic(newUser));
    return { ok: true };
  };

  const login = (email: string, password: string): { ok: boolean; error?: string } => {
    const trimEmail = email.trim().toLowerCase();
    const found = getStoredUsers().find((u) => u.email === trimEmail);
    if (!found)              return { ok: false, error: "Email tidak ditemukan." };
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

  const getAllUsers = (): User[] => {
    return getStoredUsers().map(toPublic);
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    if (user?.role !== "admin") return;
    if (userId === "admin-001") return; // jaga akun admin utama
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
