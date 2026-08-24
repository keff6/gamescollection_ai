import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";
import {
  gameConsoleIdSchema,
  gameDeveloperSchema,
  gameGenreIdsSchema,
  gameNotesSchema,
  gamePublisherSchema,
  gameRatingSchema,
  gameSagaSchema,
  gameTitleSchema,
  gameYearSchema,
  resolveGameStatus,
  sortGames,
  type GameListItem,
  type GameSortKey,
} from "@/lib/game-utils";

export { sortGames };
export type { GameListItem, GameSortKey };

export const GAMES_PAGE_SIZE = 25;

export interface GameFormInput {
  title: string;
  consoleId: string;
  genreIds: string[];
  year?: string;
  rating?: string;
  developer?: string;
  publisher?: string;
  notes?: string;
  saga?: string[];
  isNew: boolean;
  isComplete: boolean;
  isDigital: boolean;
  isBacklog: boolean;
  isPlaying: boolean;
  isFinished: boolean;
}

export interface ConsoleGamesData {
  console: { id: string; name: string; brandId: string; brandName: string };
  totalGames: number;
  total: number;
  games: GameListItem[];
}

function parseSaga(saga: unknown): string[] {
  if (!Array.isArray(saga)) return [];
  return saga.filter((tag): tag is string => typeof tag === "string");
}

function toGameListItem(game: {
  id: string;
  title: string;
  consoleId: string;
  year: string | null;
  rating: number | null;
  developer: string | null;
  publisher: string | null;
  notes: string | null;
  saga: unknown;
  isNew: boolean | null;
  isComplete: boolean | null;
  isDigital: boolean | null;
  isBacklog: boolean | null;
  isPlaying: boolean | null;
  isFinished: boolean | null;
  genres: { genreId: string; genre: { name: string } }[];
}): GameListItem {
  return {
    id: game.id,
    title: game.title,
    consoleId: game.consoleId,
    year: game.year,
    rating: game.rating,
    developer: game.developer,
    publisher: game.publisher,
    notes: game.notes,
    saga: parseSaga(game.saga),
    genreIds: game.genres.map((gameGenre) => gameGenre.genreId),
    genres: game.genres.map((gameGenre) => gameGenre.genre.name),
    isNew: game.isNew ?? false,
    isComplete: game.isComplete ?? false,
    isDigital: game.isDigital ?? false,
    isBacklog: game.isBacklog ?? false,
    isPlaying: game.isPlaying ?? false,
    isFinished: game.isFinished ?? false,
  };
}

function buildGameData(input: GameFormInput) {
  const title = gameTitleSchema.parse(input.title);
  const consoleId = gameConsoleIdSchema.parse(input.consoleId);
  const genreIds = gameGenreIdsSchema.parse(input.genreIds);
  const year = gameYearSchema.parse(input.year);
  const rating = gameRatingSchema.parse(input.rating);
  const developer = gameDeveloperSchema.parse(input.developer);
  const publisher = gamePublisherSchema.parse(input.publisher);
  const notes = gameNotesSchema.parse(input.notes);
  const saga = gameSagaSchema.parse(input.saga);
  const status = resolveGameStatus(input);

  return {
    title,
    consoleId,
    genreIds,
    year: year ?? null,
    rating: rating ?? null,
    developer: developer ?? null,
    publisher: publisher ?? null,
    notes: notes ?? null,
    saga: saga.length > 0 ? saga : Prisma.DbNull,
    status,
    isNew: input.isNew,
    isComplete: input.isComplete,
    isDigital: input.isDigital,
    isBacklog: input.isBacklog,
    isPlaying: input.isPlaying,
    isFinished: input.isFinished,
  };
}

async function assertConsoleExists(consoleId: string) {
  const consoleItem = await db.console.findUnique({
    where: { id: consoleId },
    select: { id: true },
  });
  if (!consoleItem) {
    throw new Error("Selected console doesn't exist");
  }
}

export async function getConsoleGames(
  consoleId: string,
  options: { search?: string; sort?: GameSortKey; skip?: number; take?: number } = {}
): Promise<ConsoleGamesData | null> {
  const { search = "", sort = "title", skip = 0, take = GAMES_PAGE_SIZE } = options;

  const consoleRecord = await db.console.findUnique({
    where: { id: consoleId },
    select: {
      id: true,
      name: true,
      brandId: true,
      brand: { select: { name: true } },
      _count: { select: { games: true } },
    },
  });

  if (!consoleRecord) return null;

  const games = await db.game.findMany({
    where: {
      consoleId,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    include: { genres: { include: { genre: true } } },
  });

  const mapped: GameListItem[] = games.map(toGameListItem);

  const sorted = sortGames(mapped, sort);

  return {
    console: {
      id: consoleRecord.id,
      name: consoleRecord.name,
      brandId: consoleRecord.brandId,
      brandName: consoleRecord.brand.name,
    },
    totalGames: consoleRecord._count.games,
    total: sorted.length,
    games: sorted.slice(skip, skip + take),
  };
}

export async function createGame(input: GameFormInput): Promise<GameListItem> {
  const data = buildGameData(input);
  await assertConsoleExists(data.consoleId);

  const game = await db.game.create({
    data: {
      title: data.title,
      consoleId: data.consoleId,
      year: data.year,
      rating: data.rating,
      developer: data.developer,
      publisher: data.publisher,
      notes: data.notes,
      saga: data.saga,
      status: data.status,
      isNew: data.isNew,
      isComplete: data.isComplete,
      isDigital: data.isDigital,
      isBacklog: data.isBacklog,
      isPlaying: data.isPlaying,
      isFinished: data.isFinished,
      genres: { create: data.genreIds.map((genreId) => ({ genreId })) },
    },
    include: { genres: { include: { genre: true } } },
  });

  return toGameListItem(game);
}

export async function updateGame(id: string, input: GameFormInput): Promise<GameListItem> {
  const data = buildGameData(input);
  await assertConsoleExists(data.consoleId);

  const game = await db.$transaction(async (tx) => {
    await tx.gameGenre.deleteMany({ where: { gameId: id } });

    return tx.game.update({
      where: { id },
      data: {
        title: data.title,
        consoleId: data.consoleId,
        year: data.year,
        rating: data.rating,
        developer: data.developer,
        publisher: data.publisher,
        notes: data.notes,
        saga: data.saga,
        status: data.status,
        isNew: data.isNew,
        isComplete: data.isComplete,
        isDigital: data.isDigital,
        isBacklog: data.isBacklog,
        isPlaying: data.isPlaying,
        isFinished: data.isFinished,
        genres: { create: data.genreIds.map((genreId) => ({ genreId })) },
      },
      include: { genres: { include: { genre: true } } },
    });
  });

  return toGameListItem(game);
}

export async function deleteGame(id: string): Promise<void> {
  await db.game.delete({ where: { id } });
}
