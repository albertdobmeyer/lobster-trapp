import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { StreamLine, StreamEnd } from "@/lib/types";
import { startStream, stopStream } from "@/lib/tauri";

export function useCommandStream(componentId: string, commandId: string) {
  const [lines, setLines] = useState<StreamLine[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const unlistenersRef = useRef<Array<() => void>>([]);

  // Clean up any existing listeners
  const cleanup = useCallback(() => {
    unlistenersRef.current.forEach((fn) => fn());
    unlistenersRef.current = [];
  }, []);

  const start = useCallback(
    async (args: Record<string, string> = {}) => {
      // Clean up previous listeners before registering new ones
      cleanup();

      setLines([]);
      setExitCode(null);
      setStreaming(true);

      // Listen for stream events
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
    },
    [componentId, commandId, cleanup],
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
