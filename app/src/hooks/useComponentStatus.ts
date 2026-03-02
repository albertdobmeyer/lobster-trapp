import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentStatus } from "@/lib/types";
import { getStatus } from "@/lib/tauri";

export function useComponentStatus(
  componentId: string,
  intervalMs: number = 10000,
) {
  const [status, setStatus] = useState<ComponentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const poll = useCallback(async () => {
    try {
      const result = await getStatus(componentId);
      setStatus(result);
    } catch {
      // Probe failures are expected for placeholder components
    } finally {
      setLoading(false);
    }
  }, [componentId]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll, intervalMs]);

  return { status, loading, refresh: poll };
}
