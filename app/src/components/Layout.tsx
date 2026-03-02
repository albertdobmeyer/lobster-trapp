import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import type { DiscoveredComponent } from "@/lib/types";

interface LayoutProps {
  components: DiscoveredComponent[];
}

export default function Layout({ components }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar components={components} />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
