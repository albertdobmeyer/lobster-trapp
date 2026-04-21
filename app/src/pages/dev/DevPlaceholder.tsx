interface DevPlaceholderProps {
  title: string;
  summary: string;
  specRef?: string;
}

export default function DevPlaceholder({
  title,
  summary,
  specRef,
}: DevPlaceholderProps) {
  return (
    <section className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-100 mb-1">{title}</h1>
      <p className="text-sm text-neutral-400 mb-4">{summary}</p>
      <div className="card-dev">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
          Scheduled — Phase E.3
        </p>
        <p className="text-sm text-neutral-300">
          This view is part of the developer-mode rebuild. The implementation
          lands in Phase E.3.
        </p>
        {specRef && (
          <p className="mt-3 text-xs text-neutral-500 font-mono">
            spec: {specRef}
          </p>
        )}
      </div>
    </section>
  );
}
