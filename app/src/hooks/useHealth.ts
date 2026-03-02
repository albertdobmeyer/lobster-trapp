import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HealthProbe } from "@/lib/types";
import { runHealthProbe } from "@/lib/tauri";

export interface HealthValue {
  id: string;
  name: string;
  value: string;
  color: "green" | "yellow" | "red" | "gray";
  loading: boolean;
}

function evaluateThreshold(
  value: string,
  condition: string | undefined,
): boolean {
  if (!condition) return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    // String comparison: == "running"
    const eqMatch = condition.match(/^==\s*(.+)$/);
    if (eqMatch) return value.trim() === eqMatch[1].trim();
    return false;
  }
  // Numeric comparisons
  const match = condition.match(/^([<>=!]+)\s*([\d.]+)$/);
  if (!match) return false;
  const [, op, threshold] = match;
  const t = parseFloat(threshold);
  switch (op) {
    case ">=": return numValue >= t;
    case ">": return numValue > t;
    case "<=": return numValue <= t;
    case "<": return numValue < t;
    case "==": return numValue === t;
    default: return false;
  }
}

function parseProbeOutput(
  stdout: string,
  probe: HealthProbe,
): { value: string; color: "green" | "yellow" | "red" | "gray" } {
  let extracted = stdout.trim();

  // Apply parse rules
  switch (probe.parse.type) {
    case "regex": {
      if (probe.parse.expression) {
        try {
          const re = new RegExp(probe.parse.expression);
          const match = re.exec(stdout);
          extracted = match?.[1] ?? match?.[0] ?? extracted;
        } catch {
          // Invalid regex — use raw output
        }
      }
      break;
    }
    case "line_count":
      extracted = String(stdout.split("\n").filter((l) => l.trim()).length);
      break;
    case "exit_code":
      // Handled by caller — exit_code is passed separately
      break;
    case "json_path":
      // Basic JSON path: try to extract value
      if (probe.parse.expression) {
        try {
          const obj = JSON.parse(stdout);
          const keys = probe.parse.expression.replace(/^\$\.?/, "").split(".");
          let val: unknown = obj;
          for (const key of keys) {
            val = (val as Record<string, unknown>)?.[key];
          }
          extracted = String(val ?? "");
        } catch {
          // JSON parse failed
        }
      }
      break;
  }

  // Format value
  const formatted = probe.parse.format
    ? probe.parse.format.replace("{value}", extracted)
    : extracted;

  // Evaluate thresholds
  let color: "green" | "yellow" | "red" | "gray" = "gray";
  if (probe.thresholds) {
    if (evaluateThreshold(extracted, probe.thresholds.green)) {
      color = "green";
    } else if (evaluateThreshold(extracted, probe.thresholds.yellow)) {
      color = "yellow";
    } else if (evaluateThreshold(extracted, probe.thresholds.red)) {
      color = "red";
    }
  }

  return { value: formatted, color };
}

export function useHealth(
  componentId: string,
  probes: HealthProbe[],
) {
  const [values, setValues] = useState<HealthValue[]>(() =>
    probes.map((p) => ({
      id: p.id,
      name: p.name,
      value: "...",
      color: "gray" as const,
      loading: true,
    })),
  );
  const intervalsRef = useRef<Array<ReturnType<typeof setInterval>>>([]);

  // Stabilize probes reference to prevent effect restart loops
  const probeIds = useMemo(() => probes.map((p) => p.id).join(","), [probes]);

  const pollProbe = useCallback(
    async (probe: HealthProbe) => {
      try {
        const result = await runHealthProbe(
          componentId,
          probe.command,
          probe.timeout_seconds,
        );

        const { value, color } = parseProbeOutput(result.stdout, probe);

        setValues((prev) =>
          prev.map((v) =>
            v.id === probe.id
              ? { ...v, value, color, loading: false }
              : v,
          ),
        );
      } catch {
        setValues((prev) =>
          prev.map((v) =>
            v.id === probe.id
              ? { ...v, value: "Error", color: "red" as const, loading: false }
              : v,
          ),
        );
      }
    },
    [componentId],
  );

  useEffect(() => {
    // Clear previous intervals
    intervalsRef.current.forEach(clearInterval);

    // Initial poll
    probes.forEach((probe) => pollProbe(probe));

    // Set up intervals
    intervalsRef.current = probes.map((probe) =>
      setInterval(() => pollProbe(probe), probe.interval_seconds * 1000),
    );

    return () => {
      intervalsRef.current.forEach(clearInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probeIds, pollProbe]);

  return values;
}
