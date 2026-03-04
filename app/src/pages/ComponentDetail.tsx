import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import { useComponentStatus } from "@/hooks/useComponentStatus";
import { useHealth } from "@/hooks/useHealth";
import { useAppContext } from "@/lib/AppContext";
import { SkeletonText, SkeletonBlock } from "@/components/Skeleton";
import { DynamicIcon } from "@/components/DynamicIcon";
import StatusBadge from "@/components/StatusBadge";
import HealthBadge from "@/components/HealthBadge";
import CommandPanel from "@/components/CommandPanel";
import ConfigPanel from "@/components/ConfigPanel";

interface ComponentDetailProps {
  components: DiscoveredComponent[];
}

export default function ComponentDetail({ components }: ComponentDetailProps) {
  const { id } = useParams<{ id: string }>();
  const { updateSettings } = useAppContext();
  const component = components.find((c) => c.manifest.identity.id === id);

  // Persist last-viewed component
  useEffect(() => {
    if (id) {
      updateSettings({ lastViewedComponentId: id });
    }
  }, [id, updateSettings]);

  if (!component) {
    // Still loading — show skeleton instead of instant "not found"
    if (components.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="animate-pulse bg-gray-800 w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonText width="w-1/4" />
              <SkeletonText width="w-1/2" />
            </div>
          </div>
          <SkeletonBlock height="h-40" />
          <SkeletonBlock height="h-32" />
        </div>
      );
    }

    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Component not found</p>
        <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { manifest } = component;
  const { identity, status, commands, configs, health } = manifest;

  if (identity.role === "placeholder") {
    return <PlaceholderView identity={identity} />;
  }

  return (
    <ActiveComponentView
      identity={identity}
      status={status}
      commands={commands}
      configs={configs}
      health={health}
      componentId={identity.id}
    />
  );
}

function PlaceholderView({ identity }: { identity: DiscoveredComponent["manifest"]["identity"] }) {
  return (
    <div>
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-6"
      >
        <ArrowLeft size={16} />
        Dashboard
      </Link>

      <div className="text-center py-20">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${identity.color}20` }}
        >
          <DynamicIcon name={identity.icon} size={32} color={identity.color} />
        </div>
        <h1 className="text-2xl font-bold text-gray-300">{identity.name}</h1>
        <p className="text-gray-500 mt-2">{identity.description}</p>
        <span className="inline-block mt-4 px-3 py-1 rounded-full bg-gray-800 text-gray-500 text-sm">
          Coming Soon
        </span>
      </div>
    </div>
  );
}

function ActiveComponentView({
  identity,
  status,
  commands,
  configs,
  health,
  componentId,
}: {
  identity: DiscoveredComponent["manifest"]["identity"];
  status: DiscoveredComponent["manifest"]["status"];
  commands: DiscoveredComponent["manifest"]["commands"];
  configs: DiscoveredComponent["manifest"]["configs"];
  health: DiscoveredComponent["manifest"]["health"];
  componentId: string;
}) {
  const { status: currentStatus, loading: statusLoading } =
    useComponentStatus(componentId);
  const healthValues = useHealth(componentId, health);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-4"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

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
              <h1 className="text-2xl font-bold text-gray-100">
                {identity.name}
              </h1>
              <p className="text-sm text-gray-500">
                v{identity.version} &middot; {identity.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <StatusBadge
                stateId={currentStatus?.state_id ?? null}
                states={status.states}
                loading={statusLoading}
              />
            )}
            {identity.repo && (
              <a
                href={identity.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
        <p className="text-gray-400 mt-2">{identity.description}</p>
      </div>

      {/* Health badges */}
      {healthValues.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Health
          </h2>
          <div className="flex flex-wrap gap-2">
            {healthValues.map((hv) => (
              <HealthBadge key={hv.id} health={hv} />
            ))}
          </div>
        </div>
      )}

      {/* Commands */}
      {commands.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Commands
          </h2>
          <div className="card p-4">
            <CommandPanel
              commands={commands}
              componentId={componentId}
              currentState={currentStatus?.state_id ?? null}
            />
          </div>
        </div>
      )}

      {/* Configs */}
      {configs.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Configuration
          </h2>
          <div className="card p-4">
            <ConfigPanel configs={configs} componentId={componentId} />
          </div>
        </div>
      )}
    </div>
  );
}
