import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Source of Truth: VPS API
// Use relative URL — works via Vite proxy on frontend, and direct on same machine
const API_BASE = typeof window !== 'undefined' ? '/api' : 'http://localhost:3000/api';
const SESSION_KEY = "toko_session_id";

export type UserRole = "user" | "seller" | "admin" | "kurir";

export interface User {
  id: string;
  systemId?: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  authProvider?: "password" | "google";
  googleSub?: string;
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
  isAISubscriber?: boolean;
  aiSubscriptionExpiry?: string;
  isSultan?: boolean;
  sultanExpiry?: string;
  bio?: string;
  theme?: string;
  youtubeId?: string;
  useAnimation?: boolean;
  createdAt?: string;
  publicIp?: string;
  profileLayout?: "arthur" | "simple" | "elegant" | "custom" | "premium";
  referralCode?: string;
  referredBy?: string;
  localIp?: string;
  myCoinNft?: string;
  balanceBtc?: string;
  balanceEth?: string;
  balanceUsdt?: string;
  wishlist?: any[];
}

export interface StoredUser extends User {
  password?: string;
}

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogleCredential: (credential: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<{ ok: boolean; error?: string }>;
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
  updateCryptoBalance: (uid: string, cryptoType: "BTC" | "ETH", action: "add" | "reset", amount?: number) => void;
  updateUserRole: (uid: string, role: UserRole) => void;
  updateUserPassword: (uid: string, newPassword: string) => void;
  toggleVerifiedSeller: (uid: string) => void;
  toggleVerifiedReseller: (uid: string) => void;
  toggleLayout: () => void;
  addWalletTransaction: (uid: string, amount: number, description: string, type?: "topup" | "payment" | "refund" | "auction_bid" | "auction_win", senderId?: string, senderName?: string) => void;
  fetchFreshUser: () => Promise<void>;
  migrateToVPS: () => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const toPublic = (u: StoredUser): User => {
    const { password, ...rest } = u;
    
    // Ensure array fields are actually arrays (handle JSON strings from VPS)
    const ensureArray = (val: any): any[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try { 
          const parsed = JSON.parse(val); 
          if (typeof parsed === "string") return ensureArray(parsed);
          if (Array.isArray(parsed)) return parsed;
          if (typeof parsed === "object" && parsed !== null) {
            // Recover legacy object format
            return Object.keys(parsed).filter(k => parsed[k] === "accepted" || parsed[k] === true || parsed[k] === "pending" || parsed[k] === "sent");
          }
          return [];
        } catch (e) { return []; }
      }
      if (typeof val === "object" && val !== null) {
        return Object.keys(val).filter(k => val[k] === "accepted" || val[k] === true || val[k] === "pending" || val[k] === "sent");
      }
      return [];
    };

    return {
      ...rest,
      balance: Number(rest.balance || 0),
      coins: Number(rest.coins || 0),
      points: Number(rest.points || 0),
      isSultan: rest.isSultan === true || (rest as any).isSultan === 1 || String(rest.isSultan) === "1" || String(rest.isSultan) === "true",
      isMyCryptoMember: rest.isMyCryptoMember === true || (rest as any).isMyCryptoMember === 1 || String(rest.isMyCryptoMember) === "1" || String(rest.isMyCryptoMember) === "true",
      isAISubscriber: rest.isAISubscriber === true || (rest as any).isAISubscriber === 1 || String(rest.isAISubscriber) === "1" || String(rest.isAISubscriber) === "true",
      friends: ensureArray(rest.friends),
      friendRequests: ensureArray(rest.friendRequests),
      sentRequests: ensureArray(rest.sentRequests),
      equippedCosmetics: ensureArray(rest.equippedCosmetics),
      ownedCosmetics: ensureArray(rest.ownedCosmetics),
      activityLog: ensureArray(rest.activityLog),
      purchaseHistory: ensureArray(rest.purchaseHistory),
      walletTransactions: ensureArray(rest.walletTransactions),
      myCoinNft: String(rest.myCoinNft ?? "0"),
      balanceBtc: String(rest.balanceBtc ?? "1.42"),
      balanceEth: String(rest.balanceEth ?? "8.50"),
      balanceUsdt: String(rest.balanceUsdt ?? "500.00"),
      wishlist: ensureArray(rest.wishlist),
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
      console.log("[AUTH] Fetching users from VPS...");
      
      // Use AbortController for fetch timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for VPS

      const res = await fetch(`${API_BASE}/users`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      if (data && Array.isArray(data)) {
        console.log("[AUTH] Successfully fetched users from VPS:", data.length);
        
        const vpsUsers = data as StoredUser[];

        // Helper to unwrap multiply stringified JSON from DB/LocalStorage
        const deepParseArray = (v: any): any[] => {
          if (Array.isArray(v)) return v;
          if (typeof v === "string") {
            try {
              const parsed = JSON.parse(v);
              if (typeof parsed === "string") return deepParseArray(parsed); // Recursive unwrap
              if (Array.isArray(parsed)) return parsed;
              if (typeof parsed === "object" && parsed !== null) {
                return Object.keys(parsed).filter(k => parsed[k] === "accepted" || parsed[k] === true || parsed[k] === "pending" || parsed[k] === "sent");
              }
              return [];
            } catch { return []; }
          }
          if (typeof v === "object" && v !== null) {
            return Object.keys(v).filter(k => v[k] === "accepted" || v[k] === true || v[k] === "pending" || v[k] === "sent");
          }
          return [];
        };

        // Fetch full data for currently logged-in user if session exists
        const sid = localStorage.getItem(SESSION_KEY);
        let fullLoggedInUser: any = null;
        if (sid) {
          try {
            const singleRes = await fetch(`${API_BASE}/users/${sid}`);
            if (singleRes.ok) {
              fullLoggedInUser = await singleRes.json();
            }
          } catch (err) {
            console.warn("[AUTH] Failed to fetch full user details for session:", sid, err);
          }
        }

        // Ensure referral codes and basic data integrity, cleaning JSON fields
        const processedUsers = vpsUsers.map((u: any) => {
          // Preserve heavy fields (walletTransactions, etc.) from current in-memory state
          // because GET /users excludes them for performance
          const existing = (allUsers as StoredUser[]).find(e => e.id === u.id);
          
          // If this is the logged-in user and we have their full data from GET /users/:id, merge it!
          const source = (fullLoggedInUser && fullLoggedInUser.id === u.id) ? fullLoggedInUser : u;

          return {
            ...u,
            coins: Number(source.coins || 0),
            balance: Number(source.balance || 0),
            points: Number(source.points || 0),
            friends: deepParseArray(source.friends),
            friendRequests: deepParseArray(source.friendRequests),
            sentRequests: deepParseArray(source.sentRequests),
            // ✅ Preserve heavy JSON fields from full server details or in-memory state
            activityLog: source.activityLog !== undefined ? deepParseArray(source.activityLog) : deepParseArray(existing?.activityLog),
            purchaseHistory: source.purchaseHistory !== undefined ? deepParseArray(source.purchaseHistory) : deepParseArray(existing?.purchaseHistory),
            ownedCosmetics: source.ownedCosmetics !== undefined ? deepParseArray(source.ownedCosmetics) : deepParseArray(existing?.ownedCosmetics),
            equippedCosmetics: source.equippedCosmetics !== undefined ? deepParseArray(source.equippedCosmetics) : deepParseArray(existing?.equippedCosmetics),
            walletTransactions: source.walletTransactions !== undefined ? deepParseArray(source.walletTransactions) : deepParseArray(existing?.walletTransactions),
            wishlist: source.wishlist !== undefined ? deepParseArray(source.wishlist) : deepParseArray(existing?.wishlist),
            referralCode: source.referralCode || existing?.referralCode || `ART-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            myCoinNft: String(source.myCoinNft ?? u.myCoinNft ?? "0"),
            balanceBtc: String(source.balanceBtc ?? u.balanceBtc ?? "1.42"),
            balanceEth: String(source.balanceEth ?? u.balanceEth ?? "8.50"),
            balanceUsdt: String(source.balanceUsdt ?? u.balanceUsdt ?? "500.00"),
            isAISubscriber: source.isAISubscriber === true || source.isAISubscriber === 1 || String(source.isAISubscriber) === "1" || String(source.isAISubscriber) === "true",
            aiSubscriptionExpiry: source.aiSubscriptionExpiry ?? u.aiSubscriptionExpiry,
          };
        });

        setAllUsers(processedUsers);
        
        // Restore session if exists
        if (sid) {
          const found = processedUsers.find((u: any) => u.id === sid);
          if (found) {
            console.log("[AUTH] Restored session with full data for:", found.name);
            setUser(toPublic(found));
          }
        }
      }
    } catch (e) {
      console.error("[AUTH] VPS Fetch Failed or Timed Out:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // FORCE CLEANUP: Destroy all local storage user backups immediately to avoid conflicts
    localStorage.removeItem("cynmatic_users_backup");
    localStorage.removeItem("toko_users");
    localStorage.removeItem("users");

    fetchAllUsersFromVPS();
    
    // Refresh users every 30 seconds + refresh logged-in user's full data
    const interval = setInterval(async () => {
      await fetchAllUsersFromVPS();
      // Also refresh the currently logged-in user's full data (walletTransactions etc.)
      const sid = localStorage.getItem(SESSION_KEY);
      if (sid) {
        try {
          const res = await fetch(`${API_BASE}/users/${sid}`);
          if (res.ok) {
            const freshUser = await res.json();
            const deepParseArray = (v: any): any[] => {
              if (Array.isArray(v)) return v;
              if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
              return [];
            };
            const processed = {
              ...freshUser,
              coins: Number(freshUser.coins || 0),
              balance: Number(freshUser.balance || 0),
              myCoinNft: String(freshUser.myCoinNft ?? "0"),
              balanceBtc: String(freshUser.balanceBtc ?? "1.42"),
              balanceEth: String(freshUser.balanceEth ?? "8.50"),
              balanceUsdt: String(freshUser.balanceUsdt ?? "500.00"),
              isAISubscriber: freshUser.isAISubscriber === true || freshUser.isAISubscriber === 1 || String(freshUser.isAISubscriber) === "1" || String(freshUser.isAISubscriber) === "true",
              aiSubscriptionExpiry: freshUser.aiSubscriptionExpiry,
              walletTransactions: deepParseArray(freshUser.walletTransactions),
              purchaseHistory: deepParseArray(freshUser.purchaseHistory),
              activityLog: deepParseArray(freshUser.activityLog),
              ownedCosmetics: deepParseArray(freshUser.ownedCosmetics),
              equippedCosmetics: deepParseArray(freshUser.equippedCosmetics),
              friends: deepParseArray(freshUser.friends),
              friendRequests: deepParseArray(freshUser.friendRequests),
              sentRequests: deepParseArray(freshUser.sentRequests),
              wishlist: deepParseArray(freshUser.wishlist),
            };
            setAllUsers(prev => prev.map(u => u.id === sid ? { ...u, ...processed } as any : u));
            setUser(toPublic(processed as StoredUser));
          }
        } catch(e) { /* ignore */ }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const mutateUsers = (updater: (prev: StoredUser[]) => StoredUser[]) => {
    setAllUsers(prev => {
      const updated = updater(prev as StoredUser[]);
      
      setTimeout(() => {
        const sid = localStorage.getItem(SESSION_KEY);
        if (sid) {
          const updatedSelf = updated.find(u => u.id === sid);
          if (updatedSelf) setUser(toPublic(updatedSelf));
        }

        updated.forEach((u, i) => {
          const old = prev.find(p => p.id === u.id);
          if (!old || JSON.stringify(u) !== JSON.stringify(old)) {
            syncUserToVPS(u);
          }
        });
      }, 0);
      
      return updated as any; // any to bypass User vs StoredUser type quirk during setState
    });
  };

  const register = async (name: string, email: string, password: string, referralCodeInput?: string) => {
    const trimEmail = email.trim().toLowerCase();

    if (trimEmail === "admin@cynmatic.com" || trimEmail === "admin@tokoarthur.com") {
      return { ok: false, error: "Email ini telah diabadikan untuk Sang Legenda. Demi menghormati sejarah TokoArthur, Anda tidak diperkenankan mendaftar dengan email ini." };
    }

    // Quick local check to avoid unnecessary API call
    if (allUsers.some(u => u.email === trimEmail)) return { ok: false, error: "Email sudah terdaftar." };

    // Find referrer locally
    let referrerId: string | undefined;
    if (referralCodeInput) {
      const referrer = allUsers.find(u => (u as any).referralCode === referralCodeInput.trim().toUpperCase());
      if (referrer) referrerId = referrer.id;
    }

    const newUserPayload: StoredUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: trimEmail,
      password: password,
      role: "user",
      coins: 20000 + (referrerId ? 500 : 0),
      balance: 0,
      points: 0,
      friends: [],
      friendRequests: [],
      sentRequests: [],
      referralCode: `ART-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      referredBy: referrerId,
      createdAt: new Date().toISOString()
    };

    try {
      // Try to register via VPS API first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error || "Registrasi gagal" };
      }

      const createdUser = await res.json();
      console.log("[REGISTER] User saved to MariaDB:", createdUser.name);

      // Give bonus to referrer
      if (referrerId) {
        const referrer = (allUsers as StoredUser[]).find(u => u.id === referrerId);
        if (referrer) {
          const updatedReferrer = {
            ...referrer,
            coins: (referrer.coins || 0) + 1000,
            points: (referrer.points || 0) + 100
          };
          syncUserToVPS(updatedReferrer);
          setAllUsers(prev => prev.map(u => u.id === referrerId ? toPublic(updatedReferrer as StoredUser) : u));
        }
      }

      // Add to local state
      setAllUsers(prev => [...prev, toPublic(createdUser as StoredUser)]);
      return { ok: true };

    } catch (e) {
      console.warn("[REGISTER] VPS unreachable, falling back to local:", e);
      // Fallback: register locally only
      mutateUsers(prev => {
        const updated = [...prev, newUserPayload];
        if (referrerId) {
          const idx = updated.findIndex(u => u.id === referrerId);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], coins: (updated[idx].coins || 0) + 1000, points: (updated[idx].points || 0) + 100 };
          }
        }
        return updated;
      });
      return { ok: true };
    }
  };

  const login = async (email: string, password: string) => {
    console.log("[AUTH] Attempting login for:", email);
    
    const trimEmail = email.trim().toLowerCase();
    
    // Emergency Default Accounts (Always available if VPS is down/empty)
    const defaults: StoredUser[] = [
      {
        id: "admin-001",
        name: "TokoArthur Admin",
        email: "admin@cynmatic.com",
        password: "admin",
        role: "admin",
        coins: 1000000,
        balance: 1000000,
        points: 10000,
        isVerifiedSeller: true
      },
      {
        id: "user-001",
        name: "Test User",
        email: "user@cynmatic.com",
        password: "user",
        role: "user",
        coins: 50000,
        balance: 0,
        points: 500
      }
    ];

    try {
      console.log("[AUTH] Calling MariaDB API...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimEmail, password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        console.log("[AUTH] MariaDB Login SUCCESS:", userData.name);
        
        localStorage.setItem(SESSION_KEY, userData.id);
        setUser(toPublic(userData));
        return { ok: true };
      } else {
        const errorData = await response.json();
        console.warn("[AUTH] MariaDB Login Failed:", errorData.error);
        
        // If it's a 401 (Wrong password/User not found), we should probably NOT check defaults
        // unless it's a dev environment. But let's check defaults as fallback.
        if (response.status === 401 || response.status === 403) {
          // Check defaults if not found in DB
          const foundDefault = defaults.find(u => u.email === trimEmail && u.password === password);
          if (foundDefault) {
             console.log("[AUTH] Logged in using emergency default account.");
             localStorage.setItem(SESSION_KEY, foundDefault.id);
             setUser(toPublic(foundDefault));
             return { ok: true };
          }
          return { ok: false, error: errorData.error || "Login gagal" };
        }
        
        throw new Error(errorData.error || "Server error");
      }
    } catch (e: any) {
      console.error("[AUTH] MariaDB Connection Error:", e);
      
      // Fallback to local state / defaults if MariaDB is unreachable
      console.log("[AUTH] Falling back to local state check...");
      let found = (allUsers as StoredUser[]).find(u => u.email === trimEmail);
      
      if (!found) {
        found = defaults.find(u => u.email === trimEmail);
      }

      if (!found) {
        return { ok: false, error: "Koneksi MariaDB terputus dan akun tidak ditemukan secara lokal." };
      }
      
      if (found.password !== password) {
        return { ok: false, error: "Password salah (Offline Mode)." };
      }
      
      if (found.isBanned) return { ok: false, error: `Akun ditangguhkan: ${found.banReason || "Pelanggaran"}` };

      localStorage.setItem(SESSION_KEY, found.id);
      setUser(toPublic(found));
      return { ok: true };
    }
  };

  const loginWithGoogleCredential = async (credential: string) => {
    try {
      const response = await fetch(`${API_BASE}/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { ok: false, error: data.error || "Login Google gagal" };
      }

      localStorage.setItem(SESSION_KEY, data.id);
      setUser(toPublic({ ...data, authProvider: "google" } as StoredUser));
      return { ok: true };
    } catch (e: any) {
      console.error("[GOOGLE AUTH] Frontend error:", e);
      return { ok: false, error: "Tidak bisa menghubungi server Google Auth." };
    }
  };

  const logout = () => {
    // Clear session identity
    localStorage.removeItem(SESSION_KEY);
    // Clear AI chat sessions so next user starts fresh (prevents session bleed between users)
    localStorage.removeItem("ai_chat_sessions");
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    setUser(toPublic({ ...(user as StoredUser), ...data }));
    mutateUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...data } : u));
  };

  const updateName = (n: string) => updateUser({ name: n });
  const updateAvatar = (url: string) => updateUser({ avatar: url });
  const updateCustomization = (data: Partial<User>) => updateUser(data);

  const addCoins = (uid: string | "all", amount: number) => {
    mutateUsers(prev => prev.map(u => (uid === "all" || u.id === uid) ? { ...u, coins: (u.coins || 0) + amount } : u));
  };

  const updateBalance = (uid: string, amount: number) => {
    mutateUsers(prev => prev.map(u => u.id === uid ? { ...u, balance: amount } : u));
  };

  const updateCryptoBalance = (uid: string, cryptoType: "BTC" | "ETH", action: "add" | "reset", amount?: number) => {
    mutateUsers(prev => prev.map(u => {
      if (u.id !== uid) return u;
      if (action === "reset") {
        return {
          ...u,
          balanceBtc: cryptoType === "BTC" ? "0.000000" : u.balanceBtc,
          balanceEth: cryptoType === "ETH" ? "0.000000" : u.balanceEth,
        };
      } else if (action === "add" && amount !== undefined) {
        const currentBtc = Number(u.balanceBtc || "0");
        const currentEth = Number(u.balanceEth || "0");
        return {
          ...u,
          balanceBtc: cryptoType === "BTC" ? (currentBtc + amount).toFixed(6) : u.balanceBtc,
          balanceEth: cryptoType === "ETH" ? (currentEth + amount).toFixed(6) : u.balanceEth,
        };
      }
      return u;
    }));
  };

  const addWalletTransaction = (uid: string, amount: number, description: string, type: "topup" | "payment" | "refund" | "auction_bid" | "auction_win" = "topup", senderId?: string, senderName?: string) => {
    const MAX_BALANCE = 999_999_999_999_999;
    const COIN_CONVERSION_RATE = 1_000_000_000;

    const unwrap = (v: any): any[] => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        try { 
          const parsed = JSON.parse(v);
          if (typeof parsed === "string") return unwrap(parsed);
          if (Array.isArray(parsed)) return parsed;
          return [];
        } catch { return []; }
      }
      return [];
    };

    setAllUsers(prev => {
      const updated = (prev as StoredUser[]).map(u => {
        if (u.id !== uid) return u;

        const currentBalance = Number(u.balance || 0);
        let finalAmt = amount;
        let compensation = 0;

        if (currentBalance + amount > MAX_BALANCE) {
          finalAmt = MAX_BALANCE - currentBalance;
          compensation = Math.floor((amount - finalAmt) / COIN_CONVERSION_RATE);
        }

        const tx = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          amount: finalAmt,
          description: compensation > 0 ? `${description} (Limit! +${compensation} Koin)` : description,
          date: new Date().toISOString(),
          senderId,
          senderName,
          recipientId: u.id,
          recipientName: u.name,
        };

        const currentTxs = unwrap(u.walletTransactions);
        const updatedUser = {
          ...u,
          balance: currentBalance + finalAmt,
          walletTransactions: [tx, ...currentTxs],
          coins: (u.coins || 0) + compensation
        };

        // ✅ Immediately sync to VPS — don't wait for next mutateUsers cycle
        syncUserToVPS(updatedUser);

        return updatedUser;
      });

      // Update logged-in user's state if they are the recipient
      const sid = localStorage.getItem(SESSION_KEY);
      if (sid) {
        const updatedSelf = updated.find(u => u.id === sid);
        if (updatedSelf) setTimeout(() => setUser(toPublic(updatedSelf)), 0);
      }

      return updated as any;
    });
  };

  const toggleBan = (uid: string, type: "permanent" | "trial" = "permanent", reason?: string, duration?: number) => {
    mutateUsers(prev => prev.map(u => {
      if (u.id !== uid) return u;
      const isBanned = !u.isBanned;
      let expiry;
      if (isBanned && type === "trial" && duration) {
        expiry = new Date(Date.now() + duration * 3600000).toISOString();
      }
      return { ...u, isBanned, banType: type, banReason: reason, banExpiry: expiry };
    }));
  };

  const updateUserRole = (uid: string, role: UserRole) => {
    mutateUsers(prev => prev.map(u => u.id === uid ? { ...u, role } : u));
  };

  const updateUserPassword = (uid: string, newPassword: string) => {
    mutateUsers(prev => prev.map(u => u.id === uid ? { ...u, password: newPassword } : u));
  };

  const toggleVerifiedSeller = (uid: string) => {
    mutateUsers(prev => prev.map(u => u.id === uid ? { ...u, isVerifiedSeller: !u.isVerifiedSeller } : u));
  };

  const toggleVerifiedReseller = (uid: string) => {
    mutateUsers(prev => prev.map(u => u.id === uid ? { ...u, isVerifiedReseller: !u.isVerifiedReseller } : u));
  };

  const sendFriendRequest = (tid: string) => {
    if (!user || user.id === tid) return;
    mutateUsers(prev => prev.map(u => {
      if (u.id === user.id) return { ...u, sentRequests: [...(u.sentRequests || []), tid] };
      if (u.id === tid) return { ...u, friendRequests: [...(u.friendRequests || []), user.id] };
      return u;
    }));
  };

  const acceptFriendRequest = (fid: string) => {
    if (!user) return;
    mutateUsers(prev => prev.map(u => {
      if (u.id === user.id) return { ...u, friends: [...(u.friends || []), fid], friendRequests: (u.friendRequests || []).filter(x => x !== fid) };
      if (u.id === fid) return { ...u, friends: [...(u.friends || []), user.id], sentRequests: (u.sentRequests || []).filter(x => x !== user.id) };
      return u;
    }));
  };

  const rejectFriendRequest = (fid: string) => {
    if (!user) return;
    mutateUsers(prev => prev.map(u => u.id === user.id ? { ...u, friendRequests: (u.friendRequests || []).filter(x => x !== fid) } : u));
  };

  const removeFriend = (fid: string) => {
    if (!user) return;
    mutateUsers(prev => prev.map(u => {
      if (u.id === user.id) return { ...u, friends: (u.friends || []).filter(x => x !== fid) };
      if (u.id === fid) return { ...u, friends: (u.friends || []).filter(x => x !== user.id) };
      return u;
    }));
  };

  const toggleLayout = () => {
    if (!user) return;
    const next = user.profileLayout === "arthur" || user.profileLayout === "premium" ? "simple" : "arthur";
    updateUser({ profileLayout: next });
  };

  const migrateToVPS = async () => {
    try {
      const response = await fetch(`${API_BASE}/migrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          users: allUsers, // This is the state variable, it HAS passwords!
          products: [] // Admin page can handle products separately or we can add it here
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal migrasi ke VPS.");
      }
      
      return { ok: true };
    } catch (e: any) {
      console.error("[MIGRATE] Error:", e);
      return { ok: false, error: e.message };
    }
  };

  const fetchFreshUser = async () => {
    const sid = localStorage.getItem(SESSION_KEY);
    if (!sid) { await fetchAllUsersFromVPS(); return; }
    try {
      const res = await fetch(`${API_BASE}/users/${sid}`);
      if (res.ok) {
        const freshUser = await res.json();
        const deepParse = (v: any): any[] => {
          if (Array.isArray(v)) return v;
          if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
          return [];
        };
        const processed = {
          ...freshUser,
          coins: Number(freshUser.coins || 0),
          balance: Number(freshUser.balance || 0),
          myCoinNft: String(freshUser.myCoinNft ?? "0"),
          balanceBtc: String(freshUser.balanceBtc ?? "1.42"),
          balanceEth: String(freshUser.balanceEth ?? "8.50"),
          balanceUsdt: String(freshUser.balanceUsdt ?? "500.00"),
          isAISubscriber: freshUser.isAISubscriber === true || freshUser.isAISubscriber === 1 || String(freshUser.isAISubscriber) === "1" || String(freshUser.isAISubscriber) === "true",
          aiSubscriptionExpiry: freshUser.aiSubscriptionExpiry,
          walletTransactions: deepParse(freshUser.walletTransactions),
          purchaseHistory: deepParse(freshUser.purchaseHistory),
          activityLog: deepParse(freshUser.activityLog),
          ownedCosmetics: deepParse(freshUser.ownedCosmetics),
          equippedCosmetics: deepParse(freshUser.equippedCosmetics),
          friends: deepParse(freshUser.friends),
          friendRequests: deepParse(freshUser.friendRequests),
          sentRequests: deepParse(freshUser.sentRequests),
          wishlist: deepParse(freshUser.wishlist),
        };
        setAllUsers(prev => prev.map(u => u.id === sid ? { ...u, ...processed } as any : u));
        setUser(toPublic(processed as StoredUser));
      }
    } catch(e) {
      await fetchAllUsersFromVPS();
    }
  };

  const publicUsers = allUsers.map(u => toPublic(u as StoredUser));

  return (
    <AuthContext.Provider value={{ 
      user, allUsers: publicUsers, loading, login, loginWithGoogleCredential, register, logout, updateUser, updateCustomization, updateName, updateAvatar, 
      toggleBan, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend,
      addCoins, updateBalance, updateCryptoBalance, addWalletTransaction, updateUserRole, updateUserPassword, toggleVerifiedSeller, toggleVerifiedReseller, toggleLayout, fetchFreshUser,
      migrateToVPS
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
