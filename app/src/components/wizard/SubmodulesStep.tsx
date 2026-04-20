import { GitBranch, Download, Loader, CheckCircle } from "lucide-react";
import type { PrerequisiteReport } from "@/lib/tauri";

interface SubmodulesStepProps {
  report: PrerequisiteReport | null;
  initializing: boolean;
  onInit: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

export default function SubmodulesStep({
  report,
  initializing,
  onInit,
  onNext,
  onBack,
}: SubmodulesStepProps) {
  if (!report) return null;

  const allGood = report.submodules.length > 0 && report.submodules.every((s) => s.cloned && s.has_manifest);

  return (
    <div className="max-w-lg mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-2">Assistant Modules</h2>
      <p className="text-gray-500 text-sm mb-6">
        Checking that all parts of your assistant are installed.
      </p>

      <div className="space-y-3">
        {report.submodules.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800"
          >
            {sub.cloned && sub.has_manifest ? (
              <CheckCircle size={18} className="text-green-400 shrink-0" />
            ) : (
              <GitBranch size={18} className="text-yellow-400 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">{sub.name}</p>
              <p className="text-xs text-gray-500">
                {sub.cloned
                  ? sub.has_manifest
                    ? "Installed"
                    : "Partially installed"
                  : "Not installed"}
              </p>
            </div>
          </div>
        ))}

        {report.submodules.length === 0 && (
          <p className="text-gray-500 text-sm">
            No modules found. Try re-running the setup wizard.
          </p>
        )}
      </div>

      {!allGood && (
        <button
          onClick={onInit}
          disabled={initializing}
          className="mt-4 btn bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
        >
          {initializing ? (
            <>
              <Loader size={14} className="animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <Download size={14} />
              Install Missing Modules
            </>
          )}
        </button>
      )}

      <div className="flex items-center justify-between mt-8">
        <button onClick={onBack} className="btn btn-safe">
          Back
        </button>
        <button
          onClick={onNext}
          className="btn bg-blue-600 hover:bg-blue-500 text-white"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
