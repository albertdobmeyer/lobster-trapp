// ANSI escape code handling: strip or parse to styled spans

// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]/g;

/** Strip all ANSI escape codes, returning plain text. */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, "");
}

/** A text segment with optional foreground/background color and style. */
export interface AnsiSpan {
  text: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
}

// Standard 8-color palette (SGR 30–37 / 40–47)
const COLORS_NORMAL: Record<number, string> = {
  0: "#4b5563", // black (gray-600 so it's visible on dark bg)
  1: "#ef4444", // red
  2: "#22c55e", // green
  3: "#eab308", // yellow
  4: "#3b82f6", // blue
  5: "#a855f7", // magenta
  6: "#06b6d4", // cyan
  7: "#d1d5db", // white
};

// Bright palette (SGR 90–97 / 100–107)
const COLORS_BRIGHT: Record<number, string> = {
  0: "#6b7280",
  1: "#f87171",
  2: "#4ade80",
  3: "#facc15",
  4: "#60a5fa",
  5: "#c084fc",
  6: "#22d3ee",
  7: "#f9fafb",
};

// 256-color lookup (SGR 38;5;n / 48;5;n)
function color256(n: number): string | undefined {
  if (n < 8) return COLORS_NORMAL[n];
  if (n < 16) return COLORS_BRIGHT[n - 8];
  if (n < 232) {
    // 6x6x6 color cube
    const idx = n - 16;
    const r = Math.floor(idx / 36);
    const g = Math.floor((idx % 36) / 6);
    const b = idx % 6;
    const toHex = (v: number) =>
      (v === 0 ? 0 : 55 + v * 40).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  if (n < 256) {
    // Grayscale ramp
    const v = (8 + (n - 232) * 10).toString(16).padStart(2, "0");
    return `#${v}${v}${v}`;
  }
  return undefined;
}

// eslint-disable-next-line no-control-regex
const ANSI_TOKEN = /\x1b\[([0-9;]*)([a-zA-Z])/g;

/**
 * Parse a string containing ANSI escape codes into styled spans.
 * Supports SGR codes (colors, bold, dim, italic, underline, reset).
 */
export function parseAnsi(text: string): AnsiSpan[] {
  const spans: AnsiSpan[] = [];

  let fg: string | undefined;
  let bg: string | undefined;
  let bold = false;
  let dim = false;
  let italic = false;
  let underline = false;
  let lastIndex = 0;

  ANSI_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ANSI_TOKEN.exec(text)) !== null) {
    // Push text before this escape sequence
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index);
      if (segment) {
        spans.push({ text: segment, fg, bg, bold, dim, italic, underline });
      }
    }
    lastIndex = ANSI_TOKEN.lastIndex;

    const code = match[2];
    if (code !== "m") continue; // Only handle SGR (m) sequences

    const params = match[1]
      ? match[1].split(";").map((s) => parseInt(s, 10))
      : [0];

    for (let i = 0; i < params.length; i++) {
      const p = params[i];

      if (p === 0) {
        // Reset
        fg = undefined;
        bg = undefined;
        bold = false;
        dim = false;
        italic = false;
        underline = false;
      } else if (p === 1) {
        bold = true;
      } else if (p === 2) {
        dim = true;
      } else if (p === 3) {
        italic = true;
      } else if (p === 4) {
        underline = true;
      } else if (p === 22) {
        bold = false;
        dim = false;
      } else if (p === 23) {
        italic = false;
      } else if (p === 24) {
        underline = false;
      } else if (p >= 30 && p <= 37) {
        fg = COLORS_NORMAL[p - 30];
      } else if (p === 38) {
        // Extended foreground: 38;5;n or 38;2;r;g;b
        if (params[i + 1] === 5 && i + 2 < params.length) {
          fg = color256(params[i + 2]);
          i += 2;
        } else if (params[i + 1] === 2 && i + 4 < params.length) {
          const r = params[i + 2];
          const g = params[i + 3];
          const b = params[i + 4];
          fg = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
          i += 4;
        }
      } else if (p === 39) {
        fg = undefined;
      } else if (p >= 40 && p <= 47) {
        bg = COLORS_NORMAL[p - 40];
      } else if (p === 48) {
        // Extended background: 48;5;n or 48;2;r;g;b
        if (params[i + 1] === 5 && i + 2 < params.length) {
          bg = color256(params[i + 2]);
          i += 2;
        } else if (params[i + 1] === 2 && i + 4 < params.length) {
          const r = params[i + 2];
          const g = params[i + 3];
          const b = params[i + 4];
          bg = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
          i += 4;
        }
      } else if (p === 49) {
        bg = undefined;
      } else if (p >= 90 && p <= 97) {
        fg = COLORS_BRIGHT[p - 90];
      } else if (p >= 100 && p <= 107) {
        bg = COLORS_BRIGHT[p - 100];
      }
    }
  }

  // Push remaining text after last escape
  if (lastIndex < text.length) {
    const segment = text.slice(lastIndex);
    if (segment) {
      spans.push({ text: segment, fg, bg, bold, dim, italic, underline });
    }
  }

  // If no ANSI codes were found, return the whole string as one span
  if (spans.length === 0 && text) {
    spans.push({ text });
  }

  return spans;
}
