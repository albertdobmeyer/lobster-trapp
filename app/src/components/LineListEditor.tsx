import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { Config } from "@/lib/types";
import { useConfig } from "@/hooks/useConfig";

interface LineListEditorProps {
  config: Config;
  componentId: string;
}

export default function LineListEditor({ config, componentId }: LineListEditorProps) {
  const { content, loading, saving, error, load, save } = useConfig(
    componentId,
    config.path,
  );
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setItems(
      content
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#")),
    );
  }, [content]);

  const addItem = () => {
    const val = newItem.trim();
    if (!val || items.includes(val)) return;

    if (config.line_list?.pattern) {
      const regex = new RegExp(config.line_list.pattern);
      if (!regex.test(val)) return;
    }

    setItems((prev) => [...prev, val]);
    setNewItem("");
    setDirty(true);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const handleSave = async () => {
    await save(items.join("\n") + "\n");
    setDirty(false);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-gray-800/50 rounded-md px-3 py-2"
          >
            <span className="text-sm text-gray-300 font-mono">{item}</span>
            {config.editable && (
              <button
                onClick={() => removeItem(i)}
                className="text-gray-600 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {config.editable && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder={
              config.line_list?.example
                ? `e.g. ${config.line_list.example}`
                : `Add ${config.line_list?.item_label || "item"}...`
            }
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
          />
          <button onClick={addItem} className="btn btn-safe">
            <Plus size={14} />
          </button>
        </div>
      )}

      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
}
