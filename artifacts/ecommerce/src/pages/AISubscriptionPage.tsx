import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Bot, CheckCircle2, Clock, Cpu, Sparkles, Wallet, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../contexts/WalletContext";
import { useMyAI } from "../contexts/MyAIContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";

export function AISubscriptionPage() {
  const { balance } = useWallet();
  const { isAISubscriber, aiSubscriptionExpiry, config, buyAISubscription } = useMyAI();
  const [, setLocation] = useLocation();
  const [loadingMonth, setLoadingMonth] = useState<number | null>(null);

  const handleBuy = (months: number) => {
    setLoadingMonth(months);
    const ok = buyAISubscription(months);
    setLoadingMonth(null);
    if (ok) setLocation("/aichat");
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white pb-24">
      <div className="border-b border-white/5 bg-[#050506]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <Link href="/aichat">
              <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                <Bot className="h-7 w-7 text-violet-300" />
                AI Pro Subscription
              </h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.35em] text-white/25">
                Powered by MyWallet balance
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/8 px-4 py-3 sm:flex">
            <Wallet className="h-5 w-5 text-emerald-300" />
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/25">Saldo MyWallet</p>
              <p className="text-sm font-black text-emerald-300">{formatPrice(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 pt-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.025] p-8 shadow-2xl">
          <div className="absolute right-[-80px] top-[-120px] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                isAISubscriber ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/45"
              }`}>
                <span className={`h-2 w-2 rounded-full ${isAISubscriber ? "bg-emerald-400" : "bg-white/25"}`} />
                {isAISubscriber ? "AI Pro aktif" : "AI Pro belum aktif"}
              </div>

              <div>
                <h2 className="max-w-3xl text-5xl font-black leading-none tracking-tight">
                  Buka akses AI Chat dan AI Companion.
                </h2>
                <p className="mt-5 max-w-2xl text-sm font-semibold leading-relaxed text-white/45">
                  Subscription ini dipakai buat akses AI biasa dan AI Companion. Pembayaran langsung motong saldo MyWallet, dan transaksi masuk ke riwayat dompet.
                </p>
              </div>

              {isAISubscriber && aiSubscriptionExpiry && (
                <div className="inline-flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3">
                  <Clock className="h-4 w-4 text-violet-200" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-violet-200/45">Aktif sampai</p>
                    <p className="text-sm font-black text-white">
                      {new Date(aiSubscriptionExpiry).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3">
              {[
                { icon: Sparkles, label: "AI Companion Battle Arena" },
                { icon: Bot, label: "AI Chat biasa" },
                { icon: Cpu, label: "Multi-model comparison" },
                { icon: Zap, label: "Research mode dan image model" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                  <item.icon className="h-4 w-4 text-violet-200" />
                  <span className="text-sm font-bold text-white/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {config.durations.map(duration => {
            const total = config.price * duration.months;
            const disabled = loadingMonth !== null || balance < total;
            return (
              <motion.button
                key={duration.months}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                disabled={disabled}
                onClick={() => handleBuy(duration.months)}
                className="rounded-3xl border border-white/8 bg-white/[0.025] p-5 text-left transition-all hover:border-violet-400/30 hover:bg-violet-500/8 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{duration.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{formatPrice(total)}</p>
                <p className="mt-2 text-[11px] font-semibold text-white/30">{formatPrice(config.price)} / bulan</p>
                <div className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-200">
                  <CheckCircle2 className="h-4 w-4" />
                  {isAISubscriber ? "Perpanjang" : "Subscribe"}
                </div>
              </motion.button>
            );
          })}
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
          <p className="text-xs font-semibold text-white/35">
            Saldo kurang? Top up dulu di MyWallet, lalu balik ke sini buat subscribe.
          </p>
          <Button onClick={() => setLocation("/mydompet")} className="rounded-xl bg-emerald-500 text-black hover:bg-emerald-400">
            Top Up MyWallet
          </Button>
        </div>
      </main>
    </div>
  );
}
