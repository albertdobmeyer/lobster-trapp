import { useEffect, useState } from "react";
import type { DiscoveredComponent } from "@/lib/types";
import { listComponents } from "@/lib/tauri";
import { useToast } from "@/lib/ToastContext";
import { classifyError } from "@/lib/errors";

export function useManifests() {
  const [components, setComponents] = useState<DiscoveredComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listComponents();
      setComponents(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      const classified = classifyError(err);
      addToast({
        type: "error",
        title: "Discovery failed",
        message: classified.message,
        retryFn: refresh,
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { components, loading, error, refresh };
}
