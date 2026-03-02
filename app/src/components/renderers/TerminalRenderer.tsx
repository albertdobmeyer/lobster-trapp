import { useEffect, useRef } from "react";
import { stripAnsi } from "./ansi";

interface TerminalRendererProps {
  content: string;
  exitCode?: number;
  streaming?: boolean;
}

export default function TerminalRenderer({
  content,
  exitCode,
  streaming,
}: TerminalRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content]);

  const lines = stripAnsi(content).split("\n");

  return (
    <div
      ref={containerRef}
      className="bg-gray-950 rounded-md border border-gray-800 p-4 max-h-[500px] overflow-y-auto font-mono text-sm"
    >
      {lines.map((line, i) => (
        <div key={i} className="text-gray-300 leading-relaxed">
          {line || "\u00A0"}
        </div>
      ))}
      {streaming && (
        <div className="text-gray-500 animate-pulse mt-1">
          {">"} waiting for output...
        </div>
      )}
      {exitCode !== undefined && !streaming && (
        <div
          className={`mt-2 pt-2 border-t border-gray-800 text-xs ${
            exitCode === 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          Process exited with code {exitCode}
        </div>
      )}
    </div>
  );
}
