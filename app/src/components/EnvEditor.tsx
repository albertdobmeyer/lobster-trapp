import { useEffect, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import type { Config } from "@/lib/types";
import { useConfig } from "@/hooks/useConfig";

interface EnvEntry {
  key: string;
  value: string;
  isSecret: boolean;
}

interface EnvEditorProps {
  config: Config;
  componentId: string;
}

const SECRET_PATTERNS = [/KEY/i, /SECRET/i, /TOKEN/i, /PASSWORD/i, /PASS/i, /API/i];

function isSecretKey(key: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(key));
}

function parseEnv(content: string): EnvEntry[] {
  return content
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((line) => {
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) return { key: line, value: "", isSecret: false };
      const key = line.slice(0, eqIdx).trim();
      const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      return { key, value, isSecret: isSecretKey(key) };
    });
}

export default function EnvEditor({ config, componentId }: EnvEditorProps) {
  const { content, loading, saving, error, load, save } = useConfig(
    componentId,
    config.path,
  );
  const [entries, setEntries] = useState<EnvEntry[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setEntries(parseEnv(content));
  }, [content]);

  const updateValue = (index: number, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, value } : e)),
    );
    setDirty(true);
  };

  const toggleReveal = (key: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    const newContent = entries
      .map((e) => `${e.key}=${e.value}`)
      .join("\n") + "\n";
    await save(newContent);
    setDirty(false);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={entry.key} className="flex items-center gap-2">
            <span className="w-48 text-sm font-mono text-gray-400 shrink-0 truncate">
              {entry.key}
            </span>
            <div className="flex-1 flex items-center gap-1">
              <input
                type={
                  entry.isSecret && !revealed.has(entry.key)
                    ? "password"
                    : "text"
                }
                value={entry.value}
                onChange={(e) => updateValue(i, e.target.value)}
                disabled={!config.editable}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 font-mono focus:outline-none focus:border-gray-500"
              />
              {entry.isSecret && (
                <button
                  onClick={() => toggleReveal(entry.key)}
                  className="text-gray-500 hover:text-gray-300 p-1"
                >
                  {revealed.has(entry.key) ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {dirty && config.editable && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save"}
          </button>
          {config.restart_required && (
            <span className="text-xs text-amber-400">
              Restart required after saving
            </span>
          )}
        </div>
      )}
    </div>
  );
}
