/**
 * AICompanionPage.tsx
 * AI Companion — Multi-Model Battle Arena
 * Kirim 1 prompt ke beberapa model AI sekaligus dan bandingkan jawabannya secara paralel.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Bot, Send, Loader2, Sparkles, Plus, Trash2,
  MessageSquare, Crown, Clock, Copy, Check,
  ChevronLeft, Zap, AlertCircle, X, Cpu, RotateCcw,
  BarChart3, Search, Download
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAISettings } from "../contexts/AISettingsContext";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface CompanionModel {
  id: string;
  name: string;
  modelId: string;
  description: string | null;
  color: string;
  isEnabled: boolean;
  sortOrder: number;
}

interface ModelResponse {
  modelId: string;
  content: string;
  imageUrl?: string;
  latency: number;
  error?: string;
  startedAt?: number;
  completed?: boolean;
}

interface CompanionMessage {
  role: "user" | "assistant_batch";
  content?: string;             // for user
  responses?: ModelResponse[];  // for assistant_batch
  timestamp: number;
}

interface CompanionSession {
  id: string;
  title: string;
  messages: CompanionMessage[];
  createdAt: number;
}

// ─── COPY BUTTON MINI COMPONENT ──────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Disalin" : "Salin"}
    </button>
  );
}

function DownloadImageButton({ imageUrl, filename }: { imageUrl: string; filename: string }) {
  const handleDownload = async () => {
    const safeName = filename.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ai-image";
    const link = document.createElement("a");
    link.download = `${safeName}.png`;

    try {
      if (imageUrl.startsWith("data:")) {
        link.href = imageUrl;
      } else {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
        setTimeout(() => URL.revokeObjectURL(link.href), 3000);
      }
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      link.href = imageUrl;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
    >
      <Download className="w-3 h-3" />
      Download
    </button>
  );
}

// ─── RESPONSE CARD ────────────────────────────────────────────────────────────
function ModelResponseCard({
  model,
  response,
  isWinnerSpeed,
  isWinnerLength,
  index,
}: {
  model: CompanionModel;
  response?: ModelResponse;
  isWinnerSpeed: boolean;
  isWinnerLength: boolean;
  index: number;
}) {
  const isLoading = !response;
  const hasError = response?.error;
  const displayLatency = response
    ? response.completed
      ? response.latency
      : response.startedAt
      ? Date.now() - response.startedAt
      : response.latency
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col rounded-[1.75rem] border border-white/5 bg-[#111113] overflow-hidden shadow-2xl"
      style={{ borderTopColor: `${model.color}25` }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]"
        style={{ background: `linear-gradient(135deg, ${model.color}12, transparent)` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{ backgroundColor: `${model.color}20`, border: `1px solid ${model.color}35` }}
        >
          <Cpu className="w-4 h-4" style={{ color: model.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white truncate">{model.name}</p>
          <p className="text-[9px] text-white/35 font-mono truncate">{model.modelId}</p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isWinnerSpeed && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" /> Tercepat
            </span>
          )}
          {isWinnerLength && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-violet-300 bg-violet-500/10 border border-violet-500/25 px-2 py-0.5 rounded-full">
              <Crown className="w-2.5 h-2.5" /> Terpanjang
            </span>
          )}
          {response && !hasError && (
            <span className="flex items-center gap-1 text-[8px] font-mono text-white/30">
              <Clock className="w-2.5 h-2.5" />
              {(displayLatency / 1000).toFixed(1)}s
            </span>
          )}
          {response && hasError && (
            <span className="flex items-center gap-1 text-[8px] font-mono text-red-300/60">
              <Clock className="w-2.5 h-2.5" />
              {(displayLatency / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 min-h-[120px] relative">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse pt-1">
            <div className="h-2.5 bg-white/5 rounded-full w-4/5" />
            <div className="h-2.5 bg-white/5 rounded-full w-3/5" />
            <div className="h-2.5 bg-white/5 rounded-full w-full" />
            <div className="h-2.5 bg-white/5 rounded-full w-2/3" />
            <div className="flex items-center gap-1.5 mt-3">
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: model.color, animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: model.color, animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: model.color, animationDelay: "300ms" }} />
            </div>
          </div>
        ) : hasError ? (
          <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/15 rounded-2xl p-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300/80 leading-relaxed">{response?.error}</p>
          </div>
        ) : response?.imageUrl ? (
          <div className="space-y-3">
            <img
              src={response.imageUrl}
              alt={`${model.name} generated result`}
              className="w-full max-h-[420px] rounded-2xl object-contain bg-black/30 border border-white/[0.06]"
            />
            {response.content && (
              <p className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap break-words">
                {response.content}
              </p>
            )}
          </div>
        ) : !response?.content && !response?.completed ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-white/35 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              Menunggu token pertama dari model...
            </div>
            <div className="space-y-2 animate-pulse">
              <div className="h-2.5 bg-white/5 rounded-full w-3/4" />
              <div className="h-2.5 bg-white/5 rounded-full w-1/2" />
            </div>
          </div>
        ) : !response?.content && !response?.imageUrl && response?.completed ? (
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
            <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-100/70 leading-relaxed">
              Model selesai, tapi provider tidak mengirim teks untuk request ini.
            </p>
          </div>
        ) : (
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">
            {response?.content}
          </p>
        )}
      </div>

      {/* Footer */}
      {response && !hasError && (response.content || response.imageUrl) && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
          <span className="text-[9px] text-white/20 font-mono">
            {response.imageUrl ? "gambar" : `~${response.content.split(" ").length} kata`}
          </span>
          <div className="flex items-center gap-3">
            {response.imageUrl && <DownloadImageButton imageUrl={response.imageUrl} filename={`${model.name}-${Date.now()}`} />}
            <CopyButton text={response.imageUrl || response.content} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function AICompanionPage() {
  const { user } = useAuth();
  const { isAIEnabled, aiProvider, openrouterKey, openrouterModel, obscuraKey, obscuraModel } = useAISettings();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [availableModels, setAvailableModels] = useState<CompanionModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

  const [sessions, setSessions] = useState<CompanionSession[]>(() => {
    try {
      const saved = localStorage.getItem("ai_companion_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingResponses, setPendingResponses] = useState<ModelResponse[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [researchMode, setResearchMode] = useState(false);
  const [, setTimerTick] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch available models
  useEffect(() => {
    fetch("/api/ai/companion-models")
      .then(r => r.json())
      .then((data: CompanionModel[]) => {
        const enabled = data.filter(m => m.isEnabled);
        setAvailableModels(enabled);
        // Default: select first 2 enabled
        setSelectedModelIds(enabled.slice(0, 2).map(m => m.modelId));
        setLoadingModels(false);
      })
      .catch(err => {
        console.error("Failed to load companion models:", err);
        setLoadingModels(false);
      });
  }, []);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem("ai_companion_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId, loading]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setTimerTick(tick => tick + 1);
    }, 250);
    return () => clearInterval(interval);
  }, [loading]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const startNewSession = () => {
    const newSession: CompanionSession = {
      id: Date.now().toString(),
      title: "Sesi Baru",
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setPendingResponses([]);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) { setActiveSessionId(null); setPendingResponses([]); }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModelIds(prev => {
      if (prev.includes(modelId)) {
        if (prev.length <= 1) {
          toast({ title: "Minimal 1 model harus dipilih", variant: "destructive" });
          return prev;
        }
        return prev.filter(id => id !== modelId);
      } else {
        if (prev.length >= 4) {
          toast({ title: "Maksimal 4 model sekaligus", variant: "destructive" });
          return prev;
        }
        return [...prev, modelId];
      }
    });
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !isAIEnabled || selectedModelIds.length === 0) return;

    const prompt = input.trim();
    setInput("");
    setLoading(true);
    setPendingResponses([]);

    let currentSession = activeSession;
    if (!currentSession) {
      const newSession: CompanionSession = {
        id: Date.now().toString(),
        title: prompt.slice(0, 35) + (prompt.length > 35 ? "..." : ""),
        messages: [],
        createdAt: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSession = newSession;
    }

    const userMsg: CompanionMessage = { role: "user", content: prompt, timestamp: Date.now() };
    setSessions(prev => prev.map(s =>
      s.id === currentSession!.id
        ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? prompt.slice(0, 35) : s.title }
        : s
    ));

    try {
      const historyMessages = [
        {
          role: "system" as const,
          content: researchMode
            ? "Kamu sedang ikut AI Companion Battle Arena dalam Research Mode. Gunakan hasil pencarian web/online yang tersedia untuk menjawab prompt terbaru. Jika topiknya baru, niche, atau tidak jelas, lakukan riset dulu dan jangan mengarang. Jawab dalam bahasa Indonesia, ringkas tetapi akurat, dan sebutkan bila informasi masih belum pasti."
            : "Kamu sedang ikut AI Companion Battle Arena. Jawab HANYA prompt terbaru dari user. Jangan menggabungkan dengan prompt, judul sesi, atau percakapan sebelumnya. Jawab dalam bahasa Indonesia yang jelas dan langsung sesuai permintaan.",
        },
        { role: "user" as const, content: prompt },
      ];

      if (openrouterKey || obscuraKey) {
        await fetch("/api/ai/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aiProvider,
            openrouterKey,
            openrouterModel,
            obscuraKey,
            obscuraModel
          }),
        }).catch(() => {});
      }

      const controller = new AbortController();
      let res: Response;

      try {
        res = await fetch("/api/ai/companion/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: historyMessages,
            modelIds: selectedModelIds,
            apiKey: openrouterKey,
            obscuraKey,
            obscuraModel,
            aiProvider,
            researchMode
          }),
        });
      } catch (err: any) {
        throw err;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menghubungi server AI");
      }

      const liveResponses: ModelResponse[] = selectedModelIds.map(modelId => ({
        modelId,
        content: "",
        latency: 0,
        startedAt: Date.now(),
        completed: false,
      }));
      setPendingResponses(liveResponses);

      const decoder = new TextDecoder();
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Browser tidak bisa membaca stream respons AI.");

      let buffer = "";
      let finalResponses = liveResponses;
      let completeSeen = false;
      const requestStartedAt = Date.now();
      const CLIENT_STREAM_LIMIT_MS = 60000;

      const applyEvent = (event: any) => {
        if (!event?.modelId) return;

        finalResponses = finalResponses.map(response => {
          if (response.modelId !== event.modelId) return response;

          if (event.type === "start") {
            return { ...response, startedAt: Date.now(), completed: false, error: undefined };
          }
          if (event.type === "delta") {
            const cleanDelta = String(event.delta || "").replace(/<\/?(assistant|user|system)>/gi, "");
            return { ...response, content: `${response.content}${cleanDelta}` };
          }
          if (event.type === "image") {
            return { ...response, imageUrl: event.imageUrl || "", content: event.content || response.content };
          }
          if (event.type === "done") {
            return { ...response, latency: Number(event.latency || response.latency || 0), completed: true };
          }
          if (event.type === "error") {
            return {
              ...response,
              latency: Number(event.latency || response.latency || 0),
              error: event.error || "Gagal mendapatkan respons dari model ini.",
              completed: true,
            };
          }
          return response;
        });

        setPendingResponses(finalResponses);
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk.split("\n").find(item => item.startsWith("data:"));
          if (!line) continue;
          const payload = line.replace(/^data:\s*/, "");
          if (!payload) continue;

          const event = JSON.parse(payload);
          if (event.type === "complete") {
            completeSeen = true;
            continue;
          }
          applyEvent(event);
        }

        const allDone = finalResponses.every(response => response.completed || response.content || response.imageUrl || response.error);
        if (completeSeen || allDone || Date.now() - requestStartedAt > CLIENT_STREAM_LIMIT_MS) {
          try {
            await reader.cancel();
          } catch {}
          break;
        }
      }

      finalResponses = finalResponses.map(response => {
        if (response.completed) return response;
        const latency = response.startedAt ? Date.now() - response.startedAt : response.latency;
        return {
          ...response,
          latency,
          completed: true,
          error: response.content || response.imageUrl ? undefined : "Model belum menutup respons. Silakan coba lagi atau nonaktifkan model ini.",
        };
      });
      setPendingResponses(finalResponses);

      const batchMsg: CompanionMessage = {
        role: "assistant_batch",
        responses: finalResponses,
        timestamp: Date.now(),
      };
      setSessions(prev => prev.map(s =>
        s.id === currentSession!.id
          ? { ...s, messages: [...s.messages, batchMsg] }
          : s
      ));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setPendingResponses([]);
    }
  }, [input, loading, isAIEnabled, selectedModelIds, activeSession, sessions, aiProvider, openrouterKey, openrouterModel, obscuraKey, obscuraModel, researchMode]);

  if (!user) return null;

  const isNewSession = !activeSessionId || !activeSession || activeSession.messages.length === 0;

  const getModelByModelId = (modelId: string) =>
    availableModels.find(m => m.modelId === modelId);

  // Compute winner badges for the most recent batch
  const computeWinners = (responses: ModelResponse[]) => {
    const valid = responses.filter(r => !r.error && (r.content || r.imageUrl));
    const fastestLatency = valid.length > 0 ? Math.min(...valid.map(r => r.latency)) : -1;
    const longestContent = valid.length > 0 ? Math.max(...valid.map(r => r.content.length)) : -1;
    return {
      speedWinner: fastestLatency >= 0 ? valid.find(r => r.latency === fastestLatency)?.modelId : null,
      lengthWinner: longestContent >= 0 ? valid.find(r => r.content.length === longestContent)?.modelId : null,
    };
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] bg-[#050506] text-white overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className={`${showSidebar ? "w-64" : "w-0"} transition-all duration-300 bg-[#0a0a0c] border-r border-white/[0.05] flex flex-col flex-shrink-0 overflow-hidden hidden md:flex`}>
        <div className="p-4 border-b border-white/[0.05] space-y-2.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">AI Companion</p>
              <p className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Battle Arena</p>
            </div>
          </div>

          <Button
            onClick={startNewSession}
            className="w-full justify-start gap-2 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 text-white/70 font-bold uppercase tracking-wider text-[9px] h-10 rounded-xl"
          >
            <Plus className="h-3.5 w-3.5" /> Sesi Baru
          </Button>
          <Button
            onClick={() => setLocation("/aichat")}
            className="w-full justify-start gap-2 bg-transparent border border-transparent hover:bg-white/[0.02] text-white/35 font-bold uppercase tracking-wider text-[9px] h-9 rounded-xl"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Kembali ke Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 && (
            <p className="text-[9px] text-center text-white/15 font-bold uppercase tracking-widest mt-8 italic">Belum ada sesi</p>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setPendingResponses([]); }}
              className={`group w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-xs border ${
                activeSessionId === s.id
                  ? "bg-white/[0.05] text-white font-bold border-white/10"
                  : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-white/25" />
                <span className="truncate text-[10px]">{s.title}</span>
              </div>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 border-b border-white/[0.05] bg-[#050506]/90 backdrop-blur-md px-6 py-3.5 flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(v => !v)}
            className="hidden md:flex w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.07] items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/25 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4.5 h-4.5 text-violet-300" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight">AI Companion</h1>
              <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">Multi-Model Battle Arena</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/30">
            {researchMode && (
              <span className="mr-2 flex items-center gap-1 text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <Search className="w-3 h-3" /> Research
              </span>
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {selectedModelIds.length} model aktif
          </div>
        </header>

        {/* Model Selector Chips */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.04] bg-[#07070a]">
          {loadingModels ? (
            <div className="flex gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-8 w-28 rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/25 mr-1">Model:</span>
              <button
                onClick={() => setResearchMode(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${
                  researchMode
                    ? "bg-cyan-500/15 border-cyan-400/35 text-cyan-200"
                    : "border-white/5 text-white/35 hover:text-white/60 hover:border-white/10"
                }`}
                title="Aktifkan web research OpenRouter untuk pertanyaan baru/niche"
              >
                <Search className="w-3 h-3" />
                Research
                {researchMode && <Check className="w-2.5 h-2.5" />}
              </button>
              {availableModels.map(model => {
                const isSelected = selectedModelIds.includes(model.modelId);
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.modelId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${
                      isSelected
                        ? "border-white/20 text-white shadow-sm"
                        : "border-white/5 text-white/30 hover:text-white/50 hover:border-white/10"
                    }`}
                    style={isSelected ? { backgroundColor: `${model.color}18`, borderColor: `${model.color}35`, color: model.color } : {}}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isSelected ? model.color : "rgba(255,255,255,0.1)" }}
                    />
                    {model.name}
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 px-5 scroll-smooth">
          {isNewSession ? (
            // Welcome Screen
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-2xl mx-auto">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center shadow-2xl shadow-violet-500/10">
                  <BarChart3 className="w-7 h-7 text-violet-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500/90 border border-amber-400/50 flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent tracking-tight">
                  Bandingkan Semua AI Sekaligus
                </h2>
                <p className="text-xs text-white/35 font-semibold max-w-sm leading-relaxed">
                  Kirim satu pertanyaan, dan biarkan semua model AI menjawab secara paralel. Lihat siapa yang tercepat dan paling detail.
                </p>
              </div>

              {/* Stats row */}
              <div className="flex gap-3">
                {[
                  { label: "Model Dipilih", value: selectedModelIds.length, color: "violet" },
                  { label: "Model Tersedia", value: availableModels.length, color: "blue" },
                  { label: "Max Paralel", value: "4", color: "amber" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 text-center">
                    <p className="text-xl font-black text-white">{stat.value}</p>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-white/30 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick prompts */}
              <div className="grid grid-cols-2 gap-2 w-full">
                {[
                  "Jelaskan konsep quantum computing dengan analogi sederhana",
                  "Tulis puisi pendek tentang senja di pinggir pantai",
                  "Apa perbedaan utama React vs Vue vs Angular?",
                  "Beri saya 5 ide bisnis online yang bisa dijalankan dari rumah",
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="p-3.5 text-xs text-left bg-white/[0.02] border border-white/[0.05] hover:border-white/15 hover:bg-white/[0.04] rounded-xl transition-all font-medium text-white/50 hover:text-white/80 leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Conversation
            <div className="max-w-full space-y-8">
              {activeSession?.messages.map((msg, msgIdx) => {
                if (msg.role === "user") {
                  return (
                    <motion.div
                      key={msgIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-3.5 text-sm text-white/90 leading-relaxed">
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                }

                if (msg.role === "assistant_batch" && msg.responses) {
                  const { speedWinner, lengthWinner } = computeWinners(msg.responses);
                  // Get the models that are in this response batch (in the order they were called)
                  const orderedModels = msg.responses.map(r => getModelByModelId(r.modelId)).filter(Boolean) as CompanionModel[];

                  return (
                    <div key={msgIdx} className="space-y-3">
                      <div className="text-[8px] font-black uppercase tracking-widest text-white/20 text-center">
                        — {orderedModels.length} model merespons —
                      </div>
                      <div className={`grid gap-4 ${orderedModels.length === 1 ? "grid-cols-1 max-w-2xl mx-auto" : orderedModels.length === 2 ? "grid-cols-1 lg:grid-cols-2" : orderedModels.length === 3 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                        {msg.responses.map((resp, rIdx) => {
                          const model = getModelByModelId(resp.modelId);
                          if (!model) return null;
                          return (
                            <ModelResponseCard
                              key={resp.modelId}
                              model={model}
                              response={resp}
                              isWinnerSpeed={resp.modelId === speedWinner}
                              isWinnerLength={resp.modelId === lengthWinner}
                              index={rIdx}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {/* Loading state — show skeleton cards for pending */}
              {loading && (
                <div className="space-y-3">
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/15 text-center animate-pulse">
                    — Menunggu respons {selectedModelIds.length} model... —
                  </div>
                  <div className={`grid gap-4 ${selectedModelIds.length === 1 ? "grid-cols-1 max-w-2xl mx-auto" : selectedModelIds.length === 2 ? "grid-cols-1 lg:grid-cols-2" : selectedModelIds.length === 3 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                    {selectedModelIds.map((mId, i) => {
                      const model = getModelByModelId(mId);
                      if (!model) return null;
                      const liveResponse = pendingResponses.find(response => response.modelId === mId);
                      return (
                        <ModelResponseCard
                          key={mId}
                          model={model}
                          response={liveResponse}
                          isWinnerSpeed={false}
                          isWinnerLength={false}
                          index={i}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-5 border-t border-white/[0.05] bg-[#050506]">
          <div className="max-w-5xl mx-auto relative bg-white/[0.02] border border-white/[0.08] rounded-2xl focus-within:border-violet-500/30 focus-within:shadow-[0_4px_30px_rgba(139,92,246,0.06)] transition-all duration-300 p-2 pr-14">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder={isAIEnabled ? `Kirim ke ${selectedModelIds.length} model${researchMode ? " + research" : ""}...` : "AI Service Offline"}
              disabled={!isAIEnabled || loading}
              className="w-full bg-transparent border-0 px-4 py-3 text-sm focus:outline-none focus:ring-0 placeholder:text-white/20 resize-none min-h-[48px] max-h-48 text-white disabled:opacity-50"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !isAIEnabled || selectedModelIds.length === 0}
              className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                input.trim() && !loading && isAIEnabled
                  ? "bg-violet-500 text-white cursor-pointer hover:bg-violet-400 shadow-violet-500/25"
                  : "bg-white/[0.04] text-white/20 cursor-not-allowed"
              }`}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-[8px] font-semibold text-center text-white/15 mt-2.5 uppercase tracking-wider">
            Semua model dijalankan paralel — hasil mungkin berbeda tiap model
          </p>
        </div>
      </main>
    </div>
  );
}
