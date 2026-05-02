import { useEffect, useState } from "react";
import { readConfig } from "@/lib/tauri";
import { parseEnvKeys } from "@/lib/wizardUtils";
import { useSettings } from "./useSettings";
import { useHero } from "./useHero";

export type AlertSeverity = "danger" | "warning" | "info";

export interface Alert {
  /** Stable identifier — used for dismissal persistence. */
  id: string;
  severity: AlertSeverity;
  title: string;
  /** Optional secondary explanation. */
  body?: string;
  /** Optional CTA. `to` is a router path. */
  cta?: { label: string; to: string };
  dismissable?: boolean;
}

interface KeyState {
  hasAnthropic: boolean;
  hasTelegram: boolean;
  loaded: boolean;
}

/**
 * Frontend-only alerts evaluator. Pass 6 Day 4: surfaces three rules over
 * the data we already have (perimeter health + .env key presence). The
 * 60-second backend evaluator and the broader rule set (threat-blocked
 * notices, container crash narratives, Anthropic 401 detection) lands
 * in Pass 7 Day 2. Spending-limit alerts were dropped from scope per
 * the 2026-05-02 vision recheck — Anthropic Console handles billing.
 */
export function useAlerts(): { alerts: Alert[]; dismiss: (id: string) => void } {
  const { settings, update } = useSettings();
  const { state: heroState, loading: heroLoading } = useHero();
  const [keys, setKeys] = useState<KeyState>({
    hasAnthropic: false,
    hasTelegram: false,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const env = await readConfig("openclaw-vault", ".env");
        if (cancelled) return;
        const { anthropicKey, telegramToken } = parseEnvKeys(env);
        setKeys({
          hasAnthropic: Boolean(anthropicKey),
          hasTelegram: Boolean(telegramToken),
          loaded: true,
        });
      } catch {
        // .env missing — both keys absent.
        if (!cancelled) setKeys({ hasAnthropic: false, hasTelegram: false, loaded: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const candidates: Alert[] = [];

  // Rule 1 — Anthropic key missing.
  if (keys.loaded && !keys.hasAnthropic && settings.wizardCompleted) {
    candidates.push({
      id: "missing-anthropic-key",
      severity: "danger",
      title: "Your AI key isn't set",
      body: "Your assistant needs an Anthropic key to think. Add one in Preferences.",
      cta: { label: "Open Preferences", to: "/preferences" },
      dismissable: false,
    });
  }

  // Rule 2 — Telegram token missing.
  if (keys.loaded && !keys.hasTelegram && settings.wizardCompleted) {
    candidates.push({
      id: "missing-telegram-token",
      severity: "warning",
      title: "Telegram isn't connected yet",
      body: "Add a bot token in Preferences so you can chat with your assistant.",
      cta: { label: "Open Preferences", to: "/preferences" },
      dismissable: true,
    });
  }

  // Rule 3 — perimeter is in error state (Stopped while wizard was completed).
  if (!heroLoading && heroState === "error_perimeter") {
    candidates.push({
      id: "perimeter-error",
      severity: "danger",
      title: "Your assistant didn't recover",
      body: "Try restarting the app. If it keeps happening, get help.",
      cta: { label: "Get help", to: "/help" },
      dismissable: false,
    });
  }

  const alerts = candidates.filter((a) => !settings.dismissedAlerts[a.id]);

  function dismiss(id: string) {
    void update({
      dismissedAlerts: { ...settings.dismissedAlerts, [id]: Date.now() },
    });
  }

  return { alerts, dismiss };
}
