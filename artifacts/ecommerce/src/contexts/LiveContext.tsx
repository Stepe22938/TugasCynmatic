/**
 * LiveContext.tsx
 * Kelola sesi Live Shopping — disimpan di localStorage.
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface LiveSession {
  isLive: boolean;
  title: string;
  hostName: string;
  featuredProductIds: number[];
  startedAt?: string;
}

interface LiveContextValue {
  session: LiveSession;
  startLive: () => void;
  stopLive:  () => void;
  updateSession: (patch: Partial<Omit<LiveSession, "isLive" | "startedAt">>) => void;
  toggleProduct: (id: number) => void;
}

const STORAGE_KEY = "toko_live_session_v1";

const DEFAULT_SESSION: LiveSession = {
  isLive: false,
  title: "Flash Sale — Penawaran Terbatas!",
  hostName: "Admin Toko",
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

  const set = (updated: LiveSession) => { setSession(updated); save(updated); };

  const startLive = useCallback(() => set({ ...session, isLive: true, startedAt: new Date().toISOString() }), [session]);
  const stopLive  = useCallback(() => set({ ...session, isLive: false }), [session]);

  const updateSession = useCallback((patch: Partial<Omit<LiveSession, "isLive" | "startedAt">>) => {
    set({ ...session, ...patch });
  }, [session]);

  const toggleProduct = useCallback((id: number) => {
    const ids = session.featuredProductIds.includes(id)
      ? session.featuredProductIds.filter((x) => x !== id)
      : [...session.featuredProductIds, id];
    set({ ...session, featuredProductIds: ids });
  }, [session]);

  return (
    <LiveContext.Provider value={{ session, startLive, stopLive, updateSession, toggleProduct }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be inside LiveProvider");
  return ctx;
}
