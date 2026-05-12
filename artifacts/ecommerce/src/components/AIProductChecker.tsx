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
}

interface AIResult {
  verdict: "asli" | "mencurigakan" | "palsu";
  confidence: number;
  reasoning: string;
  tips: string;
}

const VERDICT_CONFIG = {
  asli:         { icon: ShieldCheck,   color: "text-green-600", bg: "bg-green-50 border-green-200",  label: "Kemungkinan Asli" },
  mencurigakan: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200",  label: "Perlu Diwaspadai" },
  palsu:        { icon: XCircle,       color: "text-red-600",   bg: "bg-red-50 border-red-200",      label: "Kemungkinan Palsu" },
};

export function AIProductChecker({ productName, description, price, category }: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<AIResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const { isAIEnabled, activeProvider, openaiKey, openrouterKey, openrouterModel } = useAISettings();
  const [, setLocation] = useLocation();

  const handleCheck = async () => {
    if (!isAIEnabled || !activeProvider) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const apiKey = activeProvider === "openai" ? openaiKey : openrouterKey;
      const model  = activeProvider === "openrouter" && openrouterModel ? openrouterModel : undefined;
      const res = await fetch(`${base}/api/ai/check-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: productName, description, price, category, provider: activeProvider, apiKey, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Terjadi kesalahan.");
      setResult(data as AIResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menghubungi AI.");
    } finally {
      setLoading(false);
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
                Fitur AI belum dikonfigurasi. Admin perlu menambahkan API key dan mengaktifkan salah satu provider AI.
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
                  ({activeProvider === "openai" ? "ChatGPT" : "OpenRouter"})
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
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              {result && cfg && (
                <div className={`border rounded-xl p-3 space-y-2 ${cfg.bg}`}>
                  <div className="flex items-center gap-2">
                    {React.createElement(cfg.icon, { className: `h-5 w-5 ${cfg.color}` })}
                    <span className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</span>
                    <span className="ml-auto text-xs font-semibold text-muted-foreground">
                      {result.confidence}% yakin
                    </span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        result.verdict === "asli" ? "bg-green-500" : result.verdict === "mencurigakan" ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">{result.reasoning}</p>
                  {result.tips && (
                    <p className="text-[11px] text-muted-foreground italic border-t pt-2">
                      💡 {result.tips}
                    </p>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs h-7 mt-1 -mb-1" onClick={handleCheck}>
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
