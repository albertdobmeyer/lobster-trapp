import type { HealthValue } from "@/hooks/useHealth";

const COLOR_MAP: Record<string, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  gray: "#6b7280",
};

interface HealthBadgeProps {
  health: HealthValue;
}

export default function HealthBadge({ health }: HealthBadgeProps) {
  const color = COLOR_MAP[health.color] || COLOR_MAP.gray;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
    >
      <span
        className={`w-2 h-2 rounded-full ${health.loading ? "animate-pulse" : ""}`}
        style={{ backgroundColor: color }}
      />
      <span className="text-gray-400">{health.name}</span>
      <span className="font-medium" style={{ color }}>
        {health.value}
      </span>
    </div>
  );
}
