import { useCallback, useState } from "react";
import { readConfig, writeConfig } from "@/lib/tauri";
import { useToast } from "@/lib/ToastContext";
import { classifyError } from "@/lib/errors";

export function useConfig(componentId: string, configPath: string) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

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
        addToast({ type: "success", title: "Config saved", duration: 3000 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        const classified = classifyError(err);
        addToast({
          type: "error",
          title: classified.title,
          message: classified.message,
          retryFn: classified.retryable
            ? () => save(newContent)
            : undefined,
          duration: 0,
        });
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [componentId, configPath, addToast],
  );

  return { content, loading, saving, error, load, save, setContent };
}
