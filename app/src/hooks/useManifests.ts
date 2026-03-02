import { useEffect, useState } from "react";
import type { DiscoveredComponent } from "@/lib/types";
import { listComponents } from "@/lib/tauri";

export function useManifests() {
  const [components, setComponents] = useState<DiscoveredComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listComponents();
      setComponents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { components, loading, error, refresh };
}
