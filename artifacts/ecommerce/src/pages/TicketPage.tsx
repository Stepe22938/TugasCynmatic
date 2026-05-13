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

  if (!user || !params?.id) return null;

  const ticket = tickets.find(t => t.id === params.id);

  if (!ticket) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#f3f4f6] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Tiket Tidak Ditemukan</h2>
          <Link href="/tickets"><Button>Kembali</Button></Link>
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
    <div className="min-h-[calc(100vh-80px)] bg-[#f3f4f6] pb-24">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header / Kembali */}
        <div className="mb-4 flex items-center justify-between">
          <Link href={isAdmin ? "/admin" : "/tickets"} className="inline-flex items-center text-[#1ea1f2] hover:underline font-medium text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
          </Link>
          {isAdmin && ticket.status === "open" && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50" onClick={() => updateTicket(ticket.id, "resolved")}>Tandai Selesai</Button>
            </div>
          )}
        </div>

        {/* Status Laporan Accordion */}
        <div className="bg-white rounded-md shadow-sm mb-6">
          <button 
            className="w-full flex items-center justify-between p-4 focus:outline-none"
            onClick={() => setShowStatusPanel(!showStatusPanel)}
          >
            <span className="font-bold text-gray-900">Status Laporan</span>
            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${showStatusPanel ? "rotate-180" : ""}`} />
          </button>
          
          {showStatusPanel && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm grid grid-cols-[120px_1fr] gap-y-2">
              <div className="text-gray-500">Nomor Tiket</div>
              <div className="font-medium">{ticket.id.split("-")[1] || ticket.id}</div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium">{ticket.status === "open" ? "Sedang Berlangsung" : ticket.status === "resolved" ? "Selesai" : "Ditolak"}</div>
              <div className="text-gray-500">Tanggal</div>
              <div className="font-medium">{new Date(ticket.createdAt).toLocaleString("id-ID")}</div>
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="space-y-6">
          {/* First Message (The Original Ticket Description) */}
          <div className="flex justify-end">
            <div className="bg-[#cdeaf6] text-gray-800 p-4 rounded-xl rounded-tr-sm max-w-2xl text-sm shadow-sm">
              <div className="mb-3 space-y-0.5">
                <p><span className="font-semibold">Player id:</span> {ticket.userSystemId ?? ticket.userId.slice(-8)}</p>
                <p><span className="font-semibold">Nickname:</span> {ticket.userName}</p>
                <p className="font-semibold mt-2">Isi pesan:</p>
                <p className="whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
              </div>
              <div className="text-right text-[11px] text-gray-500 mt-2">
                {new Date(ticket.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Subsequent Messages */}
          {(ticket.messages || []).map(msg => {
            const isMe = msg.senderId === user.id;
            // Admin styling matches the white bubble on the left in Garena
            if (isMe) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-[#cdeaf6] text-gray-800 p-4 rounded-xl rounded-tr-sm max-w-2xl text-sm shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className="text-right text-[11px] text-gray-500 mt-2">
                      {new Date(msg.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="bg-white text-gray-800 p-4 rounded-xl rounded-tl-sm max-w-2xl text-sm shadow-sm border border-gray-100">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className="text-right text-[11px] text-gray-500 mt-3">
                      {new Date(msg.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Input or Closed Status */}
        <div className="mt-8 flex justify-center">
          {ticket.status === "open" ? (
            <div className="w-full max-w-2xl bg-white p-3 rounded-full shadow-sm flex items-center border border-gray-200">
              <input 
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tulis balasan..."
                className="flex-1 bg-transparent px-4 py-1 focus:outline-none text-sm"
                onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              />
              <button 
                onClick={handleSend}
                disabled={!text.trim()}
                className="px-6 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
              >
                Kirim
              </button>
            </div>
          ) : (
            <div className="bg-[#e0e0e0] px-16 py-2 rounded-sm shadow-inner text-sm font-bold italic text-gray-700">
              ~Tiket Anda telah ditutup
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
