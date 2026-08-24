import { PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameFormDialog, gameToFormValues } from "@/components/games/GameFormDialog";
import type { ConsoleOptionListItem } from "@/lib/consoles";
import type { GameListItem } from "@/lib/games";
import type { GenreOption } from "@/lib/genres";

export function GameCard({
  game,
  consoleId,
  consoles,
  genres,
  isLoggedIn,
  onUpdated,
  onDeleteClick,
}: {
  game: GameListItem;
  consoleId: string;
  consoles: ConsoleOptionListItem[];
  genres: GenreOption[];
  isLoggedIn: boolean;
  onUpdated: (game: GameListItem) => void;
  onDeleteClick: (game: GameListItem) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-4">
        <p className="text-lg font-bold text-foreground">{game.title}</p>
        <div className="flex shrink-0 items-center gap-1">
          {game.rating !== null && (
            <Badge variant="secondary" className="shrink-0">
              {game.rating}/10
            </Badge>
          )}
          {isLoggedIn && (
            <>
              <GameFormDialog
                consoleId={consoleId}
                consoles={consoles}
                genres={genres}
                game={gameToFormValues(game)}
                onSuccess={onUpdated}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${game.title}`}
                  >
                    <PencilIcon />
                  </Button>
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${game.title}`}
                onClick={() => onDeleteClick(game)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </>
          )}
        </div>
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
