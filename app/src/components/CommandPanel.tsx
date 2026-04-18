import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Command, OutputDisplay } from "@/lib/types";
import { COMMAND_GROUP_ORDER, COMMAND_GROUP_LABELS } from "@/lib/types";
import { useCommand } from "@/hooks/useCommand";
import CommandButton from "./CommandButton";
import ArgumentForm from "./ArgumentForm";
import ConfirmDialog from "./ConfirmDialog";
import OutputRenderer from "./OutputRenderer";
import StreamOutput from "./StreamOutput";

interface CommandPanelProps {
  commands: Command[];
  componentId: string;
  currentState: string | null;
}

export default function CommandPanel({
  commands,
  componentId,
  currentState,
}: CommandPanelProps) {
  const { result, running, error, execute, clear } = useCommand();
  const [activeCommand, setActiveCommand] = useState<Command | null>(null);
  const [showArgs, setShowArgs] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingArgs, setPendingArgs] = useState<Record<string, string>>({});
  const [lastDisplay, setLastDisplay] = useState<string>("log");

  // Stream state: tracks the currently active stream command
  const [streamCommand, setStreamCommand] = useState<{
    commandId: string;
    args: Record<string, string>;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Split commands into user-tier and advanced-tier
  const userCommands = commands.filter((c) => c.tier === "user");
  const advancedCommands = commands.filter((c) => c.tier !== "user");

  // Group and sort commands
  const groupCommands = (cmds: Command[]) =>
    COMMAND_GROUP_ORDER
      .map((group) => ({
        group,
        label: COMMAND_GROUP_LABELS[group],
        commands: cmds
          .filter((c) => c.group === group)
          .sort((a, b) => a.sort_order - b.sort_order),
      }))
      .filter((g) => g.commands.length > 0);

  const userGrouped = groupCommands(userCommands);
  const advancedGrouped = groupCommands(advancedCommands);

  const isAvailable = (cmd: Command): boolean => {
    if (cmd.available_when.length === 0) return true;
    if (!currentState) return true;
    return cmd.available_when.includes(currentState);
  };

  const handleClick = (cmd: Command) => {
    setActiveCommand(cmd);

    if (cmd.args.length > 0) {
      setShowArgs(true);
      return;
    }

    if (cmd.danger !== "safe") {
      setShowConfirm(true);
      return;
    }

    dispatchCommand(cmd, {});
  };

  const handleArgsSubmit = (args: Record<string, string>) => {
    setShowArgs(false);
    setPendingArgs(args);

    if (activeCommand && activeCommand.danger !== "safe") {
      setShowConfirm(true);
      return;
    }

    if (activeCommand) {
      dispatchCommand(activeCommand, args);
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    if (activeCommand) {
      dispatchCommand(activeCommand, pendingArgs);
    }
  };

  const dispatchCommand = async (cmd: Command, args: Record<string, string>) => {
    if (cmd.type === "stream") {
      // Close any previous stream, clear blocking output
      clear();
      setStreamCommand({ commandId: cmd.id, args });
      setPendingArgs({});
      return;
    }

    // Non-stream: run as blocking command
    setStreamCommand(null);
    clear();
    setLastDisplay(cmd.output?.display || "log");
    await execute(componentId, cmd.id, args);
    setPendingArgs({});
  };

  const renderGroup = ({ group, label, commands: cmds }: { group: string; label: string; commands: Command[] }) => (
    <div key={group}>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        {label}
      </h3>
      <div className="flex flex-wrap gap-2">
        {cmds.map((cmd) => (
          <CommandButton
            key={cmd.id}
            command={cmd}
            disabled={!isAvailable(cmd)}
            running={
              (running && activeCommand?.id === cmd.id) ||
              (streamCommand?.commandId === cmd.id)
            }
            onClick={() => handleClick(cmd)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* User-tier commands */}
      {userGrouped.map(renderGroup)}

      {/* Advanced toggle */}
      {advancedGrouped.length > 0 && (
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced ({advancedCommands.length} commands)
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-6 border-t border-gray-800 pt-4">
              {advancedGrouped.map(renderGroup)}
            </div>
          )}
        </div>
      )}

      {/* Stream output */}
      {streamCommand && (
        <StreamOutput
          componentId={componentId}
          commandId={streamCommand.commandId}
          args={streamCommand.args}
          onStop={() => setStreamCommand(null)}
        />
      )}

      {/* Blocking command output */}
      {!streamCommand && (result || error) && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Output
            </h3>
            {result && (
              <span className="text-xs text-gray-600">
                {result.duration_ms}ms
              </span>
            )}
          </div>
          {error && (
            <div className="bg-red-950 border border-red-800 rounded-md p-4 text-sm text-red-300">
              {error}
            </div>
          )}
          {result && (
            <OutputRenderer
              result={result}
              display={lastDisplay as OutputDisplay}
            />
          )}
        </div>
      )}

      {/* Argument form modal */}
      {showArgs && activeCommand && (
        <ArgumentForm
          command={activeCommand}
          componentId={componentId}
          onSubmit={handleArgsSubmit}
          onCancel={() => {
            setShowArgs(false);
            setActiveCommand(null);
          }}
        />
      )}

      {/* Confirmation dialog */}
      {showConfirm && activeCommand && (
        <ConfirmDialog
          open
          title={`Run "${activeCommand.name}"?`}
          message={
            activeCommand.description || `This will execute: ${activeCommand.command}`
          }
          danger={activeCommand.danger}
          confirmLabel={`Run ${activeCommand.name}`}
          onConfirm={handleConfirm}
          onCancel={() => {
            setShowConfirm(false);
            setActiveCommand(null);
            setPendingArgs({});
          }}
        />
      )}
    </div>
  );
}
