import { Loader2 } from "lucide-react";
import type { Command } from "@/lib/types";
import { DANGER_STYLES } from "@/lib/types";

interface CommandButtonProps {
  command: Command;
  disabled?: boolean;
  running?: boolean;
  onClick: () => void;
}

export default function CommandButton({
  command,
  disabled,
  running,
  onClick,
}: CommandButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || running}
      className={`btn ${DANGER_STYLES[command.danger]} flex items-center gap-2`}
      title={command.description || command.name}
    >
      {running && <Loader2 size={14} className="animate-spin" />}
      {command.name}
    </button>
  );
}
