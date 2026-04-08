import { FileText, Copy, CheckCircle, Info } from "lucide-react";
import type { PrerequisiteReport } from "@/lib/tauri";

interface ConfigStepProps {
  report: PrerequisiteReport | null;
  onCreateConfig: (
    componentId: string,
    configPath: string,
    templatePath: string,
  ) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

export default function ConfigStep({
  report,
  onCreateConfig,
  onNext,
  onBack,
}: ConfigStepProps) {
  if (!report) return null;

  const componentsMissingConfigs = report.components.filter(
    (c) => c.missing_config_files.length > 0,
  );

  const allGood = componentsMissingConfigs.length === 0;

  return (
    <div className="max-w-lg mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-2">
        Configuration Files
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Some components require config files to be created before they can run.
      </p>

      {allGood ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-900/20 border border-green-800">
            <CheckCircle size={20} className="text-green-400" />
            <p className="text-sm text-green-300">
              All configuration files are in place.
            </p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-900/10 border border-blue-900/30">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              You can edit API keys and other settings from the{" "}
              <strong>Settings</strong> page after setup is complete.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {componentsMissingConfigs.map((comp) => (
            <div key={comp.component_id} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">
                {comp.component_name}
              </h3>
              {comp.missing_config_files.map((cf) => (
                <div
                  key={cf.path}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800"
                >
                  <FileText size={16} className="text-yellow-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{cf.path}</p>
                    {cf.description && (
                      <p className="text-xs text-gray-500">{cf.description}</p>
                    )}
                  </div>
                  {cf.template && (
                    <button
                      onClick={() =>
                        onCreateConfig(comp.component_id, cf.path, cf.template!)
                      }
                      className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 shrink-0"
                    >
                      <Copy size={12} />
                      Create
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
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
