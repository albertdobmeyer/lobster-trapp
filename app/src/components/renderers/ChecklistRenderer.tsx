import { Check, X, Minus } from "lucide-react";
import { stripAnsi } from "./ansi";

interface ChecklistRendererProps {
  content: string;
  exitCode: number;
}

export default function ChecklistRenderer({
  content,
  exitCode,
}: ChecklistRendererProps) {
  const lines = stripAnsi(content)
    .split("\n")
    .filter((l) => l.trim());

  const items = lines.map((line) => {
    const pass =
      line.includes("PASS") ||
      line.includes("OK") ||
      line.includes("\u2713") ||
      line.includes("[+]");
    const fail =
      line.includes("FAIL") ||
      line.includes("ERROR") ||
      line.includes("\u2717") ||
      line.includes("[-]");
    return {
      text: line.replace(/[\u2713\u2717\[\+\]\[\-\]]/g, "").trim(),
      status: pass ? ("pass" as const) : fail ? ("fail" as const) : ("neutral" as const),
    };
  });

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
        >
          {item.status === "pass" && (
            <Check size={14} className="text-green-400 shrink-0" />
          )}
          {item.status === "fail" && (
            <X size={14} className="text-red-400 shrink-0" />
          )}
          {item.status === "neutral" && (
            <Minus size={14} className="text-gray-500 shrink-0" />
          )}
          <span
            className={
              item.status === "fail" ? "text-red-300" : "text-gray-300"
            }
          >
            {item.text}
          </span>
        </div>
      ))}
      <div className="pt-2 border-t border-gray-800 mt-2">
        <span
          className={`text-xs font-medium ${exitCode === 0 ? "text-green-400" : "text-red-400"}`}
        >
          {exitCode === 0 ? "All checks passed" : `Exited with code ${exitCode}`}
        </span>
      </div>
    </div>
  );
}
