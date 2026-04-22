import { SlidersHorizontal } from "lucide-react";
import UserPlaceholder from "./UserPlaceholder";

export default function Preferences() {
  return (
    <UserPlaceholder
      icon={SlidersHorizontal}
      title="Preferences"
      summary="Update your keys, change your monthly spending limit, choose which notifications to receive, control startup behaviour. Six small sections, sensible defaults."
      comingIn="Phase E.2.4"
      specRef="docs/specs/ui-rebuild-2026-04-21/user-mode/10-preferences.md"
    />
  );
}
