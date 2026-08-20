"use server";

import { GAMES_PAGE_SIZE, getConsoleGames, type GameSortKey } from "@/lib/games";

export async function loadMoreGames(
  consoleId: string,
  search: string,
  sort: GameSortKey,
  skip: number
) {
  const data = await getConsoleGames(consoleId, {
    search,
    sort,
    skip,
    take: GAMES_PAGE_SIZE,
  });

  if (!data) return { games: [], total: 0 };

  return { games: data.games, total: data.total };
}
