import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import { getDetailLabel } from "@/lib/labels";
import { useComponentStatus } from "@/hooks/useComponentStatus";
import { useHealth } from "@/hooks/useHealth";
import { useAppContext } from "@/lib/AppContext";
import { SkeletonText, SkeletonBlock } from "@/components/Skeleton";
import { DynamicIcon } from "@/components/DynamicIcon";
import StatusBadge from "@/components/StatusBadge";
import HealthBadge from "@/components/HealthBadge";
import CommandPanel from "@/components/CommandPanel";
import ConfigPanel from "@/components/ConfigPanel";
import WorkflowPanel from "@/components/WorkflowPanel";

interface ComponentDetailProps {
  components: DiscoveredComponent[];
  loading: boolean;
}

export default function ComponentDetail({ components, loading }: ComponentDetailProps) {
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
    if (loading) {
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
        <p className="text-gray-400">Page not found</p>
        <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { manifest } = component;
  const { identity, status, commands, configs, health, workflows } = manifest;

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
      workflows={workflows}
      componentId={identity.id}
    />
  );
}

function PlaceholderView({ identity }: { identity: DiscoveredComponent["manifest"]["identity"] }) {
  const label = getDetailLabel(identity.role);

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
        <h1 className="text-2xl font-bold text-gray-300">{label}</h1>
        <p className="text-gray-500 mt-2">Coming soon.</p>
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
  workflows,
  componentId,
}: {
  identity: DiscoveredComponent["manifest"]["identity"];
  status: DiscoveredComponent["manifest"]["status"];
  commands: DiscoveredComponent["manifest"]["commands"];
  configs: DiscoveredComponent["manifest"]["configs"];
  health: DiscoveredComponent["manifest"]["health"];
  workflows: DiscoveredComponent["manifest"]["workflows"];
  componentId: string;
}) {
  const { status: currentStatus, loading: statusLoading } =
    useComponentStatus(componentId);
  const healthValues = useHealth(componentId, health);
  const [showDevTools, setShowDevTools] = useState(false);

  const label = getDetailLabel(identity.role);
  const userCommands = commands.filter((c) => c.tier === "user");
  const hasDevContent =
    workflows.length > 0 || commands.length > userCommands.length || configs.length > 0;

  // Simplified security badge from health values
  const securityHealth = healthValues.find((h) => h.id === "security-audit");
  const securityOk = securityHealth?.color === "green";

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
                {label}
              </h1>
              {identity.role === "runtime" && (
                <p className="text-sm text-gray-500">Running safely</p>
              )}
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
          </div>
        </div>
      </div>

      {/* Contextual guidance */}
      {identity.role === "runtime" && (
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          {currentStatus?.state_id === "running" ? (
            <div>
              <p className="text-sm text-gray-200 font-medium mb-1">
                Talk to your assistant by messaging your bot on Telegram.
              </p>
              <p className="text-xs text-gray-400">
                It can search the web, manage files, and schedule tasks — all within
                safe boundaries. Your personal files and passwords are protected.
              </p>
            </div>
          ) : currentStatus?.state_id === "stopped" ? (
            <div>
              <p className="text-sm text-gray-200 font-medium mb-1">
                Your assistant is stopped.
              </p>
              <p className="text-xs text-gray-400">
                Click Start below to bring it back online.
              </p>
            </div>
          ) : currentStatus?.state_id === "not_setup" ? (
            <div>
              <p className="text-sm text-gray-200 font-medium mb-1">
                Your assistant needs to be set up first.
              </p>
              <p className="text-xs text-gray-400">
                Go back to the setup wizard to get started.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {identity.role === "network" && (
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-sm text-gray-200 font-medium mb-1">
            Agent Network — coming soon
          </p>
          <p className="text-xs text-gray-400">
            The Moltbook API is currently unavailable. This feature will be enabled in a future update.
          </p>
        </div>
      )}

      {/* Simplified security badge */}
      {securityHealth && (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              securityOk
                ? "bg-green-900/30 text-green-400"
                : "bg-amber-900/30 text-amber-400"
            }`}
          >
            {securityOk ? "\u2713 Safe" : "\u26A0 Check needed"}
          </span>
        </div>
      )}

      {/* Non-security health badges */}
      {healthValues.filter((h) => h.id !== "security-audit").length > 0 && (
        <div className="flex flex-wrap gap-2">
          {healthValues
            .filter((h) => h.id !== "security-audit")
            .map((hv) => (
              <HealthBadge key={hv.id} health={hv} />
            ))}
        </div>
      )}

      {/* User-tier commands as quick actions */}
      {userCommands.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Actions
          </h2>
          <div className="card p-4">
            <CommandPanel
              commands={userCommands}
              componentId={componentId}
              currentState={currentStatus?.state_id ?? null}
            />
          </div>
        </div>
      )}

      {/* Developer tools — collapsed */}
      {hasDevContent && (
        <div>
          <button
            onClick={() => setShowDevTools((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-300"
          >
            {showDevTools ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Developer Tools
          </button>

          {showDevTools && (
            <div className="space-y-6 mt-4">
              {/* Version info */}
              <p className="text-xs text-gray-600">
                v{identity.version} &middot; {identity.role}
              </p>

              {/* Workflows */}
              {workflows.length > 0 && (
                <WorkflowPanel workflows={workflows} componentId={componentId} />
              )}

              {/* All commands */}
              {commands.length > 0 && (
                <div>
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    All Commands
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
          )}
        </div>
      )}
    </div>
  );
}
