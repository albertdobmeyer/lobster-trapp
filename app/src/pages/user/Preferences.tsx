import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import {
  Bell,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Power,
  RotateCcw,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { readConfig, writeConfig } from "@/lib/tauri";
import { classifyError } from "@/lib/errors";
import { useToast } from "@/lib/ToastContext";
import { useSettings } from "@/hooks/useSettings";
import { useSpending } from "@/hooks/useSpending";
import {
  isAnthropicAdminKeyLike,
  isAnthropicKeyLike,
  isTelegramTokenLike,
  maskKey,
  parseEnvKeys,
  upsertEnvVar,
} from "@/lib/wizardUtils";

const VAULT_ENV = { component: "openclaw-vault", path: ".env" } as const;

const APP_VERSION = "0.2.0";

export default function Preferences() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-100">
        Preferences
      </h1>

      <div className="space-y-4">
        <KeysSection />
        <SpendingSection />
        <NotificationsSection />
        <StartupSection />
        <ReRunSetupSection />
        <AdvancedModeSection />
      </div>

      <footer className="mt-10 text-center text-xs text-neutral-600">
        <p>Lobster-TrApp v{APP_VERSION}</p>
        <p className="mt-1">
          Made with care for people who want AI without the stress.
        </p>
      </footer>
    </div>
  );
}

// ─── Section 1: Keys ────────────────────────────────────────────────────────

function KeysSection() {
  const { addToast } = useToast();
  const [anthropicMask, setAnthropicMask] = useState<string | null>(null);
  const [telegramMask, setTelegramMask] = useState<string | null>(null);
  const [editing, setEditing] = useState<"anthropic" | "telegram" | null>(null);
  const [draft, setDraft] = useState("");
  const [showDraft, setShowDraft] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    try {
      const env = await readConfig(VAULT_ENV.component, VAULT_ENV.path);
      const { anthropicKey, telegramToken } = parseEnvKeys(env);
      setAnthropicMask(anthropicKey ? maskKey(anthropicKey) : null);
      setTelegramMask(telegramToken ? maskKey(telegramToken) : null);
    } catch {
      // .env doesn't exist yet — keys aren't set. Show empty state.
    }
  }

  async function save(which: "anthropic" | "telegram") {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const formatOK =
      which === "anthropic"
        ? isAnthropicKeyLike(trimmed)
        : isTelegramTokenLike(trimmed);

    if (!formatOK) {
      addToast({
        type: "error",
        title: "That doesn't look right",
        message: "Double-check the key format and try again.",
      });
      return;
    }

    setSaving(true);
    try {
      let content = "";
      try {
        content = await readConfig(VAULT_ENV.component, VAULT_ENV.path);
      } catch {
        content = "# OpenClaw-Vault configuration\n";
      }
      const envKey = which === "anthropic" ? "ANTHROPIC_API_KEY" : "TELEGRAM_BOT_TOKEN";
      content = upsertEnvVar(content, envKey, trimmed);
      await writeConfig(VAULT_ENV.component, VAULT_ENV.path, content);

      addToast({
        type: "success",
        title: "Key updated",
        message: "Restart your assistant for the change to take effect.",
      });
      setEditing(null);
      setDraft("");
      setShowDraft(false);
      await refresh();
    } catch (err) {
      const classified = classifyError(err);
      addToast({
        type: "error",
        title: classified.title === "Something went wrong" ? "Couldn't save your key" : classified.title,
        message: classified.userMessage,
      });
    } finally {
      setSaving(false);
    }
  }

  function startEditing(which: "anthropic" | "telegram") {
    setEditing(which);
    setDraft("");
    setShowDraft(false);
  }

  return (
    <div className="card-raised">
      <SectionHeader icon={Key} title="Your keys" />

      <KeyRow
        label="Anthropic API key"
        mask={anthropicMask}
        editing={editing === "anthropic"}
        draft={draft}
        showDraft={showDraft}
        saving={saving && editing === "anthropic"}
        onChangeClick={() => startEditing("anthropic")}
        onCancel={() => setEditing(null)}
        onDraftChange={setDraft}
        onToggleShow={() => setShowDraft((v) => !v)}
        onSave={() => save("anthropic")}
        placeholder="sk-ant-api03-…"
      />

      <div className="my-4 border-t border-neutral-800" />

      <KeyRow
        label="Telegram bot token"
        mask={telegramMask}
        editing={editing === "telegram"}
        draft={draft}
        showDraft={showDraft}
        saving={saving && editing === "telegram"}
        onChangeClick={() => startEditing("telegram")}
        onCancel={() => setEditing(null)}
        onDraftChange={setDraft}
        onToggleShow={() => setShowDraft((v) => !v)}
        onSave={() => save("telegram")}
        placeholder="1234567890:ABCdef…"
      />
    </div>
  );
}

