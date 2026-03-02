import { useCallback, useState } from "react";
import { readConfig, writeConfig } from "@/lib/tauri";

export function useConfig(componentId: string, configPath: string) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await readConfig(componentId, configPath);
      setContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [componentId, configPath]);

  const save = useCallback(
    async (newContent: string) => {
      try {
        setSaving(true);
        setError(null);
        await writeConfig(componentId, configPath, newContent);
        setContent(newContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [componentId, configPath],
  );

  return { content, loading, saving, error, load, save, setContent };
}
