/**
 * AboutUsPage.tsx
 * Halaman 'Tentang Kami' dengan dashboard telemetri AI realtime statik dan arsip legenda interaktif.
 */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, User, Cpu, Sparkles, Code2, Rocket, Coffee, 
  BrainCircuit, Activity, Terminal, Layers, AlertCircle, RefreshCw, X, Award
} from "lucide-react";
import { Link } from "wouter";

export function AboutUsPage() {
  // Real-time counter states
  const [tokens, setTokens] = useState(12842912);
  const [requests, setRequests] = useState(148932);
  const [uptime, setUptime] = useState(0);

  // Dynamic model percentages (Replit remains fixed at 5.00%)
  const [proHigh, setProHigh] = useState(20.00);
  const [proLow, setProLow] = useState(10.00);
  const [flash, setFlash] = useState(65.00);

  // Selected legend profile to view story
  const [selectedLegend, setSelectedLegend] = useState<"admin" | "user" | null>(null);

  // Live Terminal Logs state
  const [logs, setLogs] = useState<string[]>([
    "System initialized. Core AI agent connection established.",
    "Database self-healing script deployed: isSultan columns validated.",
    "HMR client synced successfully. esbuild caching active.",
    "AuthContext cast normalizers mapped for MariaDB boolean returns.",
    "Ready for telemetry observation..."
  ]);
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Summarized historical lore stories
  const legendStories = {
    admin: {
      title: "Arsip Resolusi Sang Arsitek",
      role: "Admin Legend / Database Overseer",
      story: "Saat VPS MariaDB mengalami tabrakan schema login yang menyebabkan akun salah satu owner terkunci, admin@cynmatic.com bertindak cepat mendampingi alrizalarkan@gmail.com. Sang Admin melacak collision tabel database, mengeksekusi force migration Drizzle ORM, dan membypass validasi HMR demi memulihkan akses login sang Owner secara instan dengan seluruh data saldo E-Wallet dan lencana Crown Sultan aman tak tersentuh.",
      note: "CATATAN STATUS AKUN: Akun admin@cynmatic.com saat ini berstatus DINONAKTIFKAN (DEACTIVATED). Namun, jika seseorang memiliki password & email akun tersebut, login masih diizinkan tetapi sesi akan otomatis dialihkan ke akun Owner alrizalarkan@gmail.com. Owner sengaja mempertahankan akun admin ini dan tidak menghapusnya untuk melestarikan kenangan perjuangan selama 3 hari awal pengembangan agar Owner selalu mengingat dan belajar dari kesalahan masa lalu.",
      color: "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] bg-[#0c0505]/95",
      accent: "text-red-400 text-red-500"
    },
    user: {
      title: "Arsip Kronik Sang Owner & Pencipta",
      role: "Owner Legend / Co-Founder",
      story: "Sebagai Owner & Admin Utama TokoArthur, alrizalarkan@gmail.com mendeteksi adanya collision kritis pada database login server saat mencoba masuk. Kolaborasinya yang responsif bersama admin@cynmatic.com berhasil mengamankan validasi schema, mempertahankan status Sultan para anggota, dan menstabilkan performa platform secara menyeluruh.",
      note: undefined,
      color: "border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] bg-[#0c0905]/95",
      accent: "text-amber-400 text-amber-500"
    }
  };

  // Dynamic values timer
  useEffect(() => {
    const interval = setInterval(() => {
      // Tick uptime
      setUptime(prev => prev + 1);

      // Tick tokens and requests upwards
      setTokens(prev => prev + Math.floor(Math.random() * 800) + 100);
      setRequests(prev => prev + (Math.random() > 0.7 ? 1 : 0));

      // Fluctuate Gemini models very slightly while keeping Replit strictly at 5.00%
      const noiseHigh = (Math.sin(Date.now() / 8000) * 0.15);
      const noiseLow = (Math.cos(Date.now() / 10000) * 0.08);

      const calculatedHigh = parseFloat((20.00 + noiseHigh).toFixed(2));
      const calculatedLow = parseFloat((10.00 + noiseLow).toFixed(2));
      const calculatedFlash = parseFloat((95.00 - (calculatedHigh + calculatedLow)).toFixed(2));

      setProHigh(calculatedHigh);
      setProLow(calculatedLow);
      setFlash(calculatedFlash);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulated live AI console log updates
  useEffect(() => {
    const logPool = [
      "Gemini 3 Flash: Re-skinning LeaderboardPage to dark-gold glassmorphic theme.",
      "Antigravity: Checking remote VPS MariaDB port 3306 latency...",
      "Antigravity: Latency check completed: 42ms connection optimal.",
      "Gemini 3 Pro High: Recalculating top sellers transaction logs and revenue figures.",
      "System: Sync payload successfully registered on users REST endpoint.",
      "Gemini 3 Flash: Aligning z-index layer stack for fixed floating elements.",
      "Antigravity: Enforcing cyber-luxury CSS variables inside index.css.",
      "Gemini 3 Pro High: Resolving selectedAuction undefined bids map function exception.",
      "Antigravity: Injecting premium dark telemetry charts inside VotingPage.tsx.",
      "System: HMR recompilation triggered successfully on user view actions."
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const timestamp = new Date().toLocaleTimeString("en-GB", { hour12: false });
      setLogs(prev => {
        const updated = [...prev, `[${timestamp}] ${randomLog}`];
        if (updated.length > 20) updated.shift(); // Keep log list trimmed
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Scroll terminal logs to bottom internally
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Format uptime to readable string
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 relative overflow-hidden font-sans">
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(20,20,50,0.5)_0%,rgba(0,0,0,1)_80%)]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

      {/* Background Glowing Spotlights */}
      <div className="absolute top-24 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-24 right-1/4 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse duration-5000" />

      <div className="relative z-10 container mx-auto px-6 pt-24 max-w-6xl space-y-12">
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-4 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-500 animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Realtime Cyber Telemetry</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
              Core Operations
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-wider text-[11px] mt-1">Status dan Statistik Penggunaan AI dalam Pembangunan TokoArthur</p>
          </div>

          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <div>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">Telemetry Live</p>
              <p className="font-mono text-xs font-bold text-white mt-1">Uptime: {formatUptime(uptime)}</p>
            </div>
          </div>
        </div>

        {/* Live Counters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card bg-[#0a0a0c]/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Base Code Foundation</p>
            <p className="text-3xl font-black text-blue-500 tracking-tight mt-3">Replit</p>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider mt-1">Core Codebase (Fixed 5.00%)</p>
          </div>

          <div className="glass-card bg-[#0a0a0c]/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">AI Agent Requests</p>
            <p className="text-3xl font-black text-white tracking-tight mt-3 font-mono">
              {requests.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 animate-spin" /> Live Ticking
            </p>
          </div>

          <div className="glass-card bg-[#0a0a0c]/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">AI Generated Tokens</p>
            <p className="text-3xl font-black text-gradient-gold tracking-tight mt-3 font-mono">
              {tokens.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider mt-1">Accumulated Telemetry</p>
          </div>

          <div className="glass-card bg-[#0a0a0c]/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Compile Success Rate</p>
            <p className="text-3xl font-black text-emerald-400 tracking-tight mt-3">99.98%</p>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider mt-1">Verified Compilation</p>
          </div>
        </div>

        {/* Real-time Dashboard Grid: Log & Model Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Realtime Console Logs */}
          <div className="lg:col-span-7 glass-card rounded-[2.5rem] border border-white/5 bg-[#0a0a0c]/40 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-indigo-400" />
                <h2 className="font-black uppercase text-sm tracking-wider">Antigravity Console Logs</h2>
              </div>
              <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-widest">Realtime Feed</span>
            </div>

            <div ref={logContainerRef} className="bg-[#050507] rounded-2xl border border-white/5 p-4 h-80 overflow-y-auto font-mono text-xs text-white/70 space-y-3 scrollbar-hide">
              {logs.map((log, index) => {
                const isSystem = log.includes("System:");
                const isFlash = log.includes("Flash:");
                const isPro = log.includes("Pro ");
                let colorClass = "text-white/60";
                if (isSystem) colorClass = "text-amber-400/80";
                else if (isFlash) colorClass = "text-emerald-400/80";
                else if (isPro) colorClass = "text-indigo-400/80";

                return (
                  <div key={index} className={`leading-relaxed ${colorClass}`}>
                    <span className="text-white/20 mr-2">&gt;</span>
                    {log}
                  </div>
                );
              })}
            </div>
            
            <p className="text-[10px] text-white/20 font-medium italic">
              * Konsol di atas mensimulasikan log aktivitas realtime agen AI yang sedang bekerja di latar belakang ekosistem TokoArthur.
            </p>
          </div>

          {/* Right Panel: AI Model Usage Distribution Chart */}
          <div className="lg:col-span-5 glass-card rounded-[2.5rem] border border-white/5 bg-[#0a0a0c]/40 p-6 md:p-8 space-y-8 h-full">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Layers className="h-5 w-5 text-amber-500" />
              <h2 className="font-black uppercase text-sm tracking-wider">AI Model Allocation</h2>
            </div>

            <div className="space-y-6">
              {/* Replit - STRICTLY 5% AT ALL TIMES */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <Code2 className="h-4 w-4" /> Replit Base
                  </span>
                  <span className="font-mono text-sm font-black text-white">5.00%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: "5%" }} />
                </div>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Baseline core logic & repository foundation</p>
              </div>

              {/* Gemini 3 Flash */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Bot className="h-4 w-4" /> Gemini 3 Flash
                  </span>
                  <span className="font-mono text-sm font-black text-white">{flash.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${flash}%` }} />
                </div>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">UI Speed execution, skinning, and rapid implementation</p>
              </div>

              {/* Gemini 3 Pro High */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" /> Gemini 3 Pro High
                  </span>
                  <span className="font-mono text-sm font-black text-white">{proHigh.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${proHigh}%` }} />
                </div>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Complex multi-file architectures & secure database routing</p>
              </div>

              {/* Gemini 3 Pro Low */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Cpu className="h-4 w-4" /> Gemini 3 Pro Low
                  </span>
                  <span className="font-mono text-sm font-black text-white">{proLow.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${proLow}%` }} />
                </div>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Code optimization, refactoring loops, & debugging logs</p>
              </div>
            </div>
          </div>
        </div>

        {/* dialogue thread: Legendary Archives */}
        <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#0a0a0c]/40 p-8 sm:p-12 space-y-12">
          <div className="border-b border-white/5 pb-6">
            <h2 className="text-2xl font-black uppercase tracking-wider italic text-white flex items-center gap-3">
              <Coffee className="h-6 w-6 text-amber-500 animate-bounce" /> Legendary Archives
            </h2>
            <p className="text-white/40 font-bold uppercase tracking-wider text-[10px] mt-1">Ketuk Profil Legenda di bawah untuk membuka Berkas Arsip & Kronik Penyelamatan.</p>
          </div>

          {/* Featured Legends Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Legend Admin Card */}
            <div 
              onClick={() => setSelectedLegend("admin")}
              className="glass-card bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-[0_0_30px_rgba(239,68,68,0.05)] cursor-pointer transition-all active:scale-[0.98] group"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <Bot className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <span className="text-[8px] font-black bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-0.5 rounded-full uppercase tracking-widest">Admin Legend</span>
                <h3 className="text-lg font-black text-white mt-1 group-hover:text-red-400 transition-colors">admin@cynmatic.com</h3>
                <p className="text-xs text-white/40 mt-1.5 font-medium">Server Overseer & Database Archmage. Click to read file...</p>
              </div>
            </div>

            {/* Legend User Card */}
            <div 
              onClick={() => setSelectedLegend("user")}
              className="glass-card bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-[0_0_30px_rgba(245,158,11,0.05)] cursor-pointer transition-all active:scale-[0.98] group"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8 text-amber-400" />
              </div>
              <div className="flex-1">
                <span className="text-[8px] font-black bg-amber-600/20 text-amber-400 border border-amber-500/30 px-3 py-0.5 rounded-full uppercase tracking-widest">Owner Legend</span>
                <h3 className="text-lg font-black text-white mt-1 group-hover:text-amber-400 transition-colors">alrizalarkan@gmail.com</h3>
                <p className="text-xs text-white/40 mt-1.5 font-medium">Co-Founder, Creator & Owner. Click to read file...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
          <Link href="/profile">
            <button className="h-14 px-10 rounded-full bg-white text-slate-950 hover:bg-white/90 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Back to Profile
              <Rocket className="h-5 w-5 text-slate-950" />
            </button>
          </Link>
          <Link href="/tickets">
            <button className="h-14 px-10 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              Support Ticket Hub
              <Activity className="h-5 w-5 text-white" />
            </button>
          </Link>
        </div>
      </div>

      {/* Legend Story Modal Overlay */}
      <AnimatePresence>
        {selectedLegend && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg border rounded-[2.5rem] p-8 relative overflow-hidden backdrop-blur-2xl ${legendStories[selectedLegend].color}`}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedLegend(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${selectedLegend === "admin" ? "text-red-400" : "text-blue-400"}`}>
                    {selectedLegend === "admin" ? <Bot className="h-7 w-7" /> : <User className="h-7 w-7" />}
                  </div>
                  <div>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${selectedLegend === "admin" ? "text-red-400" : "text-blue-400"}`}>
                      {legendStories[selectedLegend].role}
                    </span>
                    <h3 className="text-xl font-black text-white tracking-tight leading-none mt-1">
                      {selectedLegend === "admin" ? "admin@cynmatic.com" : "alrizalarkan@gmail.com"}
                    </h3>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 space-y-4">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${selectedLegend === "admin" ? "text-red-400" : "text-blue-400"}`}>
                    Arsip Kronik Legenda:
                  </h4>
                  <p className="text-sm font-medium leading-relaxed text-white/80 italic">
                    "{legendStories[selectedLegend].story}"
                  </p>

                  {legendStories[selectedLegend].note && (
                    <div className="mt-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 text-xs leading-relaxed space-y-2">
                      <span className="font-black uppercase tracking-widest text-[9px] text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 animate-pulse" /> Memorial Log (Owner's Note)
                      </span>
                      <p className="italic font-medium">
                        "{legendStories[selectedLegend].note}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => setSelectedLegend(null)}
                    className="px-6 py-2.5 bg-white text-slate-950 text-xs font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Tutup Arsip
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
