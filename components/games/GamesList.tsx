"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteGameAction, loadMoreGames } from "@/app/consoles/[consoleId]/games/actions";
import { GameCard } from "@/components/games/GameCard";
import { GameFormDialog } from "@/components/games/GameFormDialog";
import { GamesControls } from "@/components/games/GamesControls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ConsoleOptionListItem } from "@/lib/consoles";
import { sortGames, type GameListItem, type GameSortKey } from "@/lib/game-utils";
import type { GenreOption } from "@/lib/genres";

export function GamesList({
  consoleId,
  consoleName,
  consoles,
  genres,
  search,
  sort,
  initialGames,
  initialTotal,
  initialTotalGames,
  isLoggedIn,
}: {
  consoleId: string;
  consoleName: string;
  consoles: ConsoleOptionListItem[];
  genres: GenreOption[];
  search: string;
  sort: GameSortKey;
  initialGames: GameListItem[];
  initialTotal: number;
  initialTotalGames: number;
  isLoggedIn: boolean;
}) {
  const [games, setGames] = useState(initialGames);
  const [total, setTotal] = useState(initialTotal);
  const [totalGames, setTotalGames] = useState(initialTotalGames);
  const [deleteTarget, setDeleteTarget] = useState<GameListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasMore = games.length < total;

  function matchesSearch(game: GameListItem) {
    return !search || game.title.toLowerCase().includes(search.toLowerCase());
  }

  function handleCreated(game: GameListItem) {
    if (game.consoleId !== consoleId) {
      toast.success("Game added");
      return;
    }
    setTotalGames((prev) => prev + 1);
    if (matchesSearch(game)) {
      setGames((prev) => sortGames([...prev, game], sort));
      setTotal((prev) => prev + 1);
    }
  }

  function handleUpdated(game: GameListItem) {
    if (game.consoleId !== consoleId) {
      setGames((prev) => prev.filter((current) => current.id !== game.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setTotalGames((prev) => Math.max(0, prev - 1));
      return;
    }
    setGames((prev) =>
      sortGames(
        prev.map((current) => (current.id === game.id ? game : current)),
        sort
      )
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteGameAction(deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      setDeleteTarget(null);
      return;
    }

    setGames((prev) => prev.filter((current) => current.id !== deleteTarget.id));
    setTotal((prev) => Math.max(0, prev - 1));
    setTotalGames((prev) => Math.max(0, prev - 1));
    toast.success("Game deleted");
    setDeleteTarget(null);
  }

  function handleShowMore() {
    startTransition(async () => {
      const next = await loadMoreGames(consoleId, search, sort, games.length);
      setGames((current) => [...current, ...next.games]);
      setTotal(next.total);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{consoleName}</h1>
          <p className="mt-1 text-muted-foreground">
            {totalGames} game{totalGames === 1 ? "" : "s"}
          </p>
        </div>
        {isLoggedIn && (
          <GameFormDialog
            consoleId={consoleId}
            consoles={consoles}
            genres={genres}
            onSuccess={handleCreated}
          />
        )}
      </div>

      <GamesControls search={search} sort={sort} />

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-card py-16 text-center ring-1 ring-foreground/10">
          <p className="text-lg font-semibold text-foreground">
            {search ? "No games match your search" : "No games yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {search
              ? "Try a different search term."
              : isLoggedIn
                ? "Add this console's first game to start building your collection."
                : "Log in to add this console's first game."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing results {games.length} / {total}
          </p>

          <div className="flex flex-col gap-3">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                consoleId={consoleId}
                consoles={consoles}
                genres={genres}
                isLoggedIn={isLoggedIn}
                onUpdated={handleUpdated}
                onDeleteClick={setDeleteTarget}
              />
            ))}
          </div>

          {hasMore && (
            <Button
              variant="outline"
              onClick={handleShowMore}
              disabled={isPending}
              className="mx-auto"
            >
              {isPending ? "Loading..." : "Show More"}
            </Button>
          )}
        </>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
