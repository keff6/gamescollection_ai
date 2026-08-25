import { describe, expect, it } from "vitest";
import { parseYearOrInfinity } from "@/lib/year-utils";

describe("parseYearOrInfinity", () => {
  it("parses a numeric year string", () => {
    expect(parseYearOrInfinity("1998")).toBe(1998);
  });

  it("returns Infinity for null", () => {
    expect(parseYearOrInfinity(null)).toBe(Infinity);
  });

  it("returns Infinity for a non-numeric string", () => {
    expect(parseYearOrInfinity("TBD")).toBe(Infinity);
  });

  it("returns Infinity for an empty string", () => {
    expect(parseYearOrInfinity("")).toBe(Infinity);
  });
});
