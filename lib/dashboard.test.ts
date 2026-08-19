import { describe, expect, it } from "vitest";
import {
  bucketCondition,
  buildConditionBreakdown,
  buildGenreBreakdown,
  buildPlatformBreakdown,
  buildTop5Consoles,
} from "@/lib/dashboard";

describe("bucketCondition", () => {
  it("prioritizes isDigital over everything else", () => {
    expect(
      bucketCondition({ isDigital: true, isNew: true, isComplete: true }),
    ).toBe("Digital");
  });

  it("prioritizes isNew over isComplete", () => {
    expect(
      bucketCondition({ isDigital: false, isNew: true, isComplete: true }),
    ).toBe("New");
  });

  it("falls back to Complete when only isComplete is set", () => {
    expect(
      bucketCondition({ isDigital: false, isNew: false, isComplete: true }),
    ).toBe("Complete");
  });

  it("falls back to Incomplete when nothing is set", () => {
    expect(
      bucketCondition({ isDigital: false, isNew: false, isComplete: false }),
    ).toBe("Incomplete");
  });

  it("treats null flags as falsy", () => {
    expect(
      bucketCondition({ isDigital: null, isNew: null, isComplete: null }),
    ).toBe("Incomplete");
  });
});

describe("buildGenreBreakdown", () => {
  it("computes percentages against total genre links, not slice count", () => {
    const result = buildGenreBreakdown([
      { name: "Action", _count: { games: 3 } },
      { name: "RPG", _count: { games: 1 } },
    ]);
    expect(result).toEqual([
      { name: "Action", count: 3, percent: 75 },
      { name: "RPG", count: 1, percent: 25 },
    ]);
  });

  it("excludes genres with zero games", () => {
    const result = buildGenreBreakdown([
      { name: "Action", _count: { games: 5 } },
      { name: "Unused", _count: { games: 0 } },
    ]);
    expect(result.map((g) => g.name)).toEqual(["Action"]);
  });

  it("sorts descending by count", () => {
    const result = buildGenreBreakdown([
      { name: "RPG", _count: { games: 1 } },
      { name: "Action", _count: { games: 5 } },
    ]);
    expect(result.map((g) => g.name)).toEqual(["Action", "RPG"]);
  });

  it("folds genres beyond maxSlices into a single Other bucket", () => {
    const genres = Array.from({ length: 9 }, (_, i) => ({
      name: `Genre${i}`,
      _count: { games: 9 - i },
    }));
    const result = buildGenreBreakdown(genres, 7);
    expect(result).toHaveLength(8);
    expect(result[7].name).toBe("Other");
    // Genre7 (count 2) + Genre8 (count 1) folded into Other
    expect(result[7].count).toBe(3);
  });

  it("omits the Other bucket when everything fits within maxSlices", () => {
    const result = buildGenreBreakdown(
      [{ name: "Action", _count: { games: 1 } }],
      7,
    );
    expect(result.some((g) => g.name === "Other")).toBe(false);
  });

  it("returns an empty array and 0% for no data", () => {
    expect(buildGenreBreakdown([])).toEqual([]);
  });
});

describe("buildPlatformBreakdown", () => {
  it("sorts by earliest console year ascending", () => {
    const result = buildPlatformBreakdown([
      { name: "PS4", shortName: "PS4", year: "2013", _count: { games: 5 } },
      { name: "NES", shortName: "NES", year: "1985", _count: { games: 2 } },
      {
        name: "Switch",
        shortName: "Switch",
        year: "2017",
        _count: { games: 1 },
      },
    ]);
    expect(result.map((p) => p.shortName)).toEqual(["NES", "PS4", "Switch"]);
  });

  it("sums counts for consoles sharing a shortName, using the earliest year", () => {
    const result = buildPlatformBreakdown([
      {
        name: "PS4 Pro",
        shortName: "PS4",
        year: "2016",
        _count: { games: 3 },
      },
      { name: "PS4", shortName: "PS4", year: "2013", _count: { games: 5 } },
    ]);
    expect(result).toEqual([{ shortName: "PS4", count: 8 }]);
  });

  it("sorts consoles with missing/unparseable year to the end", () => {
    const result = buildPlatformBreakdown([
      {
        name: "Mystery",
        shortName: "???",
        year: null,
        _count: { games: 1 },
      },
      { name: "NES", shortName: "NES", year: "1985", _count: { games: 2 } },
    ]);
    expect(result.map((p) => p.shortName)).toEqual(["NES", "???"]);
  });

  it("returns an empty array for no consoles", () => {
    expect(buildPlatformBreakdown([])).toEqual([]);
  });
});

describe("buildTop5Consoles", () => {
  it("sorts by count desc and limits to 5", () => {
    const consoles = Array.from({ length: 7 }, (_, i) => ({
      name: `Console${i}`,
      shortName: `C${i}`,
      year: "2000",
      _count: { games: i },
    }));
    const result = buildTop5Consoles(consoles);
    expect(result).toHaveLength(5);
    expect(result.map((c) => c.count)).toEqual([6, 5, 4, 3, 2]);
  });

  it("returns fewer than 5 entries when fewer consoles exist", () => {
    const result = buildTop5Consoles([
      { name: "Only", shortName: "O", year: "2000", _count: { games: 1 } },
    ]);
    expect(result).toEqual([{ name: "Only", count: 1 }]);
  });
});

describe("buildConditionBreakdown", () => {
  it("buckets and computes percentages against total games", () => {
    const games = [
      { isDigital: true, isNew: false, isComplete: false },
      { isDigital: false, isNew: true, isComplete: false },
      { isDigital: false, isNew: false, isComplete: true },
      { isDigital: false, isNew: false, isComplete: false },
    ];
    const result = buildConditionBreakdown(games, 4);
    expect(result).toEqual([
      { label: "Complete", count: 1, percent: 25 },
      { label: "Digital", count: 1, percent: 25 },
      { label: "Incomplete", count: 1, percent: 25 },
      { label: "New", count: 1, percent: 25 },
    ]);
  });

  it("only lists buckets that are actually present", () => {
    const games = [{ isDigital: false, isNew: false, isComplete: true }];
    const result = buildConditionBreakdown(games, 1);
    expect(result).toEqual([{ label: "Complete", count: 1, percent: 100 }]);
  });

  it("returns an empty array for no games", () => {
    expect(buildConditionBreakdown([], 0)).toEqual([]);
  });
});
