import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentStatus } from "@/lib/types";
import { getStatus } from "@/lib/tauri";
import { useToast } from "@/lib/ToastContext";

export function useComponentStatus(
  componentId: string,
  intervalMs: number = 10000,
) {
  const [status, setStatus] = useState<ComponentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const failCountRef = useRef(0);
  const toastFiredRef = useRef(false);
  const { addToast } = useToast();

  const poll = useCallback(async () => {
    try {
      const result = await getStatus(componentId);
      setStatus(result);
      failCountRef.current = 0;
      toastFiredRef.current = false;
    } catch {
      failCountRef.current++;
      // Only toast after 3 consecutive failures, and only once
      if (failCountRef.current >= 3 && !toastFiredRef.current) {
        toastFiredRef.current = true;
        addToast({
          type: "warning",
          title: "Status probe failing",
          message: `Unable to determine status for ${componentId}`,
          duration: 8000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [componentId, addToast]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll, intervalMs]);

  return { status, loading, refresh: poll };
}
