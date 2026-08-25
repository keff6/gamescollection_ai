"use server";

import { toGameErrorMessage } from "@/lib/game-utils";
import {
  GAMES_PAGE_SIZE,
  createGame,
  deleteGame,
  getConsoleGames,
  updateGame,
  type GameFormInput,
  type GameListItem,
  type GameSortKey,
} from "@/lib/games";
import { requireAuth, type ActionResult } from "@/lib/server-action";

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

export async function createGameAction(
  input: GameFormInput
): Promise<ActionResult<GameListItem>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const game = await createGame(input);
    return { success: true, data: game };
  } catch (error) {
    return {
      success: false,
      error: toGameErrorMessage(error, "Couldn't add game — try again"),
    };
  }
}

export async function updateGameAction(
  id: string,
  input: GameFormInput
): Promise<ActionResult<GameListItem>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const game = await updateGame(id, input);
    return { success: true, data: game };
  } catch (error) {
    return {
      success: false,
      error: toGameErrorMessage(error, "Couldn't update game — try again"),
    };
  }
}

export async function deleteGameAction(id: string): Promise<ActionResult<null>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    await deleteGame(id);
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: toGameErrorMessage(error, "Couldn't delete game — try again"),
    };
  }
}