interface KeyRowProps {
  label: string;
  mask: string | null;
  editing: boolean;
  draft: string;
  showDraft: boolean;
  saving: boolean;
  onChangeClick: () => void;
  onCancel: () => void;
  onDraftChange: (v: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
  placeholder: string;
}

function KeyRow(props: KeyRowProps) {
  if (props.editing) {
    return (
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-100">{props.label}</p>
        <div className="relative mb-3">
          <input
            type={props.showDraft ? "text" : "password"}
            value={props.draft}
            onChange={(e) => props.onDraftChange(e.target.value)}
            placeholder={props.placeholder}
            autoComplete="off"
            autoFocus
            className="input pr-10"
          />
          <button
            type="button"
            aria-label={props.showDraft ? "Hide" : "Show"}
            onClick={props.onToggleShow}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:text-neutral-300"
          >
            {props.showDraft ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onCancel}
            className="btn btn-sm btn-ghost"
            disabled={props.saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onSave}
            className="btn btn-sm btn-primary"
            disabled={props.saving || !props.draft.trim()}
          >
            {props.saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-sm font-medium text-neutral-100">{props.label}</p>
        {props.mask ? (
          <code className="block truncate text-xs text-neutral-400">{props.mask}</code>
        ) : (
          <p className="text-xs text-neutral-500">Not set</p>
        )}
      </div>
      <button
        type="button"
        onClick={props.onChangeClick}
        className="btn btn-sm btn-ghost"
      >
        {props.mask ? "Change" : "Set"}
      </button>
    </div>
  );
}

// ─── Section 2: Spending ────────────────────────────────────────────────────

function SpendingSection() {
  const { settings, update } = useSettings();
  const { addToast } = useToast();

  const monthlyCents = settings.spendingLimit.monthly;
  const threshold = settings.spendingLimit.alertThreshold;

  const PRESETS: Array<{ label: string; cents: number | null }> = [
    { label: "$5", cents: 500 },
    { label: "$20", cents: 2000 },
    { label: "$50", cents: 5000 },
    { label: "No limit", cents: null },
  ];

  function selectPreset(cents: number | null) {
    void update({ spendingLimit: { ...settings.spendingLimit, monthly: cents } });
    addToast({
      type: "success",
      title:
        cents === null
          ? "Monthly limit removed"
          : `Monthly limit set to $${(cents / 100).toFixed(0)}`,
    });
  }

  function handleThresholdChange(percent: number) {
    void update({
      spendingLimit: { ...settings.spendingLimit, alertThreshold: percent / 100 },
    });
  }

  return (
    <div className="card-raised">
      <SectionHeader icon={DollarSign} title="Spending" />

      <p className="mb-2 text-xs font-medium text-neutral-300">Monthly limit</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active = monthlyCents === preset.cents;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => selectPreset(preset.cents)}
              className={
                active
                  ? "btn btn-sm btn-primary"
                  : "btn btn-sm btn-ghost border border-neutral-700"
              }
              aria-pressed={active}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {monthlyCents !== null && (
        <>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-xs font-medium text-neutral-300">Alert me when I reach</p>
            <span className="text-xs tabular-nums text-neutral-500">
              {Math.round(threshold * 100)}% of ${(monthlyCents / 100).toFixed(0)}
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={Math.round(threshold * 100)}
            onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10))}
            className="w-full accent-primary-500"
            aria-label="Alert threshold percent"
          />
        </>
      )}

      <div className="my-6 border-t border-neutral-700" />

      <BillingAccessSubsection />
    </div>
  );
}

// ─── Section 2b: Billing access (optional) ─────────────────────────────────

const ADMIN_KEYS_URL = "https://console.anthropic.com/settings/admin-keys";
const COST_URL = "https://console.anthropic.com/cost";

