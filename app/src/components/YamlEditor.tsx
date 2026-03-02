import { useEffect, useState } from "react";
import { Save } from "lucide-react";
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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setText(content);
  }, [content]);

  const handleSave = async () => {
    await save(text);
    setDirty(false);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-red-400">{error}</div>}

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
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
