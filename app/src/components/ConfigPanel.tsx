import { useState } from "react";
import type { Config } from "@/lib/types";
import LineListEditor from "./LineListEditor";
import EnvEditor from "./EnvEditor";
import YamlEditor from "./YamlEditor";

interface ConfigPanelProps {
  configs: Config[];
  componentId: string;
}

export default function ConfigPanel({ configs, componentId }: ConfigPanelProps) {
  const [activeConfig, setActiveConfig] = useState<string | null>(
    configs[0]?.path ?? null,
  );

  if (configs.length === 0) return null;

  const config = configs.find((c) => c.path === activeConfig);

  return (
    <div>
      {/* Config tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {configs.map((c) => (
          <button
            key={c.path}
            onClick={() => setActiveConfig(c.path)}
            className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
              activeConfig === c.path
                ? "border-blue-500 text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {c.name || c.path}
          </button>
        ))}
      </div>

      {/* Active editor */}
      {config && (
        <div>
          {config.description && (
            <p className="text-sm text-gray-400 mb-3">{config.description}</p>
          )}
          {config.format === "line-list" && (
            <LineListEditor config={config} componentId={componentId} />
          )}
          {config.format === "env" && (
            <EnvEditor config={config} componentId={componentId} />
          )}
          {(config.format === "yaml" || config.format === "json") && (
            <YamlEditor config={config} componentId={componentId} />
          )}
        </div>
      )}
    </div>
  );
}
