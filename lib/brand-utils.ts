import { z } from "zod";
import { toEntityErrorMessage } from "@/lib/error-utils";

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

export const brandFormSchema = z.object({
  name: brandNameSchema,
  origin: brandOriginSchema,
});

export function sortBrandsByName<T extends { name: string }>(brands: T[]): T[] {
  return [...brands].sort((a, b) => a.name.localeCompare(b.name));
}

export function toBrandErrorMessage(error: unknown, fallback: string): string {
  return toEntityErrorMessage(error, fallback);
}
