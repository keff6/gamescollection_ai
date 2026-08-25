/**
 * Parses a stored year string for sort comparisons. Missing/non-numeric years
 * sort last (Infinity) rather than first, since a blank year isn't "oldest".
 */
export function parseYearOrInfinity(year: string | null): number {
  const parsed = parseInt(year ?? "", 10);
  return Number.isNaN(parsed) ? Infinity : parsed;
}
