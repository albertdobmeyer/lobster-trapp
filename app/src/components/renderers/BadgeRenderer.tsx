import { stripAnsi } from "./ansi";

interface BadgeRendererProps {
  content: string;
}

export default function BadgeRenderer({ content }: BadgeRendererProps) {
  const value = stripAnsi(content).trim();

  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-200">
      {value}
    </span>
  );
}
