import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { useTickets } from "../contexts/TicketContext";
import { useAuth } from "../contexts/AuthContext";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";

export function TicketPage() {
  const [, params] = useRoute("/ticket/:id");
  const { tickets, addMessage, updateTicket } = useTickets();
  const { user } = useAuth();
  
  const [text, setText] = useState("");
  const [showStatusPanel, setShowStatusPanel] = useState(false);

  const ensureArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return [];
  };

  if (!user || !params?.id) return null;

  const ticket = tickets.find(t => t.id === params.id);

  if (!ticket) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center relative z-10 glass-card rounded-[2rem] border border-white/5 p-8 max-w-sm">
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">Tiket Tidak Ditemukan</h2>
          <Link href="/tickets">
            <button className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">
              Kembali
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  
  if (!isAdmin && ticket.userId !== user.id) {
    return <div className="text-center py-16">Akses Ditolak</div>;
  }

  const handleSend = () => {
    if (!text.trim()) return;
    addMessage(ticket.id, text.trim());
    setText("");
  };

  // Convert ticket description into a message if it's the only text, 
  // or we just display the original description as the first message from the user.
  const hasMessages = ticket.messages && ticket.messages.length > 0;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#050505] text-white pb-32 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        
        {/* Header / Kembali */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={isAdmin ? "/admin" : "/tickets"}>
            <button className="inline-flex items-center text-white/50 hover:text-white font-black uppercase text-xs tracking-widest gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl transition-all active:scale-95">
              <ChevronLeft className="h-4 w-4" /> Kembali Ke Arsip
            </button>
          </Link>
          {isAdmin && ticket.status === "open" && (
            <div className="flex gap-2">
              <button 
                onClick={() => updateTicket(ticket.id, "resolved")}
                className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                Tandai Selesai
              </button>
            </div>
          )}
        </div>

        {/* Status Laporan Accordion */}
        <div className="glass-card border border-white/5 bg-[#0a0a0c]/40 rounded-[2rem] mb-8 overflow-hidden">
          <button 
            className="w-full flex items-center justify-between p-6 focus:outline-none hover:bg-white/[0.02] transition-colors"
            onClick={() => setShowStatusPanel(!showStatusPanel)}
          >
            <span className="font-black uppercase tracking-wider text-xs text-white">Status Telemetri Laporan</span>
            <ChevronDown className={`h-5 w-5 text-white/40 transition-transform ${showStatusPanel ? "rotate-180 text-red-500" : ""}`} />
          </button>
          
          {showStatusPanel && (
            <div className="p-6 border-t border-white/5 bg-[#0a0a0c]/60 text-sm grid grid-cols-[140px_1fr] gap-y-3 items-center">
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">ID Tiket</div>
              <div className="font-mono text-xs text-white/80">#{ticket.id.split("-")[1] || ticket.id}</div>
              
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Kondisi</div>
              <div className="flex items-center">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border ${
                  ticket.status === "open" 
                    ? "bg-red-500/10 text-red-400 border-red-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                  {ticket.status === "open" ? "Sedang Berlangsung" : "Selesai / Ditutup"}
                </span>
              </div>
              
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Waktu Input</div>
              <div className="font-medium text-xs text-white/70">{new Date(ticket.createdAt).toLocaleString("id-ID")}</div>
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="space-y-6">
          {/* First Message (The Original Ticket Description) */}
          <div className="flex justify-end">
            <div className="bg-red-500/10 border border-red-500/20 text-white p-5 rounded-[2rem] rounded-tr-sm max-w-2xl text-sm shadow-[0_0_20px_rgba(239,68,68,0.05)] space-y-3">
              <div className="space-y-1.5 border-b border-white/5 pb-3">
                <p><span className="text-[10px] font-black uppercase tracking-wider text-red-400 mr-2">Player ID:</span> <span className="font-mono font-bold text-xs">{ticket.userSystemId ?? ticket.userId.slice(-8)}</span></p>
                <p><span className="text-[10px] font-black uppercase tracking-wider text-red-400 mr-2">Nickname:</span> <span className="font-bold text-xs text-white/90">{ticket.userName}</span></p>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mt-3 block">Isi Pesan:</p>
                <p className="whitespace-pre-wrap leading-relaxed text-white/80 mt-1 font-medium">{ticket.description}</p>
              </div>
              <div className="text-right text-[9px] font-bold text-white/30 uppercase tracking-widest">
                {new Date(ticket.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Subsequent Messages */}
          {ensureArray(ticket.messages).map((msg: any) => {
            const isMe = msg.senderId === user.id;
            if (isMe) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-red-500/10 border border-red-500/20 text-white p-5 rounded-[2rem] rounded-tr-sm max-w-2xl text-sm shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                    <p className="whitespace-pre-wrap leading-relaxed text-white/80 font-medium">{msg.text}</p>
                    <div className="text-right text-[9px] font-bold text-white/30 uppercase tracking-widest mt-3">
                      {new Date(msg.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="glass-card border border-white/10 bg-white/[0.02] text-white p-5 rounded-[2rem] rounded-tl-sm max-w-2xl text-sm shadow-[0_0_30px_rgba(255,255,255,0.02)]">
                    <p className="whitespace-pre-wrap leading-relaxed text-white/80 font-medium">{msg.text}</p>
                    <div className="text-right text-[9px] font-bold text-white/20 uppercase tracking-widest mt-3">
                      {new Date(msg.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Input or Closed Status */}
        <div className="mt-12 flex justify-center">
          {ticket.status === "open" ? (
            <div className="w-full max-w-2xl bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 p-2.5 rounded-[2rem] flex items-center shadow-2xl focus-within:border-red-500/30 transition-all">
              <input 
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tulis balasan pesan di sini..."
                className="flex-1 bg-transparent px-5 py-1.5 focus:outline-none text-sm text-white placeholder-white/20 font-medium"
                onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              />
              <button 
                onClick={handleSend}
                disabled={!text.trim()}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-full disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-[0.98]"
              >
                Kirim
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 px-16 py-3 rounded-full shadow-inner text-xs font-black uppercase tracking-widest text-white/30 italic">
              ~ Tiket telemetri ini telah selesai ditutup ~
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
