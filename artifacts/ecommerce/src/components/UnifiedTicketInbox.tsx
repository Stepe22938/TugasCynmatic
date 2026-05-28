import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTickets, Ticket, TicketStatus } from "../contexts/TicketContext";
import { useAuth, User } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Search,
  Paperclip,
  Sparkles,
  Send,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  MessageSquare,
  Gift,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

interface UnifiedTicketInboxProps {
  preSelectedTicketId?: string;
}

export function UnifiedTicketInbox({ preSelectedTicketId }: UnifiedTicketInboxProps) {
  const { tickets, addMessage, updateTicket, createTicket } = useTickets();
  const { user, allUsers, addCoins } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Selected Ticket State
  const [activeTicketId, setActiveTicketId] = useState<string | null>(preSelectedTicketId || null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"semua" | "terbuka" | "pending" | "selesai">("semua");

  // Chat Input State
  const [replyText, setReplyText] = useState("");

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKategori, setNewKategori] = useState("");
  const [newSubKategori, setNewSubKategori] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Interactive AI states per ticket
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState(false);
  const [aiAnalyzedTickets, setAiAnalyzedTickets] = useState<Record<string, { sentiment: string; tags: string[]; summary: string }>>({});

  // Typing indicator simulation
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Mobile View state: on mobile, show chat screen instead of inbox list
  const [mobileShowChat, setMobileShowChat] = useState(!!preSelectedTicketId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync route pre-selection
  useEffect(() => {
    if (preSelectedTicketId) {
      setActiveTicketId(preSelectedTicketId);
      setMobileShowChat(true);
    }
  }, [preSelectedTicketId]);

  // Auto-scroll chat history
  useEffect(() => {
    const messageList = messagesListRef.current;
    if (!messageList) return;

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth"
    });
  }, [activeTicketId, tickets, isAiTyping]);

  // Keep the ticket workspace locked to the viewport without rewriting every parent node.
  useEffect(() => {
    const originalRestoration = 'scrollRestoration' in window.history ? window.history.scrollRestoration : 'auto';
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const forceScrollToTop = () => {
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
    };

    forceScrollToTop();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const timer1 = setTimeout(forceScrollToTop, 20);
    const timer2 = setTimeout(forceScrollToTop, 80);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = originalRestoration;
      }
    };
  }, []);

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Advanced styling avatars based on user initials
  const getAvatarGradient = (initials: string) => {
    const char = initials[0] || "A";
    if (char >= "A" && char <= "E") return "bg-gradient-to-br from-rose-400 via-pink-500 to-red-600 text-white shadow-rose-200/50 shadow-md";
    if (char >= "F" && char <= "J") return "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-orange-200/50 shadow-md";
    if (char >= "K" && char <= "O") return "bg-gradient-to-br from-teal-400 via-emerald-500 to-green-600 text-white shadow-emerald-200/50 shadow-md";
    if (char >= "P" && char <= "T") return "bg-gradient-to-br from-indigo-400 via-purple-500 to-violet-600 text-white shadow-indigo-200/50 shadow-md";
    return "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shadow-blue-200/50 shadow-md";
  };

  // Heuristic attributes generator to perfectly match reference UI aesthetics
  const getTicketAesthetic = (t: Ticket) => {
    const text = (t.description + " " + (t.messages || []).map((m) => m.text).join(" ")).toLowerCase();

    // AI Overrides if analyzed
    if (aiAnalyzedTickets[t.id]) {
      const overrides = aiAnalyzedTickets[t.id];
      let channel = "Live Chat";
      if (t.type === "order_problem") channel = "WhatsApp";
      else if (t.type === "rank_up") channel = "Email";

      return {
        sentiment: overrides.sentiment,
        channel,
        tags: overrides.tags,
        role: "Freelancer",
        phone: "+62 813-9988-1122",
        email: `${t.userName.toLowerCase().replace(/\s+/g, "")}@iultech.com`,
        joined: "1 Jun 2024",
        bio: overrides.summary,
        csat: overrides.sentiment === "Puas" ? 96 : overrides.sentiment === "Netral" ? 64 : 12
      };
    }

    // Default aesthetics based on content
    if (text.includes("garansi") || text.includes("aktivasi") || text.includes("blender")) {
      return {
        sentiment: "Netral",
        channel: "Live Chat",
        tags: ["Garansi", "Aktivasi", "Produk"],
        role: "Freelancer",
        phone: "+62 813-9988-1122",
        email: `${t.userName.toLowerCase().replace(/\s+/g, "")}@iultech.com`,
        joined: "1 Jun 2024",
        bio: "Pelanggan baru saja membeli blender dan menanyakan cara aktivasi garansi. AI menyarankan untuk mendaftarkan nomor seri 12 digit yang terletak di badan blender.",
        csat: 64
      };
    } else if (text.includes("kirim") || text.includes("ukuran") || text.includes("pesanan")) {
      return {
        sentiment: "Marah",
        channel: "Email",
        tags: ["Ukuran", "Pengiriman", "Pesanan"],
        role: "Pengusaha",
        phone: "+62 812-4433-8899",
        email: `${t.userName.toLowerCase().replace(/\s+/g, "")}@mail.com`,
        joined: "15 Jan 2024",
        bio: "Pelanggan menyampaikan keluhan atas kesalahan ukuran produk yang dikirimkan. Menunggu konfirmasi penukaran produk dari bagian logistik.",
        csat: 15
      };
    } else if (text.includes("terlambat") || text.includes("belum") || text.includes("minggu")) {
      return {
        sentiment: "Marah",
        channel: "WhatsApp",
        tags: ["Terlambat", "Pengiriman", "Kurir"],
        role: "Karyawan Swasta",
        phone: "+62 878-1122-3344",
        email: `${t.userName.toLowerCase().replace(/\s+/g, "")}@yahoo.com`,
        joined: "10 Feb 2025",
        bio: "Pelanggan menanyakan status pengiriman barang yang terlambat selama 2 minggu. Perlu pengecekan manifest kurir secepatnya.",
        csat: 8
      };
    } else if (text.includes("terima kasih") || text.includes("beres") || text.includes("puas")) {
      return {
        sentiment: "Puas",
        channel: "WhatsApp",
        tags: ["Selesai", "Layanan", "Bantuan"],
        role: "Mahasiswa",
        phone: "+62 899-4455-6677",
        email: `${t.userName.toLowerCase().replace(/\s+/g, "")}@student.ac.id`,
        joined: "22 Agt 2024",
        bio: "Kasus terselesaikan dengan baik. Pelanggan menyatakan kepuasan tinggi terhadap kecepatan respon customer service.",
        csat: 98
      };
    } else {
      return {
        sentiment: "Netral",
        channel: "Instagram",
        tags: ["Layanan", "Pertanyaan"],
        role: "Member Umum",
        phone: "+62 855-6677-8899",
        email: `${t.userName.toLowerCase().replace(/\s+/g, "")}@cynmatic.net`,
        joined: "5 Sep 2025",
        bio: "Pelanggan berkonsultasi mengenai detail teknis produk. Informasi penjelasan dasar telah disampaikan.",
        csat: 50
      };
    }
  };

  const isAdmin = user.role === "admin";
  const userTickets = isAdmin ? tickets : tickets.filter((t) => t.userId === user.id);

  // Filter & Search Tickets
  const filteredTickets = userTickets.filter((t) => {
    const matchesSearch =
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "terbuka") return t.status === "open";
    if (activeTab === "pending") return t.status === "open";
    if (activeTab === "selesai") return t.status === "resolved" || t.status === "rejected";
    return true;
  });

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || null;
  const activeAesthetics = activeTicket ? getTicketAesthetic(activeTicket) : null;
  const activeTicketUser = activeTicket ? allUsers.find((u) => u.id === activeTicket.userId) : null;

  const formatJoinedDate = (createdAt?: string) => {
    if (!createdAt) return "Tidak tersedia";

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "Tidak tersedia";

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getRoleLabel = (role?: string) => {
    if (role === "admin") return "Admin";
    if (role === "seller") return "Seller";
    if (role === "kurir") return "Kurir";
    return "Mahasiswa";
  };

  const activeContact = activeTicket
    ? {
        email: activeTicketUser?.email || activeAesthetics?.email || "Email belum tersedia",
        phone:
          (activeTicketUser as any)?.phone ||
          (activeTicketUser as any)?.phoneNumber ||
          (activeTicketUser as any)?.whatsapp ||
          "Nomor belum tersedia",
        joined: formatJoinedDate(activeTicketUser?.createdAt),
        role: getRoleLabel(activeTicketUser?.role)
      }
    : null;

  // Urgent counts
  const urgentCount = userTickets.filter((t) => {
    const aes = getTicketAesthetic(t);
    return t.status === "open" && aes.sentiment === "Marah";
  }).length;

  // Send Message
  const handleSendMessage = () => {
    if (!activeTicket || !replyText.trim()) return;
    addMessage(activeTicket.id, replyText.trim());
    setReplyText("");

    if (!isAdmin) {
      setTimeout(() => {
        addMessage(
          activeTicket.id,
          "Terima kasih atas tanggapan Anda! Pesan Anda telah didistribusikan ke portal prioritas admin TokoArthur. Kami akan membalas secepat mungkin."
        );
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // AI Assistant - Smart Typing Draft Response
  const handleAIDraft = () => {
    if (!activeTicket) return;
    const clientName = activeTicket.userName;
    const lastMsg =
      activeTicket.messages.length > 0
        ? activeTicket.messages[activeTicket.messages.length - 1].text
        : activeTicket.description;

    setIsAiTyping(true);
    toast({
      title: "✨ Asisten AI Aktif",
      description: "Menghitung respons terbaik dan mengetik draf draf..."
    });

    let draft = "";
    if (lastMsg.toLowerCase().includes("garansi") || lastMsg.toLowerCase().includes("aktivasi")) {
      draft = `Halo ${clientName}! Untuk aktivasi garansi produk blender baru Anda, cukup daftarkan nomor seri 12 digit yang terletak di stiker pada bagian bawah/badan blender langsung (bukan pada kardus ya) ke halaman resmi kami di garansi.iultech.com dalam waktu maksimal 14 hari dari pembelian. Jika ada kendala input seri, silakan kirimkan foto stiker tersebut di sini agar kami bantu verifikasi. Ada hal lain yang bisa kami bantu?`;
    } else if (lastMsg.toLowerCase().includes("ukuran") || lastMsg.toLowerCase().includes("salah kirim")) {
      draft = `Halo ${clientName}, kami memohon maaf yang sebesar-besarnya atas ketidaknyamanan karena kesalahan pengiriman ukuran produk tersebut. Mohon bantu lampirkan foto label ukuran pada produk beserta invoice pembelian Anda. Kami akan segera memproses penukaran ukuran yang sesuai dengan gratis ongkir sepenuhnya. Terima kasih atas pengertiannya.`;
    } else if (lastMsg.toLowerCase().includes("terlambat") || lastMsg.toLowerCase().includes("belum sampai")) {
      draft = `Halo ${clientName}, kami mengerti kekhawatiran Anda mengenai pengiriman yang terlambat ini. Kami telah memeriksa telemetri manifes logistik dan segera berkoordinasi dengan kurir lapangan untuk mempercepat pengiriman hari ini. Kami akan memantau statusnya hingga paket tiba dengan selamat di tangan Anda. Mohon ditunggu ya.`;
    } else {
      draft = `Halo ${clientName}, terima kasih telah menghubungi tim bantuan kami. Kami sangat senang bisa mendampingi Anda menyelesaikan kendala ini. Silakan ikuti panduan awal yang kami sediakan, dan kabari kami segera jika Anda menemui kendala tambahan atau memiliki pertanyaan lebih lanjut! 😊`;
    }

    // Simulate Typing latency for 1.4s
    setTimeout(() => {
      setReplyText(draft);
      setIsAiTyping(false);
      toast({
        title: "✨ Draf AI Siap!",
        description: "Draf balasan cerdas berhasil dimasukkan ke kolom input."
      });
    }, 1400);
  };

  // AI Sentiment & Classification
  const handleAISentimentAnalysis = () => {
    if (!activeTicket) return;
    setAiAnalysisRunning(true);

    toast({
      title: "🔮 AI Heuristik Berjalan...",
      description: "Memindai linguistik teks untuk memetakan emosi..."
    });

    setTimeout(() => {
      const isAngry = activeTicket.description.toLowerCase().includes("lambat") || activeTicket.description.toLowerCase().includes("salah");
      const isHappy = activeTicket.description.toLowerCase().includes("makasih") || activeTicket.description.toLowerCase().includes("beres");

      const finalSentiment = isAngry ? "Marah" : isHappy ? "Puas" : "Netral";
      let finalTags = ["Garansi", "Aktivasi", "Produk"];
      if (isAngry) finalTags = ["Keterlambatan", "Pengiriman", "Komplain"];
      else if (isHappy) finalTags = ["Selesai", "Apresiasi", "Layanan"];

      const clientName = activeTicket.userName;
      const lastMsg =
        activeTicket.messages.length > 0
          ? activeTicket.messages[activeTicket.messages.length - 1].text
          : activeTicket.description;

      let draft = "";
      if (lastMsg.toLowerCase().includes("garansi") || lastMsg.toLowerCase().includes("aktivasi")) {
        draft = `Halo ${clientName}! Untuk aktivasi garansi produk blender baru Anda, cukup daftarkan nomor seri 12 digit yang terletak di stiker pada bagian bawah/badan blender langsung (bukan pada kardus ya) ke halaman resmi kami di garansi.iultech.com dalam waktu maksimal 14 hari dari pembelian. Jika ada kendala input seri, silakan kirimkan foto stiker tersebut di sini agar kami bantu verifikasi. Ada hal lain yang bisa kami bantu?`;
      } else if (lastMsg.toLowerCase().includes("ukuran") || lastMsg.toLowerCase().includes("salah kirim")) {
        draft = `Halo ${clientName}, kami memohon maaf yang sebesar-besarnya atas ketidaknyamanan karena kesalahan pengiriman ukuran produk tersebut. Mohon bantu lampirkan foto label ukuran pada produk beserta invoice pembelian Anda. Kami akan segera memproses penukaran ukuran yang sesuai dengan gratis ongkir sepenuhnya. Terima kasih atas pengertiannya.`;
      } else if (lastMsg.toLowerCase().includes("terlambat") || lastMsg.toLowerCase().includes("belum sampai")) {
        draft = `Halo ${clientName}, kami mengerti kekhawatiran Anda mengenai pengiriman yang terlambat ini. Kami telah memeriksa telemetri manifes logistik dan segera berkoordinasi dengan kurir lapangan untuk mempercepat pengiriman hari ini. Kami akan memantau statusnya hingga paket tiba dengan selamat di tangan Anda. Mohon ditunggu ya.`;
      } else {
        draft = `Halo ${clientName}, terima kasih telah menghubungi tim bantuan kami. Kami sangat senang bisa mendampingi Anda menyelesaikan kendala ini. Silakan ikuti panduan awal yang kami sediakan, dan kabari kami segera jika Anda menemui kendala tambahan atau memiliki pertanyaan lebih lanjut! 😊`;
      }

      const summary = `Pelanggan atas nama ${activeTicket.userName} melaporkan kendala terkait "${
        activeTicket.description.substring(0, 45)
      }...". AI memetakan emosi pelanggan berada pada kondisi ${finalSentiment.toUpperCase()}. Dukungan logistik disarankan mengambil tindakan prioritas.`;

      setAiAnalyzedTickets((prev) => ({
        ...prev,
        [activeTicket.id]: {
          sentiment: finalSentiment,
          tags: finalTags,
          summary
        }
      }));

      // Save analysis history to database asynchronously
      fetch("/api/ai/analysis-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          userId: activeTicket.userId,
          userName: activeTicket.userName,
          sentiment: finalSentiment,
          tags: finalTags,
          summary: summary,
          description: activeTicket.description.replace(/Kategori:.*Sub Kategori:.*\n*/, "") || activeTicket.description,
          aiResponse: draft
        })
      }).catch(err => console.error("Gagal menyimpan riwayat analisis AI:", err));

      setAiAnalysisRunning(false);
      toast({
        title: "🔮 Analisis AI Selesai!",
        description: `Sentimen terdeteksi: ${finalSentiment} | CSAT terhitung.`
      });
    }, 1200);
  };

  // Direct CRM Coin Compensation action!
  const handleCoinCompensation = () => {
    if (!activeTicket) return;
    try {
      addCoins(activeTicket.userId, 500);
      toast({
        title: "🎁 Koin Kompensasi Dikirim!",
        description: `Berhasil mengirimkan bonus +500 Koin ke dompet ${activeTicket.userName} sebagai kompensasi bantuan!`
      });
      // Add system log into chat
      addMessage(activeTicket.id, `🤖 [SISTEM CRM]: Admin memberikan kompensasi sebesar +500 Koin kepada pelanggan.`);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Aksi Gagal",
        description: "Tidak bisa menghubungkan ke VPS Koin."
      });
    }
  };

  // Create Ticket Submit
  const handleCreateTicketSubmit = () => {
    if (!newKategori || !newSubKategori || !newDesc.trim()) {
      toast({
        variant: "destructive",
        title: "Formulir Kosong",
        description: "Mohon lengkapi seluruh kolom laporan bantuan."
      });
      return;
    }

    const type = newKategori === "Pesanan" ? "order_problem" : newKategori === "Akun" ? "rank_up" : "other";
    createTicket(type, `Kategori: ${newKategori}\nSub Kategori: ${newSubKategori}\n\n${newDesc.trim()}`);

    setNewKategori("");
    setNewSubKategori("");
    setNewDesc("");
    setShowCreateModal(false);

    toast({
      title: "✨ Laporan Terkirim",
      description: "Tiket keluhan Anda berhasil didaftarkan ke remote VPS TokoArthur."
    });

    setTimeout(() => {
      if (tickets.length > 0) {
        setActiveTicketId(tickets[0].id);
      }
    }, 100);
  };

  return (
    <div ref={containerRef} className="ticket-workspace fixed inset-0 z-[99999] bg-[#f4f6f8] text-[#2c3e50] font-sans antialiased overflow-hidden flex h-[100dvh] max-h-[100dvh] w-screen max-w-screen min-w-0">
      {/* Strict full screen viewport constraint styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          width: 100vw !important;
          max-width: 100vw !important;
          overflow: hidden !important;
        }

        body:has(.ticket-workspace),
        #root:has(.ticket-workspace),
        #root:has(.ticket-workspace) > div {
          height: 100dvh !important;
          max-height: 100dvh !important;
          overflow: hidden !important;
        }

        /* Suppress global TokoArthur navbar & scrollbars on ticket system pages without touching our internal component headers */
        header {
          display: none !important;
        }
        /* Except our internal chat console header */
        header.bg-white {
          display: flex !important;
          position: relative !important;
          top: auto !important;
          left: auto !important;
          height: auto !important;
          width: auto !important;
          margin: 0 !important;
        }

        nav.fixed, footer, .global-music-player {
          display: none !important;
        }

        /* Let the full-screen route wrapper hand all available space to the inbox. */
        main:has(.ticket-workspace),
        main:has(> div > .ticket-workspace) {
          margin: 0 !important;
          padding: 0 !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          width: 100vw !important;
          max-width: 100vw !important;
          overflow: hidden !important;
          position: fixed !important;
          inset: 0 !important;
        }

        /* Beautiful custom scrollbar for inbox lists and chats */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Background Accent Decorative Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-200/20 blur-[120px] rounded-full pointer-events-none" />

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* COLUMN 1: LEFT VERTICAL MINI-SIDEBAR */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <aside className="w-16 bg-white border-r border-[#e9ecef] flex flex-col items-center py-5 justify-between flex-shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.015)] h-full min-h-0">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Pulsing AI Logo Icon */}
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }} 
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black text-lg"
          >
            ✨
          </motion.div>

          {/* Navigation Group */}
          <nav className="flex flex-col gap-4 mt-8 w-full px-2">
            <button
              onClick={() => {
                setLocation("/tickets");
                setMobileShowChat(false);
              }}
              title="Kotak Masuk"
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-indigo-50 text-indigo-600 shadow-sm"
            >
              <Inbox className="h-5 w-5" />
            </button>
            <button
              onClick={() => toast({ title: "Fitur Analytics", description: "Modul pelaporan performa sedang dimuat..." })}
              title="Analytics"
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-[#a0aec0] hover:text-[#4a5568] hover:bg-[#f8f9fa]"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => toast({ title: "Database Pelanggan", description: "Membuka daftar log pengguna CRM..." })}
              title="Customers"
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-[#a0aec0] hover:text-[#4a5568] hover:bg-[#f8f9fa]"
            >
              <Users className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLocation("/settings")}
              title="Pengaturan"
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-[#a0aec0] hover:text-[#4a5568] hover:bg-[#f8f9fa]"
            >
              <Settings className="h-5 w-5" />
            </button>
          </nav>
        </div>

        {/* Bottom Group */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => setLocation(isAdmin ? "/admin" : "/profile")}
            title="Keluar / Kembali"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-[#a0aec0] hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
          </button>
          {/* User Profile initials */}
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md shadow-pink-500/20" title={user.name}>
            {getInitials(user.name)}
          </div>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* COLUMN 2: LEFT TICKET LIST ("Kotak Masuk") */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section
        className={`w-full md:w-[19rem] xl:w-80 bg-white border-r border-[#e9ecef] flex flex-col flex-shrink-0 z-10 shadow-[6px_0_30px_rgba(0,0,0,0.01)] h-full min-h-0 overflow-hidden ${
          mobileShowChat ? "hidden md:flex" : "flex"
        }`}
      >

        {/* Header Pane */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[#1e293b] tracking-tight">Kotak Masuk</h2>
            {urgentCount > 0 && (
              <span className="bg-red-50 text-red-600 text-xs font-black uppercase px-2.5 py-1 rounded-full border border-red-100 animate-pulse">
                {urgentCount} darurat
              </span>
            )}
          </div>

          {/* Search bar & "+" button */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-[#f8f9fa] rounded-xl px-3 flex items-center gap-2 border border-[#e9ecef] focus-within:border-indigo-500/30 focus-within:bg-white transition-all shadow-inner">
              <Search className="h-4 w-4 text-[#a0aec0]" />
              <input
                type="text"
                placeholder="Cari pelanggan atau topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-[#4a5568] w-full focus:outline-none py-2.5 font-semibold"
              />
            </div>
            {/* Create ticket trigger button */}
            <button
              onClick={() => setShowCreateModal(true)}
              title="Buat Laporan Baru"
              className="bg-gradient-to-tr from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Filters tabs */}
          <div className="flex items-center gap-1 border-b border-[#f1f3f5] pb-2 overflow-x-auto no-scrollbar">
            {(["semua", "terbuka", "pending", "selesai"] as const).map((tabType) => (
              <button
                key={tabType}
                onClick={() => setActiveTab(tabType)}
                className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === tabType
                    ? "bg-indigo-50/70 text-indigo-600"
                    : "text-[#a0aec0] hover:text-[#4a5568] hover:bg-[#f8f9fa]"
                }`}
              >
                {tabType}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable list of cards with Framer Motion Layout */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-6 space-y-2 no-scrollbar">
          <AnimatePresence>
            {filteredTickets.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 px-4"
              >
                <AlertCircle className="h-8 w-8 text-[#cbd5e0] mx-auto mb-2" />
                <p className="text-xs text-[#a0aec0] font-bold italic">Tidak ada tiket ditemukan</p>
              </motion.div>
            ) : (
              filteredTickets.map((t) => {
                const isActive = t.id === activeTicketId;
                const aes = getTicketAesthetic(t);
                const initials = getInitials(t.userName);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={t.id}
                    onClick={() => {
                      setActiveTicketId(t.id);
                      setLocation(`/ticket/${t.id}`);
                      setMobileShowChat(true);
                    }}
                    className={`relative rounded-2xl p-4 cursor-pointer transition-all border ${
                      isActive
                        ? "bg-indigo-50/50 border-indigo-100 shadow-sm"
                        : "bg-white border-transparent hover:border-[#e9ecef] hover:bg-[#f8f9fa] shadow-[0_2px_8px_rgba(0,0,0,0.005)]"
                    }`}
                  >
                    {/* Selected indicator bar */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeBar"
                        className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-indigo-600 rounded-r-lg" 
                      />
                    )}

                    <div className="flex gap-3">
                      {/* Colorful Gradient Circle Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${getAvatarGradient(initials)}`}>
                        {initials}
                      </div>

                      {/* Card Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-extrabold text-sm text-[#2d3748] truncate">
                            {t.userName}
                          </span>
                          <span className="text-[10px] text-[#a0aec0] font-bold whitespace-nowrap flex-shrink-0">
                            {new Date(t.createdAt).toLocaleDateString() === new Date().toLocaleDateString()
                              ? "baru saja"
                              : "4 jam lalu"}
                          </span>
                        </div>

                        {/* Description snippet */}
                        <p className="text-xs text-[#718096] font-medium truncate mb-2">
                          {t.description.replace(/Kategori:.*Sub Kategori:.*\n*/, "")}
                        </p>

                        {/* Pills Row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              aes.sentiment === "Marah"
                                ? "bg-red-50 text-red-500 border-red-100"
                                : aes.sentiment === "Puas"
                                ? "bg-emerald-50 text-emerald-500 border-emerald-100"
                                : "bg-blue-50 text-blue-500 border-blue-100"
                            }`}
                          >
                            {aes.sentiment}
                          </span>

                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              aes.channel === "WhatsApp"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : aes.channel === "Instagram"
                                ? "bg-pink-50/70 text-pink-700 border-pink-200"
                                : aes.channel === "Email"
                                ? "bg-gray-100 text-gray-700 border-gray-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}
                          >
                            {aes.channel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* COLUMN 3: CENTRAL CHAT CONSOLE */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <main
        className={`flex-1 bg-[#f8f9fa]/50 flex flex-col min-w-0 min-h-0 h-full overflow-hidden ${
          mobileShowChat ? "flex" : "hidden md:flex"
        }`}
      >

        {activeTicket ? (
          <>
            {/* Header console */}
            <header className="bg-white border-b border-[#e9ecef] px-4 sm:px-6 py-3.5 flex flex-col justify-center flex-shrink-0 shadow-[0_1px_8px_rgba(0,0,0,0.005)]">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 rounded-lg bg-[#f1f3f5] text-[#4a5568]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Gradient Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md ${getAvatarGradient(getInitials(activeTicket.userName))}`}>
                    {getInitials(activeTicket.userName)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-extrabold text-base text-[#1a202c] truncate">
                        {activeTicket.userName}
                      </h3>
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-100 flex-shrink-0">
                        {activeAesthetics?.sentiment}
                      </span>
                    </div>
                    <p className="text-xs text-[#a0aec0] font-bold mt-0.5 truncate">
                      Cara aktivasi garansi produk
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 flex-wrap flex-shrink-0">
                  <span className="bg-slate-50 text-[#4a5568] text-xs font-black uppercase px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap">
                    {activeAesthetics?.channel}
                  </span>

                  <span
                    className={`text-xs font-black uppercase px-3 py-1 rounded-full whitespace-nowrap ${
                      activeTicket.status === "open"
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    }`}
                  >
                    {activeTicket.status === "open" ? "Pending" : "Selesai"}
                  </span>

                  {/* Mark as resolved button */}
                  {isAdmin && activeTicket.status === "open" && (
                    <button
                      onClick={() => {
                        updateTicket(activeTicket.id, "resolved");
                        toast({ title: "Tiket diselesaikan", description: "Tiket bantuan telah berhasil ditutup." });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Tandai Selesai
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-label tags line */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f1f3f5] min-w-0">
                <span className="text-[10px] font-black text-[#a0aec0] uppercase tracking-wider flex-shrink-0">
                  Label AI:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {activeAesthetics?.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg whitespace-nowrap flex-shrink-0"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            {/* Message Bubble Stream with Spring animation */}
            <div ref={messagesListRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
              {/* Card Bubble 1: The Original Problem statement */}
              <div className="flex justify-start items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1 shadow-sm ${getAvatarGradient(getInitials(activeTicket.userName))}`}>
                  {getInitials(activeTicket.userName)}
                </div>
                <div className="flex flex-col max-w-[82%] sm:max-w-[70%] min-w-0">
                  <div className="bg-white border border-[#e9ecef] rounded-2xl rounded-tl-none p-4 shadow-sm text-sm text-[#2d3748] font-medium leading-relaxed">
                    <p className="whitespace-pre-wrap">
                      {activeTicket.description.replace(/Kategori:.*Sub Kategori:.*\n*/, "")}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#a0aec0] font-bold mt-1.5 ml-1">
                    {new Date(activeTicket.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>

              {/* Subsequent message histories with animated spring */}
              <AnimatePresence>
                {activeTicket.messages &&
                  activeTicket.messages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    const initials = getInitials(msg.senderName);

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        key={msg.id}
                        className={`flex items-start gap-3 ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        {!isMe && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1 shadow-sm ${getAvatarGradient(initials)}`}>
                            {initials}
                          </div>
                        )}

                        <div className="flex flex-col max-w-[82%] sm:max-w-[70%] min-w-0">
                          <div
                            className={`rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                              isMe
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none font-medium shadow-indigo-200 shadow-lg"
                                : "bg-white border border-[#e9ecef] text-[#2d3748] rounded-tl-none font-medium"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <span
                            className={`text-[10px] text-[#a0aec0] font-bold mt-1.5 ml-1 ${
                              isMe ? "text-right mr-1" : "text-left ml-1"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {isMe && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-200/50 flex-shrink-0 mt-1">
                            {initials}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </AnimatePresence>

              {/* AI Typing Indicator simulation bubble */}
              {isAiTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 justify-end"
                >
                  <div className="flex flex-col max-w-[82%] sm:max-w-[70%] min-w-0">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-tr-none p-4 flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-indigo-500 animate-spin" />
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">
                        AI sedang menulis draf...
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow flex-shrink-0 mt-1">
                    AI
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Console */}
            <div className="p-4 sm:p-5 bg-white border-t border-[#e9ecef] flex-shrink-0">
              {activeTicket.status === "open" ? (
                <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-2xl p-3 shadow-inner focus-within:bg-white focus-within:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all flex flex-col">
                  <textarea
                    rows={2}
                    placeholder="Tulis balasan... atau buat draf dengan AI"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none focus:outline-none text-sm text-[#2d3748] placeholder-[#cbd5e0] font-semibold resize-none px-2 pt-1"
                  />

                  <div className="flex items-center justify-between gap-3 border-t border-[#f1f3f5] pt-2.5 mt-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => toast({ title: "Fitur Berkas", description: "Modul unggah lampiran gambar/file siap digunakan." })}
                        title="Lampirkan File"
                        className="w-9 h-9 rounded-xl hover:bg-[#f1f3f5] text-[#a0aec0] hover:text-[#4a5568] flex items-center justify-center transition-all"
                      >
                        <Paperclip className="h-4.5 w-4.5" />
                      </button>

                      {/* AI Assist helper */}
                      <button
                        onClick={handleAIDraft}
                        disabled={isAiTyping}
                        title="Buat Draft Balasan Otomatis"
                        className="h-9 px-3 sm:px-4 rounded-xl border border-indigo-100 hover:border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> AI Draft
                      </button>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-[#a0aec0] font-black uppercase tracking-wider hidden sm:inline-block">
                        ⌘+Enter Kirim
                      </span>
                      <button
                        onClick={handleSendMessage}
                        disabled={!replyText.trim()}
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all"
                      >
                        Kirim <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-[#f8f9fa] rounded-2xl border border-dashed border-[#cbd5e0]">
                  <p className="text-xs text-[#a0aec0] font-black uppercase tracking-widest italic">
                    ~ Tiket telemetri ini telah selesai ditutup ~
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Inbox className="h-16 w-16 text-[#cbd5e0] mb-4" />
            <h3 className="text-lg font-black text-[#2d3748] mb-1">Pilih Berkas Laporan</h3>
            <p className="text-sm text-[#a0aec0] max-w-sm font-semibold">
              Klik pada salah satu kartu laporan di sisi kiri untuk memuat detail percakapan sistem bantuan.
            </p>
          </div>
        )}
      </main>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* COLUMN 4: CUSTOMER DETAILS & AI SUMMARY SIDEBAR */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTicket && (
        <aside className="w-72 xl:w-80 bg-white border-l border-[#e9ecef] flex flex-col p-5 xl:p-6 space-y-5 xl:space-y-6 flex-shrink-0 z-10 overflow-y-auto no-scrollbar hidden lg:flex shadow-[-6px_0_30px_rgba(0,0,0,0.015)] h-full min-h-0">
          {/* Section 1: Customer details header */}

          <div className="flex flex-col items-center text-center pb-6 border-b border-[#f1f3f5]">
            {/* Gradient Avatar */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl shadow-inner mb-4 ${getAvatarGradient(getInitials(activeTicket.userName))}`}>
              {getInitials(activeTicket.userName)}
            </div>
            <h4 className="font-extrabold text-base text-[#1a202c] mb-1">
              {activeTicket.userName}
            </h4>
            <span className="text-xs text-[#a0aec0] font-black uppercase tracking-widest">
              {activeContact?.role}
            </span>

            {/* Communication list */}
            <div className="w-full space-y-3 mt-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] border border-[#e9ecef] text-[#4a5568] flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#4a5568] truncate">
                  {activeContact?.email}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] border border-[#e9ecef] text-[#4a5568] flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#4a5568] truncate">
                  {activeContact?.phone}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] border border-[#e9ecef] text-[#4a5568] flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#4a5568] truncate">
                  Bergabung {activeContact?.joined}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Ticket statistics cards */}
          <div className="grid grid-cols-2 gap-3 pb-6 border-b border-[#f1f3f5]">
            <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-2xl p-4 flex flex-col shadow-inner">
              <span className="text-[10px] font-black uppercase text-[#a0aec0] tracking-wider mb-1">
                Total Tiket
              </span>
              <span className="text-2xl font-black text-[#1a202c]">
                {tickets.filter((t) => t.userId === activeTicket.userId).length}
              </span>
            </div>
            <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-2xl p-4 flex flex-col min-w-0 shadow-inner">
              <span className="text-[10px] font-black uppercase text-[#a0aec0] tracking-wider mb-1">
                Tiket Ini
              </span>
              <span className="text-xs font-extrabold text-[#4a5568] truncate font-mono mt-2.5">
                #{activeTicket.id.split("-")[1] || activeTicket.id}
              </span>
            </div>
          </div>

          {/* Section 3: AI Sentiment & Gauge CSAT progress meter */}
          <div className="pb-6 border-b border-[#f1f3f5] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#4a5568] uppercase tracking-wider">
                Status & Sentimen
              </span>
              <div className="flex gap-1.5">
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    activeTicket.status === "open"
                      ? "bg-amber-50 text-amber-500 border-amber-100"
                      : "bg-emerald-50 text-emerald-500 border-emerald-100"
                  }`}
                >
                  {activeTicket.status === "open" ? "Pending" : "Selesai"}
                </span>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    activeAesthetics?.sentiment === "Marah"
                      ? "bg-red-50 text-red-500 border-red-100"
                      : activeAesthetics?.sentiment === "Puas"
                      ? "bg-emerald-50 text-emerald-500 border-emerald-100"
                      : "bg-blue-50 text-blue-500 border-blue-100"
                  }`}
                >
                  {activeAesthetics?.sentiment}
                </span>
              </div>
            </div>

            {/* Customer CSAT Satisfaction score gauge */}
            <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-2xl p-4 space-y-2 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-[#a0aec0] tracking-wider">
                  Skor Kepuasan (CSAT)
                </span>
                <span className={`text-xs font-black ${
                  (activeAesthetics?.csat || 0) > 80 
                    ? "text-emerald-500" 
                    : (activeAesthetics?.csat || 0) > 40 
                      ? "text-indigo-500" 
                      : "text-rose-500"
                }`}>
                  {activeAesthetics?.csat}%
                </span>
              </div>
              {/* Progress sliding track */}
              <div className="w-full bg-[#e9ecef] h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${activeAesthetics?.csat}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${
                    (activeAesthetics?.csat || 0) > 80 
                      ? "from-emerald-400 to-green-500" 
                      : (activeAesthetics?.csat || 0) > 40 
                        ? "from-indigo-400 to-purple-500" 
                        : "from-rose-400 to-red-500"
                  }`} 
                />
              </div>
            </div>

            {/* AI Tags list */}
            <div className="flex flex-wrap gap-1.5">
              {activeAesthetics?.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-[#f8f9fa] text-[#4a5568] border border-[#e9ecef] text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* AI Sentiment Analysis Button */}
            <button
              onClick={handleAISentimentAnalysis}
              disabled={aiAnalysisRunning}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              {aiAnalysisRunning ? "Menganalisis..." : "Analisis Sentimen & Tag (AI)"}
            </button>
          </div>

          {/* Section 4: CRM Actions Integration (🎁 Gift compensation coins!) */}
          {isAdmin && (
            <div className="pb-6 border-b border-[#f1f3f5] space-y-3">
              <span className="text-xs font-extrabold text-[#4a5568] uppercase tracking-wider flex items-center gap-1">
                <Gift className="h-3.5 w-3.5 text-indigo-500" /> Tindakan CRM Admin
              </span>
              <button
                onClick={handleCoinCompensation}
                className="w-full border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-wider py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                🎁 Berikan +500 Koin (Kompensasi)
              </button>
            </div>
          )}

          {/* Section 5: AI Summary card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-xs text-[#4a5568] uppercase tracking-wider flex items-center gap-1.5">
                Ringkasan AI
              </h5>
              <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                FITUR UNGGULAN
              </span>
            </div>
            <p className="text-xs text-[#718096] font-semibold leading-relaxed bg-[#f8f9fa] border border-[#e9ecef] rounded-2xl p-4 shadow-inner">
              {activeAesthetics?.bio}
            </p>
          </div>
        </aside>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TICKET CREATION MODAL CONTAINER */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-[#e9ecef] p-8 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#f1f3f5] text-[#4a5568] hover:bg-[#e9ecef] flex items-center justify-center transition-all shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-black text-[#1a202c] mb-6 flex items-center gap-2">
                Buat Tiket Bantuan Baru
              </h3>

              <div className="space-y-5">
                {/* Category Select */}
                <div>
                  <label className="block text-[10px] font-black text-[#a0aec0] uppercase tracking-widest mb-2">
                    Kategori Laporan
                  </label>
                  <select
                    value={newKategori}
                    onChange={(e) => {
                      setNewKategori(e.target.value);
                      setNewSubKategori("");
                    }}
                    className="w-full bg-[#f8f9fa] border border-[#e9ecef] text-[#4a5568] rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer shadow-inner"
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Akun">Akun & Keanggotaan</option>
                    <option value="Pesanan">Transaksi & Pesanan</option>
                    <option value="Lainnya">Pertanyaan Lainnya</option>
                  </select>
                </div>

                {/* Sub-Category Select */}
                {newKategori && (
                  <div>
                    <label className="block text-[10px] font-black text-[#a0aec0] uppercase tracking-widest mb-2">
                      Sub Kategori
                    </label>
                    <select
                      value={newSubKategori}
                      onChange={(e) => setNewSubKategori(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-[#e9ecef] text-[#4a5568] rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer shadow-inner"
                    >
                      <option value="">Pilih Sub Kategori</option>
                      {newKategori === "Akun" && (
                        <>
                          <option value="Pengecekan Banned">Pengecekan Banned / Penangguhan</option>
                          <option value="Pengajuan Rank Up">Pengajuan Seller / Mitra Kerja</option>
                        </>
                      )}
                      {newKategori === "Pesanan" && (
                        <>
                          <option value="Barang Tidak Sampai">Barang Tidak Sampai / Terlambat</option>
                          <option value="Kendala Kurir">Kendala Pelayanan Kurir</option>
                        </>
                      )}
                      {newKategori === "Lainnya" && (
                        <option value="Pertanyaan Umum">Pertanyaan Umum & Bantuan</option>
                      )}
                    </select>
                  </div>
                )}

                {/* Description Input */}
                <div>
                  <label className="block text-[10px] font-black text-[#a0aec0] uppercase tracking-widest mb-2">
                    Isi Laporan / Deskripsi
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Deskripsikan kendala Anda secara lengkap di sini..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#e9ecef] text-[#4a5568] rounded-2xl p-4 text-sm font-semibold focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none shadow-inner"
                  />
                </div>

                {/* Buttons row */}
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 bg-[#f1f3f5] text-[#4a5568] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#e9ecef] transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCreateTicketSubmit}
                    disabled={!newKategori || !newSubKategori || !newDesc.trim()}
                    className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:from-indigo-600 hover:to-indigo-700 disabled:bg-[#f1f3f5] disabled:text-[#a0aec0] disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
