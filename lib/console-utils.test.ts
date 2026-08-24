import { ZodError } from "zod";
import { describe, expect, it } from "vitest";
import {
  CONSOLE_GENERATIONS,
  consoleBrandIdSchema,
  consoleGenerationSchema,
  consoleNameSchema,
  consoleShortNameSchema,
  consoleYearSchema,
  getConsoleYearOptions,
  normalizeGenerationValue,
  sortConsolesByYear,
  toConsoleErrorMessage,
} from "@/lib/console-utils";

function consoleItem(id: string, year: string | null) {
  return { id, year };
}

describe("consoleNameSchema", () => {
  it("accepts a normal name", () => {
    expect(consoleNameSchema.parse("Xbox 360")).toBe("Xbox 360");
  });

  it("trims surrounding whitespace", () => {
    expect(consoleNameSchema.parse("  PlayStation  ")).toBe("PlayStation");
  });

  it("rejects an empty name", () => {
    expect(() => consoleNameSchema.parse("")).toThrow();
  });

  it("rejects a name that is only whitespace", () => {
    expect(() => consoleNameSchema.parse("   ")).toThrow();
  });

  it("accepts a name exactly 60 characters long", () => {
    const name = "a".repeat(60);
    expect(consoleNameSchema.parse(name)).toBe(name);
  });

  it("rejects a name over 60 characters", () => {
    expect(() => consoleNameSchema.parse("a".repeat(61))).toThrow();
  });
});

describe("consoleShortNameSchema", () => {
  it("accepts a normal short name", () => {
    expect(consoleShortNameSchema.parse("PS4")).toBe("PS4");
  });

  it("rejects an empty short name", () => {
    expect(() => consoleShortNameSchema.parse("")).toThrow();
  });

  it("accepts a short name exactly 30 characters long", () => {
    const shortName = "a".repeat(30);
    expect(consoleShortNameSchema.parse(shortName)).toBe(shortName);
  });

  it("rejects a short name over 30 characters", () => {
    expect(() => consoleShortNameSchema.parse("a".repeat(31))).toThrow();
  });
});

describe("consoleBrandIdSchema", () => {
  it("accepts a non-empty id", () => {
    expect(consoleBrandIdSchema.parse("brand-1")).toBe("brand-1");
  });

  it("rejects an empty id", () => {
    expect(() => consoleBrandIdSchema.parse("")).toThrow();
  });
});

describe("consoleYearSchema", () => {
  it("accepts a 4-digit year", () => {
    expect(consoleYearSchema.parse("1998")).toBe("1998");
  });

  it("treats an empty string as undefined", () => {
    expect(consoleYearSchema.parse("")).toBeUndefined();
  });

  it("treats undefined as undefined", () => {
    expect(consoleYearSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects a non 4-digit value", () => {
    expect(() => consoleYearSchema.parse("98")).toThrow();
  });
});

describe("consoleGenerationSchema", () => {
  it("accepts a generation label", () => {
    expect(consoleGenerationSchema.parse("7th (2004 - 2014)")).toBe(
      "7th (2004 - 2014)"
    );
  });

  it("treats an empty string as undefined", () => {
    expect(consoleGenerationSchema.parse("")).toBeUndefined();
  });
});

describe("CONSOLE_GENERATIONS", () => {
  it("has 9 generations in order", () => {
    expect(CONSOLE_GENERATIONS).toHaveLength(9);
    expect(CONSOLE_GENERATIONS.map((g) => g.value)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });
});

describe("getConsoleYearOptions", () => {
  it("returns years from the given current year down to 1970, newest first", () => {
    expect(getConsoleYearOptions(1973)).toEqual(["1973", "1972", "1971", "1970"]);
  });

  it("defaults to the current year when no argument is given", () => {
    const options = getConsoleYearOptions();
    expect(options[0]).toBe(String(new Date().getFullYear()));
    expect(options[options.length - 1]).toBe("1970");
  });
});

describe("normalizeGenerationValue", () => {
  it("returns an empty string for null or empty input", () => {
    expect(normalizeGenerationValue(null)).toBe("");
    expect(normalizeGenerationValue("")).toBe("");
  });

  it("maps a legacy bare-number generation to its full label", () => {
    expect(normalizeGenerationValue("1")).toBe("1st (1972 - 1978)");
    expect(normalizeGenerationValue("6")).toBe("6th (128 bits)");
  });

  it("passes through a value already stored as a full label", () => {
    expect(normalizeGenerationValue("6th (128 bits)")).toBe("6th (128 bits)");
  });

  it("returns an empty string for a value matching no known generation", () => {
    expect(normalizeGenerationValue("not a generation")).toBe("");
  });
});

describe("sortConsolesByYear", () => {
  it("sorts consoles by year ascending", () => {
    const consoles = [
      consoleItem("1", "2005"),
      consoleItem("2", "1994"),
      consoleItem("3", "2001"),
    ];
    expect(sortConsolesByYear(consoles).map((c) => c.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts consoles with no year to the end", () => {
    const consoles = [
      consoleItem("1", null),
      consoleItem("2", "1994"),
    ];
    expect(sortConsolesByYear(consoles).map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("does not mutate the input array", () => {
    const consoles = [consoleItem("1", "2005"), consoleItem("2", "1994")];
    sortConsolesByYear(consoles);
    expect(consoles.map((c) => c.id)).toEqual(["1", "2"]);
  });
});

describe("toConsoleErrorMessage", () => {
  it("uses the first Zod issue message", () => {
    const result = consoleNameSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toConsoleErrorMessage(result.error, "fallback")).toBe(
        "Name is required"
      );
    }
  });

  it("falls back when a ZodError has no issues", () => {
    const error = new ZodError([]);
    expect(toConsoleErrorMessage(error, "fallback")).toBe("fallback");
  });

  it("uses a plain Error's message", () => {
    expect(toConsoleErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back for a non-Error value", () => {
    expect(toConsoleErrorMessage("nope", "fallback")).toBe("fallback");
  });
});
