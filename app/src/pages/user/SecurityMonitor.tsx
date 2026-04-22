import { ShieldCheck } from "lucide-react";
import UserPlaceholder from "./UserPlaceholder";

export default function SecurityMonitor() {
  return (
    <UserPlaceholder
      icon={ShieldCheck}
      title="Security & activity"
      summary="A friendly timeline of what your assistant has been doing — what it read, what it tried to visit, and which suspicious actions were blocked. Built on real activity data from the security perimeter."
      comingIn="Phase E.2.3"
      specRef="docs/specs/ui-rebuild-2026-04-21/user-mode/09-security-monitor.md"
    />
  );
}
