/**
 * CollaborationContext.tsx
 * Manages seller collaboration / partnership requests.
 * Types: reseller | dropship
 * Status: pending | accepted | rejected
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { fetchAllCollabsFromVPS, syncCollabToVPS } from "../lib/sync";

export type CollabType = "reseller" | "dropship";
export type CollabStatus = "pending" | "accepted" | "rejected";

export interface CollabRequest {
  id: string;
  fromSellerId: string;
  fromSellerName: string;
  toSellerId: string;
  toSellerName: string;
  type: CollabType;
  message: string;
  status: CollabStatus;
  createdAt: string;
  responseAt?: string;
  productId?: number;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  proposedPrice?: number;
  proposedQuantity?: number;
  commissionPercent?: number;
  feedbackMessage?: string;
}

interface CollaborationContextValue {
  requests: CollabRequest[];
  sendRequest: (
    to: { id: string; name: string },
    from: { id: string; name: string },
    type: CollabType,
    message: string,
    extra?: {
      productId?: number;
      productName?: string;
      productPrice?: number;
      productImage?: string;
      proposedPrice?: number;
      proposedQuantity?: number;
      commissionPercent?: number;
    }
  ) => void;
  acceptRequest: (id: string, feedback?: string) => void;
  rejectRequest: (id: string, feedback?: string) => void;
  getSentRequests: (sellerId: string) => CollabRequest[];
  getReceivedRequests: (sellerId: string) => CollabRequest[];
}

const STORAGE_KEY = "collab_requests_v2";

function loadLocalFallback(): CollabRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocalFallback(data: CollabRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const CollaborationContext = createContext<CollaborationContextValue | null>(null);

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<CollabRequest[]>(loadLocalFallback);

  // Sync with VPS MariaDB on mount & poll every 15 seconds
  useEffect(() => {
    const syncData = async () => {
      const vpsCollabs = await fetchAllCollabsFromVPS();
      if (vpsCollabs && Array.isArray(vpsCollabs)) {
        const parsed = vpsCollabs.map((c: any) => ({
          ...c,
          productId: c.productId ? Number(c.productId) : undefined,
          productPrice: c.productPrice ? Number(c.productPrice) : undefined,
          proposedPrice: c.proposedPrice ? Number(c.proposedPrice) : undefined,
          proposedQuantity: c.proposedQuantity ? Number(c.proposedQuantity) : undefined,
          commissionPercent: c.commissionPercent ? Number(c.commissionPercent) : undefined,
        }));
        setRequests(parsed);
        saveLocalFallback(parsed);
      }
    };
    
    syncData();
    const interval = setInterval(syncData, 15000);
    return () => clearInterval(interval);
  }, []);

  const sendRequest = useCallback((
    to: { id: string; name: string },
    from: { id: string; name: string },
    type: CollabType,
    message: string,
    extra?: {
      productId?: number;
      productName?: string;
      productPrice?: number;
      productImage?: string;
      proposedPrice?: number;
      proposedQuantity?: number;
      commissionPercent?: number;
    }
  ) => {
    const req: CollabRequest = {
      id: `collab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fromSellerId: from.id,
      fromSellerName: from.name,
      toSellerId: to.id,
      toSellerName: to.name,
      type,
      message,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...extra
    };
    
    setRequests((prev) => {
      const next = [...prev, req];
      saveLocalFallback(next);
      return next;
    });
    
    syncCollabToVPS(req);
  }, []);

  const acceptRequest = useCallback((id: string, feedback?: string) => {
    setRequests((prev) => {
      const next = prev.map((r: CollabRequest) => {
        if (r.id === id) {
          const updated = {
            ...r,
            status: "accepted" as CollabStatus,
            feedbackMessage: feedback,
            responseAt: new Date().toISOString()
          };
          syncCollabToVPS(updated);
          return updated;
        }
        return r;
      });
      saveLocalFallback(next);
      return next;
    });
  }, []);

  const rejectRequest = useCallback((id: string, feedback?: string) => {
    setRequests((prev) => {
      const next = prev.map((r: CollabRequest) => {
        if (r.id === id) {
          const updated = {
            ...r,
            status: "rejected" as CollabStatus,
            feedbackMessage: feedback,
            responseAt: new Date().toISOString()
          };
          syncCollabToVPS(updated);
          return updated;
        }
        return r;
      });
      saveLocalFallback(next);
      return next;
    });
  }, []);

  const getSentRequests = useCallback((sellerId: string) =>
    requests.filter(r => r.fromSellerId === sellerId), [requests]);

  const getReceivedRequests = useCallback((sellerId: string) =>
    requests.filter(r => r.toSellerId === sellerId), [requests]);

  const value: CollaborationContextValue = useMemo(() => ({
    requests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    getSentRequests,
    getReceivedRequests,
  }), [requests, sendRequest, acceptRequest, rejectRequest, getSentRequests, getReceivedRequests]);

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const ctx = useContext(CollaborationContext);
  if (!ctx) throw new Error("useCollaboration must be used inside CollaborationProvider");
  return ctx;
}
