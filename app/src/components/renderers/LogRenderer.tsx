import { stripAnsi } from "./ansi";

interface LogRendererProps {
  content: string;
}

export default function LogRenderer({ content }: LogRendererProps) {
  const lines = stripAnsi(content).split("\n");

  return (
    <div className="bg-gray-950 rounded-md border border-gray-800 p-4 max-h-96 overflow-y-auto">
      <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
        {lines.map((line, i) => (
          <div key={i} className="hover:bg-gray-900/50">
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}
