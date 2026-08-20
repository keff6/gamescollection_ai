"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/games/GameCard";
import type { GameListItem, GameSortKey } from "@/lib/games";
import { loadMoreGames } from "@/app/consoles/[consoleId]/games/actions";

export function GamesList({
  consoleId,
  search,
  sort,
  initialGames,
  initialTotal,
  isLoggedIn,
}: {
  consoleId: string;
  search: string;
  sort: GameSortKey;
  initialGames: GameListItem[];
  initialTotal: number;
  isLoggedIn: boolean;
}) {
  const [games, setGames] = useState(initialGames);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  const hasMore = games.length < total;

  function handleShowMore() {
    startTransition(async () => {
      const next = await loadMoreGames(consoleId, search, sort, games.length);
      setGames((current) => [...current, ...next.games]);
      setTotal(next.total);
    });
  }

  if (total === 0) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Showing results {games.length} / {total}
      </p>

      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
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
    </div>
  );
}
