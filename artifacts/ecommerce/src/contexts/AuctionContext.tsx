/**
 * AuctionContext.tsx
 * Konteks untuk mengelola sistem Lelang (Auction).
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, User } from "./AuthContext";
import { useWallet } from "./WalletContext";

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
  endTime: string; // ISO String
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
  const { user } = useAuth();
  const { refund, spend } = useWallet(); // Wallet functions
  const [auctions, setAuctions] = useState<Auction[]>([]);

  // Load auctions
  useEffect(() => {
    const saved = localStorage.getItem("global_auctions");
    if (saved) {
      setAuctions(JSON.parse(saved));
    }
  }, []);

  // Save auctions
  useEffect(() => {
    localStorage.setItem("global_auctions", JSON.stringify(auctions));
  }, [auctions]);

  // Check for ended auctions periodically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const currentAuctions: Auction[] = JSON.parse(localStorage.getItem("global_auctions") || "[]");
      let globalChanged = false;

      const updatedGlobal = currentAuctions.map(a => {
        const isExpired = new Date(a.endTime).getTime() <= now;
        
        // Payout logic for unpaid ended auctions
        if (isExpired && !a.isPaid) {
          globalChanged = true;
          const winner = a.bids.length > 0 ? a.bids[0] : null;
          
          if (winner) {
            if (user && a.sellerId === user.id) {
               refund(winner.amount, `Hasil Lelang: ${a.title}`, winner.userId, winner.userName);
            } else {
               const balKey = `wallet_balance_${a.sellerId}`;
               const txKey = `wallet_tx_${a.sellerId}`;
               const userKey = "toko_users";
               
               const bal = Number(localStorage.getItem(balKey) || "0");
               const txs = JSON.parse(localStorage.getItem(txKey) || "[]");
               
               let finalAmt = winner.amount;
               let compensation = 0;
               const MAX_LIMIT = 999_999_999_999_999;
               const CONV_RATE = 1_000_000_000;

               if (bal + winner.amount > MAX_LIMIT) {
                 finalAmt = MAX_LIMIT - bal;
                 compensation = Math.floor((winner.amount - finalAmt) / CONV_RATE);
                 
                 const users = JSON.parse(localStorage.getItem(userKey) || "[]");
                 const updated = users.map((u: any) => u.id === a.sellerId ? { ...u, coins: (u.coins || 0) + compensation } : u);
                 localStorage.setItem(userKey, JSON.stringify(updated));
               }

               const newTx = {
                 id: Math.random().toString(36).substr(2, 9),
                 type: "refund",
                 amount: finalAmt,
                 description: compensation > 0 
                   ? `Hasil Lelang: ${a.title} (Limit! Kompensasi: ${compensation} Koin)` 
                   : `Hasil Lelang: ${a.title}`,
                 date: new Date().toISOString(),
                 senderId: winner.userId,
                 senderName: winner.userName,
                 recipientId: a.sellerId,
                 recipientName: a.sellerName
               };
               localStorage.setItem(balKey, (bal + finalAmt).toString());
               localStorage.setItem(txKey, JSON.stringify([newTx, ...txs]));
            }
          }

          return {
            ...a,
            status: "ended",
            winnerId: winner?.userId,
            winnerName: winner?.userName,
            isPaid: true
          };
        }
        return a;
      });

      if (globalChanged) {
        localStorage.setItem("global_auctions", JSON.stringify(updatedGlobal));
        setAuctions(updatedGlobal);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [user, refund]);

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

    // 1. Spend money for this bid
    const spent = spend(amount, `Bid Lelang: ${auction.title}`, "auction_bid");
    if (!spent) return { ok: false, error: "Saldo MyDompet tidak cukup" };

    // 2. Refund previous bidder
    const prevBid = auction.bids.length > 0 ? auction.bids[0] : null;
    if (prevBid) {
      if (prevBid.userId === user.id) {
        // Refund current user (outbidding self)
        refund(prevBid.amount, `Re-bid Lelang: ${auction.title}`, user.id, user.name);
      } else {
        // Refund OTHER user (cross-user refund)
        const targetBalanceKey = `wallet_balance_${prevBid.userId}`;
        const targetTxKey = `wallet_tx_${prevBid.userId}`;
        const targetBalance = Number(localStorage.getItem(targetBalanceKey) || "0");
        const targetTxs = JSON.parse(localStorage.getItem(targetTxKey) || "[]");
        
        const refundTx = {
          id: Math.random().toString(36).substr(2, 9),
          type: "refund",
          amount: prevBid.amount,
          description: `Refund Bid (Kalah): ${auction.title}`,
          date: new Date().toISOString(),
          senderId: auction.sellerId, // Simulated as from the system/seller
          recipientId: prevBid.userId,
          recipientName: prevBid.userName
        };
        
        localStorage.setItem(targetBalanceKey, (targetBalance + prevBid.amount).toString());
        localStorage.setItem(targetTxKey, JSON.stringify([refundTx, ...targetTxs]));
      }
    }

    const newBid: Bid = {
      userId: user.id,
      userName: user.name,
      amount,
      date: new Date().toISOString()
    };

    const updatedAuctions = [...auctions];
    updatedAuctions[auctionIdx] = {
      ...auction,
      currentPrice: amount,
      bids: [newBid, ...auction.bids]
    };

    setAuctions(updatedAuctions);
    return { ok: true };
  };

  const endAuction = (auctionId: string) => {
    const currentAuctions: Auction[] = JSON.parse(localStorage.getItem("global_auctions") || "[]");
    let globalChanged = false;

    const updated = currentAuctions.map(a => {
      if (a.id === auctionId && a.status === "active") {
        globalChanged = true;
        const winner = a.bids.length > 0 ? a.bids[0] : null;
        
        if (winner && !a.isPaid) {
          if (user && a.sellerId === user.id) {
             refund(winner.amount, `Hasil Lelang (Selesai): ${a.title}`, winner.userId, winner.userName);
          } else {
             const balKey = `wallet_balance_${a.sellerId}`;
             const txKey = `wallet_tx_${a.sellerId}`;
             const userKey = "toko_users";
             const bal = Number(localStorage.getItem(balKey) || "0");
             const txs = JSON.parse(localStorage.getItem(txKey) || "[]");
             
             let finalAmt = winner.amount;
             let compensation = 0;
             const MAX_LIMIT = 999_999_999_999_999;
             const CONV_RATE = 1_000_000_000;

             if (bal + winner.amount > MAX_LIMIT) {
               finalAmt = MAX_LIMIT - bal;
               compensation = Math.floor((winner.amount - finalAmt) / CONV_RATE);
               const users = JSON.parse(localStorage.getItem(userKey) || "[]");
               const updatedUsers = users.map((u: any) => u.id === a.sellerId ? { ...u, coins: (u.coins || 0) + compensation } : u);
               localStorage.setItem(userKey, JSON.stringify(updatedUsers));
             }

             const newTx = {
               id: Math.random().toString(36).substr(2, 9),
               type: "refund",
               amount: finalAmt,
               description: compensation > 0 
                 ? `Hasil Lelang (Selesai): ${a.title} (Limit! +${compensation} Koin)` 
                 : `Hasil Lelang (Selesai): ${a.title}`,
               date: new Date().toISOString(),
               senderId: winner.userId,
               senderName: winner.userName,
               recipientId: a.sellerId,
               recipientName: a.sellerName
             };
             localStorage.setItem(balKey, (bal + finalAmt).toString());
             localStorage.setItem(txKey, JSON.stringify([newTx, ...txs]));
          }
        }

        return {
          ...a,
          status: "ended" as const,
          isPaid: true,
          winnerId: winner?.userId,
          winnerName: winner?.userName,
          endTime: new Date().toISOString()
        };
      }
      return a;
    });

    if (globalChanged) {
      localStorage.setItem("global_auctions", JSON.stringify(updated));
      setAuctions(updated);
    }
  };

  const deleteAuction = (auctionId: string) => {
    setAuctions(prev => {
      const updated = prev.filter(a => a.id !== auctionId);
      localStorage.setItem("global_auctions", JSON.stringify(updated));
      return updated;
    });
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
