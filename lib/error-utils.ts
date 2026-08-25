import { ZodError } from "zod";
import { AppError } from "@/lib/app-error";

/**
 * Maps a caught error to a user-facing message. Only ZodError issues and our
 * own AppError messages are passed through — anything else (e.g. a raw Prisma
 * driver error) falls back to the generic message so internal details never
 * reach the UI.
 */
export function toEntityErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof AppError) {
    return error.message;
  }
  return fallback;
}
