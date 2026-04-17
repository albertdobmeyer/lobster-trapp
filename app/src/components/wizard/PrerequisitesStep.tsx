import { CheckCircle, XCircle, Loader, ExternalLink } from "lucide-react";
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

        {!hasContainer && (
          <div className="ml-8 p-3 rounded-lg bg-blue-950/50 border border-blue-800/50">
            <p className="text-sm text-blue-300 font-medium mb-2">
              Install a container runtime to continue
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Lobster-TrApp uses containers to keep the AI agent safely separated from your system.
              Podman is recommended — it's free, open source, and doesn't require admin privileges.
            </p>
            <div className="space-y-2">
              <InstallOption
                platform="Linux (Ubuntu/Debian)"
                command="sudo apt install podman podman-compose"
                link="https://podman.io/docs/installation#installing-on-linux"
              />
              <InstallOption
                platform="macOS"
                label="Download Podman Desktop"
                link="https://podman-desktop.io/downloads"
              />
              <InstallOption
                platform="Windows"
                label="Download Podman Desktop"
                link="https://podman-desktop.io/downloads"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              After installing, restart Lobster-TrApp and the check will pass automatically.
            </p>
          </div>
        )}

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

function InstallOption({
  platform,
  command,
  label,
  link,
}: {
  platform: string;
  command?: string;
  label?: string;
  link: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded bg-gray-900/50">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-300">{platform}</p>
        {command && (
          <code className="text-xs text-blue-400 font-mono">{command}</code>
        )}
      </div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
      >
        {label || "Guide"} <ExternalLink size={12} />
      </a>
    </div>
  );
}
