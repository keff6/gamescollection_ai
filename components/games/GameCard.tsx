import { MessageSquareTextIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GameFormDialog, gameToFormValues } from "@/components/games/GameFormDialog";
import type { ConsoleOptionListItem } from "@/lib/consoles";
import type { GameListItem } from "@/lib/games";
import type { GenreOption } from "@/lib/genres";
import {
  GAME_STATUS_LABELS,
  MEDIA_STATUS_LABELS,
  mapBooleansToMediaStatus,
  resolveGameStatus,
  type GameStatusValue,
  type MediaStatus,
} from "@/lib/game-utils";
import { cn } from "@/lib/utils";

const MEDIA_STATUS_STYLES: Record<MediaStatus, string> = {
  incomplete: "bg-condition-incomplete text-foreground",
  complete: "bg-condition-complete text-foreground",
  new: "bg-condition-new text-primary-foreground",
  digital: "bg-condition-digital text-primary-foreground",
};

const GAME_STATUS_STYLES: Partial<Record<GameStatusValue, string>> = {
  BACKLOG: "bg-status-backlog text-foreground",
  PLAYING: "bg-status-playing text-foreground",
  COMPLETED: "bg-status-finished text-foreground",
};

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
  const mediaStatus = mapBooleansToMediaStatus(game);
  const gameStatus = resolveGameStatus(game);
  const gameStatusStyle = GAME_STATUS_STYLES[gameStatus];

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-divider">
      <div className="flex items-start justify-between gap-4">
        <p className="text-lg font-bold text-foreground">{game.title}</p>
        <div className="flex shrink-0 items-center gap-1">
          {game.rating !== null && (
            <Badge variant="secondary" className="shrink-0">
              {game.rating}/10
            </Badge>
          )}
          {game.notes && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Notes for ${game.title}`}
                >
                  <MessageSquareTextIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{game.notes}</TooltipContent>
            </Tooltip>
          )}
          {isLoggedIn && (
            <div className="flex items-center gap-2">
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
                    size="icon"
                    aria-label={`Edit ${game.title}`}
                  >
                    <PencilIcon />
                  </Button>
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${game.title}`}
                onClick={() => onDeleteClick(game)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
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
        <div>
          <p className="text-xs font-medium text-muted-foreground">CONDITION</p>
          <Badge
            variant="secondary"
            className={cn("mt-1", MEDIA_STATUS_STYLES[mediaStatus])}
          >
            {MEDIA_STATUS_LABELS[mediaStatus]}
          </Badge>
        </div>
        {gameStatusStyle && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">STATUS</p>
            <Badge variant="secondary" className={cn("mt-1", gameStatusStyle)}>
              {GAME_STATUS_LABELS[gameStatus]}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
