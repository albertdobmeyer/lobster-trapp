import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import yaml from "js-yaml";
import type { Config } from "@/lib/types";
import { useConfig } from "@/hooks/useConfig";

interface YamlEditorProps {
  config: Config;
  componentId: string;
}

export default function YamlEditor({ config, componentId }: YamlEditorProps) {
  const { content, loading, saving, error, load, save } = useConfig(
    componentId,
    config.path,
  );
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setText(content);
  }, [content]);

  const handleSave = async () => {
    // Validate YAML syntax before saving (for yaml/json config formats)
    if (config.format === "yaml" || config.format === "json") {
      try {
        yaml.load(text);
        setParseError(null);
      } catch (e) {
        const msg = e instanceof yaml.YAMLException
          ? `YAML syntax error: ${e.reason} (line ${e.mark?.line !== undefined ? e.mark.line + 1 : "?"})`
          : "Invalid YAML syntax";
        setParseError(msg);
        return;
      }
    }

    await save(text);
    setDirty(false);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-red-400">{error}</div>}
      {parseError && (
        <div className="text-sm text-amber-400 bg-amber-950 border border-amber-800 rounded-md px-3 py-2">
          {parseError}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
          setParseError(null);
        }}
        disabled={!config.editable}
        rows={20}
        className="w-full bg-gray-950 border border-gray-800 rounded-md px-4 py-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-gray-600 resize-y"
        spellCheck={false}
      />

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
