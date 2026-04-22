/**
 * Legacy taxonomy — kept stable so existing hooks/components keep working.
 * New code should also read `severity` for the spec-06 failure cascade.
 */
export type ErrorCategory =
  | "timeout"
  | "not_found"
  | "permission"
  | "execution"
  | "config"
  | "parse"
  | "unknown";

/**
 * Spec 06 severity axis — drives Level 1 (silent retry) → Level 2 (FriendlyRetry) → Level 3 (ContactSupport).
 */
export type ErrorSeverity =
  | "transient"
  | "connectivity"
  | "authentication"
  | "configuration"
  | "permissions"
  | "resource"
  | "user-input"
  | "platform"
  | "unknown";

export interface ClassifiedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  /** Short heading suitable for any failure surface. */
  title: string;
  /** Plain-language sentence safe to show end users (no jargon, no stack frames). */
  userMessage: string;
  /** One-line guidance on what to do next. */
  suggestedAction: string;
  /** Raw error message — only render in dev mode or behind "Show technical details". */
  message: string;
  /** Same content as `message` — explicit alias used by Level 2/3 components. */
  technicalDetails: string;
  retryable: boolean;
}

interface Pattern {
  test: RegExp;
  category: ErrorCategory;
  severity: ErrorSeverity;
  title: string;
  userMessage: string;
  suggestedAction: string;
  retryable: boolean;
}

const PATTERNS: Pattern[] = [
  // Connectivity
  {
    test: /ECONNREFUSED|ETIMEDOUT|ENETUNREACH|getaddrinfo|fetch failed|network error/i,
    category: "execution",
    severity: "connectivity",
    title: "Can't reach the network",
    userMessage: "We couldn't reach the network from your computer.",
    suggestedAction: "Check your wifi connection and try again.",
    retryable: true,
  },
  // Authentication
  {
    test: /\b401\b|\bunauthorized\b|invalid api key|invalid token|invalid credentials/i,
    category: "permission",
    severity: "authentication",
    title: "Your AI key isn't working",
    userMessage: "Your AI key isn't being accepted.",
    suggestedAction: "Open Preferences and update your key.",
    retryable: false,
  },
  // Resource — disk/memory
  {
    test: /ENOSPC|disk full|out of memory|cannot allocate/i,
    category: "execution",
    severity: "resource",
    title: "Your computer is out of space",
    userMessage: "Your computer is out of space or memory.",
    suggestedAction: "Free up some space and try again.",
    retryable: false,
  },
  // Permissions (OS file/process). Match only the explicit OS error tokens —
  // the bare phrase "permission denied" appears in higher-level wrappers
  // (e.g. "Config write error: permission denied") that other patterns own.
  {
    test: /\bEACCES\b|\bEPERM\b/,
    category: "permission",
    severity: "permissions",
    title: "Permission denied",
    userMessage: "Lobster-TrApp doesn't have permission to do that.",
    suggestedAction: "Check the file permissions and try again.",
    retryable: false,
  },
  // Existing patterns — preserve category/retryable for back-compat
  {
    test: /timed out/i,
    category: "timeout",
    severity: "transient",
    title: "That took too long",
    userMessage: "That took too long to finish.",
    suggestedAction: "Let's try again — it usually works the second time.",
    retryable: true,
  },
  {
    test: /Component not found/i,
    category: "not_found",
    severity: "configuration",
    title: "We couldn't find that part of the app",
    userMessage: "We couldn't find that part of the app.",
    suggestedAction: "Try reopening the app.",
    retryable: false,
  },
  {
    test: /Command not found/i,
    category: "not_found",
    severity: "configuration",
    title: "We couldn't find what to run",
    userMessage: "We couldn't find what to run.",
    suggestedAction: "Try reopening the app.",
    retryable: false,
  },
  {
    test: /Config file not found/i,
    category: "config",
    severity: "configuration",
    title: "Settings file is missing",
    userMessage: "We couldn't find your settings file.",
    suggestedAction: "Re-run setup to recreate it.",
    retryable: false,
  },
  {
    test: /Config write error/i,
    category: "config",
    severity: "configuration",
    title: "Couldn't save your settings",
    userMessage: "We couldn't save your settings.",
    suggestedAction: "Make sure your computer has free space and try again.",
    retryable: true,
  },
  {
    test: /Shell not found/i,
    category: "execution",
    severity: "platform",
    title: "Shell not available",
    userMessage: "Lobster-TrApp couldn't find the right tools on your computer.",
    suggestedAction: "Re-run setup to install what's missing.",
    retryable: false,
  },
  {
    test: /Path traversal/i,
    category: "permission",
    severity: "permissions",
    title: "Access denied",
    userMessage: "That path isn't allowed for safety reasons.",
    suggestedAction: "Pick a different file or folder.",
    retryable: false,
  },
  {
    test: /Manifest parse error/i,
    category: "parse",
    severity: "configuration",
    title: "Settings are invalid",
    userMessage: "One of your assistant's settings files looks broken.",
    suggestedAction: "Re-run setup to restore the defaults.",
    retryable: false,
  },
  {
    test: /execution failed/i,
    category: "execution",
    severity: "transient",
    title: "Something didn't finish",
    userMessage: "That didn't finish successfully.",
    suggestedAction: "Try again in a moment.",
    retryable: true,
  },
  // Catch-all "Not found" goes last so more-specific patterns above win
  {
    test: /Not found/i,
    category: "not_found",
    severity: "configuration",
    title: "Not found",
    userMessage: "We couldn't find what you were looking for.",
    suggestedAction: "Try refreshing or reopening the app.",
    retryable: false,
  },
];

const UNKNOWN_FALLBACK: Omit<Pattern, "test"> = {
  category: "unknown",
  severity: "unknown",
  title: "Something went wrong",
  userMessage: "Something didn't work as expected.",
  suggestedAction: "Let's try again — if it keeps happening, get help.",
  retryable: false,
};

export function classifyError(err: unknown): ClassifiedError {
  const message = err instanceof Error ? err.message : String(err);

  for (const pattern of PATTERNS) {
    if (pattern.test.test(message)) {
      return {
        category: pattern.category,
        severity: pattern.severity,
        title: pattern.title,
        userMessage: pattern.userMessage,
        suggestedAction: pattern.suggestedAction,
        message,
        technicalDetails: message,
        retryable: pattern.retryable,
      };
    }
  }

  return {
    category: UNKNOWN_FALLBACK.category,
    severity: UNKNOWN_FALLBACK.severity,
    title: UNKNOWN_FALLBACK.title,
    userMessage: UNKNOWN_FALLBACK.userMessage,
    suggestedAction: UNKNOWN_FALLBACK.suggestedAction,
    message,
    technicalDetails: message,
    retryable: UNKNOWN_FALLBACK.retryable,
  };
}
