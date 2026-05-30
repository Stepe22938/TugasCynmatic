import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, Loader2, Plus, Send, Sparkles, UserRound, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAISettings } from "../contexts/AISettingsContext";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

interface AICharacter {
  id: string;
  ownerId: string;
  name: string;
  tagline?: string | null;
  avatar?: string | null;
  personality: string;
  greeting?: string | null;
  visibility?: "private" | "public";
}

interface CharacterMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
}

interface CharacterSession {
  id: string;
  characterId: string;
  title: string;
  messages: CharacterMessage[];
  createdAt: number;
}

const starterCharacters: Omit<AICharacter, "id" | "ownerId">[] = [
  {
    name: "Arthur Mentor",
    tagline: "Teman ngobrol strategis, santai, dan tajam.",
    personality: "Kamu adalah mentor yang hangat, jujur, dan praktis. Kamu membantu user mikir lebih jelas, memberi langkah konkret, dan menjaga tone tetap santai.",
    greeting: "Yo, gue Arthur Mentor. Kita mau bedah masalah apa hari ini?",
    visibility: "private",
  },
  {
    name: "Luna Support",
    tagline: "Karakter suportif buat curhat dan brainstorming.",
    personality: "Kamu adalah karakter suportif, empatik, tidak menghakimi, dan suka membantu user merapikan pikiran. Hindari klaim medis, tapi beri dukungan praktis.",
    greeting: "Hai, aku Luna. Cerita aja pelan-pelan, kita rapihin bareng.",
    visibility: "private",
  },
];

