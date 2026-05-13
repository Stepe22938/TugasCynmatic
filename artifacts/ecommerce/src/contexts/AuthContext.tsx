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
  systemId?: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  coins: number;
  isBanned: boolean;
  bio?: string;
  theme?: string;
  friends?: string[];
  friendRequests?: string[];  // incoming
  sentRequests?: string[];    // outgoing
}

export interface User {
  id: string;
  systemId?: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  coins: number;
  isBanned: boolean;
  bio?: string;
  theme?: string;
  friends?: string[];
  friendRequests?: string[];
  sentRequests?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateName: (newName: string) => void;
  updateCustomization: (bio: string, theme: string) => void;
  sendFriendRequest: (targetId: string) => void;
  acceptFriendRequest: (fromId: string) => void;
  rejectFriendRequest: (fromId: string) => void;
  removeFriend: (friendId: string) => void;
  getAllUsers: () => User[];
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUserCoins: (userId: string, amount: number) => void;
  addCoins: (userId: string | "all", amount: number) => void;
  toggleBan: (userId: string) => void;
  updateIps: (pub: string, loc: string) => void;
}

const USERS_KEY   = "toko_users";
const SESSION_KEY = "toko_session_id";

function getStoredUsers(): StoredUser[] {
  try { 
    const raw = localStorage.getItem(USERS_KEY) ?? "[]";
    const users: StoredUser[] = JSON.parse(raw);
    const MAX_COINS = 999999999;
    
    let changed = false;
    const capped = users.map(u => {
      if (u.id === "admin-001" && u.coins > 10000) {
        changed = true;
        return { ...u, coins: 10000 };
      }
      if (u.coins && u.coins > MAX_COINS) {
        changed = true;
        return { ...u, coins: MAX_COINS };
      }
      return u;
    });

    if (changed) {
      localStorage.setItem(USERS_KEY, JSON.stringify(capped));
    }

    return capped;
  }
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
      systemId: 1,
      name: "Admin Toko",
      email: "alrizalarkan@gmail.com",
      password: "Admin123",
      role: "admin",
      createdAt: new Date().toISOString(),
      coins: 0,
      isBanned: false,
    },
    {
      id: "kurir-001",
      systemId: 2,
      name: "Kurir Express",
      email: "kurir@toko.com",
      password: "Kurir123",
      role: "kurir",
      createdAt: new Date().toISOString(),
      coins: 0,
      isBanned: false,
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

    const newId = `user-${Date.now()}`;
    const nextSystemId = users.length > 0 ? Math.max(...users.map(u => u.systemId || 0)) + 1 : 1;
    const newUser: StoredUser = {
      id: newId,
      systemId: nextSystemId,
      name: trimName,
      email: trimEmail,
      password,
      role: "user",
      createdAt: new Date().toISOString(),
      coins: 0,
      isBanned: false,
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
    if (found.isBanned)              return { ok: false, error: "Akun ini telah diblokir." };
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

  const updateCustomization = (bio: string, theme: string) => {
    if (!user) return;
    const users = getStoredUsers();
    saveUsers(users.map((u) => u.id === user.id ? { ...u, bio, theme } : u));
    setUser({ ...user, bio, theme });
  };

  const sendFriendRequest = (targetId: string) => {
    if (!user || targetId === user.id) return;
    const users = getStoredUsers();
    const target = users.find(u => u.id === targetId);
    if (!target) return;
    // Already friends or already sent
    if ((user.friends || []).includes(targetId)) return;
    if ((user.sentRequests || []).includes(targetId)) return;
    // Add to my sentRequests and their friendRequests
    const newSent = [...(user.sentRequests || []), targetId];
    const targetReqs = [...(target.friendRequests || []), user.id];
    saveUsers(users.map(u => {
      if (u.id === user.id) return { ...u, sentRequests: newSent };
      if (u.id === targetId) return { ...u, friendRequests: targetReqs };
      return u;
    }));
    setUser({ ...user, sentRequests: newSent });
  };

  const acceptFriendRequest = (fromId: string) => {
    if (!user) return;
    const users = getStoredUsers();
    const from = users.find(u => u.id === fromId);
    if (!from) return;
    // Add each other as friends, remove from request lists
    const myFriends = [...(user.friends || []), fromId];
    const myReqs = (user.friendRequests || []).filter(id => id !== fromId);
    const theirFriends = [...(from.friends || []), user.id];
    const theirSent = (from.sentRequests || []).filter(id => id !== user.id);
    saveUsers(users.map(u => {
      if (u.id === user.id) return { ...u, friends: myFriends, friendRequests: myReqs };
      if (u.id === fromId) return { ...u, friends: theirFriends, sentRequests: theirSent };
      return u;
    }));
    setUser({ ...user, friends: myFriends, friendRequests: myReqs });
  };

  const rejectFriendRequest = (fromId: string) => {
    if (!user) return;
    const users = getStoredUsers();
    const from = users.find(u => u.id === fromId);
    const myReqs = (user.friendRequests || []).filter(id => id !== fromId);
    const theirSent = from ? (from.sentRequests || []).filter(id => id !== user.id) : [];
    saveUsers(users.map(u => {
      if (u.id === user.id) return { ...u, friendRequests: myReqs };
      if (u.id === fromId) return { ...u, sentRequests: theirSent };
      return u;
    }));
    setUser({ ...user, friendRequests: myReqs });
  };

  const removeFriend = (friendId: string) => {
    if (!user) return;
    const users = getStoredUsers();
    const myFriends = (user.friends || []).filter(id => id !== friendId);
    saveUsers(users.map(u => {
      if (u.id === user.id) return { ...u, friends: myFriends };
      if (u.id === friendId) return { ...u, friends: (u.friends || []).filter(id => id !== user.id) };
      return u;
    }));
    setUser({ ...user, friends: myFriends });
  };

  const getAllUsers = (): User[] => getStoredUsers().map(toPublic);

  const updateUserRole = (userId: string, role: UserRole) => {
    if (user?.role !== "admin") return;
    if (userId === "admin-001") return;
    const users = getStoredUsers();
    saveUsers(users.map((u) => u.id === userId ? { ...u, role } : u));
  };

  const updateUserCoins = (userId: string, amount: number) => {
    if (user?.role !== "admin") return;
    const users = getStoredUsers();
    saveUsers(users.map((u) => u.id === userId ? { ...u, coins: amount } : u));
    if (user.id === userId) setUser((prev) => prev ? { ...prev, coins: amount } : null);
  };

  const addCoins = (userId: string | "all", amount: number) => {
    // If not admin, the user can only add to themselves (e.g. from checkout)
    if (userId !== "all" && user?.id !== userId && user?.role !== "admin") return;
    const MAX_COINS = 999999999; // 999 Juta Koin
    const users = getStoredUsers();
    saveUsers(users.map((u) => {
      if (userId === "all" || u.id === userId) {
        const newCoins = (u.coins || 0) + amount;
        return { ...u, coins: Math.min(newCoins, MAX_COINS) };
      }
      return u;
    }));
    if (userId === "all" || user?.id === userId) {
      setUser((prev) => prev ? { ...prev, coins: Math.min((prev.coins || 0) + amount, MAX_COINS) } : null);
    }
  };

  const toggleBan = (userId: string) => {
    if (user?.role !== "admin") return;
    if (userId === "admin-001") return;
    const users = getStoredUsers();
    saveUsers(users.map((u) => u.id === userId ? { ...u, isBanned: !u.isBanned } : u));
  };

  const updateIps = (pub: string, loc: string) => {
    if (!user) return;
    const users = getStoredUsers();
    saveUsers(users.map((u) => u.id === user.id ? { ...u, publicIp: pub, localIp: loc } : u));
    setUser((prev) => prev ? { ...prev, publicIp: pub, localIp: loc } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated: !!user, register, login, logout, updateName, updateCustomization, 
      sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, 
      getAllUsers, updateUserRole, updateUserCoins, addCoins, toggleBan, updateIps 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
