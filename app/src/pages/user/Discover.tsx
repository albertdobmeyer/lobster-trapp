import { Sparkles } from "lucide-react";
import UserPlaceholder from "./UserPlaceholder";

export default function Discover() {
  return (
    <UserPlaceholder
      icon={Sparkles}
      title="Discover what your assistant can do"
      summary="A picture-book of things you can ask your assistant — plan a trip, summarise the news, draft an email. Tap a card and it sends the prompt straight to Telegram for you."
      comingIn="Phase E.2.6"
      specRef="docs/specs/ui-rebuild-2026-04-21/user-mode/12-use-case-gallery.md"
    />
  );
}
