/**
 * AISettingsContext.tsx
 * Menyimpan konfigurasi AI (API key OpenRouter / ChatGPT) di localStorage.
 */
import React, { createContext, useContext, useState, useCallback } from "react";

export type AIProvider = "openai" | "openrouter";

interface AISettings {
  activeProvider: AIProvider | null;
  openaiKey: string;
  openrouterKey: string;
}

interface AISettingsContextValue extends AISettings {
  setActiveProvider: (p: AIProvider | null) => void;
  setOpenaiKey: (k: string) => void;
  setOpenrouterKey: (k: string) => void;
  isAIEnabled: boolean;
}

const STORAGE_KEY = "ai_settings_v1";

function load(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AISettings;
  } catch {
  }
  return { activeProvider: null, openaiKey: "", openrouterKey: "" };
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
    isAIEnabled:
      settings.activeProvider === "openai"
        ? Boolean(settings.openaiKey)
        : settings.activeProvider === "openrouter"
        ? Boolean(settings.openrouterKey)
        : false,
    setActiveProvider: (p) => update({ activeProvider: p }),
    setOpenaiKey: (k) => update({ openaiKey: k }),
    setOpenrouterKey: (k) => update({ openrouterKey: k }),
  };

  return <AISettingsContext.Provider value={value}>{children}</AISettingsContext.Provider>;
}

export function useAISettings() {
  const ctx = useContext(AISettingsContext);
  if (!ctx) throw new Error("useAISettings must be used inside AISettingsProvider");
  return ctx;
}
