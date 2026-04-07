import type { CommandResult } from "@/lib/types";
import type { OutputDisplay } from "@/lib/types";
import LogRenderer from "./renderers/LogRenderer";
import TableRenderer from "./renderers/TableRenderer";
import ChecklistRenderer from "./renderers/ChecklistRenderer";
import TerminalRenderer from "./renderers/TerminalRenderer";
import BadgeRenderer from "./renderers/BadgeRenderer";
import ReportRenderer from "./renderers/ReportRenderer";
import CardGridRenderer from "./renderers/CardGridRenderer";

interface OutputRendererProps {
  result: CommandResult;
  display: OutputDisplay;
}

export default function OutputRenderer({ result, display }: OutputRendererProps) {
  const content = result.stdout || result.stderr;

  switch (display) {
    case "table":
      return <TableRenderer content={content} />;
    case "checklist":
      return <ChecklistRenderer content={content} exitCode={result.exit_code} />;
    case "terminal":
      return <TerminalRenderer content={content} exitCode={result.exit_code} />;
    case "badge":
      return <BadgeRenderer content={content} />;
    case "card-grid":
      return <CardGridRenderer content={content} exitCode={result.exit_code} />;
    case "report":
      return <ReportRenderer content={content} exitCode={result.exit_code} />;
    case "log":
    default:
      return <LogRenderer content={content} />;
  }
}
