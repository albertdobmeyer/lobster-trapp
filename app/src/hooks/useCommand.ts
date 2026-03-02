import { useCallback, useState } from "react";
import type { CommandResult } from "@/lib/types";
import { runCommand } from "@/lib/tauri";

export function useCommand() {
  const [result, setResult] = useState<CommandResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw err;
      } finally {
        setRunning(false);
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, running, error, execute, clear };
}
