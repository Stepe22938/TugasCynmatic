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
  Menu, X, TrendingUp
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useMyCrypto } from "../contexts/MyCryptoContext";
import { CryptoBadge } from "../components/CryptoBadge";
import { useAISettings } from "../contexts/AISettingsContext";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

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
        { role: "system", content: "Kamu adalah asisten AI yang ramah dan membantu untuk pengguna platform e-commerce Cynmatic. Jawablah dalam bahasa Indonesia yang natural.", id: "sys-1" }
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
          { role: "system", content: "Kamu adalah asisten AI yang ramah dan membantu untuk pengguna platform e-commerce Cynmatic. Jawablah dalam bahasa Indonesia yang natural.", id: "sys-1" }
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

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar - Desktop */}
      <aside className={`
        ${sidebarOpen ? "w-64" : "w-0"} 
        transition-all duration-300 bg-secondary/30 border-r flex flex-col h-full overflow-hidden
        hidden md:flex
      `}>
        <div className="p-4 border-b">
          <Button 
            onClick={startNewChat}
            variant="outline" 
            className="w-full justify-start gap-2 border-dashed border-primary/50 hover:border-primary"
          >
            <Plus className="h-4 w-4" /> Chat Baru
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
              className="w-full justify-start gap-2 border-blue-500/50 text-blue-500 hover:bg-blue-500/10 mt-2"
            >
              <TrendingUp className="h-4 w-4" /> Crypto Analysis
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 && (
            <p className="text-xs text-center text-muted-foreground mt-4 italic">Belum ada riwayat chat</p>
          )}
          {sessions.map(s => (
            <div 
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`
                group flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm transition-all
                ${activeSessionId === s.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary"}
              `}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                <span className="truncate">{s.title}</span>
              </div>
              <button 
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-secondary/10">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setLocation("/profile")}>
            <ChevronLeft className="h-4 w-4" /> Kembali ke Profil
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <SidebarIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm">Cynmatic AI <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full ml-1">Beta</span></h2>
            </div>
          </div>
          
          <div className="text-[10px] text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-lg">
            {openrouterModel || "GPT-4o Mini"}
          </div>
        </header>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-0 py-8 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            {!activeSessionId && sessions.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-2">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-black">Apa yang bisa saya bantu hari ini?</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Tanyakan apa saja tentang produk, koin, atau bantuan di platform Cynmatic.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-4">
                  {[
                    "Cara dapat koin gratis?",
                    "Cek status pengiriman",
                    "Cara jadi seller?",
                    "Bantu tulis deskripsi produk"
                  ].map(q => (
                    <button 
                      key={q}
                      onClick={() => {
                        setInput(q);
                      }}
                      className="p-3 text-xs text-left border rounded-xl hover:bg-secondary transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                    <PremiumCard 
                      href="/game-topup" 
                      title="Top Up Game" 
                      subtitle="MLBB, FF, PUBG..." 
                      icon={Gamepad2} 
                      color="from-emerald-500 to-teal-700" 
                    />
                    <PremiumCard 
                      href="/mycrypto" 
                      title="MyCrypto" 
                      subtitle="AI Crypto & Signals" 
                      icon={TrendingUp} 
                      color="from-blue-600 to-indigo-900" 
                    />
                </div>
              </div>
            ) : (
              activeSession?.messages.filter(m => m.role !== "system").map((msg, idx) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-4 group animate-in slide-in-from-bottom-2 duration-300 ${msg.role === "assistant" ? "bg-secondary/20 -mx-4 px-4 py-8 rounded-3xl" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === "assistant" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">
                        {msg.role === "assistant" ? "Cynmatic AI" : "Anda"}
                      </p>
                      {msg.role === "user" && isCryptoMember && <CryptoBadge className="scale-75 origin-left" />}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex gap-4 bg-secondary/20 -mx-4 px-4 py-8 rounded-3xl animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">Cynmatic AI</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <div className="max-w-3xl mx-auto relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Kirim pesan..."
              className="w-full bg-secondary/50 border rounded-2xl px-4 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[60px] max-h-48 resize-none transition-all"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !isAIEnabled}
              className={`
                absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all
                ${input.trim() && !loading && isAIEnabled ? "bg-primary text-white scale-100" : "bg-muted text-muted-foreground scale-90 opacity-50"}
              `}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
            
            {!isAIEnabled && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl border border-dashed border-red-300">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full shadow-sm">
                  AI belum aktif. Hubungi admin.
                </p>
              </div>
            )}
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            Cynmatic AI dapat membuat kesalahan. Periksa informasi penting.
          </p>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Mobile Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-background z-40 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:hidden flex flex-col border-r
      `}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">Riwayat Chat</h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <Button onClick={startNewChat} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Chat Baru
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <div 
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setSidebarOpen(false); }}
              className={`p-3 rounded-xl cursor-pointer text-sm ${activeSessionId === s.id ? "bg-primary/10 text-primary" : "hover:bg-secondary"}`}
            >
              {s.title}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
