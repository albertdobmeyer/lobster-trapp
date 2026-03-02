import { NavLink } from "react-router-dom";
import { LayoutDashboard, Settings } from "lucide-react";
import type { DiscoveredComponent } from "@/lib/types";
import { DynamicIcon } from "./DynamicIcon";

interface SidebarProps {
  components: DiscoveredComponent[];
}

export default function Sidebar({ components }: SidebarProps) {
  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-gray-100 tracking-tight">
          Lobster-TrApp
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">OpenClaw Orchestrator</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <div className="pt-3 pb-1">
          <p className="px-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
            Components
          </p>
        </div>

        {components.map((c) => (
          <NavLink
            key={c.manifest.identity.id}
            to={`/component/${c.manifest.identity.id}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`
            }
          >
            <DynamicIcon
              name={c.manifest.identity.icon}
              size={18}
              color={c.manifest.identity.color}
            />
            {c.manifest.identity.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
