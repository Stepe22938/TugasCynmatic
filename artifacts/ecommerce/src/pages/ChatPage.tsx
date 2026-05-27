import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, ChevronLeft, Paperclip, X, Image as ImageIcon,
  Play, Download, ZoomIn, CheckCheck, Loader2, Film,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useMessages } from "../contexts/MessageContext";
import { useToast } from "../hooks/use-toast";

const API_BASE = "/api";

// ─── Media Lightbox ──────────────────────────────────────────────────────────
function MediaLightbox({ src, type, onClose }: { src: string; type: "image" | "video"; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="max-w-4xl max-h-[90vh] w-full"
        onClick={e => e.stopPropagation()}
      >
        {type === "image" ? (
          <img src={src} alt="Media" className="w-full h-full object-contain rounded-2xl max-h-[85vh]" />
        ) : (
          <video src={src} controls autoPlay className="w-full rounded-2xl max-h-[85vh]" />
        )}
        <a
          href={src}
          download
          className="mt-3 flex items-center justify-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <Download className="w-4 h-4" /> Download
        </a>
      </motion.div>
    </motion.div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isMe,
  senderUser,
  onMediaClick,
}: {
  msg: any;
  isMe: boolean;
  senderUser: any;
  onMediaClick: (url: string, type: "image" | "video") => void;
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getRoleBadge = (role?: string) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
          🛡️ Admin
        </span>
      );
    }
    if (role === "seller") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]">
          🏪 Penjual
        </span>
      );
    }
    if (role === "kurir") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
          🚚 Kurir
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-white/5 text-white/40 border border-white/10">
        🛒 Pembeli
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 400 }}
      className={`flex gap-3 ${isMe ? "flex-row-reverse justify-start" : "flex-row justify-start"} group items-end mb-1`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mb-5 select-none">
        {senderUser?.avatar ? (
          <img
            src={senderUser.avatar}
            alt=""
            className="w-8 h-8 rounded-xl object-cover border border-white/10 shadow-md"
          />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40">
            {senderUser?.name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[70%] sm:max-w-[60%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Sender Name + Role Tag */}
        <div className="flex items-center gap-2 px-1 text-[10px] select-none">
          <span className="font-bold text-white/60">
            {senderUser?.name || "User"}
          </span>
          {senderUser?.isSultan && <span className="text-[10px]" title="Sultan Member">👑</span>}
          {getRoleBadge(senderUser?.role)}
        </div>

        {/* Media preview */}
        {msg.mediaUrl && (
          <div
            className={`relative cursor-pointer overflow-hidden rounded-2xl ${isMe ? "rounded-tr-sm" : "rounded-tl-sm"} border border-white/10 shadow-lg`}
            style={{ maxWidth: 280 }}
            onClick={() => onMediaClick(msg.mediaUrl, msg.mediaType)}
          >
            {msg.mediaType === "image" ? (
              <div className="relative group/img">
                <img
                  src={msg.mediaUrl}
                  alt="Foto"
                  className="w-full object-cover max-h-52 transition-transform duration-300 group-hover/img:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
            ) : (
              <div className="relative group/vid bg-black">
                <video
                  src={msg.mediaUrl}
                  className="w-full max-h-52 object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/vid:bg-black/40 transition-all">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
                    <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text bubble */}
        {(msg.text || !msg.mediaUrl) && (
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-md ${
              isMe
                ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-tr-sm shadow-[0_4px_15px_rgba(249,115,22,0.15)] border border-orange-400/20"
                : "bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-tl-sm"
            }`}
          >
            {msg.text && <p className="text-[14px] leading-relaxed break-words font-medium">{msg.text}</p>}
          </div>
        )}

        {/* Time + status */}
        <div className={`flex items-center gap-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className="text-[9px] text-white/20 font-medium">{time}</span>
          {isMe && <CheckCheck className="w-3 h-3 text-orange-500/60" />}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ChatPage ────────────────────────────────────────────────────────────
export function ChatPage() {
  const [, params] = useRoute("/chat/:id");
  const otherUserId = params?.id || "";
  const { user, allUsers } = useAuth();
  const { sendMessage, sendMediaMessage, getChat, setActiveChat, uploadProgress } = useMessages();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [pendingFileType, setPendingFileType] = useState<"image" | "video" | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const otherUser = allUsers.find(u => u.id === otherUserId);
  const chatMessages = getChat(otherUserId);

  // Activate polling for this chat
  useEffect(() => {
    setActiveChat(otherUserId);
    return () => setActiveChat(null);
  }, [otherUserId, setActiveChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [chatMessages]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
    if (!allowed.includes(file.type)) {
      setError("Tipe file tidak didukung. Gunakan JPG, PNG, GIF, WebP, MP4, atau WebM.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File terlalu besar. Maksimal 15 MB.");
      return;
    }

    setError(null);
    setPendingFile(file);
    setPendingFileType(file.type.startsWith("video/") ? "video" : "image");
    setPendingPreviewUrl(URL.createObjectURL(file));
  }, []);

  const cancelPendingFile = useCallback(() => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setPendingFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [pendingPreviewUrl]);

  // Send handler
  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || (!inputText.trim() && !pendingFile)) return;

    setSending(true);
    setError(null);

    try {
      if (pendingFile) {
        await sendMediaMessage(otherUserId, pendingFile, inputText.trim() || undefined);
        cancelPendingFile();
        setInputText("");
      } else {
        await sendMessage(otherUserId, inputText.trim());
        setInputText("");
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengirim pesan");
      toast({ title: "Gagal kirim", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [sending, inputText, pendingFile, otherUserId, sendMessage, sendMediaMessage, cancelPendingFile, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  if (!otherUser || !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white/40 text-sm">User tidak ditemukan.</p>
          <Link href="/friends">
            <button className="text-[#007AFF] text-sm font-bold">← Kembali</button>
          </Link>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const isSending = sending || uploadProgress > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] bg-[#050505] text-white">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/[0.06] z-20">
        <div className="flex items-center gap-3">
          <Link href="/friends">
            <button className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white/70">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="relative">
            {otherUser.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.name}
                className="w-10 h-10 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-sm font-black text-white/80">
                {getInitials(otherUser.name)}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0a0c]" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white leading-none">{otherUser.name}</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Online</p>
          </div>
        </div>
      </div>

      {/* ── Messages Area ────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-3 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Header card */}
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-20 h-20 rounded-[2rem] bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-3xl font-black text-white/80 shadow-2xl">
            {otherUser.avatar
              ? <img src={otherUser.avatar} className="w-full h-full object-cover rounded-[2rem]" alt="" />
              : getInitials(otherUser.name)
            }
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-black text-white uppercase tracking-tight">{otherUser.name}</p>
            <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest">{otherUser.email}</p>
          </div>
          <span className="text-[9px] font-black px-3 py-1.5 bg-white/5 border border-white/10 rounded-full uppercase tracking-widest text-white/40">
            🔒 Enkripsi End-to-End
          </span>
        </div>

        {/* Messages */}
        <AnimatePresence initial={false}>
          {chatMessages.map(msg => {
            const isMe = msg.senderId === user.id;
            const senderUser = isMe ? user : allUsers.find(u => u.id === msg.senderId);
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMe={isMe}
                senderUser={senderUser}
                onMediaClick={(url, type) => setLightbox({ url, type })}
              />
            );
          })}
        </AnimatePresence>

        {/* Upload progress indicator */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-end"
          >
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 max-w-[200px]">
              <Loader2 className="w-4 h-4 text-[#007AFF] animate-spin" />
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Mengupload...</p>
                <div className="w-full bg-white/10 rounded-full h-1">
                  <motion.div
                    className="bg-[#007AFF] h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[#007AFF] font-black">{uploadProgress}%</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-shrink-0 mx-4 mb-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-[12px] text-red-400 font-bold flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pending File Preview ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingFile && pendingPreviewUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 px-4 pb-2 overflow-hidden"
          >
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              {/* Preview thumb */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0 relative">
                {pendingFileType === "image" ? (
                  <img src={pendingPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/80">
                    <Film className="w-6 h-6 text-white/60" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white truncate">{pendingFile.name}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide mt-0.5">
                  {pendingFileType === "image" ? "📷 Foto" : "🎬 Video"} · {(pendingFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {/* Cancel */}
              <button
                onClick={cancelPendingFile}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all text-white/40 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Bar ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pb-6 pt-2 bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/[0.06]">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
            className="hidden"
            onChange={handleFileSelect}
          />
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all flex-shrink-0 ${
              pendingFile
                ? "bg-[#007AFF]/20 border-[#007AFF]/40 text-[#007AFF]"
                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70"
            }`}
          >
            {pendingFile ? <ImageIcon className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
          </motion.button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingFile ? "Tambahkan caption... (opsional)" : "Ketik pesan..."}
              className="w-full h-11 bg-[#1c1c1e] border border-white/[0.08] rounded-[1.4rem] px-5 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
              disabled={isSending}
            />
          </div>

          {/* Send button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSending || (!inputText.trim() && !pendingFile)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all ${
              isSending || (!inputText.trim() && !pendingFile)
                ? "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                : "bg-[#007AFF] text-white shadow-[0_0_20px_rgba(0,122,255,0.4)] hover:bg-[#0071e3]"
            }`}
          >
            {isSending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" />
            }
          </motion.button>
        </form>
      </div>

      {/* ── Media Lightbox ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <MediaLightbox
            src={lightbox.url}
            type={lightbox.type}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
