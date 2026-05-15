/**
 * AuthContext.tsx
 * Comprehensive Authentication & User Management Context with Advanced Ban System
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const USERS_KEY = "toko_users";
const SESSION_KEY = "toko_session_id";

export type UserRole = "user" | "seller" | "admin" | "kurir";

export interface User {
  id: string;
  systemId: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  coins: number;
  isBanned: boolean;
  banType?: "permanent" | "trial";
  banReason?: string;
  banExpiry?: string; // ISO string for trial ban end
  friends?: string[];
  friendRequests?: string[];
  sentRequests?: string[];
  bio?: string;
  theme?: string;
  followers?: string[];
  following?: string[];
  avatar?: string;
  youtubeId?: string;
  useAnimation?: boolean;
  isSultan?: boolean;
  sultanExpiry?: string;
  publicIp?: string;
  localIp?: string;
  balance: number;
  activityLog: { action: string; timestamp: string }[];
  purchaseHistory: { itemName: string; price: number; timestamp: string }[];
  ownedCosmetics: string[];
  equippedCosmetics: string[];
  profileLayout: "premium" | "simple";
  sultanBadgeColor?: string;
  sultanGlowEffect?: boolean;
  sultanCustomTag?: string;
  referralCode: string;
  referredBy?: string;
  status?: string;
  points: number;
  isMyCryptoMember?: boolean;
  myCryptoExpiry?: string | null;
  isVerifiedSeller?: boolean;
  isVerifiedReseller?: boolean;
}

interface StoredUser extends User {
  password?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  allUsers: User[];
  register: (name: string, email: string, password: string, referralCode?: string) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateName: (newName: string) => void;
  updateUser: (data: Partial<User>) => void;
  updateCustomization: (data: { bio?: string; theme?: string; avatar?: string; youtubeId?: string; useAnimation?: boolean }) => void;
  sendFriendRequest: (targetId: string) => void;
  acceptFriendRequest: (fromId: string) => void;
  rejectFriendRequest: (fromId: string) => void;
  removeFriend: (friendId: string) => void;
  getAllUsers: () => User[];
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUserCoins: (userId: string, amount: number) => void;
  addCoins: (userId: string | "all", amount: number) => void;
  updateBalance: (userId: string, amount: number) => void;
  toggleBan: (userId: string, type?: "permanent" | "trial", reason?: string, durationHours?: number) => void;
  updateIps: (pub: string, loc: string) => void;
  toggleLayout: () => void;
  logActivity: (action: string) => void;
  logPurchase: (userId: string, itemName: string, price: number) => void;
  toggleVerifiedSeller: (userId: string) => void;
  toggleVerifiedReseller: (userId: string) => void;
}

const getStoredUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event("storage_sync"));
};

const findUserById = (id: string): StoredUser | null => {
  return getStoredUsers().find((u) => u.id === id) || null;
};

const toPublic = (u: StoredUser): User => {
  const { password, ...rest } = u;
  return rest;
};

// Advanced Ban Checker: Checks if a trial ban has expired
const checkBanStatus = (u: StoredUser): StoredUser => {
  if (u.isBanned && u.banType === "trial" && u.banExpiry) {
    if (new Date() > new Date(u.banExpiry)) {
      return { ...u, isBanned: false, banType: undefined, banExpiry: undefined, banReason: undefined };
    }
  }
  return u;
};

function seedSystemAccounts() {
  const users = getStoredUsers();
  const seeds: Partial<StoredUser>[] = [
    {
      id: "admin-001",
      systemId: 1,
      name: "Admin Toko",
      email: "alrizalarkan@gmail.com",
      password: "Admin123",
      role: "admin",
      isBanned: false,
      balance: 0,
      activityLog: [],
      purchaseHistory: [],
      ownedCosmetics: ["tag-beta", "tag-eta", "tag-tester", "visual-beard"],
      equippedCosmetics: [],
    },
    {
      id: "kurir-001",
      systemId: 2,
      name: "Kurir Express",
      email: "kurir@toko.com",
      password: "Kurir123",
      role: "kurir",
      isBanned: false,
      balance: 0,
      activityLog: [],
      purchaseHistory: [],
      ownedCosmetics: [],
      equippedCosmetics: [],
    },
  ];
  let changed = false;
  const merged = users.map(u => {
    let uChanged = false;
    if (!u.referralCode) {
      u.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      uChanged = true;
    }
    if (u.points === undefined) { u.points = 0; uChanged = true; }
    
    // Auto-unban check during seeding/loading
    const checked = checkBanStatus(u);
    if (checked.isBanned !== u.isBanned) uChanged = true;

    if (uChanged) changed = true;
    return checked;
  });

  for (const seed of seeds) {
    if (!merged.some((u) => u.id === seed.id)) {
      merged.push({
        ...seed,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        points: 0,
        activityLog: seed.activityLog || [],
        purchaseHistory: seed.purchaseHistory || [],
        ownedCosmetics: seed.ownedCosmetics || [],
        equippedCosmetics: seed.equippedCosmetics || [],
        profileLayout: "premium"
      } as StoredUser);
      changed = true;
    }
  }
  if (changed) saveUsers(merged);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>(() => getStoredUsers().map(toPublic));
  
  const syncAndSetUsers = (updated: StoredUser[]) => {
    saveUsers(updated);
    setAllUsers(updated.map(toPublic));
  };

  const [user, setUser] = useState<User | null>(() => {
    const id = localStorage.getItem(SESSION_KEY);
    const found = id ? findUserById(id) : null;
    if (!found) return null;
    
    const checked = checkBanStatus(found);
    if (checked.isBanned !== found.isBanned) {
      const users = getStoredUsers().map(u => u.id === found.id ? checked : u);
      saveUsers(users);
    }
    
    if (checked.isBanned) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return toPublic(checked);
  });

  useEffect(() => {
    seedSystemAccounts();
    const handleStorage = () => {
      const updated = getStoredUsers();
      setAllUsers(updated.map(toPublic));
      const id = localStorage.getItem(SESSION_KEY);
      if (id) {
        const u = updated.find(x => x.id === id);
        if (u) {
          const checked = checkBanStatus(u);
          if (checked.isBanned) {
            localStorage.removeItem(SESSION_KEY);
            setUser(null);
          } else {
            setUser(toPublic(checked));
          }
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("storage_sync", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("storage_sync", handleStorage);
    };
  }, []);

  const register = (name: string, email: string, password: string, referralCode?: string) => {
    const trimName = name.trim();
    const trimEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    if (users.some(u => u.email === trimEmail)) return { ok: false, error: "Email sudah terdaftar." };

    const newId = `user-${Date.now()}`;
    let referralBonus = 0;
    let inviterId = "";

    if (referralCode) {
      const inviter = users.find(u => u.referralCode === referralCode.trim().toUpperCase());
      if (inviter) {
        inviterId = inviter.id;
        referralBonus = 500;
      }
    }

    const newUser: StoredUser = {
      id: newId,
      systemId: users.length + 1,
      name: trimName, email: trimEmail, password,
      role: "user", createdAt: new Date().toISOString(),
      coins: referralBonus, balance: 0, points: 0, referredBy: inviterId,
      isBanned: false, activityLog: [], purchaseHistory: [],
      ownedCosmetics: [], equippedCosmetics: [], profileLayout: "premium",
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    let updated = [...users, newUser];
    if (inviterId) {
      updated = updated.map(u => u.id === inviterId ? { 
        ...u, 
        coins: (u.coins || 0) + 1000, 
        points: (u.points || 0) + 100,
        activityLog: [{ action: `Referral sukses: ${trimName}`, timestamp: new Date().toISOString() }, ...(u.activityLog || [])]
      } : u);
      
      const notifs = JSON.parse(localStorage.getItem(`toko_notifs_${inviterId}`) || "[]");
      notifs.unshift({ id: `n-${Date.now()}`, type: "points_earned", title: "Bonus Referral!", message: `${trimName} bergabung! +1.000 Koin & +100 Points!`, createdAt: new Date().toISOString(), read: false });
      localStorage.setItem(`toko_notifs_${inviterId}`, JSON.stringify(notifs.slice(0, 50)));
    }

    syncAndSetUsers(updated);
    localStorage.setItem(SESSION_KEY, newUser.id);
    setUser(toPublic(newUser));
    return { ok: true };
  };

  const login = (email: string, password: string) => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email.trim().toLowerCase());
    if (!found || found.password !== password) return { ok: false, error: "Email atau password salah." };
    
    const checked = checkBanStatus(found);
    if (checked.isBanned) {
      const reason = checked.banReason || "Pelanggaran kebijakan.";
      const expiry = checked.banExpiry ? ` sampai ${new Date(checked.banExpiry).toLocaleString()}` : " secara permanen";
      return { ok: false, error: `Akun diblokir${expiry}. Alasan: ${reason}` };
    }

    localStorage.setItem(SESSION_KEY, checked.id);
    const updated = users.map(u => u.id === checked.id ? { ...u, activityLog: [{ action: "Login", timestamp: new Date().toISOString() }, ...(u.activityLog || [])] } : u);
    syncAndSetUsers(updated);
    setUser(toPublic(updated.find(x => x.id === checked.id)!));
    return { ok: true };
  };

  const logout = () => { localStorage.removeItem(SESSION_KEY); setUser(null); };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const users = getStoredUsers();
    const updated = users.map(u => u.id === user.id ? { ...u, ...data } : u);
    syncAndSetUsers(updated);
  };

  const updateName = (n: string) => updateUser({ name: n });
  const updateCustomization = (d: any) => updateUser(d);

  const sendFriendRequest = (targetId: string) => {
    if (!user) return;
    const users = getStoredUsers();
    const from = users.find(u => u.id === user.id);
    const to = users.find(u => u.id === targetId);
    
    if (!from || !to) return;
    if (from.friends?.includes(targetId)) return;
    if (from.sentRequests?.includes(targetId)) return;

    from.sentRequests = [...(from.sentRequests || []), targetId];
    to.friendRequests = [...(to.friendRequests || []), targetId];
    saveUsers(users);
    setUser(toPublic(from));
  };

  const acceptFriendRequest = (fid: string) => {
    if (!user) return;
    const users = getStoredUsers();
    syncAndSetUsers(users.map(u => {
      if (u.id === user.id) return { ...u, friends: [...(u.friends || []), fid], friendRequests: (u.friendRequests || []).filter(x => x !== fid) };
      if (u.id === fid) return { ...u, friends: [...(u.friends || []), user.id] };
      return u;
    }));
  };

  const rejectFriendRequest = (fid: string) => {
    if (!user) return;
    const users = getStoredUsers();
    syncAndSetUsers(users.map(u => u.id === user.id ? { ...u, friendRequests: (u.friendRequests || []).filter(x => x !== fid) } : u));
  };

  const removeFriend = (fid: string) => {
    if (!user) return;
    const users = getStoredUsers();
    syncAndSetUsers(users.map(u => {
      if (u.id === user.id) return { ...u, friends: (u.friends || []).filter(x => x !== fid) };
      if (u.id === fid) return { ...u, friends: (u.friends || []).filter(x => x !== user.id) };
      return u;
    }));
  };

  const getAllUsers = () => allUsers;

  const updateUserRole = (uid: string, role: UserRole) => {
    if (user?.role !== "admin") return;
    const users = getStoredUsers();
    syncAndSetUsers(users.map(u => u.id === uid ? { ...u, role } : u));
  };

  const updateUserCoins = (uid: string, coins: number) => {
    if (user?.role !== "admin") return;
    const users = getStoredUsers();
    syncAndSetUsers(users.map(u => u.id === uid ? { ...u, coins } : u));
  };

  const addCoins = (uid: string | "all", amount: number) => {
    const users = getStoredUsers();
    syncAndSetUsers(users.map(u => (uid === "all" || u.id === uid) ? { ...u, coins: (u.coins || 0) + amount } : u));
  };

  const updateBalance = (uid: string, amount: number) => {
    const users = getStoredUsers();
    syncAndSetUsers(users.map(u => u.id === uid ? { ...u, balance: amount } : u));
  };

  const toggleBan = (uid: string, type?: "permanent" | "trial", reason?: string, durationHours?: number) => {
    if (user?.role !== "admin") return;
    const users = getStoredUsers();
    
    syncAndSetUsers(users.map(u => {
      if (u.id === uid) {
        const currentlyBanned = u.isBanned;
        if (currentlyBanned) {
          return { ...u, isBanned: false, banType: undefined, banReason: undefined, banExpiry: undefined };
        } else {
          let expiry: string | undefined = undefined;
          if (type === "trial" && durationHours) {
            expiry = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
          }
          return { ...u, isBanned: true, banType: type || "permanent", banReason: reason || "No reason provided", banExpiry: expiry };
        }
      }
      return u;
    }));
  };

  const updateIps = (pub: string, loc: string) => updateUser({ publicIp: pub, localIp: loc });

  const toggleLayout = () => {
    if (!user) return;
    updateUser({ profileLayout: user.profileLayout === "premium" ? "simple" : "premium" });
  };
  
  const logActivity = (action: string) => {
    if (!user) return;
    const users = getStoredUsers();
    const entry = { action, timestamp: new Date().toISOString() };
    syncAndSetUsers(users.map(u => u.id === user.id ? { ...u, activityLog: [entry, ...(u.activityLog || [])] } : u));
  };

  const logPurchase = (uid: string, itemName: string, price: number) => {
    const users = getStoredUsers();
    const entry = { itemName, price, timestamp: new Date().toISOString() };
    syncAndSetUsers(users.map(u => u.id === uid ? { ...u, purchaseHistory: [entry, ...(u.purchaseHistory || [])] } : u));
  };

  return (
    <AuthContext.Provider value={{ 
      user, allUsers, isAuthenticated: !!user, register, login, logout, updateName, updateUser, updateCustomization, 
      sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, 
      getAllUsers, updateUserRole, updateUserCoins, addCoins, updateBalance, toggleBan, updateIps, toggleLayout, logActivity, logPurchase,
      toggleVerifiedSeller: (uid: string) => {
        if (user?.role !== "admin") return;
        const users = getStoredUsers();
        syncAndSetUsers(users.map(u => u.id === uid ? { ...u, isVerifiedSeller: !u.isVerifiedSeller } : u));
      },
      toggleVerifiedReseller: (uid: string) => {
        if (user?.role !== "admin") return;
        const users = getStoredUsers();
        syncAndSetUsers(users.map(u => u.id === uid ? { ...u, isVerifiedReseller: !u.isVerifiedReseller } : u));
      }
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
