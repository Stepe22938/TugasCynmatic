import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Source of Truth: VPS API
const API_BASE = "http://localhost:3000/api";
const SESSION_KEY = "toko_session_id";

export type UserRole = "user" | "seller" | "admin" | "kurir";

export interface User {
  id: string;
  systemId?: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isVerifiedSeller?: boolean;
  isVerifiedReseller?: boolean;
  coins?: number;
  balance?: number;
  points?: number;
  isBanned?: boolean;
  banReason?: string;
  banType?: "permanent" | "trial";
  banExpiry?: string;
  friends?: string[];
  friendRequests?: string[];
  sentRequests?: string[];
  activityLog?: any[];
  purchaseHistory?: any[];
  ownedCosmetics?: any[];
  equippedCosmetics?: any[];
  walletTransactions?: any[];
  sultanBadgeColor?: string;
  sultanGlowEffect?: boolean;
  sultanCustomTag?: string;
  isMyCryptoMember?: boolean;
  myCryptoExpiry?: string;
  profileLayout?: "premium" | "simple";
}

export interface StoredUser extends User {
  password?: string;
}

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string, referralCode?: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateCustomization: (data: Partial<User>) => void;
  updateName: (name: string) => void;
  updateAvatar: (url: string) => void;
  toggleBan: (uid: string, type?: "permanent" | "trial", reason?: string, durationHours?: number) => void;
  sendFriendRequest: (targetId: string) => void;
  acceptFriendRequest: (fid: string) => void;
  rejectFriendRequest: (fid: string) => void;
  removeFriend: (fid: string) => void;
  addCoins: (uid: string | "all", amount: number) => void;
  updateBalance: (uid: string, amount: number) => void;
  updateUserRole: (uid: string, role: UserRole) => void;
  toggleVerifiedSeller: (uid: string) => void;
  toggleVerifiedReseller: (uid: string) => void;
  toggleLayout: () => void;
  fetchFreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const toPublic = (u: StoredUser): User => {
    const { password, ...rest } = u;
    
    // Ensure array fields are actually arrays (handle JSON strings from VPS)
    const ensureArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch (e) { return []; }
      }
      return [];
    };

    return {
      ...rest,
      balance: Number(rest.balance || 0),
      coins: Number(rest.coins || 0),
      points: Number(rest.points || 0),
      friends: ensureArray(rest.friends),
      friendRequests: ensureArray(rest.friendRequests),
      sentRequests: ensureArray(rest.sentRequests),
      equippedCosmetics: ensureArray(rest.equippedCosmetics),
      ownedCosmetics: ensureArray(rest.ownedCosmetics),
      activityLog: ensureArray(rest.activityLog),
      purchaseHistory: ensureArray(rest.purchaseHistory),
      walletTransactions: ensureArray(rest.walletTransactions)
    };
  };

  const syncUserToVPS = async (u: StoredUser) => {
    try {
      await fetch(`${API_BASE}/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(u)
      });
    } catch (e) {
      console.error("[SYNC] Failed to sync user to VPS:", e);
    }
  };

  const fetchAllUsersFromVPS = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      if (data && Array.isArray(data)) {
        console.log("[AUTH] Fetched users from VPS:", data.length);
        
        // Data Migration: Ensure every user has a referralCode
        let needsResync = false;
        const processedUsers = data.map((u: any) => {
          if (!u.referralCode) {
            needsResync = true;
            return { 
              ...u, 
              referralCode: `CYN-${Math.random().toString(36).substring(2, 7).toUpperCase()}` 
            };
          }
          return u;
        });

        setAllUsers(processedUsers);
        
        if (needsResync) {
          console.log("[AUTH] Some users missing referral codes, re-syncing...");
          processedUsers.forEach(u => {
            if (data.find((orig: any) => orig.id === u.id && !orig.referralCode)) {
              syncUserToVPS(u);
            }
          });
        }
        
        // Re-sync current session
        const sid = localStorage.getItem(SESSION_KEY);
        if (sid) {
          const found = processedUsers.find((u: any) => u.id === sid);
          if (found) setUser(toPublic(found));
        }
      }
    } catch (e) {
      console.error("[FETCH] Failed to fetch users from VPS:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("[AUTH] Initializing AuthProvider...");
    fetchAllUsersFromVPS();
    
    // Emergency Timeout: Force loading to false after 5 seconds if still stuck
    const timeout = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.warn("[AUTH] Emergency Timeout triggered - forcing loading to false");
          return false;
        }
        return false;
      });
    }, 5000);

    const interval = setInterval(fetchAllUsersFromVPS, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const syncAndSetUsers = async (updated: StoredUser[]) => {
    setAllUsers(updated);
    
    // Update local session user if changed
    if (user) {
      const updatedSelf = updated.find(u => u.id === user.id);
      if (updatedSelf) setUser(toPublic(updatedSelf));
    }

    // Push changes to VPS
    updated.forEach(u => syncUserToVPS(u));
  };

  const register = (name: string, email: string, password: string, referralCodeInput?: string) => {
    const trimEmail = email.trim().toLowerCase();
    if (allUsers.some(u => u.email === trimEmail)) return { ok: false, error: "Email sudah terdaftar." };

    // Find who referred this new user
    let referrerId: string | undefined;
    if (referralCodeInput) {
      const referrer = allUsers.find(u => u.referralCode === referralCodeInput.trim().toUpperCase());
      if (referrer) referrerId = referrer.id;
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: trimEmail,
      password: password,
      role: "user",
      coins: 20000 + (referrerId ? 500 : 0), // Bonus 500 coins if using referral
      balance: 0,
      points: 0,
      friends: [],
      friendRequests: [],
      sentRequests: [],
      referralCode: `CYN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      referredBy: referrerId,
      createdAt: new Date().toISOString()
    };

    const updated = [...(allUsers as StoredUser[]), newUser];
    
    // Give bonus to referrer too
    if (referrerId) {
      const referrerIdx = updated.findIndex(u => u.id === referrerId);
      if (referrerIdx !== -1) {
        updated[referrerIdx] = {
          ...updated[referrerIdx],
          coins: (updated[referrerIdx].coins || 0) + 1000, // Reward for referrer
          points: (updated[referrerIdx].points || 0) + 100
        };
      }
    }

    syncAndSetUsers(updated);
    return { ok: true };
  };

  const login = (email: string, password: string) => {
    console.log("[AUTH] Attempting login for:", email);
    console.log("[AUTH] Current allUsers count:", allUsers.length);
    
    const found = (allUsers as StoredUser[]).find(u => u.email === email.trim().toLowerCase());
    if (!found) {
      console.warn("[AUTH] User not found in state.");
      return { ok: false, error: "Email atau password salah." };
    }
    
    console.log("[AUTH] User found:", found.id, "Role:", found.role);
    if (found.password !== password) {
      console.warn("[AUTH] Password mismatch.");
      return { ok: false, error: "Email atau password salah." };
    }
    
    if (found.isBanned) return { ok: false, error: `Akun diblokir: ${found.banReason || "Tanpa alasan"}` };

    localStorage.setItem(SESSION_KEY, found.id);
    setUser(toPublic(found));
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = (allUsers as StoredUser[]).map(u => u.id === user.id ? { ...u, ...data } : u);
    syncAndSetUsers(updated);
  };

  const updateName = (n: string) => updateUser({ name: n });
  const updateAvatar = (url: string) => updateUser({ avatar: url });
  const updateCustomization = (data: Partial<User>) => updateUser(data);

  const addCoins = (uid: string | "all", amount: number) => {
    const updated = (allUsers as StoredUser[]).map(u => (uid === "all" || u.id === uid) ? { ...u, coins: (u.coins || 0) + amount } : u);
    syncAndSetUsers(updated);
  };

  const updateBalance = (uid: string, amount: number) => {
    const updated = (allUsers as StoredUser[]).map(u => u.id === uid ? { ...u, balance: amount } : u);
    syncAndSetUsers(updated);
  };

  const toggleBan = (uid: string, type: "permanent" | "trial" = "permanent", reason?: string, duration?: number) => {
    const updated = (allUsers as StoredUser[]).map(u => {
      if (u.id !== uid) return u;
      const isBanned = !u.isBanned;
      let expiry;
      if (isBanned && type === "trial" && duration) {
        expiry = new Date(Date.now() + duration * 3600000).toISOString();
      }
      return { ...u, isBanned, banType: type, banReason: reason, banExpiry: expiry };
    });
    syncAndSetUsers(updated);
  };

  const updateUserRole = (uid: string, role: UserRole) => {
    const updated = (allUsers as StoredUser[]).map(u => u.id === uid ? { ...u, role } : u);
    syncAndSetUsers(updated);
  };

  const toggleVerifiedSeller = (uid: string) => {
    const updated = (allUsers as StoredUser[]).map(u => u.id === uid ? { ...u, isVerifiedSeller: !u.isVerifiedSeller } : u);
    syncAndSetUsers(updated);
  };

  const toggleVerifiedReseller = (uid: string) => {
    const updated = (allUsers as StoredUser[]).map(u => u.id === uid ? { ...u, isVerifiedReseller: !u.isVerifiedReseller } : u);
    syncAndSetUsers(updated);
  };

  const sendFriendRequest = (tid: string) => {
    if (!user || user.id === tid) return;
    const updated = (allUsers as StoredUser[]).map(u => {
      if (u.id === user.id) return { ...u, sentRequests: [...(u.sentRequests || []), tid] };
      if (u.id === tid) return { ...u, friendRequests: [...(u.friendRequests || []), user.id] };
      return u;
    });
    syncAndSetUsers(updated);
  };

  const acceptFriendRequest = (fid: string) => {
    if (!user) return;
    const updated = (allUsers as StoredUser[]).map(u => {
      if (u.id === user.id) return { ...u, friends: [...(u.friends || []), fid], friendRequests: (u.friendRequests || []).filter(x => x !== fid) };
      if (u.id === fid) return { ...u, friends: [...(u.friends || []), user.id], sentRequests: (u.sentRequests || []).filter(x => x !== user.id) };
      return u;
    });
    syncAndSetUsers(updated);
  };

  const rejectFriendRequest = (fid: string) => {
    if (!user) return;
    const updated = (allUsers as StoredUser[]).map(u => u.id === user.id ? { ...u, friendRequests: (u.friendRequests || []).filter(x => x !== fid) } : u);
    syncAndSetUsers(updated);
  };

  const removeFriend = (fid: string) => {
    if (!user) return;
    const updated = (allUsers as StoredUser[]).map(u => {
      if (u.id === user.id) return { ...u, friends: (u.friends || []).filter(x => x !== fid) };
      if (u.id === fid) return { ...u, friends: (u.friends || []).filter(x => x !== user.id) };
      return u;
    });
    syncAndSetUsers(updated);
  };

  const toggleLayout = () => {
    if (!user) return;
    const next = user.profileLayout === "premium" ? "simple" : "premium";
    updateUser({ profileLayout: next });
  };

  const fetchFreshUser = async () => { await fetchAllUsersFromVPS(); };

  const publicUsers = allUsers.map(u => toPublic(u as StoredUser));

  return (
    <AuthContext.Provider value={{ 
      user, allUsers: publicUsers, loading, login, register, logout, updateUser, updateCustomization, updateName, updateAvatar, 
      toggleBan, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend,
      addCoins, updateBalance, updateUserRole, toggleVerifiedSeller, toggleVerifiedReseller, toggleLayout, fetchFreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
