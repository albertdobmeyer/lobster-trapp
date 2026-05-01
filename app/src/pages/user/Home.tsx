import { Activity, Shield } from "lucide-react";
import HeroStatusCard from "@/components/user/HeroStatusCard";
import ProactiveAlertsBanner from "@/components/user/ProactiveAlertsBanner";
import SpendingTile from "@/components/user/SpendingTile";
import StatTile, { type TileTone } from "@/components/user/StatTile";
import TipOfTheDay from "@/components/user/TipOfTheDay";
import { useHero, type HeroState } from "@/hooks/useHero";
import { useSpending } from "@/hooks/useSpending";

export default function Home() {
  const { state, loading } = useHero();
  const spending = useSpending();
  const security = securityFromHero(state);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
      <ProactiveAlertsBanner />

      <HeroStatusCard state={state} loading={loading} />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          icon={Shield}
          iconTint="text-success-400"
          title="Security"
          value={security.value}
          subline={security.subline}
          href="/security"
          tone={security.tone}
        />
        <StatTile
          icon={Activity}
          iconTint="text-info-400"
          title="Activity"
          value="None yet"
          subline="Your assistant has no tasks today."
          href="/security"
        />
        <SpendingTile summary={spending.summary} loading={spending.loading} />
      </div>

      <TipOfTheDay />
    </div>
  );
}

interface SecurityCell {
  value: string;
  subline: string;
  tone: TileTone;
}

function securityFromHero(state: HeroState): SecurityCell {
  switch (state) {
    case "running_safely":
      return { value: "Safe", subline: "Sandbox is active.", tone: "neutral" };
    case "starting":
      return { value: "Starting…", subline: "Sandbox is coming up.", tone: "neutral" };
    case "recovering":
      return {
        value: "Recovering",
        subline: "Sandbox is restarting itself.",
        tone: "warning",
      };
    case "error_perimeter":
      return {
        value: "Needs attention",
        subline: "Sandbox isn't running.",
        tone: "danger",
      };
    case "not_setup":
      return { value: "Not set up", subline: "Run setup to begin.", tone: "neutral" };
  }
}
