import { useCallback, useState } from "react";
import { CheckCircle, Loader2, Play } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import { runCommand } from "@/lib/tauri";

interface CompleteStepProps {
  components: DiscoveredComponent[];
  onFinish: () => void;
}

export default function CompleteStep({
  components,
  onFinish,
}: CompleteStepProps) {
  const [starting, setStarting] = useState<string | null>(null);
  const [started, setStarted] = useState<Set<string>>(new Set());

  const handleStart = useCallback(
    async (componentId: string) => {
      setStarting(componentId);
      try {
        await runCommand(componentId, "start");
        setStarted((prev) => new Set([...prev, componentId]));
      } catch {
        // Toast will be shown by error handling
      } finally {
        setStarting(null);
      }
    },
    [],
  );

  const startableComponents = components.filter((c) =>
    c.manifest.commands.some((cmd) => cmd.id === "start"),
  );

  return (
    <div className="text-center max-w-md mx-auto py-12">
      <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-100 mb-3">All Set!</h2>
      <p className="text-gray-400 mb-8">
        Your environment is ready. You can start components now or head to the
        dashboard.
      </p>

      {startableComponents.length > 0 && (
        <div className="space-y-3 mb-8 text-left">
          {startableComponents.map((comp) => {
            const id = comp.manifest.identity.id;
            const isStarted = started.has(id);
            const isStarting = starting === id;

            return (
              <div
                key={id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800"
              >
                {isStarted ? (
                  <CheckCircle size={16} className="text-green-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-800 border border-gray-700 shrink-0" />
                )}
                <span className="flex-1 text-sm text-gray-200">
                  {comp.manifest.identity.name}
                </span>
                {!isStarted && (
                  <button
                    onClick={() => handleStart(id)}
                    disabled={isStarting || starting !== null}
                    className="text-xs px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isStarting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                    Start
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onFinish}
        className="btn bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-base"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
