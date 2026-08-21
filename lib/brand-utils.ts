import { ZodError, z } from "zod";

export interface BrandOption {
  id: string;
  name: string;
  origin: string | null;
  consoleCount: number;
}

export const brandNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(30, "Name must be 30 characters or fewer");

export const brandOriginSchema = z
  .string()
  .trim()
  .max(30, "Origin must be 30 characters or fewer")
  .optional()
  .transform((value) => (value ? value : undefined));

export function sortBrandsByName<T extends { name: string }>(brands: T[]): T[] {
  return [...brands].sort((a, b) => a.name.localeCompare(b.name));
}

export function toBrandErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
