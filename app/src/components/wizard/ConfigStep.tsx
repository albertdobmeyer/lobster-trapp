import { useState, useEffect } from "react";
import { FileText, Copy, CheckCircle, Info, ExternalLink, Key, MessageCircle } from "lucide-react";
import type { PrerequisiteReport } from "@/lib/tauri";
import { readConfig, writeConfig } from "@/lib/tauri";

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
  const [anthropicKey, setAnthropicKey] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing keys from .env if available
  useEffect(() => {
    if (!report) return;
    const vault = report.components.find(c => c.component_id === "openclaw-vault");
    if (!vault) return;

    readConfig("openclaw-vault", ".env")
      .then((content) => {
        const lines = content.split("\n");
        for (const line of lines) {
          const match = line.match(/^([A-Z_]+)=(.*)$/);
          if (!match) continue;
          const [, key, value] = match;
          if (key === "ANTHROPIC_API_KEY" && value && !value.includes("REPLACE")) {
            setAnthropicKey(value);
          }
          if (key === "TELEGRAM_BOT_TOKEN" && value && !value.includes("REPLACE")) {
            setTelegramToken(value);
          }
        }
        setKeysLoaded(true);
      })
      .catch(() => {
        setKeysLoaded(true);
      });
  }, [report]);

  if (!report) return null;

  const componentsMissingConfigs = report.components.filter(
    (c) => c.missing_config_files.length > 0,
  );

  const allGood = componentsMissingConfigs.length === 0;
  const hasValidKeys = anthropicKey.startsWith("sk-") && telegramToken.length > 10;

  async function handleContinue() {
    // If user entered keys, write them to .env
    if (anthropicKey || telegramToken) {
      setSaving(true);
      try {
        // Read existing .env or start fresh
        let content = "";
        try {
          content = await readConfig("openclaw-vault", ".env");
        } catch {
          content = "# OpenClaw-Vault API keys\n";
        }

        // Update or add each key
        content = upsertEnvVar(content, "ANTHROPIC_API_KEY", anthropicKey);
        content = upsertEnvVar(content, "TELEGRAM_BOT_TOKEN", telegramToken);

        await writeConfig("openclaw-vault", ".env", content);
      } catch (err) {
        console.error("Failed to save keys:", err);
      }
      setSaving(false);
    }
    onNext();
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-2">
        Configuration
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Your assistant needs API keys to work. These are stored locally and never leave your machine.
      </p>

      {/* Missing config files — existing behavior */}
      {!allGood && (
        <div className="space-y-4 mb-6">
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

      {/* API key entry form — always shown */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-amber-400" />
            <label className="text-sm font-medium text-gray-200">
              Anthropic API Key
            </label>
            {anthropicKey.startsWith("sk-") && (
              <CheckCircle size={14} className="text-green-400" />
            )}
          </div>
          <input
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Powers your AI assistant.{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Get one at console.anthropic.com <ExternalLink size={10} />
            </a>
          </p>
          <p className="text-xs text-amber-400/70 mt-1">
            Tip: Create a key with a spending limit for safety.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} className="text-blue-400" />
            <label className="text-sm font-medium text-gray-200">
              Telegram Bot Token
            </label>
            {telegramToken.length > 10 && (
              <CheckCircle size={14} className="text-green-400" />
            )}
          </div>
          <input
            type="password"
            value={telegramToken}
            onChange={(e) => setTelegramToken(e.target.value)}
            placeholder="1234567890:ABCdefGHIjklMNOpqrs..."
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Lets you talk to your assistant from Telegram.{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Create a bot via @BotFather <ExternalLink size={10} />
            </a>
          </p>
        </div>
      </div>

      {!hasValidKeys && keysLoaded && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-900/20 border border-amber-800/30 mt-4">
          <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            Both keys are needed for your assistant to work. You can add them later from Settings, but the assistant won't respond until they're configured.
          </p>
        </div>
      )}

      {hasValidKeys && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-900/20 border border-green-800/30 mt-4">
          <CheckCircle size={16} className="text-green-400" />
          <p className="text-sm text-green-300">
            Keys configured. Your assistant is ready to connect.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <button onClick={onBack} className="btn btn-safe">
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={saving}
          className="btn bg-blue-600 hover:bg-blue-500 text-white"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

/** Update or insert a key=value pair in .env content */
function upsertEnvVar(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  return content.trimEnd() + "\n" + line + "\n";
}
