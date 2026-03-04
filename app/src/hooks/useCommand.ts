import { useCallback, useState } from "react";
import type { CommandResult } from "@/lib/types";
import { runCommand } from "@/lib/tauri";
import { useToast } from "@/lib/ToastContext";
import { classifyError } from "@/lib/errors";

export function useCommand() {
  const [result, setResult] = useState<CommandResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const execute = useCallback(
    async (
      componentId: string,
      commandId: string,
      args: Record<string, string> = {},
    ) => {
      try {
        setRunning(true);
        setError(null);
        setResult(null);
        const res = await runCommand(componentId, commandId, args);
        setResult(res);
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        const classified = classifyError(err);
        addToast({
          type: "error",
          title: classified.title,
          message: `${commandId}: ${classified.message}`,
          retryFn: classified.retryable
            ? () => execute(componentId, commandId, args)
            : undefined,
          duration: 0,
        });
        throw err;
      } finally {
        setRunning(false);
      }
    },
    [addToast],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, running, error, execute, clear };
}
