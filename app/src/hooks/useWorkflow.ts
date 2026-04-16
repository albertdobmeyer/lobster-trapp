import { useState, useCallback } from "react";
import { executeWorkflow as invokeExecuteWorkflow } from "../lib/tauri";
import { useToast } from "../lib/ToastContext";
import type { WorkflowResult, StepResult } from "../lib/types";

interface UseWorkflowReturn {
  execute: (
    componentId: string,
    workflowId: string,
    inputs?: Record<string, string>,
  ) => Promise<WorkflowResult | null>;
  result: WorkflowResult | null;
  isRunning: boolean;
  error: string | null;
  reset: () => void;
}

export function useWorkflow(): UseWorkflowReturn {
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsRunning(false);
  }, []);

  const execute = useCallback(
    async (
      componentId: string,
      workflowId: string,
      inputs: Record<string, string> = {},
    ): Promise<WorkflowResult | null> => {
      setIsRunning(true);
      setError(null);
      setResult(null);

      try {
        const wfResult = await invokeExecuteWorkflow(
          componentId,
          workflowId,
          inputs,
        );
        setResult(wfResult);

        if (wfResult.status === "failed" || wfResult.status === "aborted") {
          const failedStep = wfResult.steps.find(
            (s: StepResult) => s.status === "failed",
          );
          const failMsg = failedStep?.error
            || failedStep?.result?.stderr?.trim()
            || `Workflow failed at step "${failedStep?.step_id}"`;
          addToast({
            type: "error",
            title: `Workflow failed`,
            message: failMsg,
            duration: 0,
          });
        } else {
          addToast({
            type: "success",
            title: "Workflow complete",
            message: `${wfResult.steps.filter((s: StepResult) => s.status === "passed").length}/${wfResult.steps.length} steps passed`,
            duration: 5000,
          });
        }

        return wfResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        addToast({
          type: "error",
          title: "Workflow error",
          message: msg,
          duration: 0,
        });
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [addToast],
  );

  return { execute, result, isRunning, error, reset };
}
