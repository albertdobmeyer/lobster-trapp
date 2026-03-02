import { stripAnsi } from "./ansi";

interface TableRendererProps {
  content: string;
}

export default function TableRenderer({ content }: TableRendererProps) {
  const lines = stripAnsi(content)
    .split("\n")
    .filter((l) => l.trim());

  if (lines.length === 0) {
    return <p className="text-sm text-gray-500">No data</p>;
  }

  // Try to detect table structure (pipe-separated or space-aligned)
  const isPipeSeparated = lines[0].includes("|");

  if (isPipeSeparated) {
    const rows = lines
      .filter((l) => !l.match(/^[\s|+-]+$/)) // skip separator rows
      .map((l) =>
        l
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c),
      );

    const header = rows[0];
    const body = rows.slice(1);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-800">
              {header?.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 text-gray-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback: render as preformatted text
  return (
    <div className="bg-gray-950 rounded-md border border-gray-800 p-4 overflow-x-auto">
      <pre className="text-sm text-gray-300 font-mono">{content}</pre>
    </div>
  );
}