function BillingAccessSubsection() {
  const { addToast } = useToast();
  const { refresh: refreshSpending } = useSpending();
  const [adminMask, setAdminMask] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showDraft, setShowDraft] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    try {
      const env = await readConfig(VAULT_ENV.component, VAULT_ENV.path);
      const { adminKey } = parseEnvKeys(env);
      setAdminMask(adminKey ? maskKey(adminKey) : null);
    } catch {
      // .env doesn't exist yet — admin key isn't set.
    }
  }

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    if (!isAnthropicAdminKeyLike(trimmed)) {
      addToast({
        type: "error",
        title: "That doesn't look like a billing key",
        message: "Billing keys start with sk-ant-admin-.",
      });
      return;
    }

    setSaving(true);
    try {
      let content = "";
      try {
        content = await readConfig(VAULT_ENV.component, VAULT_ENV.path);
      } catch {
        content = "# OpenClaw-Vault configuration\n";
      }
      content = upsertEnvVar(content, "ANTHROPIC_ADMIN_API_KEY", trimmed);
      await writeConfig(VAULT_ENV.component, VAULT_ENV.path, content);

      addToast({
        type: "success",
        title: "Billing access connected",
        message: "Your real spend will appear on the Home page in a moment.",
      });
      setEditing(false);
      setDraft("");
      setShowDraft(false);
      await refresh();
      await refreshSpending();
    } catch (err) {
      const classified = classifyError(err, "billing");
      addToast({
        type: "error",
        title:
          classified.title === "Something went wrong"
            ? "Couldn't save your billing key"
            : classified.title,
        message: classified.userMessage,
      });
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setSaving(true);
    try {
      let content = "";
      try {
        content = await readConfig(VAULT_ENV.component, VAULT_ENV.path);
      } catch {
        return;
      }
      content = upsertEnvVar(content, "ANTHROPIC_ADMIN_API_KEY", "");
      await writeConfig(VAULT_ENV.component, VAULT_ENV.path, content);
      addToast({ type: "success", title: "Billing access disconnected" });
      await refresh();
      await refreshSpending();
    } catch (err) {
      const classified = classifyError(err, "billing");
      addToast({
        type: "error",
        title: "Couldn't disconnect",
        message: classified.userMessage,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-neutral-300">
        Billing access (optional)
      </p>
      <p className="mb-3 text-xs leading-relaxed text-neutral-500">
        Lets the Home page show your real Anthropic spend. Without this, the
        Spending tile just deep-links to the Anthropic Console. Requires an
        organization on Anthropic — you can create one (free) in Console
        settings if you don't have one yet.
      </p>

      {editing ? (
        <div>
          <div className="relative mb-3">
            <input
              type={showDraft ? "text" : "password"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="sk-ant-admin-…"
              autoComplete="off"
              autoFocus
              className="input pr-10"
            />
            <button
              type="button"
              aria-label={showDraft ? "Hide" : "Show"}
              onClick={() => setShowDraft((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:text-neutral-300"
            >
              {showDraft ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                void openUrl(ADMIN_KEYS_URL);
              }}
              className="inline-flex items-center gap-1 text-xs text-info-400 hover:text-info-300"
            >
              Get a billing key
              <ExternalLink size={11} />
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft("");
                  setShowDraft(false);
                }}
                className="btn btn-sm btn-ghost"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                className="btn btn-sm btn-primary"
                disabled={saving || !draft.trim()}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {adminMask ? (
              <code className="block truncate text-xs text-neutral-400">{adminMask}</code>
            ) : (
              <p className="text-xs text-neutral-500">Not connected</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void openUrl(COST_URL);
              }}
              className="inline-flex items-center gap-1 text-xs text-info-400 hover:text-info-300"
            >
              View on Console
              <ExternalLink size={11} />
            </button>
            {adminMask ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn btn-sm btn-ghost"
                  disabled={saving}
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => void clear()}
                  className="btn btn-sm btn-ghost text-danger-400 hover:text-danger-300"
                  disabled={saving}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn btn-sm btn-primary"
                disabled={saving}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section 3: Notifications ───────────────────────────────────────────────

function NotificationsSection() {
  const { settings, update } = useSettings();
  const { addToast } = useToast();
  const n = settings.notifications;

  function toggle<K extends keyof typeof n>(key: K, label: string) {
    const next = !n[key];
    void update({ notifications: { ...n, [key]: next } });
    addToast({
      type: "success",
      title: next ? `${label} on` : `${label} off`,
    });
  }

  return (
    <div className="card-raised">
      <SectionHeader icon={Bell} title="Notifications" />
      <ToggleRow
        label="Security alerts"
        checked={n.securityAlerts}
        onChange={() => toggle("securityAlerts", "Security alerts")}
      />
      <ToggleRow
        label="Spending warnings"
        checked={n.spendingLimit}
        onChange={() => toggle("spendingLimit", "Spending warnings")}
      />
      <ToggleRow
        label="App updates"
        checked={n.updates}
        onChange={() => toggle("updates", "App updates")}
      />
    </div>
  );
}

// ─── Section 4: Startup ─────────────────────────────────────────────────────

function StartupSection() {
  const { settings, update } = useSettings();
  const { addToast } = useToast();

  function toggleAutostart() {
    const next = !settings.autostart;
    void update({ autostart: next });
    addToast({
      type: "success",
      title: next ? "Starting with your computer" : "Won't start automatically",
      message:
        "This preference will apply the next time you reboot.",
    });
  }

  function toggleCloseToTray() {
    const next = !settings.closeToTray;
    void update({ closeToTray: next });
    addToast({
      type: "success",
      title: next ? "Keeping it running in the background" : "Closing fully when you quit",
    });
  }

  return (
    <div className="card-raised">
      <SectionHeader icon={Power} title="Startup" />
      <ToggleRow
        label="Start Lobster-TrApp when I turn on my computer"
        checked={settings.autostart}
        onChange={toggleAutostart}
      />
      <ToggleRow
        label="Keep it running in the background"
        checked={settings.closeToTray}
        onChange={toggleCloseToTray}
      />
    </div>
  );
}

// ─── Section 5: Re-run setup ────────────────────────────────────────────────

function ReRunSetupSection() {
  const navigate = useNavigate();
  const { update } = useSettings();
  const [confirming, setConfirming] = useState(false);

  async function confirm() {
    await update({ wizardCompleted: false });
    navigate("/setup");
  }

  return (
    <div className="card-raised">
      <SectionHeader icon={RotateCcw} title="Re-run setup" />
      <p className="mb-4 text-sm text-neutral-400">
        Run through the setup again. Useful if you got a new computer.
      </p>

      {confirming ? (
        <div className="space-y-3 rounded-md bg-neutral-900 p-3">
          <p className="text-sm text-neutral-200">Re-run setup?</p>
          <p className="text-xs text-neutral-400">
            Your keys and preferences will be kept.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="btn btn-sm btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              className="btn btn-sm btn-primary"
            >
              Re-run setup
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn btn-md btn-ghost border border-neutral-700"
        >
          Re-run setup
        </button>
      )}
    </div>
  );
}

// ─── Section 6: Advanced Mode ───────────────────────────────────────────────

function AdvancedModeSection() {
  const { settings, update } = useSettings();
  const navigate = useNavigate();
  const enabled = settings.mode === "developer";

  async function toggle() {
    const next = !enabled;
    await update({ mode: next ? "developer" : "user" });
    navigate(next ? "/dev" : "/");
  }

  return (
    <div className="card-raised opacity-90">
      <SectionHeader icon={Wrench} title="Advanced Mode" muted />
      <p className="mb-2 text-sm text-neutral-400">
        Unlocks detailed views for developers, security researchers, and power
        users.
      </p>
      <p className="mb-4 text-xs text-neutral-500">Most people won't need this.</p>
      <ToggleRow label="Enable Advanced Mode" checked={enabled} onChange={toggle} />
    </div>
  );
}

// ─── Shared bits ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  muted,
}: {
  icon: LucideIcon;
  title: string;
  muted?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon
        size={16}
        className={muted ? "text-neutral-500" : "text-primary-400"}
      />
      <h2
        className={
          muted
            ? "text-sm font-medium text-neutral-400"
            : "text-sm font-semibold text-neutral-100"
        }
      >
        {title}
      </h2>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
      <span className="text-sm text-neutral-200">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer accent-primary-500"
      />
    </label>
  );
}
