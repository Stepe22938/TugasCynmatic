/**
 * LiveContext.tsx
 * Kelola sesi Live Shopping per-seller — disimpan di localStorage.
 * Hadiah (gifts) hanya bersifat runtime (tidak persisten).
 */
import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

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
  session: LiveSession;
  startLive: (sellerId: string, sellerName: string) => void;
  stopLive:  () => void;
  updateSession: (patch: Partial<Omit<LiveSession, "isLive" | "startedAt">>) => void;
  toggleProduct: (id: number) => void;
  // Gift runtime state
  gifts: GiftEvent[];
  totalPoints: number;
  sendGift: (giftId: string, senderName: string) => void;
  clearGift: (id: string) => void;
}

const STORAGE_KEY = "toko_live_session_v2";

const DEFAULT_SESSION: LiveSession = {
  isLive: false,
  title: "Flash Sale — Penawaran Terbatas!",
  hostName: "Seller",
  sellerId: "",
  featuredProductIds: [],
};

function load(): LiveSession {
  try { return { ...DEFAULT_SESSION, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") }; }
  catch { return DEFAULT_SESSION; }
}

function save(s: LiveSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const LiveContext = createContext<LiveContextValue | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LiveSession>(load);
  const [gifts, setGifts]     = useState<GiftEvent[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const giftIdRef = useRef(0);

  const set = useCallback((updated: LiveSession) => {
    setSession(updated);
    save(updated);
  }, []);

  const startLive = useCallback((sellerId: string, sellerName: string) => {
    set({ ...session, isLive: true, sellerId, hostName: sellerName, startedAt: new Date().toISOString() });
    setGifts([]);
    setTotalPoints(0);
  }, [session, set]);

  const stopLive = useCallback(() => {
    set({ ...session, isLive: false });
  }, [session, set]);

  const updateSession = useCallback((patch: Partial<Omit<LiveSession, "isLive" | "startedAt">>) => {
    const updated = { ...session, ...patch };
    set(updated);
  }, [session, set]);

  const toggleProduct = useCallback((id: number) => {
    const ids = session.featuredProductIds.includes(id)
      ? session.featuredProductIds.filter((x) => x !== id)
      : [...session.featuredProductIds, id];
    set({ ...session, featuredProductIds: ids });
  }, [session, set]);

  const sendGift = useCallback((giftId: string, senderName: string) => {
    const gift = GIFT_TYPES.find((g) => g.id === giftId);
    if (!gift) return;
    const id = `gift-${++giftIdRef.current}`;
    const event: GiftEvent = {
      id, giftId, senderName,
      x: 20 + Math.random() * 60,
      sentAt: Date.now(),
    };
    setGifts((prev) => [...prev.slice(-12), event]);
    setTotalPoints((p) => p + gift.points);
    // Auto-remove after animation
    setTimeout(() => setGifts((prev) => prev.filter((g) => g.id !== id)), 3000);
  }, []);

  const clearGift = useCallback((id: string) => {
    setGifts((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return (
    <LiveContext.Provider value={{ session, startLive, stopLive, updateSession, toggleProduct, gifts, totalPoints, sendGift, clearGift }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be inside LiveProvider");
  return ctx;
}
