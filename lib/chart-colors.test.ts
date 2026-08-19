import { describe, expect, it } from "vitest";
import { getGenreShade } from "@/lib/chart-colors";

describe("getGenreShade", () => {
  it("returns the dark endpoint for the first slice", () => {
    expect(getGenreShade(0, 5)).toBe("#0f766e");
  });

  it("returns the light endpoint for the last slice", () => {
    expect(getGenreShade(4, 5)).toBe("#99f6e4");
  });

  it("returns the dark endpoint for a single slice", () => {
    expect(getGenreShade(0, 1)).toBe("#0f766e");
  });

  it("returns a valid hex color for a middle slice", () => {
    expect(getGenreShade(2, 5)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
