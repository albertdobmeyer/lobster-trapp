import { useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, X, ArrowRight, Shield } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import { getUserLabel } from "@/lib/labels";
import { useComponentStatus } from "@/hooks/useComponentStatus";
import { DynamicIcon } from "@/components/DynamicIcon";
import StatusBadge from "@/components/StatusBadge";
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

  const runtimeComponent = components.find(
    (c) => c.manifest.identity.role === "runtime",
  );
  const secondaryComponents = components.filter(
    (c) => c.manifest.identity.role !== "runtime",
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : components.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-2">
            No assistant detected
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Run the setup wizard to get started.
          </p>
          <Link
            to="/setup"
            className="btn btn-safe inline-flex items-center gap-2"
          >
            Run Setup Wizard
          </Link>
        </div>
      ) : (
        <>
          {/* Primary: Assistant status card */}
          {runtimeComponent && (
            <AssistantCard
              component={runtimeComponent}
              showOnboarding={showOnboarding}
              onDismissOnboarding={() => setShowOnboarding(false)}
            />
          )}

          {/* Secondary cards */}
          {secondaryComponents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {secondaryComponents.map((c) => (
                <SecondaryCard
                  key={c.manifest.identity.id}
                  component={c}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AssistantCard({
  component,
  showOnboarding,
  onDismissOnboarding,
}: {
  component: DiscoveredComponent;
  showOnboarding: boolean;
  onDismissOnboarding: () => void;
}) {
  const { identity, status } = component.manifest;
  const { status: currentStatus, loading } = useComponentStatus(identity.id);

  return (
    <div>
      <Link
        to={`/component/${identity.id}`}
        className="card p-6 hover:border-gray-700 transition-colors group block"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${identity.color}20` }}
            >
              <DynamicIcon
                name={identity.icon}
                size={24}
                color={identity.color}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100 group-hover:text-white">
                Your AI Assistant
              </h2>
              <p className="text-sm text-gray-400">
                Talk to your assistant on Telegram
              </p>
            </div>
          </div>
          {status && (
            <StatusBadge
              stateId={currentStatus?.state_id ?? null}
              states={status.states}
              loading={loading}
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Shield size={12} />
            Running safely
          </div>
        </div>
      </Link>

      {/* Onboarding banner */}
      {showOnboarding && (
        <div className="mt-3 p-4 rounded-lg bg-blue-950/30 border border-blue-800/30 relative">
          <button
            onClick={onDismissOnboarding}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-300"
          >
            <X size={14} />
          </button>
          <p className="text-sm text-blue-200 font-medium mb-1">
            Your assistant is ready!
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Message your bot on Telegram to start a conversation. You can also
            check your skills or run a security audit from this dashboard.
          </p>
          <Link
            to={`/component/${identity.id}`}
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            Learn what your assistant can do <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}

function SecondaryCard({ component }: { component: DiscoveredComponent }) {
  const { identity, status } = component.manifest;
  const isPlaceholder = identity.role === "placeholder";
  const label = getUserLabel(identity.role);

  const { status: currentStatus, loading } = useComponentStatus(
    identity.id,
    isPlaceholder ? 60000 : 10000,
  );

  if (isPlaceholder) {
    return (
      <div className="card p-4 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DynamicIcon
              name={identity.icon}
              size={18}
              color={identity.color}
            />
            <span className="text-sm font-medium text-gray-300">{label}</span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-500">
            Coming Soon
          </span>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/component/${identity.id}`}
      className="card p-4 hover:border-gray-700 transition-colors group block"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DynamicIcon
            name={identity.icon}
            size={18}
            color={identity.color}
          />
          <span className="text-sm font-medium text-gray-100 group-hover:text-white">
            {label}
          </span>
        </div>
        {status && (
          <StatusBadge
            stateId={currentStatus?.state_id ?? null}
            states={status.states}
            loading={loading}
          />
        )}
      </div>
    </Link>
  );
}
