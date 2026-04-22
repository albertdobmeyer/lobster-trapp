import type { LucideIcon } from "lucide-react";

interface UserPlaceholderProps {
  icon: LucideIcon;
  title: string;
  summary: string;
  comingIn: string;
  specRef?: string;
}

export default function UserPlaceholder({
  icon: Icon,
  title,
  summary,
  comingIn,
  specRef,
}: UserPlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl py-12 px-4 animate-slide-in">
      <div className="card-hero text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-400">
          <Icon size={40} strokeWidth={1.5} />
        </div>
        <h1 className="mb-2 text-3xl font-semibold text-neutral-100">{title}</h1>
        <p className="mx-auto mb-8 max-w-xl text-sm text-neutral-400">{summary}</p>
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-neutral-800 px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
          Coming in {comingIn}
        </div>
        {specRef && (
          <p className="mt-4 font-mono text-xs text-neutral-600">spec: {specRef}</p>
        )}
      </div>
    </div>
  );
}
