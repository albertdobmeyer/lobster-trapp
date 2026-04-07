import { stripAnsi } from "./ansi";

interface CardGridRendererProps {
  content: string;
  exitCode: number;
}

interface CardData {
  title: string;
  fields: Array<{ key: string; value: unknown }>;
  status?: string;
}

// Keys checked in priority order for card title
const TITLE_KEYS = ["name", "id", "title", "skill", "tool"];

// Status badge color mapping
const STATUS_GREEN = new Set([
  "certified", "passing", "pass", "ok", "healthy", "ready", "clean", "safe",
]);
const STATUS_YELLOW = new Set([
  "warning", "warn", "caution", "partial", "pending",
]);
const STATUS_RED = new Set([
  "error", "fail", "failing", "critical", "blocked", "malicious",
]);

function getStatusColor(status: string): string {
  const lower = status.toLowerCase();
  if (STATUS_GREEN.has(lower)) return "bg-green-900/50 text-green-300 border-green-700";
  if (STATUS_YELLOW.has(lower)) return "bg-yellow-900/50 text-yellow-300 border-yellow-700";
  if (STATUS_RED.has(lower)) return "bg-red-900/50 text-red-300 border-red-700";
  return "bg-gray-800 text-gray-300 border-gray-600";
}

function resolveTitle(obj: Record<string, unknown>, index: number): string {
  for (const key of TITLE_KEYS) {
    if (key in obj && obj[key] != null) {
      return String(obj[key]);
    }
  }
  return `Card ${index + 1}`;
}

function objectToCard(obj: Record<string, unknown>, index: number): CardData {
  const title = resolveTitle(obj, index);
  const titleKey = TITLE_KEYS.find((k) => k in obj && obj[k] != null);
  const status = typeof obj.status === "string" ? obj.status : undefined;

  const fields: Array<{ key: string; value: unknown }> = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key === titleKey || key === "status") continue;
    fields.push({ key, value });
  }

  return { title, fields, status };
}

function formatValue(value: unknown): JSX.Element {
  if (typeof value === "boolean") {
    return value ? (
      <span className="text-green-400">&#10003;</span>
    ) : (
      <span className="text-red-400">&#10007;</span>
    );
  }
  const str = String(value);
  const display = str.length > 200 ? str.slice(0, 200) + "\u2026" : str;
  return <span className="text-gray-200">{display}</span>;
}

/**
 * Try to parse content as a JSON array of objects.
 * Returns null if content is not valid JSON or not an array of objects.
 */
function tryJsonArray(text: string): Record<string, unknown>[] | null {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null) {
      return parsed as Record<string, unknown>[];
    }
    // JSON object with a single array value
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const values = Object.values(parsed);
      if (values.length === 1 && Array.isArray(values[0]) && values[0].length > 0 && typeof values[0][0] === "object" && values[0][0] !== null) {
        return values[0] as Record<string, unknown>[];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try to parse content as newline-delimited JSON (JSONL).
 * Returns null if any non-empty line fails to parse as a JSON object.
 */
function tryJsonl(text: string): Record<string, unknown>[] | null {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return null;

  const results: Record<string, unknown>[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return null;
      }
      results.push(parsed as Record<string, unknown>);
    } catch {
      return null;
    }
  }
  return results.length > 0 ? results : null;
}

/**
 * Section-header fallback: split by header-like lines, same logic as ReportRenderer.
 */
function sectionFallback(text: string): CardData[] {
  const lines = text.split("\n");
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } = { title: "", lines: [] };

  lines.forEach((line) => {
    const isHeader =
      line.match(/^#{1,3}\s/) ||
      line.match(/^={3,}/) ||
      line.match(/^-{3,}/) ||
      (line === line.toUpperCase() && line.trim().length > 3 && !line.includes(" "));

    if (isHeader && current.lines.length > 0) {
      sections.push(current);
      current = { title: line.replace(/^[#=\-\s]+/, "").trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  });
  sections.push(current);

  return sections.map((section, i) => ({
    title: section.title || `Card ${i + 1}`,
    fields: [{ key: "content", value: section.lines.join("\n").trim() }],
  }));
}

function parseContent(text: string): CardData[] {
  // 1. Try JSON array or object-with-array
  const jsonArray = tryJsonArray(text);
  if (jsonArray) {
    return jsonArray.map((obj, i) => objectToCard(obj, i));
  }

  // 2. Try JSONL
  const jsonl = tryJsonl(text);
  if (jsonl) {
    return jsonl.map((obj, i) => objectToCard(obj, i));
  }

  // 3. Section-header fallback
  return sectionFallback(text);
}

export default function CardGridRenderer({ content, exitCode }: CardGridRendererProps) {
  const clean = stripAnsi(content);
  const cards = parseContent(clean);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-200 truncate">
                {card.title}
              </h4>
            </div>
            {(card.fields.length > 0 || card.status) && (
              <div className="border-t border-gray-800 pt-2 space-y-1">
                {card.fields.map((field, j) => (
                  <div key={j} className="text-xs flex gap-1">
                    <span className="text-gray-400 shrink-0">{field.key}:</span>
                    {formatValue(field.value)}
                  </div>
                ))}
                {card.status && (
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs rounded border ${getStatusColor(card.status)}`}
                  >
                    {card.status}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-600 mt-4">
        Exit code: {exitCode}
      </div>
    </div>
  );
}
