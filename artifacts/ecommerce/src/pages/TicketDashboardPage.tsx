import React, { useState } from "react";
import { Link } from "wouter";
import { useTickets } from "../contexts/TicketContext";
import { useAuth } from "../contexts/AuthContext";
import { ChevronLeft, Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

export function TicketDashboardPage() {
  const { getUserTickets, createTicket } = useTickets();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [view, setView] = useState<"list" | "create">("list");
  
  // Create Form State
  const [kategori, setKategori] = useState("");
  const [subKategori, setSubKategori] = useState("");
  const [newDesc, setNewDesc] = useState("");

  if (!user) return null;

  const tickets = getUserTickets();
  const filteredTickets = tickets.filter(t => 
    activeTab === "open" ? t.status === "open" : (t.status === "resolved" || t.status === "rejected")
  );

  const handleCreate = () => {
    if (!kategori || !subKategori || !newDesc.trim()) return;
    const type = kategori === "Pesanan" ? "order_problem" : kategori === "Akun" ? "rank_up" : "other";
    createTicket(type, `Kategori: ${kategori}\nSub Kategori: ${subKategori}\n\n${newDesc.trim()}`);
    setKategori("");
    setSubKategori("");
    setNewDesc("");
    setView("list");
    toast({ title: "Tiket Dibuat", description: "Laporan Anda telah berhasil dikirim." });
    setActiveTab("open");
  };

  if (view === "create") {
    const isFormValid = kategori !== "" && subKategori !== "" && newDesc.trim() !== "";
    
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#050505] text-white pb-32 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-24 right-1/4 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
          <div className="mb-6">
            <button 
              onClick={() => setView("list")} 
              className="inline-flex items-center text-red-500 hover:text-red-400 font-black uppercase text-xs tracking-widest gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl transition-all active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" /> Kembali Ke Arsip
            </button>
          </div>

          <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#0a0a0c]/40 p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            <h2 className="text-2xl font-black text-white italic uppercase tracking-wider mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
              Buat Tiket Laporan
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Nama Pengguna</label>
                  <input type="text" value={user.name} disabled className="w-full bg-white/5 text-white/50 border border-white/10 rounded-2xl p-4 text-sm outline-none cursor-not-allowed font-medium" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Platform / Layanan</label>
                  <input type="text" value="Toko Online TokoArthur" disabled className="w-full bg-white/5 text-white/50 border border-white/10 rounded-2xl p-4 text-sm outline-none cursor-not-allowed font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Player ID</label>
                  <p className="text-[10px] text-white/20 mb-2">Identitas unik akun Anda</p>
                  <input type="text" value={user.systemId ?? user.id.slice(-6)} disabled className="w-full bg-white/5 text-white/50 border border-white/10 rounded-2xl p-4 text-sm outline-none cursor-not-allowed font-mono font-bold" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Nickname Akun</label>
                  <p className="text-[10px] text-white/20 mb-2">Nama tampilan saat ini</p>
                  <input type="text" value={user.name} disabled className="w-full bg-white/5 text-white/50 border border-white/10 rounded-2xl p-4 text-sm outline-none cursor-not-allowed font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Pilih Kategori Laporan</label>
                <div className="relative">
                  <select 
                    value={kategori} 
                    onChange={(e) => { setKategori(e.target.value); setSubKategori(""); }}
                    className="w-full bg-[#0a0a0c] text-white border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-red-500/50 transition-all font-bold cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#0a0a0c]">Pilih Kategori</option>
                    <option value="Akun" className="bg-[#0a0a0c]">Akun & Keanggotaan</option>
                    <option value="Pesanan" className="bg-[#0a0a0c]">Transaksi & Pesanan</option>
                    <option value="Lainnya" className="bg-[#0a0a0c]">Pertanyaan Lainnya</option>
                  </select>
                </div>
              </div>

              {kategori && (
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Sub Kategori</label>
                  <div className="relative">
                    <select 
                      value={subKategori} 
                      onChange={(e) => setSubKategori(e.target.value)}
                      className="w-full bg-[#0a0a0c] text-white border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-red-500/50 transition-all font-bold cursor-pointer"
                    >
                      <option value="" disabled className="bg-[#0a0a0c]">Pilih Sub Kategori</option>
                      {kategori === "Akun" && (
                        <>
                          <option value="Pengecekan Banned" className="bg-[#0a0a0c]">Pengecekan Banned / Penangguhan</option>
                          <option value="Pengajuan Rank Up" className="bg-[#0a0a0c]">Pengajuan Seller / Mitra Kerja</option>
                        </>
                      )}
                      {kategori === "Pesanan" && (
                        <>
                          <option value="Barang Tidak Sampai" className="bg-[#0a0a0c]">Barang Tidak Sampai / Terlambat</option>
                          <option value="Kendala Kurir" className="bg-[#0a0a0c]">Kendala Pelayanan Kurir</option>
                        </>
                      )}
                      {kategori === "Lainnya" && (
                        <option value="Pertanyaan Umum" className="bg-[#0a0a0c]">Pertanyaan Umum & Bantuan</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Isi Laporan / Deskripsi Kendala</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-white/5 text-white border border-white/10 rounded-2xl p-4 text-sm h-36 resize-none outline-none focus:border-red-500/50 placeholder-white/20 transition-all font-medium"
                  placeholder="Deskripsikan secara detail masalah atau kendala yang Anda alami..."
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleCreate}
                  disabled={!isFormValid}
                  className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    isFormValid 
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_35px_rgba(239,68,68,0.4)] active:scale-[0.98]" 
                      : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                  }`}
                >
                  Kirim Laporan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#050505] text-white pb-32 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        
        {/* Header / Kembali */}
        <div className="mb-6">
          <Link href="/profile">
            <button className="inline-flex items-center text-white/50 hover:text-white font-black uppercase text-xs tracking-widest gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl transition-all active:scale-95">
              <ChevronLeft className="h-4 w-4" /> Dashboard Profile
            </button>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center p-1.5 gap-1 mb-6">
          <button 
            onClick={() => setActiveTab("open")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest text-center rounded-xl transition-all ${
              activeTab === "open" 
                ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                : "text-white/40 hover:bg-white/5 hover:text-white"
            }`}
          >
            Aktif / Berlangsung
          </button>
          <button 
            onClick={() => setActiveTab("closed")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest text-center rounded-xl transition-all ${
              activeTab === "closed" 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-white/40 hover:bg-white/5 hover:text-white"
            }`}
          >
            Selesai / Ditutup
          </button>
        </div>

        {/* Ticket List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="glass-card rounded-[2rem] p-16 text-center border border-white/5 bg-[#0a0a0c]/20">
              <p className="text-white/40 font-bold italic text-sm">Tidak ada berkas laporan di kategori ini.</p>
            </div>
          ) : (
            filteredTickets.map(t => (
              <Link key={t.id} href={`/ticket/${t.id}`}>
                <div className="glass-card border border-white/5 bg-[#0a0a0c]/20 rounded-[2rem] p-6 sm:p-8 cursor-pointer hover:border-white/15 hover:shadow-[0_0_30px_rgba(255,255,255,0.01)] transition-all block group">
                  <div className="grid grid-cols-[140px_1fr] gap-y-4 text-sm items-center">
                    
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">ID Tiket</div>
                    <div className="font-mono text-xs font-bold text-white/80 group-hover:text-red-500 transition-colors">#{t.id.split("-")[1] || t.id}</div>

                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Kategori</div>
                    <div className="text-white font-black uppercase text-xs italic tracking-wider">
                      {t.type === "order_problem" ? "Pesanan" : t.type === "rank_up" ? "Akun & Keanggotaan" : "Bantuan Umum"}
                    </div>

                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Kasus Masalah</div>
                    <div className="font-bold text-white/90">
                      {t.type === "order_problem" ? "Kendala Pengiriman/Barang" : t.type === "rank_up" ? "Pengajuan Seller" : "Lainnya"}
                    </div>

                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Telemetry Log</div>
                    <div className="text-white/50 text-xs font-medium">
                      {new Date(t.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>

                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest pt-2 border-t border-white/5">Status Telemetri</div>
                    <div className="pt-2 border-t border-white/5 flex items-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        t.status === "open" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : t.status === "resolved" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-white/5 text-white/40 border-white/10"
                      }`}>
                        {t.status === "open" ? "Sedang Diproses" : t.status === "resolved" ? "Selesai" : "Ditolak"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => setView("create")}
        className="fixed bottom-10 right-10 w-16 h-16 bg-red-600 text-white rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_45px_rgba(239,68,68,0.6)] hover:bg-red-700 active:scale-95 transition-all z-10"
      >
        <Plus className="h-8 w-8" />
      </button>
    </div>
  );
}
