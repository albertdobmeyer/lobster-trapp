import { useState } from "react";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import type {
  Workflow,
  WorkflowInput,
  WorkflowResult,
  StepResult,
} from "@/lib/types";
import { DANGER_STYLES } from "@/lib/types";
import { useWorkflow } from "@/hooks/useWorkflow";
import ConfirmDialog from "./ConfirmDialog";

interface WorkflowPanelProps {
  workflows: Workflow[];
  componentId: string;
}

export default function WorkflowPanel({
  workflows,
  componentId,
}: WorkflowPanelProps) {
  if (workflows.length === 0) return null;

  return (
    <div>
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Workflows
      </h2>
      <div className="card p-4 space-y-3">
        {workflows.map((wf) => (
          <WorkflowItem
            key={wf.id}
            workflow={wf}
            componentId={componentId}
          />
        ))}
      </div>
    </div>
  );
}

function WorkflowItem({
  workflow,
  componentId,
}: {
  workflow: Workflow;
  componentId: string;
}) {
  const { execute, result, isRunning, reset } = useWorkflow();
  const [showInputs, setShowInputs] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingArgs, setPendingArgs] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);

  const hasInputs = workflow.inputs.length > 0;
  const isDangerous = workflow.danger !== "safe";

  const handleClick = () => {
    if (isRunning) return;
    reset();

    if (hasInputs) {
      setShowInputs(true);
    } else if (isDangerous) {
      setPendingArgs({});
      setShowConfirm(true);
    } else {
      execute(componentId, workflow.id);
    }
  };

  const handleInputsSubmit = (args: Record<string, string>) => {
    setShowInputs(false);
    if (isDangerous) {
      setPendingArgs(args);
      setShowConfirm(true);
    } else {
      execute(componentId, workflow.id, args);
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    execute(componentId, workflow.id, pendingArgs);
  };

  return (
    <div className="border border-gray-800 rounded-md p-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClick}
              disabled={isRunning}
              className={`btn ${DANGER_STYLES[workflow.danger]} flex items-center gap-2 text-sm`}
            >
              {isRunning ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {workflow.name}
            </button>
            {workflow.shell_requirement !== "any" && (
              <span className="text-xs text-gray-600">
                Requires {workflow.shell_requirement} shell
              </span>
            )}
          </div>
          {workflow.user_description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {workflow.user_description}
            </p>
          )}
        </div>

        {/* Expand/collapse result */}
        {result && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Step progress / results */}
      {result && (
        <div className="mt-3">
          <WorkflowProgress result={result} expanded={expanded} />
        </div>
      )}

      {/* Input form modal */}
      {showInputs && (
        <WorkflowInputForm
          workflow={workflow}
          onSubmit={handleInputsSubmit}
          onCancel={() => setShowInputs(false)}
        />
      )}

      {/* Confirm dialog for dangerous workflows */}
      <ConfirmDialog
        open={showConfirm}
        title={`Run "${workflow.name}"?`}
        message={
          workflow.user_description ||
          workflow.description ||
          `This will execute the ${workflow.name} workflow.`
        }
        danger={workflow.danger}
        confirmLabel={`Run ${workflow.name}`}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

function WorkflowProgress({
  result,
  expanded,
}: {
  result: WorkflowResult;
  expanded: boolean;
}) {
  const statusIcon = (status: StepResult["status"]) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 size={14} className="text-emerald-500" />;
      case "failed":
        return <XCircle size={14} className="text-red-500" />;
      case "skipped":
        return <SkipForward size={14} className="text-gray-600" />;
      case "running":
        return <Loader2 size={14} className="animate-spin text-blue-400" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  const summaryColor =
    result.status === "completed"
      ? "text-emerald-400"
      : result.status === "failed"
        ? "text-red-400"
        : "text-gray-400";

  return (
    <div>
      {/* Summary line */}
      <div className="flex items-center gap-2 text-xs">
        <span className={summaryColor}>
          {result.status === "completed" ? "Completed" : "Failed"}
        </span>
        <span className="text-gray-600">
          {result.steps.filter((s) => s.status === "passed").length}/
          {result.steps.length} steps passed
        </span>
        <span className="text-gray-700">
          {(result.duration_ms / 1000).toFixed(1)}s
        </span>
      </div>

      {/* Step details */}
      {expanded && (
        <div className="mt-2 space-y-1">
          {result.steps.map((step) => (
            <div
              key={step.step_id}
              className="flex items-center gap-2 text-xs text-gray-400"
            >
              {statusIcon(step.status)}
              <span className="font-mono">{step.step_id}</span>
              {step.result && (
                <span className="text-gray-600">
                  exit {step.result.exit_code} ({step.result.duration_ms}ms)
                </span>
              )}
              {step.error && (
                <span className="text-red-500 truncate max-w-xs">
                  {step.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowInputForm({
  workflow,
  onSubmit,
  onCancel,
}: {
  workflow: Workflow;
  onSubmit: (args: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    workflow.inputs.forEach((input) => {
      if (input.default !== undefined && input.default !== null) {
        defaults[input.id] = String(input.default);
      }
    });
    return defaults;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-200">
            {workflow.name}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {workflow.inputs.map((input) => (
            <WorkflowInputField
              key={input.id}
              input={input}
              value={values[input.id] || ""}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, [input.id]: v }))
              }
            />
          ))}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-safe"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${DANGER_STYLES[workflow.danger]}`}
            >
              Run {workflow.name}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkflowInputField({
  input,
  value,
  onChange,
}: {
  input: WorkflowInput;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {input.label}
        {input.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {input.description && (
        <p className="text-xs text-gray-600 mb-1">{input.description}</p>
      )}
      {input.type === "enum" && input.options.length > 0 ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
          required={input.required}
        >
          <option value="">Select...</option>
          {input.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : input.type === "boolean" ? (
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="rounded bg-gray-800 border-gray-700"
        />
      ) : (
        <input
          type={input.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={input.label}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
          required={input.required}
        />
      )}
    </div>
  );
}