export function AICharactersPage() {
  const { user } = useAuth();
  const { aiProvider, openrouterKey, openrouterModel, obscuraKey, obscuraModel } = useAISettings();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [sessions, setSessions] = useState<CharacterSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", tagline: "", personality: "", greeting: "", visibility: "private" as "private" | "public" });
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const visibleSessions = useMemo(
    () => sessions.filter(s => !selectedCharacterId || s.characterId === selectedCharacterId),
    [sessions, selectedCharacterId]
  );

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/ai/characters?userId=${encodeURIComponent(user.id)}`)
      .then(res => res.ok ? res.json() : [])
      .then(async (data: AICharacter[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCharacters(data);
          setSelectedCharacterId(prev => prev || data[0].id);
          return;
        }

        const seeded: AICharacter[] = [];
        for (const character of starterCharacters) {
          const res = await fetch("/api/ai/characters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: user.id, ...character }),
          });
          if (res.ok) seeded.push((await res.json()).character);
        }
        setCharacters(seeded);
        setSelectedCharacterId(seeded[0]?.id || "");
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/ai/character-sessions?userId=${encodeURIComponent(user.id)}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: CharacterSession[]) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  const persistSession = (session: CharacterSession) => {
    if (!user?.id) return;
    fetch("/api/ai/character-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, characterId: session.characterId, session }),
    }).catch(() => {});
  };

  const startSession = (character: AICharacter) => {
    const greeting = character.greeting || `Halo, aku ${character.name}.`;
    const session: CharacterSession = {
      id: `char-session-${Date.now()}`,
      characterId: character.id,
      title: character.name,
      messages: [{ role: "assistant", content: greeting, id: `greet-${Date.now()}` }],
      createdAt: Date.now(),
    };
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    persistSession(session);
  };

  const saveCharacter = async () => {
    if (!user?.id || !form.name.trim() || !form.personality.trim()) {
      toast({ title: "Nama dan personality wajib diisi", variant: "destructive" });
      return;
    }
    const res = await fetch("/api/ai/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: user.id, ...form }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: "Gagal membuat karakter", description: data.error, variant: "destructive" });
      return;
    }
    setCharacters(prev => [data.character, ...prev]);
    setSelectedCharacterId(data.character.id);
    setShowCreate(false);
    setForm({ name: "", tagline: "", personality: "", greeting: "", visibility: "private" });
    startSession(data.character);
  };

  const sendMessage = async () => {
    if (!user?.id || !selectedCharacter || !input.trim() || loading) return;
    let session = activeSession;
    if (!session || session.characterId !== selectedCharacter.id) {
      startSession(selectedCharacter);
      session = {
        id: `char-session-${Date.now()}`,
        characterId: selectedCharacter.id,
        title: selectedCharacter.name,
        messages: [],
        createdAt: Date.now(),
      };
    }

    const userMsg: CharacterMessage = { role: "user", content: input.trim(), id: `u-${Date.now()}` };
    const nextSession = { ...session, title: userMsg.content.slice(0, 40), messages: [...session.messages, userMsg] };
    setSessions(prev => [nextSession, ...prev.filter(s => s.id !== nextSession.id)]);
    setActiveSessionId(nextSession.id);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/ai/characters/${selectedCharacter.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          messages: nextSession.messages,
          aiProvider,
          apiKey: openrouterKey,
          obscuraKey,
          model: aiProvider === "obscura" ? obscuraModel : openrouterModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghubungi karakter");
      const finalSession = {
        ...nextSession,
        messages: [...nextSession.messages, { role: "assistant" as const, content: data.content || "", id: `a-${Date.now()}` }],
      };
      setSessions(prev => [finalSession, ...prev.filter(s => s.id !== finalSession.id)]);
      persistSession(finalSession);
    } catch (err: any) {
      toast({ title: "Karakter error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#050506] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[2rem] border border-white/6 bg-white/[0.03] p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Character AI</p>
              <h1 className="text-2xl font-black tracking-tight">Persona Hub</h1>
            </div>
            <button onClick={() => setShowCreate(v => !v)} className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white">
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {showCreate && (
            <div className="mb-4 space-y-3 rounded-[1.5rem] border border-violet-400/20 bg-violet-500/8 p-4">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama karakter" className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs outline-none" />
              <input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline singkat" className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs outline-none" />
              <textarea value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} placeholder="Personality, gaya bicara, aturan karakter..." className="min-h-24 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs outline-none" />
              <input value={form.greeting} onChange={e => setForm({ ...form, greeting: e.target.value })} placeholder="Greeting awal" className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs outline-none" />
              <button onClick={() => setForm({ ...form, visibility: form.visibility === "public" ? "private" : "public" })} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                <span className={`grid h-5 w-5 place-items-center rounded-md border ${form.visibility === "public" ? "border-emerald-400 bg-emerald-500/20" : "border-white/15"}`}>{form.visibility === "public" && <Check className="h-3 w-3" />}</span>
                Public Character
              </button>
              <Button onClick={saveCharacter} className="w-full rounded-xl bg-violet-600 hover:bg-violet-500">Simpan Karakter</Button>
            </div>
          )}

          <div className="space-y-2">
            {characters.map(character => (
              <button key={character.id} onClick={() => { setSelectedCharacterId(character.id); const existing = sessions.find(s => s.characterId === character.id); existing ? setActiveSessionId(existing.id) : startSession(character); }} className={`w-full rounded-2xl border p-3 text-left transition ${selectedCharacterId === character.id ? "border-violet-400/35 bg-violet-500/15" : "border-white/6 bg-white/[0.025] hover:bg-white/[0.05]"}`}>
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/15 border border-violet-400/20">
                    <UserRound className="h-5 w-5 text-violet-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{character.name}</p>
                    <p className="truncate text-[10px] font-semibold text-white/35">{character.tagline || "Custom character"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex min-h-[720px] flex-col overflow-hidden rounded-[2rem] border border-white/6 bg-white/[0.03] shadow-2xl">
          <header className="flex items-center justify-between border-b border-white/6 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 border border-violet-400/20">
                <Sparkles className="h-5 w-5 text-violet-200" />
              </div>
              <div>
                <h2 className="text-lg font-black">{selectedCharacter?.name || "Pilih Karakter"}</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{selectedCharacter?.tagline || "Character.ai style chat"}</p>
              </div>
            </div>
            <span className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/35 sm:flex">
              <Users className="h-3.5 w-3.5" /> Persona Memory
            </span>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
            {!activeSession ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="mb-5 h-20 w-20 text-white/8" />
                <p className="text-sm font-black uppercase tracking-[0.25em] text-white/25">Pilih karakter buat mulai chat</p>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                {activeSession.messages.map(message => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-violet-600 text-white rounded-tr-sm" : "bg-white/[0.06] border border-white/8 text-white/82 rounded-tl-sm"}`}>
                      {message.role === "assistant" && <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-violet-200">{selectedCharacter?.name}</p>}
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))}
                {loading && <div className="flex items-center gap-2 text-xs text-white/35"><Loader2 className="h-4 w-4 animate-spin" /> Karakter sedang membalas...</div>}
              </div>
            )}
          </div>

          <div className="border-t border-white/6 p-4">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(); }} disabled={!selectedCharacter || loading} placeholder={selectedCharacter ? `Ngobrol dengan ${selectedCharacter.name}...` : "Pilih karakter dulu..."} className="h-12 flex-1 rounded-2xl border border-white/8 bg-black/35 px-4 text-sm font-semibold outline-none placeholder:text-white/20 focus:border-violet-400/35 disabled:opacity-50" />
              <button onClick={sendMessage} disabled={!input.trim() || !selectedCharacter || loading} className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white disabled:bg-white/5 disabled:text-white/20">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
