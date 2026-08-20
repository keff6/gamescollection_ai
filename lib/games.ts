import { db } from "@/lib/prisma";

export const GAMES_PAGE_SIZE = 25;

export type GameSortKey = "title" | "year" | "rating";

export interface GameListItem {
  id: string;
  title: string;
  year: string | null;
  rating: number | null;
  developer: string | null;
  publisher: string | null;
  genres: string[];
}

export interface ConsoleGamesData {
  console: { id: string; name: string; brandId: string; brandName: string };
  totalGames: number;
  total: number;
  games: GameListItem[];
}

function parseYear(year: string | null) {
  const parsed = parseInt(year ?? "", 10);
  return Number.isNaN(parsed) ? Infinity : parsed;
}

export function sortGames(games: GameListItem[], sort: GameSortKey) {
  const sorted = [...games];
  if (sort === "year") {
    sorted.sort((a, b) => parseYear(a.year) - parseYear(b.year));
  } else if (sort === "rating") {
    sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  } else {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  return sorted;
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

  const mapped: GameListItem[] = games.map((game) => ({
    id: game.id,
    title: game.title,
    year: game.year,
    rating: game.rating,
    developer: game.developer,
    publisher: game.publisher,
    genres: game.genres.map((gameGenre) => gameGenre.genre.name),
  }));

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
