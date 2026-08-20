function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function ConsoleGamesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <SkeletonBlock className="h-4 w-48" />

      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-24" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <SkeletonBlock className="h-8 w-full sm:w-64" />
        <SkeletonBlock className="h-8 w-32" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
