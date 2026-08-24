import { ZodError } from "zod";
import { describe, expect, it } from "vitest";
import {
  gameConsoleIdSchema,
  gameDeveloperSchema,
  gameGenreIdsSchema,
  gameNotesSchema,
  gamePublisherSchema,
  gameRatingSchema,
  gameSagaSchema,
  gameSagaTagSchema,
  gameTitleSchema,
  gameYearSchema,
  getGameYearOptions,
  isDuplicateSagaTag,
  mapBooleansToMediaStatus,
  mapMediaStatusToBooleans,
  resolveGameStatus,
  toGameErrorMessage,
} from "@/lib/game-utils";

describe("gameTitleSchema", () => {
  it("accepts a normal title", () => {
    expect(gameTitleSchema.parse("Pokémon Red")).toBe("Pokémon Red");
  });

  it("trims surrounding whitespace", () => {
    expect(gameTitleSchema.parse("  Zelda  ")).toBe("Zelda");
  });

  it("rejects an empty title", () => {
    expect(() => gameTitleSchema.parse("")).toThrow();
  });

  it("accepts a title exactly 80 characters long", () => {
    const title = "a".repeat(80);
    expect(gameTitleSchema.parse(title)).toBe(title);
  });

  it("rejects a title over 80 characters", () => {
    expect(() => gameTitleSchema.parse("a".repeat(81))).toThrow();
  });
});

describe("gameConsoleIdSchema", () => {
  it("accepts a non-empty id", () => {
    expect(gameConsoleIdSchema.parse("console-1")).toBe("console-1");
  });

  it("rejects an empty id", () => {
    expect(() => gameConsoleIdSchema.parse("")).toThrow();
  });
});

describe("gameGenreIdsSchema", () => {
  it("accepts a non-empty array", () => {
    expect(gameGenreIdsSchema.parse(["g1", "g2"])).toEqual(["g1", "g2"]);
  });

  it("rejects an empty array", () => {
    expect(() => gameGenreIdsSchema.parse([])).toThrow();
  });
});

