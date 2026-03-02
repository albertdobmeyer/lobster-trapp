import * as icons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name?: string;
}

// Map kebab-case icon names to PascalCase component names
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  if (!name) {
    return <icons.Box {...props} />;
  }

  const pascalName = toPascalCase(name);
  const Icon = (icons as unknown as Record<string, React.ComponentType<LucideProps>>)[
    pascalName
  ];

  if (!Icon) {
    return <icons.Box {...props} />;
  }

  return <Icon {...props} />;
}
