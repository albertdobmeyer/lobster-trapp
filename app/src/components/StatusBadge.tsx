import type { StateDefinition } from "@/lib/types";
import { DynamicIcon } from "./DynamicIcon";

interface StatusBadgeProps {
  stateId: string | null;
  states: StateDefinition[];
  loading?: boolean;
}

export default function StatusBadge({
  stateId,
  states,
  loading,
}: StatusBadgeProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        Checking...
      </span>
    );
  }

  const state = states.find((s) => s.id === stateId);

  if (!state) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-500">
        Unknown
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${state.color}20`,
        color: state.color,
      }}
    >
      {state.icon && <DynamicIcon name={state.icon} size={12} />}
      {state.label}
    </span>
  );
}
