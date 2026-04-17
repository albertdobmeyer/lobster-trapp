import { useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, X, ArrowRight } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import ComponentCard from "@/components/ComponentCard";
import { SkeletonCard } from "@/components/Skeleton";

interface DashboardProps {
  components: DiscoveredComponent[];
  loading: boolean;
  onRefresh: () => void;
}

export default function Dashboard({
  components,
  loading,
  onRefresh,
}: DashboardProps) {
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Sort: active components first, placeholder last
  const sorted = [...components].sort((a, b) => {
    if (a.manifest.identity.role === "placeholder") return 1;
    if (b.manifest.identity.role === "placeholder") return -1;
    return a.manifest.identity.name.localeCompare(b.manifest.identity.name);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            OpenClaw ecosystem components
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-safe flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {showOnboarding && components.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-blue-950/30 border border-blue-800/30 relative">
          <button
            onClick={() => setShowOnboarding(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-300"
          >
            <X size={14} />
          </button>
          <p className="text-sm text-blue-200 font-medium mb-1">
            Setup complete — your security perimeter is ready.
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Click a component below to view its dashboard, run workflows, or configure settings.
            Start with <strong>OpenClaw Vault</strong> to manage your AI assistant.
          </p>
          <Link
            to="/component/openclaw-vault"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            Open Vault Dashboard <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {loading && components.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : components.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-2">No components detected yet</p>
          <p className="text-sm text-gray-600 mb-4">
            Run the setup wizard to configure and discover your components.
          </p>
          <Link to="/setup" className="btn btn-safe inline-flex items-center gap-2">
            Run Setup Wizard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((c) => (
            <ComponentCard key={c.manifest.identity.id} component={c} />
          ))}
        </div>
      )}
    </div>
  );
}
