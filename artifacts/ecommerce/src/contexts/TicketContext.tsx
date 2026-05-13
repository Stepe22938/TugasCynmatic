import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type TicketType = "rank_up" | "order_problem" | "other";
export type TicketStatus = "open" | "resolved" | "rejected";

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userSystemId?: number;
  type: TicketType;
  status: TicketStatus;
  description: string;
  orderId?: string;
  createdAt: string;
  messages: TicketMessage[];
}

interface TicketContextType {
  tickets: Ticket[];
  createTicket: (type: TicketType, description: string, orderId?: string) => void;
  updateTicket: (ticketId: string, status: TicketStatus) => void;
  addMessage: (ticketId: string, text: string) => void;
  getUserTickets: () => Ticket[];
}

const TICKETS_KEY = "toko_tickets";

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try { return JSON.parse(localStorage.getItem(TICKETS_KEY) ?? "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  }, [tickets]);

  const createTicket = (type: TicketType, description: string, orderId?: string) => {
    if (!user) return;
    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userSystemId: user.systemId,
      type,
      status: "open",
      description,
      orderId,
      createdAt: new Date().toISOString(),
      messages: []
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const updateTicket = (ticketId: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status } : t));
  };

  const addMessage = (ticketId: string, text: string) => {
    if (!user) return;
    const msg: TicketMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text,
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, messages: [...(t.messages || []), msg] } : t));
  };

  const getUserTickets = () => {
    if (!user) return [];
    if (user.role === "admin") return tickets;
    return tickets.filter(t => t.userId === user.id);
  };

  return (
    <TicketContext.Provider value={{ tickets, createTicket, updateTicket, addMessage, getUserTickets }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used within TicketProvider");
  return ctx;
}
