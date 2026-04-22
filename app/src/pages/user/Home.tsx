import { Home as HomeIcon } from "lucide-react";
import UserPlaceholder from "./UserPlaceholder";

export default function Home() {
  return (
    <UserPlaceholder
      icon={HomeIcon}
      title="Your assistant, at a glance"
      summary="The hero status card, security/activity/spending tiles, and proactive alerts will live here. The full home dashboard arrives in the next sub-phase."
      comingIn="Phase E.2.2"
      specRef="docs/specs/ui-rebuild-2026-04-21/user-mode/08-home-dashboard.md"
    />
  );
}
