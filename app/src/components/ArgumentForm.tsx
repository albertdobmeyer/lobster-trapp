import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Arg, Command } from "@/lib/types";
import { loadOptions } from "@/lib/tauri";

interface ArgumentFormProps {
  command: Command;
  componentId: string;
  onSubmit: (args: Record<string, string>) => void;
  onCancel: () => void;
}

export default function ArgumentForm({
  command,
  componentId,
  onSubmit,
  onCancel,
}: ArgumentFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [dynamicOptions, setDynamicOptions] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    let cancelled = false;

    // Initialize defaults
    const defaults: Record<string, string> = {};
    command.args.forEach((arg) => {
      if (arg.default !== undefined) {
        defaults[arg.id] = String(arg.default);
      }
    });
    setValues(defaults);
    setDynamicOptions({});

    // Load dynamic options with cancellation guard
    command.args.forEach(async (arg) => {
      if (arg.options_from) {
        try {
          const opts = await loadOptions(
            componentId,
            arg.options_from.command,
            arg.options_from.timeout_seconds,
          );
          if (!cancelled) {
            setDynamicOptions((prev) => ({ ...prev, [arg.id]: opts }));
          }
        } catch {
          // Dynamic options failed — user can type manually
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [command, componentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const renderField = (arg: Arg) => {
    const options = arg.options.length > 0 ? arg.options : dynamicOptions[arg.id];

    switch (arg.type) {
      case "enum":
        return (
          <select
            value={values[arg.id] || ""}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [arg.id]: e.target.value }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
          >
            <option value="">Select...</option>
            {options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "boolean":
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values[arg.id] === "true"}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [arg.id]: e.target.checked ? "true" : "false",
                }))
              }
              className="rounded bg-gray-800 border-gray-700"
            />
            <span className="text-sm text-gray-300">{arg.name}</span>
          </label>
        );

      case "number":
        return (
          <input
            type="number"
            value={values[arg.id] || ""}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [arg.id]: e.target.value }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
          />
        );

      default:
        return (
          <input
            type="text"
            value={values[arg.id] || ""}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [arg.id]: e.target.value }))
            }
            placeholder={arg.description}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gray-500"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-100">{command.name}</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>
        {command.description && (
          <p className="text-sm text-gray-400 mb-4">{command.description}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {command.args.map((arg) => (
            <div key={arg.id}>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {arg.name}
                {arg.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {arg.description && arg.type !== "boolean" && (
                <p className="text-xs text-gray-500 mb-1">{arg.description}</p>
              )}
              {renderField(arg)}
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onCancel} className="btn btn-safe">
              Cancel
            </button>
            <button type="submit" className="btn bg-blue-600 hover:bg-blue-500 text-white">
              Run
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
