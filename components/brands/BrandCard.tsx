import { PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { BrandFormDialog } from "@/components/brands/BrandFormDialog";
import { Button } from "@/components/ui/button";
import type { BrandWithConsoleCount } from "@/lib/brands";

export function BrandCard({
  brand,
  isLoggedIn,
  onUpdated,
  onDeleteClick,
}: {
  brand: BrandWithConsoleCount;
  isLoggedIn: boolean;
  onUpdated: (brand: BrandWithConsoleCount) => void;
  onDeleteClick: (brand: BrandWithConsoleCount) => void;
}) {
  return (
    <div className="relative rounded-xl bg-card p-6 ring-1 ring-foreground/10 transition-colors hover:bg-muted">
      <Link
        href={`/brands/${brand.id}/consoles`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <p className="text-lg font-bold text-foreground pr-14">{brand.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {brand.consoleCount} Console{brand.consoleCount === 1 ? "" : "s"}
        </p>
      </Link>

      {isLoggedIn && (
        <div className="absolute top-4 right-4 flex gap-1">
          <BrandFormDialog
            brand={brand}
            onSuccess={onUpdated}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${brand.name}`}
              >
                <PencilIcon />
              </Button>
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${brand.name}`}
            onClick={() => onDeleteClick(brand)}
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
