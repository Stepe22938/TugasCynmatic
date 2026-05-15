import React, { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronLeft, Phone, Video, Info, MoreVertical, Paperclip, Smile } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useMessages } from "../contexts/MessageContext";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

export function ChatPage() {
  const [, params] = useRoute("/chat/:id");
  const otherUserId = params?.id;
  const { user, getAllUsers } = useAuth();
  const { sendMessage, getChat } = useMessages();
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const otherUser = getAllUsers().find(u => u.id === otherUserId);
  const chatMessages = getChat(otherUserId || "");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !otherUserId) return;
    sendMessage(otherUserId, inputText.trim());
    setInputText("");
  };

  if (!otherUser || !user) {
    return <div className="p-10 text-center font-bold">User tidak ditemukan.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Link href="/friends">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="relative">
            <img 
              src={otherUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.name}`} 
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h2 className="font-bold text-sm">{otherUser.name}</h2>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full"><Phone className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><Video className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><Info className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <div className="text-center py-8">
          <img 
            src={otherUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.name}`} 
            className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white shadow-lg"
          />
          <h3 className="font-black text-lg">{otherUser.name}</h3>
          <p className="text-xs text-muted-foreground max-w-[200px] mx-auto mt-1">Kamu sekarang berteman dengan {otherUser.name}. Mulai obrolan sekarang!</p>
          <div className="mt-4 flex justify-center gap-2">
             <span className="text-[10px] font-black px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg uppercase tracking-widest text-muted-foreground">Enkripsi End-to-End</span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm relative group ${
                msg.senderId === user.id 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-white dark:bg-slate-800 text-foreground border rounded-tl-none"
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className={`text-[9px] mt-1 opacity-70 flex items-center gap-1 ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground"><Paperclip className="h-5 w-5" /></Button>
          <div className="flex-1 relative">
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik pesan..."
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-primary transition-all pr-12"
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50"
            disabled={!inputText.trim()}
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
