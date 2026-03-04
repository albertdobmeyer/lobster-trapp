import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { StreamLine, StreamEnd } from "@/lib/types";
import { startStream, stopStream } from "@/lib/tauri";
import { useToast } from "@/lib/ToastContext";
import { classifyError } from "@/lib/errors";

export function useCommandStream(componentId: string, commandId: string) {
  const [lines, setLines] = useState<StreamLine[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const unlistenersRef = useRef<Array<() => void>>([]);
  const { addToast } = useToast();

  const cleanup = useCallback(() => {
    unlistenersRef.current.forEach((fn) => fn());
    unlistenersRef.current = [];
  }, []);

  const start = useCallback(
    async (args: Record<string, string> = {}) => {
      cleanup();
      setLines([]);
      setExitCode(null);
      setStreaming(true);

      try {
        const unlistenLine = await listen<StreamLine>("stream-line", (event) => {
          if (
            event.payload.component_id === componentId &&
            event.payload.command_id === commandId
          ) {
            setLines((prev) => [...prev, event.payload]);
          }
        });

        const unlistenEnd = await listen<StreamEnd>("stream-end", (event) => {
          if (
            event.payload.component_id === componentId &&
            event.payload.command_id === commandId
          ) {
            setExitCode(event.payload.exit_code);
            setStreaming(false);
          }
        });

        unlistenersRef.current = [unlistenLine, unlistenEnd];
        await startStream(componentId, commandId, args);
      } catch (err) {
        setStreaming(false);
        const classified = classifyError(err);
        addToast({
          type: "error",
          title: classified.title,
          message: `Stream ${commandId}: ${classified.message}`,
          retryFn: classified.retryable
            ? () => start(args)
            : undefined,
          duration: 0,
        });
      }
    },
    [componentId, commandId, cleanup, addToast],
  );

  const stop = useCallback(async () => {
    await stopStream(componentId, commandId);
    cleanup();
    setStreaming(false);
  }, [componentId, commandId, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { lines, streaming, exitCode, start, stop };
}
