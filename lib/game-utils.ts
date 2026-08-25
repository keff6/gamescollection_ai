import { z } from "zod";
import { toEntityErrorMessage } from "@/lib/error-utils";

export type MediaStatus = "incomplete" | "complete" | "new" | "digital";

export type GameStatusValue = "WISHLIST" | "BACKLOG" | "OWNED" | "PLAYING" | "COMPLETED";

export type GameSortKey = "title" | "year" | "rating";

export interface GameListItem {
  id: string;
  title: string;
  consoleId: string;
  year: string | null;
  rating: number | null;
  developer: string | null;
  publisher: string | null;
  notes: string | null;
  saga: string[];
  genreIds: string[];
  genres: string[];
  isNew: boolean;
  isComplete: boolean;
  isDigital: boolean;
  isBacklog: boolean;
  isPlaying: boolean;
  isFinished: boolean;
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

export const gameTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(80, "Title must be 80 characters or fewer");

export const gameConsoleIdSchema = z.string().trim().min(1, "Console is required");

export const gameGenreIdsSchema = z
  .array(z.string())
  .min(1, "Select at least one genre");

export const gameYearSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || /^\d{4}$/.test(value), {
    message: "Year must be a 4-digit year",
  });

export const gameRatingSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : undefined))
  .refine(
    (value) => value === undefined || (Number.isInteger(value) && value >= 1 && value <= 10),
    { message: "Rating must be a whole number between 1 and 10" }
  );

export const gameDeveloperSchema = z
  .string()
  .trim()
  .max(50, "Developer must be 50 characters or fewer")
  .optional()
  .transform((value) => (value ? value : undefined));

export const gamePublisherSchema = z
  .string()
  .trim()
  .max(50, "Publisher must be 50 characters or fewer")
  .optional()
  .transform((value) => (value ? value : undefined));

export const gameNotesSchema = z
  .string()
  .trim()
  .max(200, "Notes must be 200 characters or fewer")
  .optional()
  .transform((value) => (value ? value : undefined));

export const gameSagaTagSchema = z
  .string()
  .trim()
  .min(1, "Saga tag can't be empty")
  .max(50, "Saga tag must be 50 characters or fewer");

export const gameSagaSchema = z.array(gameSagaTagSchema).optional().default([]);

export const gameFormSchema = z.object({
  title: gameTitleSchema,
  consoleId: gameConsoleIdSchema,
  genreIds: gameGenreIdsSchema,
  rating: gameRatingSchema,
  year: gameYearSchema,
  developer: gameDeveloperSchema,
  publisher: gamePublisherSchema,
  notes: gameNotesSchema,
  saga: gameSagaSchema,
});

const GAME_YEAR_START = 1970;

export function getGameYearOptions(
  currentYear: number = new Date().getFullYear()
): string[] {
  const years: string[] = [];
  for (let year = currentYear; year >= GAME_YEAR_START; year--) {
    years.push(String(year));
  }
  return years;
}

export function mapBooleansToMediaStatus(input: {
  isNew: boolean;
  isComplete: boolean;
  isDigital: boolean;
}): MediaStatus {
  if (input.isNew) return "new";
  if (input.isComplete) return "complete";
  if (input.isDigital) return "digital";
  return "incomplete";
}

export function mapMediaStatusToBooleans(mediaStatus: MediaStatus): {
  isNew: boolean;
  isComplete: boolean;
  isDigital: boolean;
} {
  return {
    isNew: mediaStatus === "new",
    isComplete: mediaStatus === "complete",
    isDigital: mediaStatus === "digital",
  };
}

export function resolveGameStatus(input: {
  isFinished: boolean;
  isPlaying: boolean;
  isBacklog: boolean;
}): GameStatusValue {
  if (input.isFinished) return "COMPLETED";
  if (input.isPlaying) return "PLAYING";
  if (input.isBacklog) return "BACKLOG";
  return "OWNED";
}

export function isDuplicateSagaTag(saga: string[], candidate: string): boolean {
  const normalized = candidate.trim().toLowerCase();
  return saga.some((tag) => tag.toLowerCase() === normalized);
}

export function toGameErrorMessage(error: unknown, fallback: string): string {
  return toEntityErrorMessage(error, fallback);
}
