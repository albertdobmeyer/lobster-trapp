import { useNavigate } from "react-router-dom";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { DollarSign, ExternalLink } from "lucide-react";
import type { SpendingSummary } from "@/lib/tauri";
import { useSettings } from "@/hooks/useSettings";
import type { TileTone } from "./StatTile";

const CONSOLE_COST_URL = "https://console.anthropic.com/cost";

interface Props {
  summary: SpendingSummary;
  loading: boolean;
}

interface Cell {
  value: string;
  subline: string;
  tone: TileTone;
}

const TONE_BORDER: Record<TileTone, string> = {
  neutral: "",
  warning: "border-warning-500/60",
  danger: "border-danger-500/60",
};

export default function SpendingTile({ summary, loading }: Props) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const cell = deriveCell(summary, settings.spendingLimit.monthly, loading);
  const accent = TONE_BORDER[cell.tone];

  return (
    <div className={`card overflow-hidden ${accent}`}>
      <button
        type="button"
        onClick={() => navigate("/preferences")}
        className="block w-full p-4 text-left transition-colors hover:bg-neutral-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-info-500/40"
        aria-label={`Spending — ${cell.value}. Click to manage in Preferences.`}
      >
        <div className="mb-3 flex items-center gap-2">
          <DollarSign size={16} className="text-warning-400" />
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Spending
          </span>
        </div>
        <p className="mb-1 text-xl font-semibold text-neutral-100">{cell.value}</p>
        <p className="text-xs text-neutral-500">{cell.subline}</p>
      </button>

      <div className="border-t border-neutral-900 bg-neutral-900/40 px-4 py-2">
        <button
          type="button"
          onClick={() => {
            void openUrl(CONSOLE_COST_URL);
          }}
          className="inline-flex items-center gap-1 text-xs text-info-400 hover:text-info-300 focus:outline-none focus-visible:underline"
        >
          View on Anthropic Console
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}

function deriveCell(
  summary: SpendingSummary,
  monthlyLimitCents: number | null,
  loading: boolean,
): Cell {
  if (loading) {
    return { value: "Loading…", subline: "Fetching the latest from Anthropic.", tone: "neutral" };
  }

  switch (summary.kind) {
    case "not_connected":
      return {
        value: "Not connected",
        subline: "Add a billing key in Preferences to see your real spend.",
        tone: "neutral",
      };
    case "connected": {
      const month = formatDollars(summary.this_month_cents);
      const today = formatDollars(summary.today_cents);
      const overLimit =
        monthlyLimitCents !== null && summary.this_month_cents >= monthlyLimitCents;
      const limit = monthlyLimitCents !== null ? formatDollars(monthlyLimitCents) : null;
      return {
        value: `${month} this month`,
        subline: overLimit
          ? `Today: ${today} · Over your ${limit} monthly limit.`
          : limit
            ? `Today: ${today} · Limit ${limit}.`
            : `Today: ${today}.`,
        tone: overLimit ? "danger" : "neutral",
      };
    }
    case "error": {
      switch (summary.code) {
        case "individual_account":
          return {
            value: "Set up an organization",
            subline:
              "Anthropic only exposes spend for organizations. You can create one (free) on Console.",
            tone: "warning",
          };
        case "unauthorized":
          return {
            value: "Billing key didn't work",
            subline: "Update your billing key in Preferences.",
            tone: "warning",
          };
        case "unreachable":
          return {
            value: "Couldn't reach Anthropic",
            subline: "Check Console for the latest. We'll retry shortly.",
            tone: "neutral",
          };
        case "parse_failed":
          return {
            value: "Spending data unavailable",
            subline: "We couldn't read Anthropic's reply. Check Console for the latest.",
            tone: "neutral",
          };
      }
    }
  }
}

function formatDollars(cents: number): string {
  const dollars = cents / 100;
  if (dollars < 10) {
    return `$${dollars.toFixed(2)}`;
  }
  return `$${dollars.toFixed(0)}`;
}
