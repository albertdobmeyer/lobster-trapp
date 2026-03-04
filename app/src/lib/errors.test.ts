import { classifyError } from "./errors";

describe("classifyError", () => {
  test("classifies timeout errors", () => {
    const result = classifyError("Command timed out after 30 seconds");
    expect(result.category).toBe("timeout");
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
    expect(result.retryable).toBe(false);
  });

  test("classifies shell not found", () => {
    const result = classifyError("Shell not found: bash");
    expect(result.category).toBe("execution");
  });

  test("classifies manifest parse errors", () => {
    const result = classifyError("Manifest parse error in component.yml: invalid YAML");
    expect(result.category).toBe("parse");
  });

  test("classifies execution failures", () => {
    const result = classifyError("Command execution failed: exit code 1");
    expect(result.category).toBe("execution");
    expect(result.retryable).toBe(true);
  });

  test("classifies unknown errors", () => {
    const result = classifyError("Something completely unexpected");
    expect(result.category).toBe("unknown");
    expect(result.retryable).toBe(false);
  });

  test("handles Error objects", () => {
    const result = classifyError(new Error("Command timed out after 10 seconds"));
    expect(result.category).toBe("timeout");
    expect(result.message).toBe("Command timed out after 10 seconds");
  });
});
