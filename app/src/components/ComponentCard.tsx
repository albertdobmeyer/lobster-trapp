import { Link } from "react-router-dom";
import type { DiscoveredComponent } from "@/lib/types";
import { getUserLabel } from "@/lib/labels";
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

  const label = getUserLabel(identity.role);

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
            <h3 className="font-medium text-gray-300">{label}</h3>
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
          <h3 className="font-medium text-gray-100 group-hover:text-white">
            {label}
          </h3>
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
