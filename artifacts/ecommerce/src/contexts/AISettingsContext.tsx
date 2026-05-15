/**
 * AISettingsContext.tsx
 * Menyimpan konfigurasi AI (API key OpenRouter / ChatGPT) di localStorage.
 */
import React, { createContext, useContext, useState, useCallback } from "react";

interface AISettings {
  openrouterKey: string;
  openrouterModel: string;
}

interface AISettingsContextValue extends AISettings {
  setOpenrouterKey: (k: string) => void;
  setOpenrouterModel: (m: string) => void;
  isAIEnabled: boolean;
}

const STORAGE_KEY = "ai_settings_v2";

function load(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AISettings;
    // migrate from v1
    const v1 = localStorage.getItem("ai_settings_v1");
    if (v1) {
      const parsed = JSON.parse(v1) as Omit<AISettings, "openrouterModel">;
      return { ...parsed, openrouterModel: "" };
    }
  } catch {
  }
  return { openrouterKey: "", openrouterModel: "" };
}

function save(s: AISettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const AISettingsContext = createContext<AISettingsContextValue | null>(null);

export function AISettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AISettings>(load);

  const update = useCallback((patch: Partial<AISettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  const value: AISettingsContextValue = {
    ...settings,
    isAIEnabled: Boolean(settings.openrouterKey),
    setOpenrouterKey: (k) => update({ openrouterKey: k }),
    setOpenrouterModel: (m) => update({ openrouterModel: m }),
  };

  return <AISettingsContext.Provider value={value}>{children}</AISettingsContext.Provider>;
}

export function useAISettings() {
  const ctx = useContext(AISettingsContext);
  if (!ctx) throw new Error("useAISettings must be used inside AISettingsProvider");
  return ctx;
}
