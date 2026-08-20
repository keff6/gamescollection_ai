import Link from "next/link";
import type { BrandWithConsoleCount } from "@/lib/brands";

export function BrandCard({ brand }: { brand: BrandWithConsoleCount }) {
  return (
    <Link
      href={`/brands/${brand.id}`}
      className="rounded-xl bg-card p-6 ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <p className="text-lg font-bold text-foreground">{brand.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {brand.consoleCount} Console{brand.consoleCount === 1 ? "" : "s"}
      </p>
    </Link>
  );
}
