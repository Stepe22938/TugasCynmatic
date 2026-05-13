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
      <div className="min-h-[calc(100vh-80px)] bg-[#f3f4f6] pb-24">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-4">
            <button onClick={() => setView("list")} className="inline-flex items-center text-[#1ea1f2] hover:underline font-medium text-sm">
              <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
            </button>
          </div>

          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-8">Buat Tiket Laporan</h2>
            
            <div className="space-y-6 max-w-3xl">
              <div>
                <label className="block text-[13px] text-gray-700 mb-2">Nama pengguna:</label>
                <input type="text" value={user.name} disabled className="w-full bg-[#f5f5f5] text-gray-500 border border-gray-200 rounded-sm p-2.5 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-[13px] text-gray-700 mb-2">Platform / Layanan</label>
                <input type="text" value="Toko Online Cynmatic" disabled className="w-full bg-[#f5f5f5] text-gray-500 border border-gray-200 rounded-sm p-2.5 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-[13px] text-gray-700 mb-0.5">Player id</label>
                <p className="text-[11px] text-gray-500 mb-2">Player id dapat anda lihat pada profile in app</p>
                <input type="text" value={user.systemId ?? user.id.slice(-6)} disabled className="w-full bg-[#f5f5f5] text-gray-500 border border-gray-200 rounded-sm p-2.5 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-[13px] text-gray-700 mb-2">Nickname</label>
                <input type="text" value={user.name} disabled className="w-full bg-[#f5f5f5] text-gray-500 border border-gray-200 rounded-sm p-2.5 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-[13px] text-gray-700 mb-2">Kategori</label>
                <select 
                  value={kategori} 
                  onChange={(e) => { setKategori(e.target.value); setSubKategori(""); }}
                  className="w-full bg-white border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-gray-400"
                >
                  <option value="" disabled>Pilih Kategori</option>
                  <option value="Akun">Akun</option>
                  <option value="Pesanan">Pesanan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] text-gray-700 mb-2">Sub Kategori</label>
                <select 
                  value={subKategori} 
                  onChange={(e) => setSubKategori(e.target.value)}
                  disabled={!kategori}
                  className="w-full bg-white border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-gray-400 disabled:bg-[#f5f5f5]"
                >
                  <option value="" disabled>Pilih Sub Kategori</option>
                  {kategori === "Akun" && (
                    <>
                      <option value="Pengecekan Banned">Pengecekan Banned</option>
                      <option value="Pengajuan Rank Up">Pengajuan Rank Up</option>
                    </>
                  )}
                  {kategori === "Pesanan" && (
                    <>
                      <option value="Barang Tidak Sampai">Barang Tidak Sampai</option>
                      <option value="Kendala Kurir">Kendala Kurir</option>
                    </>
                  )}
                  {kategori === "Lainnya" && (
                    <option value="Pertanyaan Umum">Pertanyaan Umum</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[13px] text-gray-700 mb-2">Isi Laporan</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm p-2.5 text-sm h-32 resize-none outline-none focus:border-gray-400"
                  placeholder="Deskripsikan masalah Anda..."
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleCreate}
                  disabled={!isFormValid}
                  className={`w-full py-3 rounded-sm text-sm font-bold transition-colors ${
                    isFormValid ? "bg-[#b2b2b2] hover:bg-gray-400 text-white" : "bg-[#d1d1d1] text-gray-100 cursor-not-allowed"
                  }`}
                >
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f3f4f6] pb-24">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header / Kembali */}
        <div className="mb-4">
          <Link href="/profile" className="inline-flex items-center text-[#1ea1f2] hover:underline font-medium text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#e2e2e2] rounded-t-md flex items-center p-1 gap-1 mb-4">
          <button 
            onClick={() => setActiveTab("open")}
            className={`flex-1 py-2 text-sm font-medium text-center rounded-sm transition-colors ${activeTab === "open" ? "bg-white text-red-600 shadow-sm" : "text-gray-600 hover:bg-gray-300/50"}`}
          >
            Sedang berlangsung
          </button>
          <button 
            onClick={() => setActiveTab("closed")}
            className={`flex-1 py-2 text-sm font-medium text-center rounded-sm transition-colors ${activeTab === "closed" ? "bg-white text-gray-800 shadow-sm" : "text-gray-600 hover:bg-gray-300/50"}`}
          >
            Ditutup
          </button>
        </div>

        {/* Ticket List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-md p-8 text-center shadow-sm">
              <p className="text-gray-500 text-sm">Tidak ada tiket di kategori ini.</p>
            </div>
          ) : (
            filteredTickets.map(t => (
              <Link key={t.id} href={`/ticket/${t.id}`}>
                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow block">
                  <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                    <div className="text-gray-500">Nomor Tiket.</div>
                    <div className="text-gray-900">{t.id.split("-")[1] || t.id}</div>

                    <div className="text-gray-500">Kategori</div>
                    <div className="text-gray-900">
                      {t.type === "order_problem" ? "Pesanan" : t.type === "rank_up" ? "Akun" : "Bantuan Umum"}
                    </div>

                    <div className="text-gray-500">Sub Kategori</div>
                    <div className="font-bold text-gray-900">
                      {t.type === "order_problem" ? "Kendala Pengiriman/Barang" : t.type === "rank_up" ? "Pengajuan Seller" : "Lainnya"}
                    </div>

                    <div className="text-gray-500">Terakhir diperbarui</div>
                    <div className="text-gray-900">
                      {new Date(t.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>

                    <div className="font-bold text-gray-900 pt-1">Status</div>
                    <div className="text-gray-900 pt-1">
                      {t.status === "open" ? "Sedang Berlangsung" : t.status === "resolved" ? "Selesai" : "Ditolak"}
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
        className="fixed bottom-8 right-8 w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-10"
      >
        <Plus className="h-8 w-8" />
      </button>
    </div>
  );
}
