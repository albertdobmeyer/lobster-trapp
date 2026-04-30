import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  getPerimeterState,
  type PerimeterStatus,
  type PerimeterState,
} from "@/lib/tauri";
import { useSettings } from "./useSettings";

/**
 * The hero card on Home renders one of these states. This is a *user-facing*
 * state — derived from the backend `PerimeterState` (which is mechanical: how
 * many containers are running) plus session context (has the perimeter ever
 * been healthy this session? has the wizard run?).
 *
 * Mapping rules live in docs/specs/2026-04-30-pass-6-roadmap.md. Two states
 * named in the Pass 2 spec are NOT YET REACHABLE in Pass 6 and will appear
 * in Pass 7: `paused_by_user` (needs a "Pause" affordance and intent flag)
 * and `error_key` (needs an Anthropic 401 detector in the alerts evaluator).
 */
export type HeroState =
  | "not_setup"
  | "starting"
  | "running_safely"
  | "recovering"
  | "error_perimeter";

export interface Hero {
  state: HeroState;
  /** Underlying perimeter snapshot — useful for the Security tile + diagnostics. */
  status: PerimeterStatus;
  /** True until the first watchdog tick lands. UI shows a brief skeleton. */
  loading: boolean;
}

const EMPTY_STATUS: PerimeterStatus = {
  state: "not_setup",
  containers: [],
  last_checked_unix_ms: 0,
};

export function useHero(): Hero {
  const { settings } = useSettings();
  const [status, setStatus] = useState<PerimeterStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);
  const hasBeenRunningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | null = null;

    (async () => {
      try {
        const initial = await getPerimeterState();
        if (cancelled) return;
        if (initial.state === "running_safely") hasBeenRunningRef.current = true;
        setStatus(initial);
      } catch {
        // Tauri IPC unavailable (e.g. browser dev mode) — keep EMPTY_STATUS.
      } finally {
        if (!cancelled) setLoading(false);
      }

      unlisten = await listen<PerimeterStatus>("perimeter-state-changed", (event) => {
        if (event.payload.state === "running_safely") {
          hasBeenRunningRef.current = true;
        }
        setStatus(event.payload);
      });
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const heroState = derive(status.state, hasBeenRunningRef.current, settings.wizardCompleted);

  return { state: heroState, status, loading };
}

function derive(
  perimeter: PerimeterState,
  hasBeenRunning: boolean,
  wizardCompleted: boolean,
): HeroState {
  switch (perimeter) {
    case "running_safely":
      return "running_safely";
    case "starting":
      return "starting";
    case "recovering":
      return hasBeenRunning ? "recovering" : "starting";
    case "stopped":
      // If the wizard never ran, "stopped" means "not yet set up", not "broken".
      return wizardCompleted ? "error_perimeter" : "not_setup";
    case "not_setup":
      return "not_setup";
  }
}
