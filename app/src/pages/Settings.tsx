import { useState } from "react";
import { Info, FolderOpen } from "lucide-react";

export default function Settings() {
  const [monorepoPath, setMonorepoPath] = useState("");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Monorepo path */}
        <div className="card p-4">
          <h3 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
            <FolderOpen size={16} />
            Monorepo Path
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Override the auto-detected monorepo root directory.
          </p>
          <input
            type="text"
            value={monorepoPath}
            onChange={(e) => setMonorepoPath(e.target.value)}
            placeholder="Auto-detected (leave empty)"
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
          />
        </div>

        {/* About */}
        <div className="card p-4">
          <h3 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
            <Info size={16} />
            About
          </h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>
              <span className="text-gray-500">App:</span> Lobster-TrApp v0.1.0
            </p>
            <p>
              <span className="text-gray-500">Framework:</span> Tauri 2 + React
              18
            </p>
            <p>
              <span className="text-gray-500">Architecture:</span>{" "}
              Manifest-driven generic renderer
            </p>
            <p className="pt-2">
              Components self-describe via{" "}
              <code className="text-gray-300">component.yml</code> manifests.
              The GUI discovers and renders dashboards generically — no
              hardcoded knowledge of individual components.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
