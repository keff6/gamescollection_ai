import { ZodError } from "zod";
import { describe, expect, it } from "vitest";
import {
  brandNameSchema,
  brandOriginSchema,
  sortBrandsByName,
  toBrandErrorMessage,
} from "@/lib/brand-utils";

function brand(id: string, name: string) {
  return { id, name };
}

describe("brandNameSchema", () => {
  it("accepts a normal name", () => {
    expect(brandNameSchema.parse("Nintendo")).toBe("Nintendo");
  });

  it("trims surrounding whitespace", () => {
    expect(brandNameSchema.parse("  Sony  ")).toBe("Sony");
  });

  it("rejects an empty name", () => {
    expect(() => brandNameSchema.parse("")).toThrow();
  });

  it("rejects a name that is only whitespace", () => {
    expect(() => brandNameSchema.parse("   ")).toThrow();
  });

  it("accepts a name exactly 30 characters long", () => {
    const name = "a".repeat(30);
    expect(brandNameSchema.parse(name)).toBe(name);
  });

  it("rejects a name over 30 characters", () => {
    expect(() => brandNameSchema.parse("a".repeat(31))).toThrow();
  });
});

describe("brandOriginSchema", () => {
  it("accepts a normal origin", () => {
    expect(brandOriginSchema.parse("Japan")).toBe("Japan");
  });

  it("trims surrounding whitespace", () => {
    expect(brandOriginSchema.parse("  USA  ")).toBe("USA");
  });

  it("treats an empty string as undefined", () => {
    expect(brandOriginSchema.parse("")).toBeUndefined();
  });

  it("treats undefined as undefined", () => {
    expect(brandOriginSchema.parse(undefined)).toBeUndefined();
  });

  it("accepts an origin exactly 30 characters long", () => {
    const origin = "a".repeat(30);
    expect(brandOriginSchema.parse(origin)).toBe(origin);
  });

  it("rejects an origin over 30 characters", () => {
    expect(() => brandOriginSchema.parse("a".repeat(31))).toThrow();
  });
});

describe("sortBrandsByName", () => {
  it("sorts brands alphabetically", () => {
    const brands = [brand("1", "Sony"), brand("2", "Atari"), brand("3", "Sega")];
    expect(sortBrandsByName(brands).map((b) => b.name)).toEqual([
      "Atari",
      "Sega",
      "Sony",
    ]);
  });

  it("does not mutate the input array", () => {
    const brands = [brand("1", "Sony"), brand("2", "Atari")];
    sortBrandsByName(brands);
    expect(brands.map((b) => b.name)).toEqual(["Sony", "Atari"]);
  });
});

describe("toBrandErrorMessage", () => {
  it("uses the first Zod issue message", () => {
    const result = brandNameSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toBrandErrorMessage(result.error, "fallback")).toBe("Name is required");
    }
  });

  it("falls back when a ZodError has no issues", () => {
    const error = new ZodError([]);
    expect(toBrandErrorMessage(error, "fallback")).toBe("fallback");
  });

  it("uses a plain Error's message", () => {
    expect(toBrandErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back for a non-Error value", () => {
    expect(toBrandErrorMessage("nope", "fallback")).toBe("fallback");
  });
});
