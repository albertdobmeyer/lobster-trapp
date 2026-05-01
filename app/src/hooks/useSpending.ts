import { useCallback, useEffect, useRef, useState } from "react";
import { getSpendingSummary, type SpendingSummary } from "@/lib/tauri";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min — backend cache TTL is 10 min

export interface SpendingState {
  summary: SpendingSummary;
  /** True until the first fetch lands. UI shows a brief skeleton. */
  loading: boolean;
  /** Force-refetch — call after the user pastes a new admin key. */
  refresh: () => Promise<void>;
}

const NOT_CONNECTED: SpendingSummary = { kind: "not_connected" };

/**
 * Live spending summary backed by the Anthropic Admin API. The Rust
 * backend handles caching (10-min TTL) and key-presence detection — this
 * hook is a thin wrapper that polls every 5 minutes and exposes a manual
 * refresh hook for the Preferences key-edit save flow.
 *
 * No estimation. If the user hasn't connected an admin key, the summary
 * is `{ kind: "not_connected" }` and the UI surfaces a CTA + Console
 * deep-link.
 */
export function useSpending(): SpendingState {
  const [summary, setSummary] = useState<SpendingSummary>(NOT_CONNECTED);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetch = useCallback(async (force: boolean) => {
    try {
      const next = await getSpendingSummary(force);
      if (mountedRef.current) setSummary(next);
    } catch {
      // Tauri IPC unavailable (e.g. browser dev mode) — leave as not_connected.
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetch(false);
    const id = setInterval(() => void fetch(false), POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetch]);

  const refresh = useCallback(() => fetch(true), [fetch]);

  return { summary, loading, refresh };
}
