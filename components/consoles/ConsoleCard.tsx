import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConsoleWithGameCount } from "@/lib/consoles";

export function ConsoleCard({
  console: consoleItem,
}: {
  console: ConsoleWithGameCount;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <Gamepad2 className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-lg font-bold text-foreground">{consoleItem.name}</p>
      </div>

      <div className="flex gap-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground">YEAR</p>
          <p className="mt-1 text-sm text-foreground">{consoleItem.year ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">GENERATION</p>
          <p className="mt-1 text-sm text-foreground">
            {consoleItem.generation ?? "—"}
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
