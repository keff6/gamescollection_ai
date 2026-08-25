import { z } from "zod";
import { toEntityErrorMessage } from "@/lib/error-utils";

export interface GenreOption {
  id: string;
  name: string;
}

export const genreNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or fewer");

export function sortGenresByName(genres: GenreOption[]): GenreOption[] {
  return [...genres].sort((a, b) => a.name.localeCompare(b.name));
}

export function isDuplicateGenreName(
  genres: GenreOption[],
  name: string,
  excludeId?: string
): boolean {
  const normalized = name.trim().toLowerCase();
  return genres.some(
    (genre) => genre.id !== excludeId && genre.name.toLowerCase() === normalized
  );
}

export function toGenreErrorMessage(error: unknown, fallback: string): string {
  return toEntityErrorMessage(error, fallback);
}
