import { useEffect, useRef, useState } from "react";
import { useCommandStream } from "@/hooks/useCommandStream";
import AnsiLine from "./renderers/AnsiLine";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface StreamOutputProps {
  componentId: string;
  commandId: string;
  args: Record<string, string>;
  onStop: () => void;
}

export default function StreamOutput({
  componentId,
  commandId,
  args,
  onStop,
}: StreamOutputProps) {
  const { lines, streaming, exitCode, start, stop } = useCommandStream(
    componentId,
    commandId,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Elapsed timer
  useEffect(() => {
    if (streaming) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [streaming]);

  // Start the stream on mount
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      start(args);
    }
  }, [start, args]);

  // Auto-scroll to bottom as new lines arrive
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lines]);

  const handleStop = async () => {
    await stop();
    onStop();
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {streaming ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Streaming &middot; {formatElapsed(elapsed)}
            </span>
          ) : (
            <>Stream ended &middot; {formatElapsed(elapsed)}</>
          )}
        </h3>
        <div className="flex items-center gap-3">
          {exitCode !== null && (
            <span
              className={`text-xs ${exitCode === 0 ? "text-green-500" : "text-red-400"}`}
            >
              exit {exitCode}
            </span>
          )}
          {streaming && (
            <button
              onClick={handleStop}
              className="text-xs px-3 py-1 rounded bg-red-900 hover:bg-red-800 text-red-200 transition-colors"
            >
              Stop
            </button>
          )}
          {!streaming && (
            <button
              onClick={onStop}
              className="text-xs px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="bg-gray-950 border border-gray-800 rounded-md p-4 font-mono text-sm text-gray-300 max-h-96 overflow-y-auto"
      >
        {lines.length === 0 && streaming && (
          <span className="text-gray-600">Waiting for output...</span>
        )}
        {lines.map((line, i) => (
          <div
            key={i}
            className={line.stream === "stderr" ? "text-red-400" : ""}
          >
            <AnsiLine text={line.line} />
          </div>
        ))}
      </div>
    </div>
  );
}
