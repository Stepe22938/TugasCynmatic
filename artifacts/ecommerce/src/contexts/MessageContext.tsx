import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "/api";

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  createdAt: string;
}

interface MessageContextType {
  messages: DirectMessage[];
  loadingMessages: boolean;
  sendMessage: (receiverId: string, text: string) => Promise<void>;
  sendMediaMessage: (receiverId: string, file: File, caption?: string) => Promise<void>;
  uploadProgress: number; // 0-100
  fetchChat: (otherUserId: string) => Promise<void>;
  getChat: (otherUserId: string) => DirectMessage[];
  getRecentChats: () => { userId: string; lastMessage: DirectMessage }[];
  activeChat: string | null;
  setActiveChat: (id: string | null) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeChatRef = useRef<string | null>(null);

  activeChatRef.current = activeChat;

  // ─── Fetch messages from API ─────────────────────────────────────────────
  const fetchChat = useCallback(async (otherUserId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/messages/${user.id}/${otherUserId}`);
      if (!res.ok) return;
      const data: DirectMessage[] = await res.json();
      setMessages(prev => {
        // Merge: keep messages from other chats, replace messages for this chat
        const others = prev.filter(m =>
          !(
            (m.senderId === user.id && m.receiverId === otherUserId) ||
            (m.senderId === otherUserId && m.receiverId === user.id)
          )
        );
        return [...others, ...data];
      });
    } catch (err) {
      console.error("[MessageContext] fetchChat error:", err);
    }
  }, [user]);

  // ─── Polling: refetch active chat every 2 seconds ────────────────────────
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (!user || !activeChat) return;

    // Immediate fetch when activeChat changes
    fetchChat(activeChat);

    pollingRef.current = setInterval(() => {
      if (activeChatRef.current) {
        fetchChat(activeChatRef.current);
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, activeChat, fetchChat]);

  // ─── Send text message ───────────────────────────────────────────────────
  const sendMessage = useCallback(async (receiverId: string, text: string) => {
    if (!user || !text.trim()) return;

    // Optimistic: add locally first
    const optimistic: DirectMessage = {
      id: `opt-${Date.now()}`,
      senderId: user.id,
      receiverId,
      text,
      mediaUrl: null,
      mediaType: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`${API_BASE}/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: user.id, receiverId, text }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("[MessageContext] sendMessage error:", err);
      }
      // Refresh from server
      await fetchChat(receiverId);
    } catch (err) {
      console.error("[MessageContext] sendMessage network error:", err);
    }
  }, [user, fetchChat]);

  // ─── Upload media + send message ─────────────────────────────────────────
  const sendMediaMessage = useCallback(async (receiverId: string, file: File, caption?: string) => {
    if (!user) return;
    setUploadProgress(0);

    try {
      // 1. Upload file via XHR (for progress tracking)
      const formData = new FormData();
      formData.append("media", file);

      const mediaData = await new Promise<{ mediaUrl: string; mediaType: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/messages/upload`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 90));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              reject(new Error(JSON.parse(xhr.responseText).error || "Upload gagal"));
            } catch {
              reject(new Error("Upload gagal"));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error saat upload"));
        xhr.send(formData);
      });

      setUploadProgress(95);

      // 2. Send message record with mediaUrl
      await fetch(`${API_BASE}/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId,
          text: caption || null,
          mediaUrl: mediaData.mediaUrl,
          mediaType: mediaData.mediaType,
        }),
      });

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);

      // Refresh
      await fetchChat(receiverId);
    } catch (err: any) {
      console.error("[MessageContext] sendMediaMessage error:", err);
      setUploadProgress(0);
      throw err;
    }
  }, [user, fetchChat]);

  // ─── Get chat slice ──────────────────────────────────────────────────────
  const getChat = useCallback((otherUserId: string): DirectMessage[] => {
    if (!user) return [];
    return messages
      .filter(m =>
        (m.senderId === user.id && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === user.id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [user, messages]);

  // ─── Get recent chats list ───────────────────────────────────────────────
  const getRecentChats = useCallback((): { userId: string; lastMessage: DirectMessage }[] => {
    if (!user) return [];
    const chatMap = new Map<string, DirectMessage>();
    const sorted = [...messages].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    sorted.forEach(m => {
      const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
      if (m.senderId === user.id || m.receiverId === user.id) {
        if (!chatMap.has(otherId)) chatMap.set(otherId, m);
      }
    });
    return Array.from(chatMap.entries()).map(([userId, lastMessage]) => ({ userId, lastMessage }));
  }, [user, messages]);

  return (
    <MessageContext.Provider value={{
      messages,
      loadingMessages,
      sendMessage,
      sendMediaMessage,
      uploadProgress,
      fetchChat,
      getChat,
      getRecentChats,
      activeChat,
      setActiveChat,
    }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessages must be used within MessageProvider");
  return ctx;
}
