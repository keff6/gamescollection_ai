import Link from "next/link";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;

        return (
          <span key={segment.label} className="flex items-center gap-2">
            {index > 0 && <span className="text-muted-foreground">/</span>}
            {segment.href && !isLast ? (
              <Link
                href={segment.href}
                className="text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {segment.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={isLast ? "font-bold text-foreground" : "text-muted-foreground"}
              >
                {segment.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
