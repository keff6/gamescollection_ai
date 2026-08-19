import type { ConditionLabel } from "@/lib/dashboard";

export const CHART_ACCENT = "#2dd4bf";

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--foreground)",
  fontSize: 12,
} as const;

export const CHART_TICK_STYLE = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
} as const;

export const CONDITION_COLORS: Record<ConditionLabel, string> = {
  Complete: "#0d9488",
  Digital: "#2dd4bf",
  Incomplete: "#134e4a",
  New: "#99f6e4",
};

const GENRE_SHADE_DARK = { r: 0x0f, g: 0x76, b: 0x6e };
const GENRE_SHADE_LIGHT = { r: 0x99, g: 0xf6, b: 0xe4 };

function toHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0");
}

/** Interpolates a teal shade for slice `index` of `total`, dark to light. */
export function getGenreShade(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1);
  const r = GENRE_SHADE_DARK.r + (GENRE_SHADE_LIGHT.r - GENRE_SHADE_DARK.r) * t;
  const g = GENRE_SHADE_DARK.g + (GENRE_SHADE_LIGHT.g - GENRE_SHADE_DARK.g) * t;
  const b = GENRE_SHADE_DARK.b + (GENRE_SHADE_LIGHT.b - GENRE_SHADE_DARK.b) * t;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
