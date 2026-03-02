import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import { useComponentStatus } from "@/hooks/useComponentStatus";
import { DynamicIcon } from "./DynamicIcon";
import StatusBadge from "./StatusBadge";

interface ComponentCardProps {
  component: DiscoveredComponent;
}

export default function ComponentCard({ component }: ComponentCardProps) {
  const { identity, status } = component.manifest;
  const isPlaceholder = identity.role === "placeholder";

  const { status: currentStatus, loading } = useComponentStatus(
    identity.id,
    isPlaceholder ? 60000 : 10000,
  );

  if (isPlaceholder) {
    return (
      <div className="card p-5 opacity-60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${identity.color}20` }}
            >
              <DynamicIcon
                name={identity.icon}
                size={20}
                color={identity.color}
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-300">{identity.name}</h3>
              <p className="text-xs text-gray-600">v{identity.version}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-500">
            Coming Soon
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-500">{identity.description}</p>
      </div>
    );
  }

  return (
    <Link
      to={`/component/${identity.id}`}
      className="card p-5 hover:border-gray-700 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${identity.color}20` }}
          >
            <DynamicIcon
              name={identity.icon}
              size={20}
              color={identity.color}
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-100 group-hover:text-white">
              {identity.name}
            </h3>
            <p className="text-xs text-gray-500">v{identity.version}</p>
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
      <p className="mt-3 text-sm text-gray-400">{identity.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-600 capitalize">{identity.role}</span>
        {identity.repo && (
          <ExternalLink size={14} className="text-gray-600 group-hover:text-gray-400" />
        )}
      </div>
    </Link>
  );
}
