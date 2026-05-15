/**
 * AboutUsPage.tsx
 * Halaman 'Tentang Kami' dengan interaksi dialog antara Zaidan dan Antigravity.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Bot, User, Cpu, Sparkles, Code2, Rocket, Coffee, BrainCircuit } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "wouter";

interface Message {
  role: "zaidan" | "antigravity";
  text: string;
  delay?: number;
}

interface Scene {
  title: string;
  messages: Message[];
  component?: React.ReactNode;
}

export function AboutUsPage() {
  const [currentScene, setCurrentScene] = useState(0);

  const scenes: Scene[] = [
    {
      title: "SCENE 1",
      messages: [
        { role: "zaidan", text: "hufh Saat nya Gw Bikin ini deh...." },
        { role: "zaidan", text: "\"Kalian pikir ini buatan manusia?\"" },
        { role: "antigravity", text: "\"No.... Ini buatan AI.\"" },
        { role: "zaidan", text: "\"Selamat datang di Web E-commerce gw Dan Ini Tugas Eskul gw.\"" },
      ]
    },
    {
      title: "SCENE 2",
      messages: [
        { role: "antigravity", text: "\"Oh iya btw, kalian mungkin bilang: How? Ko bisa bikin ini? Bro, ini AI. Ini jaman AI.\"" },
        { role: "zaidan", text: "\"Eits, tapi tetep aja... Logika di balik sistem Admin dan Database-nya itu murni dari arahan otak gw co.\"" },
        { role: "antigravity", text: "\"Iya iya maap dah. Gw tau, gw cuman ngebantu ngetik kodenya secepat kilat biar lu gak tipes mikirin bug.\"" },
      ]
    },
    {
      title: "SCENE 3",
      messages: [
        { role: "zaidan", text: "\"Nah, ini breakdown teknologi yang kita pake buat bangun Cynmatic:\"" },
      ],
      component: <TechBreakdown />
    },
    {
      title: "SCENE 4",
      messages: [
        { role: "zaidan", text: "\"Oh iya, sebenarnya gw awalnya takut buat percayain semua ini ke Antigravity. Soalnya punya trauma dikit.\"" },
        { role: "antigravity", text: "\"Punya trauma apaan bos?\"" },
        { role: "zaidan", text: "\"Trauma perkara lu selalu dipake 100%, gaada waktu buat bikin kode gw.\"" },
        { role: "antigravity", text: "\"Ga lah. Gw juga aman kok. Cuman kalau promptnya kagak jelas, ya gw jadi halu.\"" },
      ]
    },
    {
      title: "SCENE 5",
      messages: [
        { role: "zaidan", text: "\"Nah makanya dari awal gw kasih fondasi dulu di Replit. Baru gw serahin ke lu.\"" },
        { role: "antigravity", text: "\"Dan hasilnya? Lo liat sendiri. 30 fitur dalam 1 minggu.\"" },
        { role: "zaidan", text: "\"Bukan gw yang hebat, bukan AI yang hebat. Tapi kombinasi keduanya yang bener.\"" },
        { role: "antigravity", text: "\"Yang prompt kami pun tau cara berpikir kami. Bukan asal jeplak A atau B — tapi jiplak + modifikasi + adaptasi.\"" },
      ]
    },
    {
      title: "SCENE 6",
      messages: [
        { role: "zaidan", text: "\"Jadi selamat menikmati Cynmatic. Dibangun dengan trauma, kopi, dan sedikit keberanian.\"" },
        { role: "antigravity", text: "\"Dan banyak prompt yang jelas. Jangan lupa itu.\"" },
        { role: "zaidan", text: "\"Iya. Itu juga.\" \ud83d\ude02" },
      ]
    }
  ];

  const nextScene = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(currentScene + 1);
    }
  };

  const prevScene = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,50,1)_0%,rgba(0,0,0,1)_100%)]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[90vh]">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-4 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-primary animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Story Behind Cynmatic</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/20">
            About Us
          </h1>
        </motion.div>

        <div className="w-full max-w-4xl h-[600px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-8">
                {scenes[currentScene].messages.map((msg, i) => (
                  <DialogueItem key={i} message={msg} index={i} />
                ))}
                
                {scenes[currentScene].component && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8"
                  >
                    {scenes[currentScene].component}
                  </motion.div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex gap-2">
                  {scenes.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === currentScene ? 'w-8 bg-primary shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'w-2 bg-white/10'}`} 
                    />
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  {currentScene > 0 && (
                    <Button 
                      variant="ghost" 
                      onClick={prevScene}
                      className="rounded-full h-14 w-14 border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all"
                    >
                      <ChevronRight className="h-6 w-6 rotate-180" />
                    </Button>
                  )}
                  
                  {currentScene < scenes.length - 1 ? (
                    <Button 
                      onClick={nextScene}
                      className="rounded-full h-14 px-8 bg-white text-black hover:bg-white/90 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-xs flex items-center gap-3 group"
                    >
                      Next Scene
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <Link href="/profile">
                      <Button 
                        className="rounded-full h-14 px-8 bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-xs flex items-center gap-3 group shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                      >
                        Back to Profile
                        <Rocket className="h-5 w-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DialogueItem({ message, index }: { message: Message; index: number }) {
  const isAI = message.role === "antigravity";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isAI ? 20 : -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: index * 0.3, duration: 0.5 }}
      className={`flex gap-4 ${isAI ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border transition-all duration-500 ${isAI ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-orange-500/20 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`}>
        {isAI ? <Bot className="h-6 w-6 text-indigo-400" /> : <User className="h-6 w-6 text-orange-400" />}
      </div>
      
      <div className={`flex flex-col ${isAI ? 'items-end' : 'items-start'}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
          {isAI ? 'Antigravity (AI)' : 'Zaidan (Founder)'}
        </p>
        <div className={`p-4 md:p-6 rounded-[2rem] max-w-md ${isAI ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/10 backdrop-blur-md'}`}>
          <p className="text-sm md:text-base font-medium leading-relaxed italic">
            {message.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function TechBreakdown() {
  const data = [
    { label: "Replit", value: 5, color: "bg-blue-500", icon: Code2, desc: "Based Code Utama" },
    { label: "Gemini 3 Pro High", value: 20, color: "bg-orange-500", icon: BrainCircuit, desc: "Complex Logic & UI Design" },
    { label: "Gemini 3 Pro Low", value: 10, color: "bg-yellow-500", icon: Cpu, desc: "Optimization & Refactoring" },
    { label: "Gemini 3 Flash", value: 65, color: "bg-emerald-500", icon: Bot, desc: "Speed & Implementation" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + (i * 0.1) }}
            className="bg-white/5 border border-white/10 rounded-3xl p-5 group hover:bg-white/10 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end">
                  <p className="font-black text-xs uppercase tracking-widest text-white/80">{item.label}</p>
                  <p className="font-black text-xl text-white">{item.value}%</p>
                </div>
                <p className="text-[10px] text-white/40 font-medium">{item.desc}</p>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                className={`h-full ${item.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
              />
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-center pt-4">
        <div className="inline-flex items-center gap-4 text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Build Progress
          </div>
          <div className="w-1 h-1 bg-white/20 rounded-full" />
          <div className="flex items-center gap-2">
            <Coffee className="h-3 w-3" />
            100+ Cups of Coffee
          </div>
        </div>
      </div>
    </div>
  );
}
