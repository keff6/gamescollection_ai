function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function BrandConsolesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <SkeletonBlock className="h-4 w-40" />

      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-32" />
      </div>

      <div className="flex gap-2">
        <SkeletonBlock className="h-8 w-16 rounded-full" />
        <SkeletonBlock className="h-8 w-20 rounded-full" />
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
