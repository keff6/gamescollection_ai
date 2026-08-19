import { db } from "@/lib/prisma";

export interface GenreSlice {
  name: string;
  count: number;
  percent: number;
}

export interface PlatformBar {
  shortName: string;
  count: number;
}

export interface ConsoleBar {
  name: string;
  count: number;
}

export type ConditionLabel = "Digital" | "New" | "Complete" | "Incomplete";

export interface ConditionSlice {
  label: ConditionLabel;
  count: number;
  percent: number;
}

export interface DashboardStats {
  totalGames: number;
  completedGames: number;
  completedPercent: number;
  nowPlayingGames: number;
  totalBrands: number;
  totalConsoles: number;
  genreBreakdown: GenreSlice[];
  platformBreakdown: PlatformBar[];
  conditionBreakdown: ConditionSlice[];
  top5Consoles: ConsoleBar[];
}

interface GenreCount {
  name: string;
  _count: { games: number };
}

interface ConsoleCount {
  name: string;
  shortName: string;
  year: string | null;
  _count: { games: number };
}

interface GameConditionFlags {
  isDigital: boolean | null;
  isNew: boolean | null;
  isComplete: boolean | null;
}

const MAX_GENRE_SLICES = 7;

const CONDITION_ORDER: ConditionLabel[] = [
  "Complete",
  "Digital",
  "Incomplete",
  "New",
];

export function bucketCondition(game: GameConditionFlags): ConditionLabel {
  if (game.isDigital) return "Digital";
  if (game.isNew) return "New";
  if (game.isComplete) return "Complete";
  return "Incomplete";
}

export function buildGenreBreakdown(
  genres: GenreCount[],
  maxSlices: number = MAX_GENRE_SLICES,
): GenreSlice[] {
  const totalGenreLinks = genres.reduce((sum, g) => sum + g._count.games, 0);
  const sortedGenres = genres
    .filter((g) => g._count.games > 0)
    .sort((a, b) => b._count.games - a._count.games);

  const topGenres = sortedGenres.slice(0, maxSlices);
  const restGenres = sortedGenres.slice(maxSlices);
  const otherCount = restGenres.reduce((sum, g) => sum + g._count.games, 0);

  const toSlice = (name: string, count: number): GenreSlice => ({
    name,
    count,
    percent:
      totalGenreLinks > 0 ? Math.round((count / totalGenreLinks) * 100) : 0,
  });

  const breakdown = topGenres.map((g) => toSlice(g.name, g._count.games));
  if (otherCount > 0) {
    breakdown.push(toSlice("Other", otherCount));
  }
  return breakdown;
}

export function buildPlatformBreakdown(
  consolesWithGames: ConsoleCount[],
): PlatformBar[] {
  const platformCounts = new Map<string, number>();
  const platformYears = new Map<string, number>();
  for (const c of consolesWithGames) {
    platformCounts.set(
      c.shortName,
      (platformCounts.get(c.shortName) ?? 0) + c._count.games,
    );
    const year = parseInt(c.year ?? "", 10);
    if (!Number.isNaN(year)) {
      const existing = platformYears.get(c.shortName);
      if (existing === undefined || year < existing) {
        platformYears.set(c.shortName, year);
      }
    }
  }
  return Array.from(platformCounts, ([shortName, count]) => ({
    shortName,
    count,
  })).sort((a, b) => {
    const yearA = platformYears.get(a.shortName) ?? Infinity;
    const yearB = platformYears.get(b.shortName) ?? Infinity;
    return yearA - yearB;
  });
}

export function buildTop5Consoles(
  consolesWithGames: ConsoleCount[],
): ConsoleBar[] {
  return consolesWithGames
    .map((c) => ({ name: c.name, count: c._count.games }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function buildConditionBreakdown(
  games: GameConditionFlags[],
  totalGames: number,
): ConditionSlice[] {
  const conditionCounts = new Map<ConditionLabel, number>();
  for (const game of games) {
    const label = bucketCondition(game);
    conditionCounts.set(label, (conditionCounts.get(label) ?? 0) + 1);
  }
  return CONDITION_ORDER.filter(
    (label) => (conditionCounts.get(label) ?? 0) > 0,
  ).map((label) => {
    const count = conditionCounts.get(label) ?? 0;
    return {
      label,
      count,
      percent: totalGames > 0 ? Math.round((count / totalGames) * 100) : 0,
    };
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalGames,
    completedGames,
    nowPlayingGames,
    totalBrands,
    totalConsoles,
    genres,
    consoles,
    conditionFlags,
  ] = await Promise.all([
    db.game.count(),
    db.game.count({ where: { status: "COMPLETED" } }),
    db.game.count({ where: { status: "PLAYING" } }),
    db.brand.count(),
    db.console.count(),
    db.genre.findMany({
      select: { name: true, _count: { select: { games: true } } },
    }),
    db.console.findMany({
      select: {
        name: true,
        shortName: true,
        year: true,
        _count: { select: { games: true } },
      },
    }),
    db.game.findMany({
      select: { isDigital: true, isNew: true, isComplete: true },
    }),
  ]);

  const completedPercent =
    totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

  const consolesWithGames = consoles.filter((c) => c._count.games > 0);

  return {
    totalGames,
    completedGames,
    completedPercent,
    nowPlayingGames,
    totalBrands,
    totalConsoles,
    genreBreakdown: buildGenreBreakdown(genres),
    platformBreakdown: buildPlatformBreakdown(consolesWithGames),
    conditionBreakdown: buildConditionBreakdown(conditionFlags, totalGames),
    top5Consoles: buildTop5Consoles(consolesWithGames),
  };
}
