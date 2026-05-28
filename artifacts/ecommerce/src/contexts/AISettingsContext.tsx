/**
 * AISettingsContext.tsx
 * Menyimpan konfigurasi AI (API key OpenRouter / ChatGPT) di localStorage.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface AISettings {
  aiProvider: "openrouter" | "obscura";
  openrouterKey: string;
  openrouterModel: string;
  obscuraKey: string;
  obscuraModel: string;
}

interface AISettingsContextValue extends AISettings {
  setAIProvider: (p: "openrouter" | "obscura") => void;
  setOpenrouterKey: (k: string) => void;
  setOpenrouterModel: (m: string) => void;
  setObscuraKey: (k: string) => void;
  setObscuraModel: (m: string) => void;
  isAIEnabled: boolean;
}

const STORAGE_KEY = "ai_settings_v2";

function load(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AISettings>;
      return {
        aiProvider: parsed.aiProvider === "obscura" ? "obscura" : "openrouter",
        openrouterKey: parsed.openrouterKey || "",
        openrouterModel: parsed.openrouterModel || "",
        obscuraKey: parsed.obscuraKey || "",
        obscuraModel: parsed.obscuraModel || "",
      };
    }
    // migrate from v1
    const v1 = localStorage.getItem("ai_settings_v1");
    if (v1) {
      const parsed = JSON.parse(v1) as Omit<AISettings, "openrouterModel">;
      return { ...parsed, aiProvider: "openrouter", openrouterModel: "", obscuraKey: "", obscuraModel: "" };
    }
  } catch {
  }
  return { aiProvider: "openrouter", openrouterKey: "", openrouterModel: "", obscuraKey: "", obscuraModel: "" };
}

function save(s: AISettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const AISettingsContext = createContext<AISettingsContextValue | null>(null);

export function AISettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AISettings>(load);

  // Sync settings from database on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
        const res = await fetch(`${base}/api/ai/settings`);
        if (res.ok) {
          const data = await res.json();
          // Only update if database settings are defined to avoid overwriting local defaults if DB is empty
          if (data.openrouterKey || data.openrouterModel || data.obscuraKey || data.obscuraModel || data.aiProvider) {
            const next = {
              aiProvider: data.aiProvider === "obscura" ? "obscura" as const : "openrouter" as const,
              openrouterKey: data.openrouterKey || "",
              openrouterModel: data.openrouterModel || "",
              obscuraKey: data.obscuraKey || "",
              obscuraModel: data.obscuraModel || "",
            };
            setSettings(next);
            save(next);
          }
        }
      } catch (err) {
        console.error("Failed to sync AI settings from DB:", err);
      }
    };
    fetchSettings();
  }, []);

  const update = useCallback((patch: Partial<AISettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);

      // Async sync to database
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      fetch(`${base}/api/ai/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch((err) => console.error("Failed to save AI settings to DB:", err));

      return next;
    });
  }, []);

  const value: AISettingsContextValue = {
    ...settings,
    isAIEnabled: settings.aiProvider === "obscura" ? Boolean(settings.obscuraKey) : Boolean(settings.openrouterKey),
    setAIProvider: (p) => update({ aiProvider: p }),
    setOpenrouterKey: (k) => update({ openrouterKey: k }),
    setOpenrouterModel: (m) => update({ openrouterModel: m }),
    setObscuraKey: (k) => update({ obscuraKey: k }),
    setObscuraModel: (m) => update({ obscuraModel: m }),
  };

  return <AISettingsContext.Provider value={value}>{children}</AISettingsContext.Provider>;
}

export function useAISettings() {
  const ctx = useContext(AISettingsContext);
  if (!ctx) throw new Error("useAISettings must be used inside AISettingsProvider");
  return ctx;
}
