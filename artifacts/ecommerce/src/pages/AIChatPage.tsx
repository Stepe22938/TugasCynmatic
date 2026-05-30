/**
 * AIChatPage.tsx
 * Halaman Chat AI dengan desain ala ChatGPT.
 * Menggunakan OpenRouter untuk backend komunikasi.
 */
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  Plus, MessageSquare, Trash2, Send, Bot, User, 
  ChevronLeft, Loader2, Sparkles, Sidebar as SidebarIcon,
  Menu, X, TrendingUp, Gamepad2, ChevronRight, BarChart3
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useMyCrypto } from "../contexts/MyCryptoContext";
import { useMyAI } from "../contexts/MyAIContext";
import { CryptoBadge } from "../components/CryptoBadge";
import { useAISettings } from "../contexts/AISettingsContext";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

interface PremiumCardProps {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
}

function PremiumCard({ href, title, subtitle, icon: Icon, color }: PremiumCardProps) {
  const [, setLocation] = useLocation();
  return (
    <div 
      onClick={() => setLocation(href)}
      className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${color} text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group border border-white/5 shadow-[0_4px_25px_rgba(0,0,0,0.4)] hover:border-white/10`}
    >
      {/* Light Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="absolute -right-2 -bottom-2 opacity-15 group-hover:opacity-25 group-hover:scale-105 transition-all duration-500">
        <Icon className="w-20 h-20" />
      </div>
      
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[80px]">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-3 backdrop-blur-md border border-white/10 group-hover:bg-white/10 transition-colors">
          <Icon className="w-4.5 h-4.5 text-white/90" />
        </div>
        <div>
          <h4 className="font-bold text-xs tracking-tight group-hover:text-white transition-colors">{title}</h4>
          <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id: string;
  imageUrl?: string;
  modelName?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface ChatModel {
  id: string;
  name: string;
  modelId: string;
  description?: string | null;
  color?: string;
  isEnabled?: boolean;
  isReleased?: boolean;
  accessLevel?: "free" | "pro" | "dev";
}

function DownloadImageButton({ imageUrl }: { imageUrl: string }) {
  const handleDownload = async () => {
    const link = document.createElement("a");
    link.download = `tokoarthur-ai-${Date.now()}.png`;
    if (imageUrl.startsWith("data:")) {
      link.href = imageUrl;
    } else {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      link.href = URL.createObjectURL(blob);
    }
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (!imageUrl.startsWith("data:")) URL.revokeObjectURL(link.href);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition hover:border-white/25 hover:bg-white/[0.08]"
    >
      Download Gambar
    </button>
  );
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

const trimForLocalCache = (value: string, max = 5000) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const sanitizeSessionsForLocalCache = (items: ChatSession[], maxSessions = 25, maxMessages = 18) =>
  items.slice(0, maxSessions).map((session) => {
    const systemMessages = session.messages.filter((message) => message.role === "system").slice(0, 1);
    const visibleMessages = session.messages.filter((message) => message.role !== "system").slice(-maxMessages);
    return {
      ...session,
      title: trimForLocalCache(session.title, 120),
      messages: [...systemMessages, ...visibleMessages].map((message) => ({
        ...message,
        content: trimForLocalCache(message.content),
        imageUrl: message.imageUrl?.startsWith("data:") ? undefined : message.imageUrl,
      })),
    };
  });

const saveSessionsToLocalCache = (items: ChatSession[], userId?: string) => {
  const key = userId ? `ai_chat_sessions_${userId}` : "ai_chat_sessions";
  try {
    localStorage.setItem(key, JSON.stringify(sanitizeSessionsForLocalCache(items)));
  } catch {
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(sanitizeSessionsForLocalCache(items, 8, 8)));
    } catch {
      localStorage.removeItem(key);
    }
  }
};

const loadSessionsFromLocalCache = (userId?: string): ChatSession[] => {
  const key = userId ? `ai_chat_sessions_${userId}` : "ai_chat_sessions";
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export function AIChatPage() {
  const { user } = useAuth();
  const { isCryptoMember } = useMyCrypto();
  const { isAISubscriber } = useMyAI();
  const { isAIEnabled, aiProvider, openrouterKey, openrouterModel, obscuraKey, obscuraModel } = useAISettings();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Start with empty sessions — will be loaded from user-scoped cache after user is known
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatModels, setChatModels] = useState<ChatModel[]>([]);
  const [loadingChatModels, setLoadingChatModels] = useState(true);
  const [selectedChatModelId, setSelectedChatModelId] = useState("");
  const [sessionsHydrated, setSessionsHydrated] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── CYBER SLASH COMMANDS AUTOCONFIG ──────────────────────────────────────
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ cmd: string; desc: string; template: string }[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  useEffect(() => {
    if (input.startsWith("/")) {
      const typed = input.toLowerCase();
      const allCmds = [
        { cmd: "/help", desc: "Tampilkan panduan perintah siber TokoArthur.", template: "/help" },
        { cmd: "/profile", desc: "Tampilkan resume detail profil akun Anda.", template: "/profile" },
        { cmd: "/wallet", desc: "Tampilkan informasi saldo wallet & transaksi.", template: "/wallet" },
        { cmd: "/koin", desc: "Tampilkan koin toko & status keanggotaan Sultan VIP.", template: "/koin" },
        { cmd: "/crypto", desc: "Tampilkan detail portofolio aset crypto (BTC/ETH/USDT).", template: "/crypto" },
        { cmd: "/orders", desc: "Tampilkan 3 transaksi pembelian terakhir Anda.", template: "/orders" },
      ];

      if (user?.role === "admin") {
        allCmds.push(
          { cmd: "/admin", desc: "Ajarkan AI fakta baru (Format: /admin [key] = [val])", template: "/admin " },
          { cmd: "/learn", desc: "Ajarkan AI fakta baru (Format: /learn [key] = [val])", template: "/learn " },
          { cmd: "/giftkoin", desc: "Kirim koin gratis (Format: /giftkoin [user] [koin])", template: "/giftkoin " },
          { cmd: "/giftsaldo", desc: "Kirim saldo gratis (Format: /giftsaldo [user] [saldo])", template: "/giftsaldo " },
          { cmd: "/ban", desc: "Blokir akses pengguna (Format: /ban [user] [alasan])", template: "/ban " },
          { cmd: "/unban", desc: "Pulihkan akses pengguna (Format: /unban [user])", template: "/unban " },
          { cmd: "/clearmemory", desc: "Reset semua memori fakta pembelajaran AI.", template: "/clearmemory" }
        );
      }

      const filtered = allCmds.filter(c => c.cmd.startsWith(typed.split(" ")[0]));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [input, user?.role]);


  const openAIUsage = () => {
    window.dispatchEvent(new CustomEvent("tokoarthur:open-ai-usage"));
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId, loading]);

  // Load sessions when user ID changes — ensures each user has their own isolated session history
  useEffect(() => {
    if (!user?.id) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }
    // First: load from user-scoped localStorage cache immediately for fast UI
    const cached = loadSessionsFromLocalCache(user.id);
    if (cached.length > 0) {
      setSessions(cached);
      setActiveSessionId(cached[0]?.id || null);
    } else {
      setSessions([]);
      setActiveSessionId(null);
    }
    // Then: hydrate from server (authoritative source)
    setSessionsHydrated(false);
    fetch(`/api/ai/chat-sessions?userId=${encodeURIComponent(user.id)}`)
      .then(res => res.ok ? res.json() : [])
      .then((serverSessions: ChatSession[]) => {
        if (Array.isArray(serverSessions) && serverSessions.length > 0) {
          setSessions(serverSessions);
          setActiveSessionId(prev => prev && serverSessions.some(s => s.id === prev) ? prev : serverSessions[0]?.id || null);
        }
      })
      .catch(() => {})
      .finally(() => setSessionsHydrated(true));
  }, [user?.id]);

  // Persist sessions to user-scoped localStorage and server
  useEffect(() => {
    saveSessionsToLocalCache(sessions, user?.id);
    if (!user?.id || !sessionsHydrated || sessions.length === 0) return;
    const timeout = window.setTimeout(() => {
      sessions.forEach(session => {
        fetch("/api/ai/chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, session }),
        }).catch(() => {});
      });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [sessions, user?.id, sessionsHydrated]);

  useEffect(() => {
    setLoadingChatModels(true);
    fetch("/api/ai/companion-models")
      .then(res => res.ok ? res.json() : [])
      .then((models: ChatModel[]) => {
        const released = (Array.isArray(models) ? models : [])
          .filter(model => model.isEnabled && model.isReleased)
          .filter(model => {
            if (user?.role === "admin") return true;
            if (model.accessLevel === "dev") return false;
            if (model.accessLevel === "pro") return isAISubscriber;
            return true;
          });
        setChatModels(released);
        setSelectedChatModelId(prev => released.some(model => model.modelId === prev) ? prev : released[0]?.modelId || "");
      })
      .catch(() => setChatModels([]))
      .finally(() => setLoadingChatModels(false));
  }, [user?.role, isAISubscriber]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const selectedChatModel = chatModels.find(model => model.modelId === selectedChatModelId);
  const selectedAgentName = selectedChatModel?.name || (user?.role === "admin" ? (aiProvider === "obscura" ? obscuraModel : openrouterModel) : "Pilih Agent");
  const selectedAgentAccessLabel = selectedChatModel?.accessLevel === "dev"
    ? "Dev/Admin"
    : selectedChatModel?.accessLevel === "pro"
      ? "AI Pro"
      : selectedChatModel
        ? "Global"
        : "Default";
  const selectedAgentAccessClass = selectedChatModel?.accessLevel === "dev"
    ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
    : selectedChatModel?.accessLevel === "pro"
      ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
      : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  const getDisplayModelName = (message?: Message) => {
    const modelName = message?.modelName || selectedAgentName || selectedChatModelId;
    return modelName && modelName !== "Pilih Agent" ? modelName : "AI";
  };
  const formatAssistantName = (message?: Message) =>
    `TokoArthur - ${getDisplayModelName(message)}`;

  useEffect(() => {
    const fallbackModel = getDisplayModelName();
    if (!activeSessionId || fallbackModel === "AI") return;
    setSessions(prev => prev.map(session => {
      if (session.id !== activeSessionId) return session;
      let changed = false;
      const messages = session.messages.map(message => {
        if (message.role !== "assistant" || message.modelName) return message;
        changed = true;
        return { ...message, modelName: fallbackModel };
      });
      return changed ? { ...session, messages } : session;
    }));
  }, [activeSessionId, selectedAgentName, selectedChatModelId]);

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "Chat Baru",
      messages: [],
      createdAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    if (activeSessionId === id) setActiveSessionId(null);
    if (user?.id) {
      fetch(`/api/ai/chat-sessions/${encodeURIComponent(id)}?userId=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !isAIEnabled) return;
    if (!selectedChatModelId && user?.role !== "admin") {
      toast({
        title: "Pilih model AI dulu",
        description: isAISubscriber ? "Belum ada model AI Chat yang dirilis." : "Belum ada model gratis. Subscribe AI Pro atau minta admin rilis model Global Gratis.",
        variant: "destructive"
      });
      return;
    }

    let currentSession = activeSession;
    if (!currentSession) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
        messages: [], // Backend builds system prompt dynamically
        createdAt: Date.now()
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      currentSession = newSession;
    }

    const userMsg: Message = { role: "user", content: input.trim(), id: Date.now().toString() };
    const updatedMessages = [...currentSession.messages, userMsg];
    const replyModelName = selectedChatModel?.name || selectedAgentName || selectedChatModelId || "AI";
    
    // Update local state first for instant feedback (Fixed: correctly check if messages filter system is 0 to update title on first user msg)
    setSessions(prev => prev.map(s => 
      s.id === currentSession?.id ? { ...s, messages: updatedMessages, title: s.messages.filter(m => m.role !== "system").length === 0 ? userMsg.content.slice(0, 30) + (userMsg.content.length > 30 ? "..." : "") : s.title } : s
    ));
    
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          apiKey: openrouterKey,
          obscuraKey,
          aiProvider,
          model: selectedChatModelId || (user?.role === "admin" ? (aiProvider === "obscura" ? obscuraModel : openrouterModel) : ""),
          userId: user?.id
        })
      });

      const aiMsgRaw = await readJsonResponse(res);

      if (!res.ok) {
        const err = aiMsgRaw;
        throw new Error(err.error || "Gagal menghubungi AI");
      }

      const aiMsg: Message = {
        role: "assistant",
        content: aiMsgRaw.content || "",
        imageUrl: aiMsgRaw.imageUrl,
        modelName: replyModelName,
        id: (Date.now() + 1).toString()
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSession?.id ? { ...s, messages: [...s.messages, aiMsg] } : s
      ));
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (loading || !isAIEnabled) return;
    if (!selectedChatModelId && user?.role !== "admin") {
      toast({
        title: "Pilih model AI dulu",
        description: isAISubscriber ? "Belum ada model AI Chat yang dirilis." : "Belum ada model gratis. Subscribe AI Pro atau minta admin rilis model Global Gratis.",
        variant: "destructive"
      });
      return;
    }

    let currentSession = activeSession;
    if (!currentSession) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: promptText.slice(0, 30) + (promptText.length > 30 ? "..." : ""),
        messages: [],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSession = newSession;
    }

    const userMsg: Message = { role: "user", content: promptText, id: Date.now().toString() };
    const updatedMessages = [...currentSession.messages, userMsg];
    const replyModelName = selectedChatModel?.name || selectedAgentName || selectedChatModelId || "AI";
    
    // (Fixed: correctly check if messages filter system is 0 to update title on first user msg)
    setSessions(prev => prev.map(s => 
      s.id === currentSession?.id ? { ...s, messages: updatedMessages, title: s.messages.filter(m => m.role !== "system").length === 0 ? userMsg.content.slice(0, 30) + (userMsg.content.length > 30 ? "..." : "") : s.title } : s
    ));
    
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          apiKey: openrouterKey,
          obscuraKey,
          aiProvider,
          model: selectedChatModelId || (user?.role === "admin" ? (aiProvider === "obscura" ? obscuraModel : openrouterModel) : ""),
          userId: user?.id
        })
      });

      const aiMsgRaw = await readJsonResponse(res);

      if (!res.ok) {
        const err = aiMsgRaw;
        throw new Error(err.error || "Gagal menghubungi AI");
      }

      const aiMsg: Message = {
        role: "assistant",
        content: aiMsgRaw.content || "",
        imageUrl: aiMsgRaw.imageUrl,
        modelName: replyModelName,
        id: (Date.now() + 1).toString()
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSession?.id ? { ...s, messages: [...s.messages, aiMsg] } : s
      ));
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (!loadingChatModels && !isAISubscriber && user.role !== "admin" && chatModels.length === 0) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-[2rem] border border-white/8 bg-white/[0.03] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
            <Sparkles className="h-8 w-8 text-violet-200" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">AI Pro belum aktif</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-white/40">
            Subscribe dulu pakai saldo MyWallet buat membuka AI Chat dan AI Companion.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => setLocation("/ai-subscribe")} className="rounded-xl bg-violet-500 hover:bg-violet-400">
              Subscribe AI Pro
            </Button>
            <Button variant="outline" onClick={() => setLocation("/mydompet")} className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cek MyWallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conditions to show the gorgeous Welcome screen:
  // 1. No active session is selected
  // 2. Active session has no user/assistant messages (new chat)
  const isNewChat = !activeSessionId || !activeSession || activeSession.messages.filter(m => m.role !== "system").length === 0;

  return (
    <div className="flex h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] bg-background overflow-hidden text-foreground">
      {/* Sidebar - Desktop */}
      <aside className={`
        ${sidebarOpen ? "w-66" : "w-0"} 
        transition-all duration-300 bg-zinc-950 border-r border-white/5 flex flex-col h-full overflow-hidden
        hidden md:flex backdrop-blur-xl z-20
      `}>
        <div className="p-4 border-b border-white/5 space-y-2">
          <Button 
            onClick={startNewChat}
            variant="outline" 
            className="w-full justify-start gap-2 border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/[0.05] hover:border-white/20 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 text-white/60" /> Chat Baru
          </Button>
          
          {isCryptoMember && (
            <Button 
              onClick={() => {
                const newSession: ChatSession = {
                  id: `crypto-${Date.now()}`,
                  title: "Analisis Crypto",
                  messages: [
                    { 
                      role: "system", 
                      content: `Kamu adalah asisten AI khusus Crypto (MYCRYPTO) untuk platform TokoArthur. 
                      Karakteristik: Pro, Analitis, Objektif.
                      Tugas Utama: 
                      1. Memberikan analisis teknikal (RSI, MACD, Support/Resistance) berdasarkan data pasar terbaru (simulasi).
                      2. Memberikan analisis fundamental koin tertentu.
                      3. Memberikan analisis sentimen pasar (Bullish/Bearish).
                      4. Memberikan rekomendasi trading yang memiliki risk-reward ratio yang baik.
                      Format Jawaban: Gunakan Markdown yang rapi dengan heading, list, dan tabel jika perlu. Jawab dalam Bahasa Indonesia.`, 
                      id: "sys-crypto" 
                    }
                  ],
                  createdAt: Date.now()
                };
                setSessions([newSession, ...sessions]);
                setActiveSessionId(newSession.id);
              }}
              variant="outline" 
              className="w-full justify-start gap-2 border-blue-500/10 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl transition-all duration-300 mt-2"
            >
              <TrendingUp className="h-4 w-4 text-blue-400/80" /> Crypto Analysis
            </Button>
          )}

          <Button
            onClick={() => setLocation("/ai-companion")}
            variant="outline"
            className="w-full justify-start gap-2 border-violet-500/15 bg-violet-500/5 text-violet-300 hover:bg-violet-500/10 hover:border-violet-400/35 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl transition-all duration-300 mt-2"
          >
            <Sparkles className="h-4 w-4 text-violet-300/90" /> AI Companion
          </Button>

          <Button
            onClick={() => setLocation("/characters")}
            variant="outline"
            className="w-full justify-start gap-2 border-fuchsia-500/15 bg-fuchsia-500/5 text-fuchsia-300 hover:bg-fuchsia-500/10 hover:border-fuchsia-400/35 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl transition-all duration-300 mt-2"
          >
            <Bot className="h-4 w-4 text-fuchsia-300/90" /> Character AI
          </Button>

          <Button
            onClick={openAIUsage}
            variant="outline"
            className="w-full justify-start gap-2 border-cyan-500/15 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/35 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl transition-all duration-300 mt-2"
          >
            <BarChart3 className="h-4 w-4 text-cyan-300/90" /> AI Usage
          </Button>

          <Button
            onClick={() => setLocation("/ai-subscribe")}
            variant="outline"
            className={`w-full justify-start gap-2 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl transition-all duration-300 mt-2 ${
              isAISubscriber
                ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400/35"
                : "border-amber-500/15 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/35"
            }`}
          >
            <Bot className="h-4 w-4" /> {isAISubscriber ? "AI Pro Aktif" : "Subscribe AI Pro"}
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 && (
            <p className="text-[9px] font-semibold uppercase tracking-widest text-center text-white/20 mt-8 italic">Empty Chat Vault</p>
          )}
          {sessions.map(s => (
            <div 
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`
                group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer text-xs transition-all duration-300 border
                ${activeSessionId === s.id 
                  ? "bg-white/[0.04] text-white font-bold border-white/10 shadow-md" 
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]"}
              `}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-white/40" />
                <span className="truncate">{s.title}</span>
              </div>
              <button 
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 bg-secondary/5">
          <Button variant="ghost" className="w-full justify-start gap-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => setLocation("/profile")}>
            <ChevronLeft className="h-4 w-4" /> Back to Profile
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10 bg-zinc-950">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex text-white/70 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <SidebarIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-md">
                <Bot className="h-5 w-5 text-white/80" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                  <span className="max-w-[320px] truncate">TokoArthur</span>
                  <span className="text-[9px] font-medium bg-white/10 text-white/80 px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/5">Beta</span>
                </h2>
                <p className="text-[8px] font-semibold text-violet-200/80 uppercase tracking-widest mt-0.5">
                  Model: {getDisplayModelName()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/ai-companion")}
              className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-violet-200 bg-violet-500/10 border border-violet-400/20 px-3 py-1.5 rounded-xl shadow-lg hover:bg-violet-500/15 hover:border-violet-300/35 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Battle Arena
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 text-white/70 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg">
              <Bot className="h-3.5 w-3.5 text-white/45" />
              <span className="max-w-[160px] truncate">{selectedAgentName}</span>
            </div>
          </div>
        </header>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 md:px-0 py-6 scroll-smooth animate-in fade-in duration-300"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            {isNewChat ? (
              <div className="flex flex-col items-center justify-start py-4 text-center space-y-5 w-full max-w-lg mx-auto">
                <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  <Bot className="h-6 w-6 text-white/80" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent tracking-tight">
                    Bagaimana saya bisa membantu Anda hari ini?
                  </h3>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">
                    Asisten cerdas untuk belanja, informasi koin, dan transaksi Anda
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 w-full mt-2">
                  {[
                    "Cara dapat koin gratis?",
                    "Cek status pengiriman",
                    "Cara jadi seller?",
                    "Bantu tulis deskripsi produk"
                  ].map(q => (
                    <button 
                      key={q}
                      onClick={() => handleQuickPrompt(q)}
                      className="p-3.5 text-xs text-left bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] rounded-xl transition-all duration-300 font-semibold text-white/70 hover:text-white flex items-center justify-between group shadow-md"
                    >
                      <span>{q}</span>
                      <ChevronRight className="w-4 h-4 text-white/35 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                    <PremiumCard 
                      href="/game-topup" 
                      title="Top Up Game" 
                      subtitle="MLBB, FF, PUBG..." 
                      icon={Gamepad2} 
                      color="from-emerald-500/10 to-teal-700/10 border-emerald-500/10 hover:border-emerald-500/30" 
                    />
                    <PremiumCard 
                      href="/mycrypto" 
                      title="MyCrypto Vault" 
                      subtitle="AI Crypto & Signals" 
                      icon={TrendingUp} 
                      color="from-blue-600/10 to-indigo-900/10 border-blue-500/10 hover:border-blue-500/30" 
                    />
                    <PremiumCard 
                      href="/ai-companion" 
                      title="AI Companion" 
                      subtitle="Multi-Model Battle" 
                      icon={Sparkles} 
                      color="from-violet-600/10 to-purple-900/10 border-violet-500/10 hover:border-violet-500/30" 
                    />
                    <PremiumCard
                      href="/characters"
                      title="Character AI"
                      subtitle="Persona Chat"
                      icon={Bot}
                      color="from-fuchsia-600/10 to-rose-900/10 border-fuchsia-500/10 hover:border-fuchsia-500/30"
                    />
                </div>
              </div>
            ) : (
              activeSession?.messages.filter(m => m.role !== "system").map((msg, idx) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-4 group animate-in slide-in-from-bottom-2 duration-300 ${
                    msg.role === "assistant" 
                      ? "bg-white/[0.01] border border-white/5 -mx-6 px-8 py-8 rounded-[2rem] shadow-xl backdrop-blur-sm" 
                      : "justify-end"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0 text-white/80 shadow-md">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                  )}

                  <div className={`flex-1 space-y-2 overflow-hidden ${msg.role === "user" ? "max-w-[80%] flex-initial bg-amber-500/[0.03] border border-amber-500/15 rounded-2xl p-5 shadow-lg" : ""}`}>
                    <div className="flex items-center gap-2">
                      <p className={`text-[9px] font-bold uppercase tracking-widest opacity-50 ${msg.role === "assistant" ? "text-white/60" : "text-white/40"}`}>
                        {msg.role === "assistant" ? formatAssistantName(msg) : "Anda"}
                      </p>
                      {msg.role === "assistant" && (
                        <span className="rounded-lg border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-violet-100">
                          {getDisplayModelName(msg)}
                        </span>
                      )}
                      {msg.role === "user" && isCryptoMember && <CryptoBadge className="scale-75 origin-left" />}
                    </div>
                    {msg.imageUrl ? (
                      <div className="space-y-3">
                        <img
                          src={msg.imageUrl}
                          alt="Hasil gambar TokoArthur AI"
                          className="max-h-[520px] w-full max-w-2xl rounded-2xl border border-white/10 bg-black/30 object-contain shadow-2xl"
                        />
                        {msg.content && (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-white/70">
                            {msg.content}
                          </div>
                        )}
                        <DownloadImageButton imageUrl={msg.imageUrl} />
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.role === 'user' ? 'text-white/90' : 'text-white/80'}">
                        {msg.content}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center flex-shrink-0 text-white/40 shadow-sm">
                      <User className="h-4.5 w-4.5" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex gap-4 bg-white/[0.02] border border-white/5 -mx-6 px-8 py-8 rounded-[2rem] shadow-xl backdrop-blur-sm animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0 text-white/80">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                    TokoArthur ({selectedAgentName || "AI"})
                  </p>
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 bg-zinc-950">
          <div className="max-w-3xl mx-auto relative bg-white/[0.02] border border-white/10 rounded-2xl focus-within:border-white/30 focus-within:shadow-[0_4px_30px_rgba(255,255,255,0.03)] transition-all duration-300 p-2 pr-14">
            <div className="mb-1 flex flex-wrap items-center gap-2 border-b border-white/5 px-2 pb-2 sm:flex-nowrap">
              <div className="flex flex-shrink-0 items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-violet-200">
                <Sparkles className="h-3.5 w-3.5" />
                Switch Agent
              </div>
              <select
                value={selectedChatModelId}
                onChange={(event) => setSelectedChatModelId(event.target.value)}
                disabled={loadingChatModels}
                className="min-w-[180px] flex-1 rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 text-[11px] font-bold text-white/85 shadow-inner outline-none transition-all focus:border-violet-300/40 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-wait disabled:opacity-50"
              >
                {user.role === "admin" && <option value="">{openrouterModel || obscuraModel || "Default AI"}</option>}
                {loadingChatModels && <option value="">Loading agent...</option>}
                {!loadingChatModels && user.role !== "admin" && chatModels.length === 0 && <option value="">Belum ada model rilis</option>}
                {chatModels.map(model => (
                  <option key={model.id} value={model.modelId}>
                    {model.accessLevel === "dev" ? "[DEV] " : model.accessLevel === "pro" ? "[AI PRO] " : "[GLOBAL] "}{model.name}
                  </option>
                ))}
              </select>
              <span className="flex-shrink-0 rounded-lg border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${selectedAgentAccessClass}">
                {selectedAgentAccessLabel}
              </span>
              {!isAISubscriber && user.role !== "admin" && (
                <button
                  type="button"
                  onClick={() => setLocation("/ai-subscribe")}
                  className="flex-shrink-0 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-amber-200 transition hover:bg-amber-500/15"
                >
                  Unlock Pro
                </button>
              )}
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 bottom-[calc(100%+0.75rem)] w-full max-w-xl bg-zinc-950/95 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> TokoArthur Cyber Command
                  </span>
                  <span className="text-[8px] font-bold text-white/30 uppercase">
                    Use <kbd className="bg-white/10 px-1 rounded text-white/60">Tab</kbd> / <kbd className="bg-white/10 px-1 rounded text-white/60">↑\d</kbd> / Click
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
                  {suggestions.map((item, idx) => (
                    <div
                      key={item.cmd}
                      onClick={() => {
                        setInput(item.template);
                        setShowSuggestions(false);
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                      className="px-5 py-3.5 cursor-pointer transition-all duration-150 flex items-center justify-between text-xs ${idx === selectedSuggestionIndex ? 'bg-white/[0.04] text-white font-bold' : 'text-white/60 hover:text-white hover:bg-white/[0.01]'}"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs ${idx === selectedSuggestionIndex ? 'text-[#D4AF37]' : 'text-violet-300'}">
                          {item.cmd}
                        </span>
                        <span className="text-white/40 text-[10px] truncate max-w-[280px]">
                          {item.desc}
                        </span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                        {item.cmd.startsWith("/admin") || item.cmd.startsWith("/learn") || item.cmd.startsWith("/gift") || item.cmd.startsWith("/ban") || item.cmd.startsWith("/unban") || item.cmd.startsWith("/clear") ? "ADMIN" : "USER"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (showSuggestions && suggestions.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                  } else if (e.key === "Tab" || e.key === "Enter") {
                    e.preventDefault();
                    setInput(suggestions[selectedSuggestionIndex].template);
                    setShowSuggestions(false);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setShowSuggestions(false);
                  }
                } else {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }
              }}
              placeholder="Kirim pesan ke ${selectedAgentName || 'AI'}..."
              className="w-full bg-transparent border-0 px-4 py-3 text-sm focus:outline-none focus:ring-0 placeholder:text-white/20 resize-none min-h-[48px] max-h-48 text-white"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !isAIEnabled}
              className="absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${input.trim() && !loading && isAIEnabled ? 'bg-white text-black scale-100 shadow-white/10 cursor-pointer hover:bg-neutral-200' : 'bg-white/5 text-white/20 scale-95 opacity-50 cursor-not-allowed'}"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
            
            {!isAIEnabled && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center rounded-2xl border border-dashed border-red-500/10">
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest bg-red-500/5 border border-red-500/10 px-4 py-2 rounded-xl">
                  AI Service Offline
                </p>
              </div>
            )}
          </div>
          <p className="text-[9px] font-semibold text-center text-white/20 mt-3 uppercase tracking-wider">
            TokoArthur model {getDisplayModelName()} dapat membuat kesalahan. Harap validasi informasi penting.
          </p>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Mobile Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-zinc-950 z-40 transform transition-transform duration-300 border-r border-white/5 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-widest text-white/80">Riwayat Chat</h2>
          <Button variant="ghost" size="icon" className="text-white/50" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <Button onClick={startNewChat} className="w-full gap-2 border-white/10 bg-white/5 text-white/90 hover:bg-white/10 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl">
            <Plus className="h-4 w-4" /> Chat Baru
          </Button>
          <Button
            onClick={() => { setLocation("/ai-companion"); setSidebarOpen(false); }}
            variant="outline"
            className="mt-2 w-full justify-start gap-2 border-violet-500/15 bg-violet-500/5 text-violet-300 hover:bg-violet-500/10 hover:border-violet-400/35 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl"
          >
            <Sparkles className="h-4 w-4" /> AI Companion
          </Button>
          <Button
            onClick={() => { setLocation("/characters"); setSidebarOpen(false); }}
            variant="outline"
            className="mt-2 w-full justify-start gap-2 border-fuchsia-500/15 bg-fuchsia-500/5 text-fuchsia-300 hover:bg-fuchsia-500/10 hover:border-fuchsia-400/35 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl"
          >
            <Bot className="h-4 w-4" /> Character AI
          </Button>
          <Button
            onClick={() => { openAIUsage(); setSidebarOpen(false); }}
            variant="outline"
            className="mt-2 w-full justify-start gap-2 border-cyan-500/15 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/35 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl"
          >
            <BarChart3 className="h-4 w-4" /> AI Usage
          </Button>
          <Button
            onClick={() => { setLocation("/ai-subscribe"); setSidebarOpen(false); }}
            variant="outline"
            className="mt-2 w-full justify-start gap-2 font-bold uppercase tracking-wider text-[10px] h-12 rounded-xl ${isAISubscriber ? 'border-emerald-500/15 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400/35' : 'border-amber-500/15 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/35'}"
          >
            <Bot className="h-4 w-4" /> {isAISubscriber ? "AI Pro Aktif" : "Subscribe AI Pro"}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <div 
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setSidebarOpen(false); }}
              className="p-3 rounded-xl cursor-pointer text-xs ${activeSessionId === s.id ? 'bg-white/10 text-white font-bold border-white/10' : 'hover:bg-secondary text-white/70'}"
            >
              {s.title}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
