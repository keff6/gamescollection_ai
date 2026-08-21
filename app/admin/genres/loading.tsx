function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function AdminGenresLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
        <SkeletonBlock className="h-8 w-28 rounded-lg" />
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 rounded-md" />
        ))}
      </div>
    </div>
  );
}
