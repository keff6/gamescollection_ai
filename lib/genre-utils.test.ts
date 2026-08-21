import { ZodError } from "zod";
import { describe, expect, it } from "vitest";
import {
  genreNameSchema,
  isDuplicateGenreName,
  sortGenresByName,
  toGenreErrorMessage,
  type GenreOption,
} from "@/lib/genre-utils";

function genre(id: string, name: string): GenreOption {
  return { id, name };
}

describe("genreNameSchema", () => {
  it("accepts a normal name", () => {
    expect(genreNameSchema.parse("RPG")).toBe("RPG");
  });

  it("trims surrounding whitespace", () => {
    expect(genreNameSchema.parse("  Platformer  ")).toBe("Platformer");
  });

  it("rejects an empty name", () => {
    expect(() => genreNameSchema.parse("")).toThrow();
  });

  it("rejects a name that is only whitespace", () => {
    expect(() => genreNameSchema.parse("   ")).toThrow();
  });

  it("accepts a name exactly 50 characters long", () => {
    const name = "a".repeat(50);
    expect(genreNameSchema.parse(name)).toBe(name);
  });

  it("rejects a name over 50 characters", () => {
    expect(() => genreNameSchema.parse("a".repeat(51))).toThrow();
  });
});

describe("sortGenresByName", () => {
  it("sorts genres alphabetically", () => {
    const genres = [genre("1", "RPG"), genre("2", "Action"), genre("3", "Puzzle")];
    expect(sortGenresByName(genres).map((g) => g.name)).toEqual([
      "Action",
      "Puzzle",
      "RPG",
    ]);
  });

  it("does not mutate the input array", () => {
    const genres = [genre("1", "RPG"), genre("2", "Action")];
    sortGenresByName(genres);
    expect(genres.map((g) => g.name)).toEqual(["RPG", "Action"]);
  });
});

describe("isDuplicateGenreName", () => {
  const genres = [genre("1", "RPG"), genre("2", "Action")];

  it("matches case-insensitively", () => {
    expect(isDuplicateGenreName(genres, "rpg")).toBe(true);
  });

  it("returns false for a name not in the list", () => {
    expect(isDuplicateGenreName(genres, "Puzzle")).toBe(false);
  });

  it("excludes the given id from the check (editing a row to its own name)", () => {
    expect(isDuplicateGenreName(genres, "RPG", "1")).toBe(false);
  });

  it("still flags a collision with a different row when excluding an id", () => {
    expect(isDuplicateGenreName(genres, "Action", "1")).toBe(true);
  });
});

describe("toGenreErrorMessage", () => {
  it("uses the first Zod issue message", () => {
    const result = genreNameSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toGenreErrorMessage(result.error, "fallback")).toBe("Name is required");
    }
  });

  it("falls back when a ZodError has no issues", () => {
    const error = new ZodError([]);
    expect(toGenreErrorMessage(error, "fallback")).toBe("fallback");
  });

  it("uses a plain Error's message", () => {
    expect(toGenreErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back for a non-Error value", () => {
    expect(toGenreErrorMessage("nope", "fallback")).toBe("fallback");
  });
});
