import { stripAnsi } from "./ansi";

interface ReportRendererProps {
  content: string;
  exitCode: number;
}

export default function ReportRenderer({ content, exitCode }: ReportRendererProps) {
  const lines = stripAnsi(content).split("\n");

  // Try to identify sections (lines that look like headers)
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } = { title: "", lines: [] };

  lines.forEach((line) => {
    const isHeader =
      line.match(/^[=]{3,}/) ||
      line.match(/^[-]{3,}/) ||
      line.match(/^#{1,3}\s/) ||
      (line === line.toUpperCase() && line.trim().length > 3 && !line.includes(" "));

    if (isHeader && current.lines.length > 0) {
      sections.push(current);
      current = { title: line.replace(/^[#=\-\s]+/, "").trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  });
  sections.push(current);

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div key={i} className="card p-4">
          {section.title && (
            <h4 className="text-sm font-medium text-gray-200 mb-2">
              {section.title}
            </h4>
          )}
          <pre className="text-sm text-gray-400 font-mono whitespace-pre-wrap">
            {section.lines.join("\n")}
          </pre>
        </div>
      ))}
      <div className="text-xs text-gray-600">
        Exit code: {exitCode}
      </div>
    </div>
  );
}
