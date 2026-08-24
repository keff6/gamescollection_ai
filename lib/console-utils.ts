import { ZodError, z } from "zod";

export interface ConsoleGeneration {
  value: number;
  text: string;
}

export const CONSOLE_GENERATIONS: ConsoleGeneration[] = [
  { value: 1, text: "1st (1972 - 1978)" },
  { value: 2, text: "2nd (1976 - 1984)" },
  { value: 3, text: "3rd (8 bits)" },
  { value: 4, text: "4th (16 bits)" },
  { value: 5, text: "5th (32 / 64 bits)" },
  { value: 6, text: "6th (128 bits)" },
  { value: 7, text: "7th (2004 - 2014)" },
  { value: 8, text: "8th (2011 - present)" },
  { value: 9, text: "9th (2020 - present)" },
];

const CONSOLE_YEAR_START = 1970;

export function getConsoleYearOptions(currentYear: number = new Date().getFullYear()): string[] {
  const years: string[] = [];
  for (let year = currentYear; year >= CONSOLE_YEAR_START; year--) {
    years.push(String(year));
  }
  return years;
}

export function normalizeGenerationValue(value: string | null): string {
  if (!value) return "";
  const match = CONSOLE_GENERATIONS.find(
    (generation) => generation.text === value || String(generation.value) === value
  );
  return match?.text ?? "";
}

export interface ConsoleOption {
  id: string;
  name: string;
  shortName: string;
  brandId: string;
  year: string | null;
  generation: string | null;
  isPortable: boolean;
  gameCount: number;
}

export const consoleNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(60, "Name must be 60 characters or fewer");

export const consoleShortNameSchema = z
  .string()
  .trim()
  .min(1, "Short name is required")
  .max(30, "Short name must be 30 characters or fewer");

export const consoleBrandIdSchema = z.string().trim().min(1, "Brand is required");

export const consoleYearSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || /^\d{4}$/.test(value), {
    message: "Year must be a 4-digit year",
  });

export const consoleGenerationSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export function sortConsolesByYear<T extends { year: string | null }>(
  consoles: T[]
): T[] {
  const parseYear = (year: string | null) => {
    const parsed = parseInt(year ?? "", 10);
    return Number.isNaN(parsed) ? Infinity : parsed;
  };

  return [...consoles].sort((a, b) => parseYear(a.year) - parseYear(b.year));
}

export function toConsoleErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
