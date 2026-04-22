import { Outlet } from "react-router-dom";
import UserSidebar from "./UserSidebar";

export default function UserLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-900">
      <UserSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
