export type ErrorCategory =
  | "timeout"
  | "not_found"
  | "permission"
  | "execution"
  | "config"
  | "parse"
  | "unknown";

export interface ClassifiedError {
  category: ErrorCategory;
  title: string;
  message: string;
  retryable: boolean;
}

const PATTERNS: Array<{
  test: RegExp;
  category: ErrorCategory;
  title: string;
  retryable: boolean;
}> = [
  { test: /timed out/i, category: "timeout", title: "Command timed out", retryable: true },
  { test: /Component not found/i, category: "not_found", title: "Component not found", retryable: false },
  { test: /Command not found/i, category: "not_found", title: "Command not found", retryable: false },
  { test: /Config file not found/i, category: "config", title: "Config not found", retryable: false },
  { test: /Config write error/i, category: "config", title: "Config write failed", retryable: true },
  { test: /Shell not found/i, category: "execution", title: "Shell not available", retryable: false },
  { test: /Not found/i, category: "not_found", title: "Not found", retryable: false },
  { test: /Path traversal/i, category: "permission", title: "Access denied", retryable: false },
  { test: /Manifest parse error/i, category: "parse", title: "Invalid manifest", retryable: false },
  { test: /execution failed/i, category: "execution", title: "Command failed", retryable: true },
];

export function classifyError(err: unknown): ClassifiedError {
  const message = err instanceof Error ? err.message : String(err);

  for (const pattern of PATTERNS) {
    if (pattern.test.test(message)) {
      return {
        category: pattern.category,
        title: pattern.title,
        message,
        retryable: pattern.retryable,
      };
    }
  }

  return {
    category: "unknown",
    title: "Something went wrong",
    message,
    retryable: false,
  };
}
