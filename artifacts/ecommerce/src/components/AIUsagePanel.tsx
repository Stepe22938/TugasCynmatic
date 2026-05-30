import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Bot, Keyboard, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_BASES = ["/api", "http://localhost:3000/api"];

type AIUsageScope = {
  scope: "chat" | "companion";
  label: string;
  used: number;
  limit: number;
  remaining: number | null;
  estimatedTokens: number;
  percent: number;
};

type AIUsageSummary = {
  usageDate: string;
  totalRequests: number;
  totalEstimatedTokens: number;
  scopes: AIUsageScope[];
};

const numberFormat = new Intl.NumberFormat("id-ID");
const formatNumber = (value: number) => numberFormat.format(Math.max(0, Math.round(value || 0)));

const formatLimit = (scope: AIUsageScope) => {
  if (scope.limit <= 0) return "Unlimited";
  return `${formatNumber(scope.used)} / ${formatNumber(scope.limit)}`;
};

function SidebarItem({ active, label }: { active?: boolean; label: string }) {
  return (
    <button
      type="button"
      className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition ${
        active ? "bg-white/[0.07] text-white" : "text-white/58 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1b1b1c] p-5">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/42">{description}</p>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-3 text-sm text-white/38">{title}</p>
      {children}
    </section>
  );
}

function UsageRow({ scope }: { scope: AIUsageScope }) {
  const Icon = scope.scope === "companion" ? Sparkles : Bot;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1c]">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-500/10 text-cyan-200">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-white">{scope.label}</p>
              <p className="text-sm text-white/42">Pemakaian request harian untuk akun ini.</p>
            </div>
          </div>
          <p className="shrink-0 text-sm font-semibold text-white/82">{formatLimit(scope)}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/45">Sisa limit</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {scope.remaining === null ? "Tanpa batas" : `${formatNumber(scope.remaining)} request`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/45">Estimasi token</p>
            <p className="mt-1 text-sm font-semibold text-cyan-200">{formatNumber(scope.estimatedTokens)}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${scope.limit <= 0 ? 100 : scope.percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function UsageState({
  loading,
  error,
  canLoad,
  scopes,
}: {
  loading: boolean;
  error: string;
  canLoad: boolean;
  scopes: AIUsageScope[];
}) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-white/10 bg-[#1b1b1c] text-white/50">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Mengambil data usage...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-5 text-sm font-semibold text-red-200">
        {error}
      </div>
    );
  }

  if (!canLoad) {
    return (
      <div className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 p-5 text-sm font-semibold text-yellow-100">
        Login dulu buat lihat pemakaian AI akun ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scopes.map((scope) => <UsageRow key={scope.scope} scope={scope} />)}
    </div>
  );
}

function TogglePill({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 first:border-t-0">
      <div className="pr-4">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-sm text-white/42">
          {enabled ? "Aktif dan dihitung ke usage harian." : "Tidak aktif untuk akun ini."}
        </p>
      </div>
      <div className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${enabled ? "bg-cyan-500" : "bg-white/12"}`}>
        <div className={`h-5 w-5 rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
}

export function AIUsagePanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<AIUsageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canLoad = Boolean(user?.id);

  const loadUsage = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      let lastError = "Gagal mengambil usage AI";
      for (const baseUrl of API_BASES) {
        try {
          const response = await fetch(`${baseUrl}/ai/usage?userId=${encodeURIComponent(user.id)}`);
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            lastError = data?.error || lastError;
            continue;
          }
          setUsage(data);
          setError("");
          return;
        } catch (err: any) {
          lastError = err?.message || lastError;
        }
      }
      throw new Error(lastError);
    } catch (err: any) {
      setError(err?.message || "Gagal mengambil usage AI");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleShortcut = (event: KeyboardEvent) => {
      const isComma = event.key === "," || event.code === "Comma";
      if ((event.ctrlKey || event.metaKey) && isComma) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("tokoarthur:open-ai-usage", handleOpen);
    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("tokoarthur:open-ai-usage", handleOpen);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    if (open) void loadUsage();
  }, [open, loadUsage]);

  const scopes = useMemo(() => usage?.scopes || [], [usage]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/72 px-5 py-6 backdrop-blur-xl">
      <div className="flex h-[82vh] w-full max-w-6xl overflow-hidden rounded-xl border border-white/10 bg-[#202020] text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <aside className="hidden w-60 shrink-0 border-r border-white/8 bg-[#1d1d1d] px-4 py-6 md:block">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-500/10 text-cyan-200">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Usage</p>
              <p className="text-xs text-white/40">Analytics</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="mb-2 px-4 text-xs font-semibold text-white/32">General</p>
            <SidebarItem active label="Overview" />
            <SidebarItem label="AI Biasa" />
            <SidebarItem label="AI Companion" />
            <SidebarItem label="Token" />
          </div>

          <div className="mt-8 space-y-1">
            <p className="mb-2 px-4 text-xs font-semibold text-white/32">Shortcuts</p>
            <SidebarItem label="Ctrl + ," />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 items-center justify-between border-b border-white/8 px-6">
            <p className="text-sm text-white/82">AI Usage - Analytics</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/62 transition hover:bg-white/10 hover:text-white"
              aria-label="Tutup AI Usage"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <main className="flex-1 overflow-y-auto px-8 py-7">
            <div>
              <h2 className="text-lg font-semibold text-white">AI usage monitor</h2>
              <p className="mt-2 text-sm text-white/45">Pantau request, limit, dan estimasi token AI harian untuk akun ini.</p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <SummaryCard
                label="Total request"
                value={formatNumber(usage?.totalRequests || 0)}
                description="Jumlah semua request AI yang dipakai hari ini."
              />
              <SummaryCard
                label="Token terpakai"
                value={formatNumber(usage?.totalEstimatedTokens || 0)}
                description="Estimasi token dari prompt, jawaban, dan output gambar."
              />
              <SummaryCard
                label="Tanggal"
                value={usage?.usageDate || "-"}
                description="Usage dihitung harian mengikuti waktu Asia/Jakarta."
              />
            </div>

            <div className="my-8 h-px bg-white/8" />

            <div className="mx-auto max-w-3xl space-y-8">
              <SettingsSection title="Usage">
                <UsageState loading={loading} error={error} canLoad={canLoad} scopes={scopes} />
              </SettingsSection>

              <SettingsSection title="Tracking">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1c]">
                  <TogglePill enabled={canLoad} label="Track AI request" />
                  <TogglePill enabled={Boolean(usage?.totalEstimatedTokens || usage?.totalRequests)} label="Token estimator" />
                </div>
              </SettingsSection>
            </div>
          </main>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-6 py-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
              <Keyboard className="h-4 w-4" />
              Ctrl + ,
            </div>
            <button
              type="button"
              onClick={() => void loadUsage()}
              disabled={loading || !canLoad}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
