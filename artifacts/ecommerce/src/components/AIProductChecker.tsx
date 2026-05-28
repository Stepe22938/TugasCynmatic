/**
 * AIProductChecker.tsx
 * Komponen AI asisten untuk menilai keaslian produk.
 * Memanggil /api/ai/check-product di api-server.
 */
import React, { useState } from "react";
import { Bot, Sparkles, ShieldCheck, AlertTriangle, XCircle, Loader2, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useAISettings } from "../contexts/AISettingsContext";
import { useLocation } from "wouter";

interface Props {
  productName: string;
  description: string;
  price: number;
  category: string;
  productId?: number;
}

interface AIResult {
  verdict: "asli" | "mencurigakan" | "palsu";
  confidence: number;
  reasoning: string;
  tips: string;
}

const VERDICT_CONFIG = {
  asli:         { icon: ShieldCheck,   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-100",  label: "Kemungkinan Asli" },
  mencurigakan: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20 text-amber-100",  label: "Perlu Diwaspadai" },
  palsu:        { icon: XCircle,       color: "text-rose-400",   bg: "bg-rose-500/10 border-rose-500/20 text-rose-100",      label: "Kemungkinan Palsu" },
};

export function AIProductChecker({ productName, description, price, category, productId }: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<AIResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const { isAIEnabled, aiProvider, openrouterKey, openrouterModel, obscuraKey, obscuraModel } = useAISettings();
  const [, setLocation] = useLocation();

  const handleCheck = async () => {
    if (!isAIEnabled) return;
    setLoading(true); setError(null); setResult(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const apiKey = openrouterKey;
      const model  = aiProvider === "obscura" ? obscuraModel || undefined : openrouterModel || undefined;
      const res = await fetch(`${base}/api/ai/check-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: productName, description, price, category, apiKey, obscuraKey, aiProvider, model, productId }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status}`);
      }

      if (!res.ok) throw new Error(data.error ?? "Terjadi kesalahan.");
      setResult(data as AIResult);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("Permintaan waktu habis (timeout). Coba lagi atau gunakan model lain.");
      } else {
        setError(e instanceof Error ? e.message : "Gagal menghubungi AI.");
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const cfg = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <div className="border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <Bot className="h-4 w-4 text-primary" />
          Cek Keaslian dengan AI
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t space-y-3">
          {!isAIEnabled ? (
            <div className="pt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Fitur AI belum dikonfigurasi. Admin perlu menambahkan API key OpenRouter.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setLocation("/admin")}
              >
                <Settings className="h-3.5 w-3.5" />
                Pengaturan AI
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground pt-3">
                AI akan menganalisis nama, deskripsi, harga, dan kategori produk untuk memperkirakan keasliannya.
                <span className="ml-1 font-medium text-primary">
                  (OpenRouter)
                </span>
              </p>

              {!result && !loading && (
                <Button size="sm" onClick={handleCheck} className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />Mulai Analisis AI
                </Button>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />Menganalisis produk…
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400">
                  {error}
                </div>
              )}

              {result && cfg && (
                <div className={`border rounded-xl p-4.5 space-y-3.5 transition-all ${cfg.bg}`}>
                  <div className="flex items-center gap-2">
                    {React.createElement(cfg.icon, { className: `h-5 w-5 ${cfg.color} shrink-0` })}
                    <span className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</span>
                    <span className="ml-auto text-xs font-semibold text-white/50">
                      {result.confidence}% yakin
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        result.verdict === "asli" ? "bg-emerald-500" : result.verdict === "mencurigakan" ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed opacity-95">{result.reasoning}</p>
                  {result.tips && (
                    <div className="text-[11px] opacity-80 italic border-t border-white/10 pt-3 flex items-start gap-1.5">
                      <span className="shrink-0">💡</span>
                      <span>{result.tips}</span>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`text-xs h-7 mt-1 -mb-1 px-2.5 font-medium border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] ${cfg.color}`}
                    onClick={handleCheck}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />Analisis Ulang
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
