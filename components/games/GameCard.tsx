import { Badge } from "@/components/ui/badge";
import type { GameListItem } from "@/lib/games";

export function GameCard({ game }: { game: GameListItem }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-4">
        <p className="text-lg font-bold text-foreground">{game.title}</p>
        {game.rating !== null && (
          <Badge variant="secondary" className="shrink-0">
            {game.rating}/10
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground">YEAR</p>
          <p className="mt-1 text-sm text-foreground">{game.year ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">GENRE</p>
          <p className="mt-1 text-sm text-foreground">
            {game.genres.length > 0 ? game.genres.join(", ") : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            DEVELOPER-PUBLISHER
          </p>
          <p className="mt-1 text-sm text-foreground">
            {[game.developer, game.publisher].filter(Boolean).join(" / ") || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
