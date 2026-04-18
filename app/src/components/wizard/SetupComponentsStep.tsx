import { useState, useCallback, useRef, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { CheckCircle, XCircle, Loader2, Play } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import type { StreamLine, StreamEnd } from "@/lib/types";
import { startStream, stopStream } from "@/lib/tauri";
import AnsiLine from "@/components/renderers/AnsiLine";
import { useToast } from "@/lib/ToastContext";
import { classifyError } from "@/lib/errors";

type SetupStatus = "pending" | "running" | "done" | "failed";

/** Redact API keys and tokens from build output */
function sanitizeLine(text: string): string {
  return text
    .replace(/(ANTHROPIC_API_KEY=|sk-ant-api03-)[^\s'"]+/g, "$1[REDACTED]")
    .replace(/(OPENAI_API_KEY=|sk-)[A-Za-z0-9_-]{10,}/g, "$1[REDACTED]")
    .replace(/(TELEGRAM_BOT_TOKEN=)\S+/g, "$1[REDACTED]")
    .replace(/(-e\s+ANTHROPIC_API_KEY=)\S+/g, "$1[REDACTED]")
    .replace(/(-e\s+OPENAI_API_KEY=)\S+/g, "$1[REDACTED]")
    .replace(/(-e\s+TELEGRAM_BOT_TOKEN=)\S+/g, "$1[REDACTED]");
}

interface ComponentSetupState {
  status: SetupStatus;
  lines: StreamLine[];
  exitCode: number | null;
}

interface SetupComponentsStepProps {
  components: DiscoveredComponent[];
  onNext: () => void;
  onBack: () => void;
}

export default function SetupComponentsStep({
  components,
  onNext,
  onBack,
}: SetupComponentsStepProps) {
  const { addToast } = useToast();

  // Filter to components that have a setup_command, vault first (it's the perimeter)
  const setupComponents = components
    .filter((c) => c.manifest.prerequisites?.setup_command)
    .sort((a, b) => {
      const aRuntime = a.manifest.prerequisites?.container_runtime ? 0 : 1;
      const bRuntime = b.manifest.prerequisites?.container_runtime ? 0 : 1;
      return aRuntime - bRuntime;
    });

  // Track setup state per component
  const [states, setStates] = useState<Record<string, ComponentSetupState>>(
    () => {
      const initial: Record<string, ComponentSetupState> = {};
      for (const c of setupComponents) {
        initial[c.manifest.identity.id] = {
          status: "pending",
          lines: [],
          exitCode: null,
        };
      }
      return initial;
    },
  );

  const unlistenersRef = useRef<Array<() => void>>([]);
  const outputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      unlistenersRef.current.forEach((fn) => fn());
    };
  }, []);

  // Auto-scroll output containers
  const scrollToBottom = useCallback((componentId: string) => {
    const el = outputRefs.current[componentId];
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const runSetup = useCallback(
    async (componentId: string, commandId: string) => {
      // Update status to running
      setStates((prev) => ({
        ...prev,
        [componentId]: { status: "running", lines: [], exitCode: null },
      }));

      try {
        // Listen for stream events
        const unlistenLine = await listen<StreamLine>(
          "stream-line",
          (event) => {
            if (
              event.payload.component_id === componentId &&
              event.payload.command_id === commandId
            ) {
              const sanitized = {
                ...event.payload,
                line: sanitizeLine(event.payload.line),
              };
              setStates((prev) => ({
                ...prev,
                [componentId]: {
                  ...prev[componentId],
                  lines: [...prev[componentId].lines, sanitized],
                },
              }));
              scrollToBottom(componentId);
            }
          },
        );

        const unlistenEnd = await listen<StreamEnd>("stream-end", (event) => {
          if (
            event.payload.component_id === componentId &&
            event.payload.command_id === commandId
          ) {
            const success = event.payload.exit_code === 0;
            setStates((prev) => ({
              ...prev,
              [componentId]: {
                ...prev[componentId],
                status: success ? "done" : "failed",
                exitCode: event.payload.exit_code,
              },
            }));
          }
        });

        unlistenersRef.current.push(unlistenLine, unlistenEnd);
        await startStream(componentId, commandId);
      } catch (err) {
        setStates((prev) => ({
          ...prev,
          [componentId]: {
            ...prev[componentId],
            status: "failed",
            exitCode: -1,
          },
        }));
        const classified = classifyError(err);
        addToast({
          type: "error",
          title: `Setup failed: ${componentId}`,
          message: classified.message,
          duration: 0,
        });
      }
    },
    [addToast, scrollToBottom],
  );

  const handleStop = useCallback(
    async (componentId: string, commandId: string) => {
      try {
        await stopStream(componentId, commandId);
      } catch {
        // ignore stop errors
      }
      setStates((prev) => ({
        ...prev,
        [componentId]: {
          ...prev[componentId],
          status: "failed",
          exitCode: -1,
        },
      }));
    },
    [],
  );

  // Check if all required setups are complete
  const requiredDone = setupComponents
    .filter((c) => c.manifest.prerequisites?.container_runtime)
    .every((c) => states[c.manifest.identity.id]?.status === "done");

  const anyRunning = Object.values(states).some(
    (s) => s.status === "running",
  );

  const canProceed = requiredDone && !anyRunning;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-2">
        Set Up Components
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Run the initial setup for each component. Container builds may take a
        few minutes.
      </p>

      <div className="space-y-4">
        {setupComponents.map((comp) => {
          const id = comp.manifest.identity.id;
          const commandId = comp.manifest.prerequisites!.setup_command!;
          const state = states[id];
          const isRequired = comp.manifest.prerequisites?.container_runtime;

          return (
            <div
              key={id}
              className="rounded-lg bg-gray-900 border border-gray-800 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4">
                <StatusIcon status={state.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">
                    {comp.manifest.identity.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {state.status === "pending" && "Ready to set up"}
                    {state.status === "running" && "Setting up..."}
                    {state.status === "done" && "Setup complete"}
                    {state.status === "failed" &&
                      `Failed (exit ${state.exitCode})`}
                    {isRequired && (
                      <span className="ml-2 text-amber-500">required</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {state.status === "pending" && (
                    <button
                      onClick={() => runSetup(id, commandId)}
                      disabled={anyRunning}
                      className="btn bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Play size={14} />
                      Set Up
                    </button>
                  )}
                  {state.status === "running" && (
                    <button
                      onClick={() => handleStop(id, commandId)}
                      className="text-xs px-3 py-1 rounded bg-red-900 hover:bg-red-800 text-red-200"
                    >
                      Stop
                    </button>
                  )}
                  {state.status === "failed" && (
                    <button
                      onClick={() => runSetup(id, commandId)}
                      disabled={anyRunning}
                      className="btn bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Play size={14} />
                      Retry
                    </button>
                  )}
                </div>
              </div>

              {/* Stream output */}
              {(state.status === "running" || state.lines.length > 0) && (
                <div
                  ref={(el) => {
                    outputRefs.current[id] = el;
                  }}
                  className="border-t border-gray-800 bg-gray-950 p-3 font-mono text-xs text-gray-400 max-h-64 overflow-y-auto"
                >
                  {state.lines.length === 0 && state.status === "running" && (
                    <span className="text-gray-600">
                      Waiting for output...
                    </span>
                  )}
                  {state.lines.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.stream === "stderr" ? "text-red-400" : ""
                      }
                    >
                      <AnsiLine text={line.line} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {setupComponents.length === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-900/20 border border-green-800">
          <CheckCircle size={20} className="text-green-400" />
          <p className="text-sm text-green-300">
            No components require setup.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <button onClick={onBack} className="btn btn-safe" disabled={anyRunning}>
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed && setupComponents.length > 0}
          className="btn bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: SetupStatus }) {
  switch (status) {
    case "pending":
      return (
        <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700" />
      );
    case "running":
      return <Loader2 size={20} className="text-blue-400 animate-spin" />;
    case "done":
      return <CheckCircle size={20} className="text-green-400" />;
    case "failed":
      return <XCircle size={20} className="text-red-400" />;
  }
}
