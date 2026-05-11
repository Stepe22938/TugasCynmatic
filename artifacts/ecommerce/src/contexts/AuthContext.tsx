/**
 * AuthContext.tsx
 * Sistem autentikasi lokal berbasis localStorage.
 *
 * Fitur:
 * - Register akun baru (name, email, password)
 * - Login dengan email + password
 * - Logout
 * - Akun admin di-seed otomatis saat pertama kali app dibuka
 * - Data user (tanpa password) tersedia di seluruh aplikasi via useAuth()
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Akun tersimpan di localStorage (termasuk password — hanya untuk demo lokal) */
interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  createdAt: string;
}

/** Data user yang tersedia ke komponen (password tidak diekspos) */
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateName: (newName: string) => void;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const USERS_KEY   = "toko_users";
const SESSION_KEY = "toko_session_id";

/** Ambil semua user yang tersimpan */
function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"); }
  catch { return []; }
}

/** Simpan daftar user */
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Cari user berdasarkan ID, tanpa password */
function findUserById(id: string): User | null {
  const found = getStoredUsers().find((u) => u.id === id);
  if (!found) return null;
  const { password: _p, ...safe } = found;
  return safe;
}

/** ID sesi aktif */
function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
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
  // Seed admin akun sekali saat modul pertama kali dimuat
  useEffect(() => { seedAdminIfNeeded(); }, []);

  // Inisialisasi user dari sesi tersimpan
  const [user, setUser] = useState<User | null>(() => {
    const id = getSessionId();
    return id ? findUserById(id) : null;
  });

  /** Daftarkan akun baru */
  const register = (name: string, email: string, password: string): { ok: boolean; error?: string } => {
    const trimName  = name.trim();
    const trimEmail = email.trim().toLowerCase();

    if (!trimName)  return { ok: false, error: "Nama tidak boleh kosong." };
    if (!trimEmail) return { ok: false, error: "Email tidak boleh kosong." };
    if (password.length < 6) return { ok: false, error: "Password minimal 6 karakter." };

    const users = getStoredUsers();
    if (users.some((u) => u.email === trimEmail)) {
      return { ok: false, error: "Email sudah terdaftar. Silakan login." };
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      name: trimName,
      email: trimEmail,
      password,
      role: "user",
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);

    // Auto-login setelah register
    localStorage.setItem(SESSION_KEY, newUser.id);
    const { password: _p, ...safe } = newUser;
    setUser(safe);
    return { ok: true };
  };

  /** Login dengan email + password */
  const login = (email: string, password: string): { ok: boolean; error?: string } => {
    const trimEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const found = users.find((u) => u.email === trimEmail);

    if (!found)              return { ok: false, error: "Email tidak ditemukan." };
    if (found.password !== password) return { ok: false, error: "Password salah." };

    localStorage.setItem(SESSION_KEY, found.id);
    const { password: _p, ...safe } = found;
    setUser(safe);
    return { ok: true };
  };

  /** Logout — hapus sesi */
  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  /** Ubah nama tampilan user yang sedang login */
  const updateName = (newName: string) => {
    if (!user || !newName.trim()) return;
    const users = getStoredUsers();
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, name: newName.trim() } : u
    );
    saveUsers(updated);
    setUser({ ...user, name: newName.trim() });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
