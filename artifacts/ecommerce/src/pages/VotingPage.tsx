import React from "react";
import { motion } from "framer-motion";
import { Vote as VoteIcon, BarChart3, ChevronLeft, Info, AlertTriangle, Trophy, Users } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useVote } from "../contexts/VoteContext";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

export function VotingPage() {
  const { user } = useAuth();
  const { polls, vote } = useVote();
  const { toast } = useToast();

  const activePolls = polls.filter(p => p.isActive);
  const closedPolls = polls.filter(p => !p.isActive);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-cyan-950/80 to-blue-950/40 pt-16 pb-28 px-6 border-b border-cyan-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/profile">
            <button className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors group bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-xs uppercase tracking-widest">Beranda</span>
            </button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-cyan-500/10 backdrop-blur-md rounded-2xl border border-cyan-500/20 shadow-xl">
                  <VoteIcon className="h-9 w-9 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Sistem Voting</h1>
                  <p className="text-cyan-300/60 font-bold uppercase tracking-wider text-[10px] mt-1">Membentuk Kebijakan & Masa Depan Ekosistem.</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center min-w-[110px]">
                <p className="text-2xl font-black text-white leading-none">{activePolls.length}</p>
                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-1">Aktif</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center min-w-[110px]">
                <p className="text-2xl font-black text-white leading-none">{polls.reduce((acc, p) => acc + p.votedUserIds.length, 0)}</p>
                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-1">Total Suara</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-14 space-y-12 relative z-10">
        {/* Active Polls Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            <h2 className="font-black text-xl tracking-tight uppercase italic">Poling Sedang Berlangsung</h2>
          </div>
          
          {activePolls.length === 0 ? (
            <div className="glass-card rounded-[2.5rem] py-20 text-center border border-white/5 bg-[#0a0a0c]/20">
              <Info className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold italic text-sm">Belum ada poling aktif saat ini.</p>
              <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Tunggu kabar dari Admin Zaidan!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePolls.map((poll, idx) => (
                <PollCard key={poll.id} poll={poll} index={idx} isClosed={false} />
              ))}
            </div>
          )}
        </section>

        {/* Closed Polls Section */}
        {closedPolls.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2 px-2">
              <BarChart3 className="h-5 w-5 text-white/40" />
              <h2 className="font-black text-xl tracking-tight uppercase text-white/40 italic">Arsip & Hasil</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
              {closedPolls.map((poll, idx) => (
                <PollCard key={poll.id} poll={poll} index={idx} isClosed={true} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function PollCard({ poll, index, isClosed }: { poll: any, index: number, isClosed: boolean }) {
  const { user } = useAuth();
  const { vote } = useVote();
  const { toast } = useToast();
  const hasVoted = poll.votedUserIds.includes(user?.id || "");
  const showResults = hasVoted || isClosed;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`glass-card border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col h-full transition-all group ${
        isClosed 
          ? "border-white/5 bg-[#0a0a0c]/10 grayscale-[0.3]" 
          : "border-cyan-500/20 bg-[#0a0a0c]/20 hover:border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.02)]"
      }`}
    >
      {!isClosed && (
        <div className="absolute top-0 right-0 p-6">
           <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
             hasVoted 
               ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
               : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
           }`}>
              {hasVoted ? 'Terpilih' : 'Open'}
           </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-black text-xl leading-tight mb-3 pr-16 text-white group-hover:text-cyan-400 transition-colors">{poll.title}</h3>
        <div className="flex items-center gap-2 text-[10px] text-white/40 font-black uppercase tracking-wider">
          <Users className="h-4 w-4 text-white/20" />
          <span>{poll.votedUserIds.length} Rakyat Cynmatic Telah Memilih</span>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {poll.options.map((opt: any) => {
          const percent = poll.votedUserIds.length === 0 ? 0 : Math.round((opt.votes / poll.votedUserIds.length) * 100);
          
          return (
            <button
              key={opt.id}
              disabled={showResults}
              onClick={() => {
                if (user) {
                  vote(poll.id, opt.id, user.id);
                  toast({ title: "Berhasil!", description: "Suaramu telah tercatat." });
                }
              }}
              className={`w-full group/btn relative overflow-hidden min-h-[56px] rounded-2xl border transition-all flex items-center px-5 ${
                showResults 
                  ? "border-white/5 bg-white/[0.02] cursor-default" 
                  : "border-white/10 bg-[#0a0a0c] hover:border-cyan-500/50 hover:bg-cyan-500/[0.03] active:scale-[0.98]"
              }`}
            >
              {/* Progress Bar Background */}
              {showResults && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`absolute left-0 top-0 h-full ${isClosed ? 'bg-white/5' : 'bg-cyan-500/10'}`} 
                />
              )}
              
              <div className="relative z-10 w-full flex justify-between items-center gap-4">
                <span className={`font-bold text-sm text-left ${showResults ? 'text-white/80' : 'text-white'}`}>{opt.text}</span>
                {showResults ? (
                  <span className="text-xs font-black text-cyan-400">{percent}%</span>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/20 group-hover/btn:border-cyan-500 transition-colors flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full scale-0 group-hover/btn:scale-100 transition-transform" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isClosed && (
        <div className="mt-6 flex items-center gap-2 justify-center py-3 bg-white/5 rounded-2xl border border-white/5">
           <Trophy className="h-4 w-4 text-amber-500 animate-bounce" />
           <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Poling Telah Resmi Ditutup</span>
        </div>
      )}
    </motion.div>
  );
}
