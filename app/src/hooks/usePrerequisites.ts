import { useCallback, useState } from "react";
import {
  checkPrerequisites,
  initSubmodules,
  createConfigFromTemplate,
} from "@/lib/tauri";
import type { PrerequisiteReport } from "@/lib/tauri";
import { useToast } from "@/lib/ToastContext";
import { classifyError } from "@/lib/errors";

export function usePrerequisites() {
  const [report, setReport] = useState<PrerequisiteReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const { addToast } = useToast();

  const check = useCallback(async () => {
    try {
      setChecking(true);
      const result = await checkPrerequisites();
      setReport(result);
      return result;
    } catch (err) {
      const classified = classifyError(err);
      addToast({
        type: "error",
        title: "Prerequisites check failed",
        message: classified.message,
        duration: 0,
      });
      return null;
    } finally {
      setChecking(false);
    }
  }, [addToast]);

  const initSubs = useCallback(async () => {
    try {
      setInitializing(true);
      await initSubmodules();
      addToast({ type: "success", title: "Submodules initialized", duration: 3000 });
      // Re-check after init
      await check();
    } catch (err) {
      const classified = classifyError(err);
      addToast({
        type: "error",
        title: "Submodule init failed",
        message: classified.message,
        duration: 0,
      });
    } finally {
      setInitializing(false);
    }
  }, [check, addToast]);

  const createConfig = useCallback(
    async (componentId: string, configPath: string, templatePath: string) => {
      try {
        await createConfigFromTemplate(componentId, configPath, templatePath);
        addToast({ type: "success", title: "Config created", duration: 3000 });
        // Re-check to update report
        await check();
      } catch (err) {
        const classified = classifyError(err);
        addToast({
          type: "error",
          title: "Config creation failed",
          message: classified.message,
          duration: 0,
        });
      }
    },
    [check, addToast],
  );

  return { report, checking, initializing, check, initSubs, createConfig };
}
