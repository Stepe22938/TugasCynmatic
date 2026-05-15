/**
 * NotificationContext.tsx
 * Sistem notifikasi in-app per user — disimpan di localStorage.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type NotifType = 
  "order_placed" | "order_received" | "product_approved" | "product_rejected" | 
  "friend_request" | "friend_accept" | "gift_received" | "points_earned" | "promo" | "system" | "report_status";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  orderId?: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function storageKey(userId?: string) {
  return `toko_notifs_${userId ?? "guest"}`;
}

function load(userId?: string): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]");
  } catch {
    return [];
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => load(user?.id));

  useEffect(() => {
    setNotifications(load(user?.id));
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem(storageKey(user?.id), JSON.stringify(notifications));
  }, [notifications, user?.id]);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const notif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev].slice(0, 50));
  }, []);

  const markAllRead = useCallback(() =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))), []);

  const markRead = useCallback((id: string) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)), []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
}
