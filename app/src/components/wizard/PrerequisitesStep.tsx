import { CheckCircle, XCircle, Loader } from "lucide-react";
import type { PrerequisiteReport } from "@/lib/tauri";

interface PrerequisitesStepProps {
  report: PrerequisiteReport | null;
  checking: boolean;
  onNext: () => void;
  onBack: () => void;
}

export default function PrerequisitesStep({
  report,
  checking,
  onNext,
  onBack,
}: PrerequisitesStepProps) {
  if (checking || !report) {
    return (
      <div className="text-center py-12">
        <Loader size={32} className="animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-gray-400">Checking prerequisites...</p>
      </div>
    );
  }

  const hasContainer = report.container_runtime.found;
  const allSubmodulesCloned = report.submodules.length > 0 && report.submodules.every((s) => s.cloned && s.has_manifest);
  const allChecksPassed = report.components.every(
    (c) => c.check_passed === null || c.check_passed === true,
  );

  return (
    <div className="max-w-lg mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Prerequisites</h2>

      <div className="space-y-4">
        {/* Container runtime */}
        <CheckItem
          label="Container runtime"
          detail={
            hasContainer
              ? `${report.container_runtime.name} — ${report.container_runtime.version}`
              : "Docker or Podman required"
          }
          passed={hasContainer}
          required
        />

        {/* Submodules */}
        <CheckItem
          label="Component submodules"
          detail={
            !allSubmodulesCloned
              ? "Some submodules missing or have no manifest"
              : report.components.length < report.submodules.length
                ? `${report.components.length} of ${report.submodules.length} components loaded (some failed to parse)`
                : `${report.components.length} components found`
          }
          passed={allSubmodulesCloned && report.components.length >= report.submodules.length}
          required
        />

        {/* Per-component checks */}
        {report.components.map((c) => (
          <CheckItem
            key={c.component_id}
            label={c.component_name}
            detail={
              c.missing_config_files.length > 0
                ? `Missing: ${c.missing_config_files.map((f) => f.path).join(", ")}`
                : c.check_passed === false
                  ? "Check command failed"
                  : "Ready"
            }
            passed={c.missing_config_files.length === 0 && c.check_passed !== false}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-8">
        <button onClick={onBack} className="btn btn-safe">
          Back
        </button>
        <button
          onClick={onNext}
          className="btn bg-blue-600 hover:bg-blue-500 text-white"
        >
          {hasContainer && allSubmodulesCloned && allChecksPassed
            ? "Continue"
            : "Continue anyway"}
        </button>
      </div>
    </div>
  );
}

function CheckItem({
  label,
  detail,
  passed,
  required,
}: {
  label: string;
  detail: string;
  passed: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800">
      {passed ? (
        <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
      ) : (
        <XCircle
          size={20}
          className={`${required ? "text-red-400" : "text-yellow-400"} mt-0.5 shrink-0`}
        />
      )}
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  );
}