describe("gameYearSchema", () => {
  it("accepts a 4-digit year", () => {
    expect(gameYearSchema.parse("1998")).toBe("1998");
  });

  it("treats an empty string as undefined", () => {
    expect(gameYearSchema.parse("")).toBeUndefined();
  });

  it("treats undefined as undefined", () => {
    expect(gameYearSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects a non 4-digit value", () => {
    expect(() => gameYearSchema.parse("98")).toThrow();
  });
});

describe("gameRatingSchema", () => {
  it("parses a valid rating into a number", () => {
    expect(gameRatingSchema.parse("8")).toBe(8);
  });

  it("treats an empty string as undefined", () => {
    expect(gameRatingSchema.parse("")).toBeUndefined();
  });

  it("treats undefined as undefined", () => {
    expect(gameRatingSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects a rating below 1", () => {
    expect(() => gameRatingSchema.parse("0")).toThrow();
  });

  it("rejects a rating above 10", () => {
    expect(() => gameRatingSchema.parse("11")).toThrow();
  });

  it("rejects a non-integer rating", () => {
    expect(() => gameRatingSchema.parse("7.5")).toThrow();
  });
});

describe("gameDeveloperSchema / gamePublisherSchema", () => {
  it("accepts a value exactly 50 characters long", () => {
    const value = "a".repeat(50);
    expect(gameDeveloperSchema.parse(value)).toBe(value);
    expect(gamePublisherSchema.parse(value)).toBe(value);
  });

  it("rejects a value over 50 characters", () => {
    expect(() => gameDeveloperSchema.parse("a".repeat(51))).toThrow();
    expect(() => gamePublisherSchema.parse("a".repeat(51))).toThrow();
  });

  it("treats an empty string as undefined", () => {
    expect(gameDeveloperSchema.parse("")).toBeUndefined();
    expect(gamePublisherSchema.parse("")).toBeUndefined();
  });
});

describe("gameNotesSchema", () => {
  it("accepts a value exactly 200 characters long", () => {
    const value = "a".repeat(200);
    expect(gameNotesSchema.parse(value)).toBe(value);
  });

  it("rejects a value over 200 characters", () => {
    expect(() => gameNotesSchema.parse("a".repeat(201))).toThrow();
  });

  it("treats an empty string as undefined", () => {
    expect(gameNotesSchema.parse("")).toBeUndefined();
  });
});

describe("gameSagaTagSchema / gameSagaSchema", () => {
  it("accepts a tag exactly 50 characters long", () => {
    const tag = "a".repeat(50);
    expect(gameSagaTagSchema.parse(tag)).toBe(tag);
  });

  it("rejects a tag over 50 characters", () => {
    expect(() => gameSagaTagSchema.parse("a".repeat(51))).toThrow();
  });

  it("rejects an empty tag", () => {
    expect(() => gameSagaTagSchema.parse("")).toThrow();
  });

  it("defaults to an empty array when omitted", () => {
    expect(gameSagaSchema.parse(undefined)).toEqual([]);
  });

  it("accepts multiple tags", () => {
    expect(gameSagaSchema.parse(["Mario", "Zelda"])).toEqual(["Mario", "Zelda"]);
  });
});

describe("getGameYearOptions", () => {
  it("returns years from the given current year down to 1985, newest first", () => {
    expect(getGameYearOptions(1988)).toEqual(["1988", "1987", "1986", "1985"]);
  });

  it("defaults to the current year when no argument is given", () => {
    const options = getGameYearOptions();
    expect(options[0]).toBe(String(new Date().getFullYear()));
    expect(options[options.length - 1]).toBe("1985");
  });
});

describe("mapBooleansToMediaStatus / mapMediaStatusToBooleans", () => {
  it("round-trips each media status", () => {
    (["incomplete", "complete", "new", "digital"] as const).forEach((status) => {
      const booleans = mapMediaStatusToBooleans(status);
      expect(mapBooleansToMediaStatus(booleans)).toBe(status);
    });
  });

  it("prioritizes new, then complete, then digital", () => {
    expect(
      mapBooleansToMediaStatus({ isNew: true, isComplete: true, isDigital: true })
    ).toBe("new");
    expect(
      mapBooleansToMediaStatus({ isNew: false, isComplete: true, isDigital: true })
    ).toBe("complete");
    expect(
      mapBooleansToMediaStatus({ isNew: false, isComplete: false, isDigital: true })
    ).toBe("digital");
  });

  it("falls back to incomplete when nothing is set", () => {
    expect(
      mapBooleansToMediaStatus({ isNew: false, isComplete: false, isDigital: false })
    ).toBe("incomplete");
  });
});

describe("resolveGameStatus", () => {
  it("prioritizes finished, then playing, then backlog", () => {
    expect(
      resolveGameStatus({ isFinished: true, isPlaying: true, isBacklog: true })
    ).toBe("COMPLETED");
    expect(
      resolveGameStatus({ isFinished: false, isPlaying: true, isBacklog: true })
    ).toBe("PLAYING");
    expect(
      resolveGameStatus({ isFinished: false, isPlaying: false, isBacklog: true })
    ).toBe("BACKLOG");
  });

  it("falls back to owned when nothing is set", () => {
    expect(
      resolveGameStatus({ isFinished: false, isPlaying: false, isBacklog: false })
    ).toBe("OWNED");
  });
});

describe("isDuplicateSagaTag", () => {
  it("detects a case-insensitive duplicate", () => {
    expect(isDuplicateSagaTag(["Mario"], "mario")).toBe(true);
  });

  it("returns false for a new tag", () => {
    expect(isDuplicateSagaTag(["Mario"], "Zelda")).toBe(false);
  });

  it("trims the candidate before comparing", () => {
    expect(isDuplicateSagaTag(["Mario"], "  Mario  ")).toBe(true);
  });
});

describe("toGameErrorMessage", () => {
  it("uses the first Zod issue message", () => {
    const result = gameTitleSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toGameErrorMessage(result.error, "fallback")).toBe("Title is required");
    }
  });

  it("falls back when a ZodError has no issues", () => {
    const error = new ZodError([]);
    expect(toGameErrorMessage(error, "fallback")).toBe("fallback");
  });

  it("uses a plain Error's message", () => {
    expect(toGameErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back for a non-Error value", () => {
    expect(toGameErrorMessage("nope", "fallback")).toBe("fallback");
  });
});
