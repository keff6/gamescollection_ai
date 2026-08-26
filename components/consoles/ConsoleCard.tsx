import { Gamepad2, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { ConsoleFormDialog } from "@/components/consoles/ConsoleFormDialog";
import { Button } from "@/components/ui/button";
import type { BrandOptionListItem } from "@/lib/brands";
import type { ConsoleWithGameCount } from "@/lib/consoles";
import { normalizeGenerationValue } from "@/lib/console-utils";

export function ConsoleCard({
  console: consoleItem,
  brandId,
  brands,
  isLoggedIn,
  onUpdated,
  onDeleteClick,
}: {
  console: ConsoleWithGameCount;
  brandId: string;
  brands: BrandOptionListItem[];
  isLoggedIn: boolean;
  onUpdated: (consoleItem: ConsoleWithGameCount) => void;
  onDeleteClick: (consoleItem: ConsoleWithGameCount) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-6 ring-1 ring-divider">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-lg font-bold text-foreground">{consoleItem.name}</p>
        </div>

        {isLoggedIn && (
          <div className="flex shrink-0 gap-2">
            <ConsoleFormDialog
              brandId={brandId}
              brands={brands}
              console={{
                id: consoleItem.id,
                name: consoleItem.name,
                shortName: consoleItem.shortName,
                brandId: consoleItem.brandId,
                year: consoleItem.year ?? "",
                generation: normalizeGenerationValue(consoleItem.generation),
                isPortable: consoleItem.isPortable,
              }}
              onSuccess={onUpdated}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${consoleItem.name}`}
                >
                  <PencilIcon />
                </Button>
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Delete ${consoleItem.name}`}
              onClick={() => onDeleteClick(consoleItem)}
            >
              <Trash2Icon className="text-destructive" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground">YEAR</p>
          <p className="mt-1 text-sm text-foreground">{consoleItem.year ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">GENERATION</p>
          <p className="mt-1 text-sm text-foreground">
            {normalizeGenerationValue(consoleItem.generation) || "—"}
          </p>
        </div>
      </div>

      <Button asChild variant="outline" className="w-full text-accent">
        <Link href={`/consoles/${consoleItem.id}/games`}>
          View {consoleItem.gameCount} Game{consoleItem.gameCount === 1 ? "" : "s"}
        </Link>
      </Button>
    </div>
  );
}
