import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

interface MessageContextType {
  messages: DirectMessage[];
  sendMessage: (receiverId: string, text: string) => void;
  getChat: (otherUserId: string) => DirectMessage[];
  getRecentChats: () => { userId: string; lastMessage: DirectMessage }[];
}

const MESSAGES_KEY = "cynmatic_direct_messages";

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem(MESSAGES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = (receiverId: string, text: string) => {
    if (!user) return;
    const newMessage: DirectMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      senderId: user.id,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const getChat = (otherUserId: string) => {
    if (!user) return [];
    return messages.filter(m => 
      (m.senderId === user.id && m.receiverId === otherUserId) ||
      (m.senderId === otherUserId && m.receiverId === user.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getRecentChats = () => {
    if (!user) return [];
    const chatMap = new Map<string, DirectMessage>();
    
    // Sort descending to get newest first
    const sorted = [...messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    sorted.forEach(m => {
      const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
      if (m.senderId === user.id || m.receiverId === user.id) {
        if (!chatMap.has(otherId)) {
          chatMap.set(otherId, m);
        }
      }
    });

    return Array.from(chatMap.entries()).map(([userId, lastMessage]) => ({
      userId,
      lastMessage
    }));
  };

  return (
    <MessageContext.Provider value={{ messages, sendMessage, getChat, getRecentChats }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessages must be used within MessageProvider");
  return ctx;
}
