import { RefreshCw } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import ComponentCard from "@/components/ComponentCard";

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

      {loading && components.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Discovering components...
        </div>
      ) : components.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-2">No components found</p>
          <p className="text-sm text-gray-600">
            Ensure component.yml manifests exist in components/*/
          </p>
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
