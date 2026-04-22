import { LifeBuoy } from "lucide-react";
import UserPlaceholder from "./UserPlaceholder";

export default function Help() {
  return (
    <UserPlaceholder
      icon={LifeBuoy}
      title="Help & support"
      summary="Plain-language answers to common questions, with screenshots. When you can't find what you need, copy a redacted diagnostic bundle and email or post on GitHub for help."
      comingIn="Phase E.2.5"
      specRef="docs/specs/ui-rebuild-2026-04-21/user-mode/11-help-and-support.md"
    />
  );
}
