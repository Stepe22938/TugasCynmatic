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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/profile">
            <button className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group">
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-widest">Kembali ke Profil</span>
            </button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                  <VoteIcon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter">Sistem Voting</h1>
              </div>
              <p className="text-cyan-100 font-medium max-w-md">
                Suaramu menentukan masa depan Cynmatic. Ikuti poling resmi dan lihat hasil pilihan rakyat.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center min-w-[100px]">
                <p className="text-2xl font-black text-white leading-none">{activePolls.length}</p>
                <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest mt-1">Aktif</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center min-w-[100px]">
                <p className="text-2xl font-black text-white leading-none">{polls.reduce((acc, p) => acc + p.votedUserIds.length, 0)}</p>
                <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest mt-1">Total Suara</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 space-y-8">
        {/* Active Polls Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="font-black text-xl tracking-tight uppercase">Poling Sedang Berlangsung</h2>
          </div>
          
          {activePolls.length === 0 ? (
            <div className="bg-card border-2 border-dashed rounded-[2.5rem] py-16 text-center">
              <Info className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold">Belum ada poling aktif saat ini.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tunggu kabar dari Admin Zaidan!</p>
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
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-black text-xl tracking-tight uppercase text-muted-foreground">Arsip & Hasil</h2>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-card border-2 rounded-[2.5rem] p-8 shadow-xl shadow-black/5 relative overflow-hidden flex flex-col h-full ${
        isClosed ? "border-muted grayscale-[0.5]" : "border-cyan-100 dark:border-cyan-900/30"
      }`}
    >
      {!isClosed && (
        <div className="absolute top-0 right-0 p-4">
           <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${hasVoted ? 'bg-green-100 text-green-700' : 'bg-cyan-100 text-cyan-700'}`}>
              {hasVoted ? 'Terpilih' : 'Open'}
           </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-black text-xl leading-tight mb-2 pr-12">{poll.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-tighter">
          <Users className="h-3.5 w-3.5" />
          <span>{poll.votedUserIds.length} Pengguna Berpartisipasi</span>
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
              className={`w-full group relative overflow-hidden min-h-[56px] rounded-2xl border-2 transition-all flex items-center px-5 ${
                showResults 
                  ? "border-muted bg-muted/10 cursor-default" 
                  : "border-slate-100 dark:border-slate-800 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
              }`}
            >
              {/* Progress Bar Background */}
              {showResults && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`absolute left-0 top-0 h-full ${isClosed ? 'bg-slate-200 dark:bg-slate-800' : 'bg-cyan-100 dark:bg-cyan-900/30'}`} 
                />
              )}
              
              <div className="relative z-10 w-full flex justify-between items-center gap-4">
                <span className={`font-bold text-sm ${showResults ? 'text-foreground' : 'text-foreground/80'}`}>{opt.text}</span>
                {showResults ? (
                  <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">{percent}%</span>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-cyan-500 transition-colors flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full scale-0 group-hover:scale-100 transition-transform" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isClosed && (
        <div className="mt-6 flex items-center gap-2 justify-center py-2 bg-muted/30 rounded-xl">
           <Trophy className="h-4 w-4 text-amber-500" />
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Poling Ditutup</span>
        </div>
      )}
    </motion.div>
  );
}
