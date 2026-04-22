import { classifyError } from "./errors";

describe("classifyError", () => {
  // ─── Legacy categories (preserve back-compat) ───
  test("classifies timeout errors", () => {
    const result = classifyError("Command timed out after 30 seconds");
    expect(result.category).toBe("timeout");
    expect(result.severity).toBe("transient");
    expect(result.retryable).toBe(true);
  });

  test("classifies component not found", () => {
    const result = classifyError("Component not found: my-component");
    expect(result.category).toBe("not_found");
    expect(result.retryable).toBe(false);
  });

  test("classifies command not found", () => {
    const result = classifyError("Command not found: start in component vault");
    expect(result.category).toBe("not_found");
  });

  test("classifies config not found", () => {
    const result = classifyError("Config file not found: config.yml");
    expect(result.category).toBe("config");
  });

  test("classifies config write errors", () => {
    const result = classifyError("Config write error: permission denied");
    expect(result.category).toBe("config");
    expect(result.retryable).toBe(true);
  });

  test("classifies path traversal as permission", () => {
    const result = classifyError("Path traversal detected");
    expect(result.category).toBe("permission");
    expect(result.severity).toBe("permissions");
    expect(result.retryable).toBe(false);
  });

  test("classifies shell not found", () => {
    const result = classifyError("Shell not found: bash");
    expect(result.category).toBe("execution");
    expect(result.severity).toBe("platform");
  });

  test("classifies manifest parse errors", () => {
    const result = classifyError("Manifest parse error in component.yml: invalid YAML");
    expect(result.category).toBe("parse");
  });

  test("classifies execution failures", () => {
    const result = classifyError("Command execution failed: exit code 1");
    expect(result.category).toBe("execution");
    expect(result.severity).toBe("transient");
    expect(result.retryable).toBe(true);
  });

  test("classifies unknown errors", () => {
    const result = classifyError("Something completely unexpected");
    expect(result.category).toBe("unknown");
    expect(result.severity).toBe("unknown");
    expect(result.retryable).toBe(false);
  });

  test("handles Error objects", () => {
    const result = classifyError(new Error("Command timed out after 10 seconds"));
    expect(result.category).toBe("timeout");
    expect(result.message).toBe("Command timed out after 10 seconds");
  });

  // ─── New spec 06 severity axis ───
  test("classifies network refused as connectivity", () => {
    const result = classifyError("connect ECONNREFUSED 127.0.0.1:11434");
    expect(result.severity).toBe("connectivity");
    expect(result.retryable).toBe(true);
  });

  test("classifies fetch failed as connectivity", () => {
    const result = classifyError("fetch failed");
    expect(result.severity).toBe("connectivity");
  });

  test("classifies 401 as authentication", () => {
    const result = classifyError("Request returned 401 Unauthorized");
    expect(result.severity).toBe("authentication");
  });

  test("classifies invalid api key as authentication", () => {
    const result = classifyError("Invalid API key");
    expect(result.severity).toBe("authentication");
  });

  test("classifies disk full as resource", () => {
    const result = classifyError("write failed: ENOSPC");
    expect(result.severity).toBe("resource");
  });

  test("classifies EACCES as permissions", () => {
    const result = classifyError("EACCES: permission denied, open '/etc/passwd'");
    expect(result.severity).toBe("permissions");
    expect(result.retryable).toBe(false);
  });

  test("provides plain-language userMessage and suggestedAction for known patterns", () => {
    const result = classifyError("connect ETIMEDOUT 1.1.1.1:443");
    expect(result.userMessage).toMatch(/network/i);
    expect(result.suggestedAction).toMatch(/wifi/i);
  });

  test("provides safe fallback for unknown errors", () => {
    const result = classifyError("Frobnicator quux exception");
    expect(result.userMessage).toMatch(/didn't work/i);
    expect(result.suggestedAction).toMatch(/get help/i);
  });

  test("technicalDetails mirrors message for redaction-free passthrough", () => {
    const raw = "Some raw error from the kernel";
    const result = classifyError(raw);
    expect(result.technicalDetails).toBe(raw);
    expect(result.message).toBe(raw);
  });
});
