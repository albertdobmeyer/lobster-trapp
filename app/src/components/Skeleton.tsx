const pulse = "animate-pulse bg-gray-800 rounded";

export function SkeletonText({ width = "w-full" }: { width?: string }) {
  return <div className={`${pulse} h-4 ${width}`} />;
}

export function SkeletonBlock({ height = "h-20" }: { height?: string }) {
  return <div className={`${pulse} ${height} w-full rounded-md`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`${pulse} w-10 h-10 rounded-lg`} />
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-1/3" />
          <SkeletonText width="w-2/3" />
        </div>
      </div>
      <SkeletonText width="w-full" />
      <div className="flex gap-2">
        <SkeletonText width="w-16" />
        <SkeletonText width="w-16" />
      </div>
    </div>
  );
}
