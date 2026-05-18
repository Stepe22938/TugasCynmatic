/**
 * AuctionContext.tsx
 * Global auction store — Fully synced to VPS MariaDB.
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";
import { fetchAllAuctionsFromVPS, syncAuctionToVPS } from "../lib/sync";

export interface Bid {
  userId: string;
  userName: string;
  amount: number;
  date: string;
}

export interface Auction {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  imageUrl: string;
  startPrice: number;
  currentPrice: number;
  minStep: number;
  endTime: string; 
  status: "active" | "ended";
  bids: Bid[];
  winnerId?: string;
  winnerName?: string;
  isPaid?: boolean;
}

interface AuctionContextType {
  auctions: Auction[];
  createAuction: (auction: Omit<Auction, "id" | "sellerId" | "sellerName" | "currentPrice" | "status" | "bids">) => void;
  placeBid: (auctionId: string, amount: number) => { ok: boolean; error?: string };
  endAuction: (auctionId: string) => void;
  deleteAuction: (auctionId: string) => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const { refund, spend } = useWallet();
  const [auctions, setAuctions] = useState<Auction[]>([]);

  // Initial Fetch from VPS
  useEffect(() => {
    const init = async () => {
      const vpsAuctions = await fetchAllAuctionsFromVPS();
      if (vpsAuctions) {
        setAuctions(vpsAuctions.map((a: any) => {
          let parsedBids = [];
          if (a.bids) {
            if (typeof a.bids === "string") {
              try {
                parsedBids = JSON.parse(a.bids);
              } catch (e) {
                parsedBids = [];
              }
            } else if (Array.isArray(a.bids)) {
              parsedBids = a.bids;
            }
          }
          return {
            ...a,
            startPrice: Number(a.startPrice),
            currentPrice: Number(a.currentPrice),
            minStep: Number(a.minStep),
            bids: parsedBids
          };
        }));
      }
    };
    init();
    
    // Polling every 10 seconds for real-time bids
    const interval = setInterval(init, 10000);
    return () => clearInterval(interval);
  }, []);

  const createAuction = (data: any) => {
    if (!user) return;
    const newAuction: Auction = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      sellerId: user.id,
      sellerName: user.name,
      currentPrice: data.startPrice,
      status: "active",
      bids: []
    };
    setAuctions(prev => [newAuction, ...prev]);
    syncAuctionToVPS(newAuction);
  };

  const placeBid = (auctionId: string, amount: number) => {
    if (!user) return { ok: false, error: "Harus login untuk bid" };
    
    const auctionIdx = auctions.findIndex(a => a.id === auctionId);
    if (auctionIdx === -1) return { ok: false, error: "Lelang tidak ditemukan" };
    
    const auction = auctions[auctionIdx];
    if (auction.status === "ended") return { ok: false, error: "Lelang sudah berakhir" };
    if (amount <= auction.currentPrice) return { ok: false, error: "Bid harus lebih tinggi dari harga sekarang" };
    if (amount < auction.currentPrice + auction.minStep) return { ok: false, error: `Minimal kenaikan adalah ${auction.minStep}` };
    if (user.id === auction.sellerId) return { ok: false, error: "Seller tidak bisa ngebid barang sendiri" };

    // 1. Spend money
    const spent = spend(amount, `Bid Lelang: ${auction.title}`, "auction_bid");
    if (!spent) return { ok: false, error: "Saldo MyDompet tidak cukup" };

    // 2. Refund previous bidder (handled locally for current user, VPS will handle others on next fetch)
    const prevBid = auction.bids.length > 0 ? auction.bids[0] : null;
    if (prevBid && prevBid.userId === user.id) {
       refund(prevBid.amount, `Re-bid Lelang: ${auction.title}`, user.id, user.name);
    }

    const newBid: Bid = {
      userId: user.id,
      userName: user.name,
      amount,
      date: new Date().toISOString()
    };

    const updatedAuction = {
      ...auction,
      currentPrice: amount,
      bids: [newBid, ...auction.bids]
    };

    setAuctions(prev => prev.map(a => a.id === auctionId ? updatedAuction : a));
    syncAuctionToVPS(updatedAuction);
    
    return { ok: true };
  };

  const endAuction = (auctionId: string) => {
    setAuctions(prev => prev.map(a => {
      if (a.id === auctionId && a.status === "active") {
        const winner = a.bids.length > 0 ? a.bids[0] : null;
        const updated = {
          ...a,
          status: "ended" as const,
          winnerId: winner?.userId,
          winnerName: winner?.userName,
          isPaid: true,
          endTime: new Date().toISOString()
        };
        
        // If current user is the winner, they are already debited. 
        // If current user is the seller, they should get the money.
        if (winner && user && a.sellerId === user.id) {
          refund(winner.amount, `Hasil Lelang: ${a.title}`, winner.userId, winner.userName);
        }

        syncAuctionToVPS(updated);
        return updated;
      }
      return a;
    }));
  };

  const deleteAuction = (auctionId: string) => {
    setAuctions(prev => prev.filter(a => a.id !== auctionId));
    // Usually we mark as deleted in DB, but for now we just remove from state
  };

  return (
    <AuctionContext.Provider value={{ auctions, createAuction, placeBid, endAuction, deleteAuction }}>
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const context = useContext(AuctionContext);
  if (!context) throw new Error("useAuction must be used within AuctionProvider");
  return context;
}
