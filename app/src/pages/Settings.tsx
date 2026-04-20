import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info, FolderOpen, RefreshCw, Save, X, RotateCcw } from "lucide-react";
import { useAppContext } from "@/lib/AppContext";
import { useToast } from "@/lib/ToastContext";
import { setMonorepoRoot } from "@/lib/tauri";

export default function Settings() {
  const { settings, updateSettings } = useAppContext();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [monorepoPath, setMonorepoPath] = useState(settings.monorepoPathOverride ?? "");
  const [refreshInterval, setRefreshInterval] = useState(settings.autoRefreshInterval / 1000);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Track dirty state
  useEffect(() => {
    const pathChanged = (monorepoPath || null) !== (settings.monorepoPathOverride || null);
    const intervalChanged = refreshInterval !== settings.autoRefreshInterval / 1000;
    setDirty(pathChanged || intervalChanged);
  }, [monorepoPath, refreshInterval, settings]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    try {
      const newPath = monorepoPath.trim() || null;

      // If path changed, validate via backend
      if (newPath && newPath !== settings.monorepoPathOverride) {
        await setMonorepoRoot(newPath);
      }

      await updateSettings({
        monorepoPathOverride: newPath,
        autoRefreshInterval: refreshInterval * 1000,
      });

      setDirty(false);
      addToast({
        type: "success",
        title: "Settings saved",
        message: "Your changes have been applied.",
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setMonorepoPath(settings.monorepoPathOverride ?? "");
    setRefreshInterval(settings.autoRefreshInterval / 1000);
    setSaveError(null);
    setDirty(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Monorepo path */}
        <div className="card p-4">
          <h3 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
            <FolderOpen size={16} />
            App Data Location
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Override where your assistant's files are stored. Leave empty to use the default location.
          </p>
          <input
            type="text"
            value={monorepoPath}
            onChange={(e) => setMonorepoPath(e.target.value)}
            placeholder="Auto-detected (leave empty)"
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
          />
        </div>

        {/* Auto-refresh interval */}
        <div className="card p-4">
          <h3 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
            <RefreshCw size={16} />
            Status Refresh Interval
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            How often to check if your assistant is running (in seconds).
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={2}
              max={60}
              step={1}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-300 w-12 text-right tabular-nums">
              {refreshInterval}s
            </span>
          </div>
        </div>

        {/* Setup wizard */}
        <div className="card p-4">
          <h3 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
            <RotateCcw size={16} />
            Setup Wizard
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Re-run the first-time setup wizard to set up your assistant again.
          </p>
          <button
            onClick={async () => {
              await updateSettings({ wizardCompleted: false });
              navigate("/setup");
            }}
            className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
          >
            Re-run Setup Wizard
          </button>
        </div>

        {/* Save / Cancel */}
        {dirty && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        )}

        {saveError && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">
            {saveError}
          </div>
        )}

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
              <span className="text-gray-500">Framework:</span> Tauri 2 + React 18
            </p>
            <p>
              <span className="text-gray-500">Architecture:</span>{" "}
              Self-describing modules
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
