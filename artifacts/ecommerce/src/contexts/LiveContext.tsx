/**
 * LiveContext.tsx
 * Kelola sesi Live Shopping per-seller — disimpan di localStorage.
 * Hadiah (gifts) hanya bersifat runtime (tidak persisten).
 */
import React, { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from "react";
import { useWallet } from "./WalletContext";

// ─── Gift system ──────────────────────────────────────────────────────────────

export interface GiftType {
  id: string;
  emoji: string;
  label: string;
  points: number;
  color: string;
}

export const GIFT_TYPES: GiftType[] = [
  { id: "rose",    emoji: "🌹", label: "Mawar",   points: 10,   color: "text-rose-500" },
  { id: "heart",   emoji: "❤️", label: "Hati",    points: 5,    color: "text-red-500" },
  { id: "star",    emoji: "⭐", label: "Bintang",  points: 20,   color: "text-yellow-500" },
  { id: "crown",   emoji: "👑", label: "Mahkota",  points: 100,  color: "text-amber-500" },
  { id: "diamond", emoji: "💎", label: "Berlian",  points: 500,  color: "text-cyan-400" },
  { id: "gift",    emoji: "🎁", label: "Hadiah",   points: 50,   color: "text-purple-500" },
  { id: "fire",    emoji: "🔥", label: "Api",      points: 30,   color: "text-orange-500" },
];

export interface GiftEvent {
  id: string;
  giftId: string;
  senderName: string;
  x: number; // percent from right
  sentAt: number;
}

// ─── Session type ──────────────────────────────────────────────────────────────

export interface LiveSession {
  isLive: boolean;
  title: string;
  hostName: string;
  sellerId: string;
  featuredProductIds: number[];
  startedAt?: string;
}

interface LiveContextValue {
  activeSessions: LiveSession[];
  currentSession: LiveSession | null;
  startLive: (sellerId: string, sellerName: string) => void;
  stopLive:  (sellerId: string) => void;
  updateSession: (sellerId: string, patch: Partial<Omit<LiveSession, "isLive" | "startedAt">>) => void;
  toggleProduct: (sellerId: string, productId: number) => void;
  // Gift runtime state
  gifts: GiftEvent[];
  totalPoints: number;
  sendGift: (giftId: string, senderName: string, recipientSellerId: string) => boolean;
  clearGift: (id: string) => void;
}

const STORAGE_KEY = "toko_live_session_v2";

function load(): LiveSession[] {
  try { 
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  }
  catch { return []; }
}

function save(s: LiveSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const LiveContext = createContext<LiveContextValue | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const { spend } = useWallet();
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>(load);
  const [gifts, setGifts]     = useState<GiftEvent[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const giftIdRef = useRef(0);

  const sync = useCallback((updated: LiveSession[]) => {
    setActiveSessions(updated);
    save(updated);
  }, []);

  const startLive = useCallback((sellerId: string, sellerName: string) => {
    const newSession: LiveSession = {
      isLive: true,
      sellerId,
      hostName: sellerName,
      title: "Live Belanja Seru!",
      featuredProductIds: [],
      startedAt: new Date().toISOString()
    };
    sync([...activeSessions.filter(s => s.sellerId !== sellerId), newSession]);
    setGifts([]);
    setTotalPoints(0);
  }, [activeSessions, sync]);

  const stopLive = useCallback((sellerId: string) => {
    sync(activeSessions.filter(s => s.sellerId !== sellerId));
  }, [activeSessions, sync]);

  const updateSession = useCallback((sellerId: string, patch: Partial<Omit<LiveSession, "isLive" | "startedAt">>) => {
    sync(activeSessions.map(s => s.sellerId === sellerId ? { ...s, ...patch } : s));
  }, [activeSessions, sync]);

  const toggleProduct = useCallback((sellerId: string, productId: number) => {
    sync(activeSessions.map(s => {
      if (s.sellerId !== sellerId) return s;
      const ids = s.featuredProductIds.includes(productId)
        ? s.featuredProductIds.filter(x => x !== productId)
        : [...s.featuredProductIds, productId];
      return { ...s, featuredProductIds: ids };
    }));
  }, [activeSessions, sync]);

  const sendGift = useCallback((giftId: string, senderName: string, recipientSellerId: string) => {
    const gift = GIFT_TYPES.find((g) => g.id === giftId);
    if (!gift) return false;

    // Deduct from wallet (Price in IDR = points * 1000 for simplicity)
    const cost = gift.points * 1000;
    const success = spend(cost, `Kirim hadiah ${gift.label} ke ${recipientSellerId}`, "payment");
    
    if (!success) return false;

    const id = `gift-${++giftIdRef.current}`;
    const event: GiftEvent = {
      id, giftId, senderName,
      x: 10 + Math.random() * 80,
      sentAt: Date.now(),
    };

    setGifts((prev) => [...prev.slice(-20), event]);
    setTotalPoints((p) => p + gift.points);
    setTimeout(() => setGifts((prev) => prev.filter((g) => g.id !== id)), 4000);
    return true;
  }, [spend]);

  const clearGift = useCallback((id: string) => {
    setGifts((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return (
    <LiveContext.Provider value={{ 
      activeSessions, 
      currentSession: activeSessions[0] || null, // Default to first for legacy support if needed
      startLive, 
      stopLive, 
      updateSession, 
      toggleProduct, 
      gifts, 
      totalPoints, 
      sendGift, 
      clearGift 
    }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be inside LiveProvider");
  return ctx;
}
