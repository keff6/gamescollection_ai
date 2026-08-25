import Link from "next/link";

export type ConsoleFilterType = "all" | "home" | "portable";

const FILTERS: { value: ConsoleFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "home", label: "Home" },
  { value: "portable", label: "Portable" },
];

export function ConsoleFilterTabs({
  brandId,
  active,
}: {
  brandId: string;
  active: ConsoleFilterType;
}) {
  return (
    <div className="flex items-center gap-2">
      {FILTERS.map((filter) => {
        const isActive = filter.value === active;
        const href =
          filter.value === "all"
            ? `/brands/${brandId}/consoles`
            : `/brands/${brandId}/consoles?type=${filter.value}`;

        return (
          <Link
            key={filter.value}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground ring-1 ring-foreground/30 hover:text-foreground"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
