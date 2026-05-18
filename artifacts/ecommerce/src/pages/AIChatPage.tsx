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
  Menu, X, TrendingUp, Gamepad2, ChevronRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useMyCrypto } from "../contexts/MyCryptoContext";
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
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export function AIChatPage() {
  const { user } = useAuth();
  const { isCryptoMember } = useMyCrypto();
  const { isAIEnabled, openrouterKey, openrouterModel } = useAISettings();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("ai_chat_sessions");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId, loading]);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem("ai_chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "Chat Baru",
      messages: [
        { role: "system", content: "Kamu adalah asisten AI (Cynmatic AI) yang ramah dan membantu untuk platform e-commerce Cynmatic. Jawablah dalam bahasa Indonesia yang natural. PENTING: Format nomor pesanan/invoice di Cynmatic selalu berawalan 'TKO-' (contoh: #TKO-16190 atau TKO-12345). Jika user memberikan kode 'TKO-', anggap itu sebagai nomor pesanan yang valid dan bantu cek statusnya.", id: "sys-1" }
      ],
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
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !isAIEnabled) return;

    let currentSession = activeSession;
    if (!currentSession) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
        messages: [
          { role: "system", content: "Kamu adalah asisten AI (Cynmatic AI) yang ramah dan membantu untuk platform e-commerce Cynmatic. Jawablah dalam bahasa Indonesia yang natural. PENTING: Format nomor pesanan/invoice di Cynmatic selalu berawalan 'TKO-' (contoh: #TKO-16190 atau TKO-12345). Jika user memberikan kode 'TKO-', anggap itu sebagai nomor pesanan yang valid dan bantu cek statusnya.", id: "sys-1" }
        ],
        createdAt: Date.now()
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      currentSession = newSession;
    }

    const userMsg: Message = { role: "user", content: input.trim(), id: Date.now().toString() };
    const updatedMessages = [...currentSession.messages, userMsg];
    
    // Update local state first for instant feedback
    setSessions(prev => prev.map(s => 
      s.id === currentSession?.id ? { ...s, messages: updatedMessages, title: s.messages.length === 1 ? userMsg.content.slice(0, 30) : s.title } : s
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
          model: openrouterModel
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghubungi AI");
      }

      const aiMsgRaw = await res.json();
      const aiMsg: Message = {
        role: "assistant",
        content: aiMsgRaw.content,
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

    let currentSession = activeSession;
    if (!currentSession) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: promptText.slice(0, 30) + (promptText.length > 30 ? "..." : ""),
        messages: [
          { role: "system", content: "Kamu adalah asisten AI (Cynmatic AI) yang ramah dan membantu untuk platform e-commerce Cynmatic. Jawablah dalam bahasa Indonesia yang natural. PENTING: Format nomor pesanan/invoice di Cynmatic selalu berawalan 'TKO-' (contoh: #TKO-16190 atau TKO-12345). Jika user memberikan kode 'TKO-', anggap itu sebagai nomor pesanan yang valid dan bantu cek statusnya.", id: "sys-1" }
        ],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSession = newSession;
    }

    const userMsg: Message = { role: "user", content: promptText, id: Date.now().toString() };
    const updatedMessages = [...currentSession.messages, userMsg];
    
    setSessions(prev => prev.map(s => 
      s.id === currentSession?.id ? { ...s, messages: updatedMessages, title: s.messages.length === 1 ? userMsg.content.slice(0, 30) : s.title } : s
    ));
    
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          apiKey: openrouterKey,
          model: openrouterModel
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghubungi AI");
      }

      const aiMsgRaw = await res.json();
      const aiMsg: Message = {
        role: "assistant",
        content: aiMsgRaw.content,
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
                      content: `Kamu adalah asisten AI khusus Crypto (MYCRYPTO) untuk platform Cynmatic. 
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
              <div>
                <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                  Cynmatic AI 
                  <span className="text-[9px] font-medium bg-white/10 text-white/80 px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/5">Beta</span>
                </h2>
                <p className="text-[8px] font-semibold text-white/40 uppercase tracking-widest mt-0.5">Official AI Companion</p>
              </div>
            </div>
          </div>
          
          <div className="text-[9px] font-semibold uppercase tracking-widest text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl shadow-lg">
            {openrouterModel || "GPT-4o Mini"}
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
                        {msg.role === "assistant" ? "Cynmatic AI" : "Anda"}
                      </p>
                      {msg.role === "user" && isCryptoMember && <CryptoBadge className="scale-75 origin-left" />}
                    </div>
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.role === "user" ? "text-white/90" : "text-white/80"}`}>
                      {msg.content}
                    </div>
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
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Cynmatic AI</p>
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
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Kirim pesan ke Cynmatic AI..."
              className="w-full bg-transparent border-0 px-4 py-3 text-sm focus:outline-none focus:ring-0 placeholder:text-white/20 resize-none min-h-[48px] max-h-48 text-white"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !isAIEnabled}
              className={`
                absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg
                ${input.trim() && !loading && isAIEnabled 
                  ? "bg-white text-black scale-100 shadow-white/10 cursor-pointer hover:bg-neutral-200" 
                  : "bg-white/5 text-white/20 scale-95 opacity-50 cursor-not-allowed"}
              `}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
            
            {!isAIEnabled && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center rounded-2xl border border-dashed border-red-500/10">
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest bg-red-500/5 border border-red-500/10 px-4 py-2 rounded-xl">
                  AI Service Temporarily Offline
                </p>
              </div>
            )}
          </div>
          <p className="text-[9px] font-semibold text-center text-white/20 mt-3 uppercase tracking-wider">
            Cynmatic AI dapat membuat kesalahan. Harap validasi informasi penting.
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
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-zinc-950 z-40 transform transition-transform duration-300 border-r border-white/5
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:hidden flex flex-col
      `}>
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
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <div 
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setSidebarOpen(false); }}
              className={`p-3 rounded-xl cursor-pointer text-xs ${activeSessionId === s.id ? "bg-white/10 text-white font-bold border-white/10" : "hover:bg-secondary text-white/70"}`}
            >
              {s.title}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
