import { describe, expect, it } from "vitest";
import { sortGames, type GameListItem } from "@/lib/games";

function game(overrides: Partial<GameListItem>): GameListItem {
  return {
    id: overrides.id ?? "id",
    title: "Untitled",
    consoleId: "console-1",
    year: null,
    rating: null,
    developer: null,
    publisher: null,
    notes: null,
    saga: [],
    genreIds: [],
    genres: [],
    isNew: false,
    isComplete: false,
    isDigital: false,
    isBacklog: false,
    isPlaying: false,
    isFinished: false,
    ...overrides,
  };
}

describe("sortGames", () => {
  it("sorts by title alphabetically", () => {
    const games = [
      game({ id: "1", title: "Zelda" }),
      game({ id: "2", title: "Astro Bot" }),
      game({ id: "3", title: "Metroid" }),
    ];
    expect(sortGames(games, "title").map((g) => g.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts by year ascending, treating missing/unparseable years as last", () => {
    const games = [
      game({ id: "1", title: "A", year: "2005" }),
      game({ id: "2", title: "B", year: null }),
      game({ id: "3", title: "C", year: "1998" }),
      game({ id: "4", title: "D", year: "" }),
    ];
    expect(sortGames(games, "year").map((g) => g.id)).toEqual(["3", "1", "2", "4"]);
  });

  it("sorts by rating descending, treating unrated games as lowest", () => {
    const games = [
      game({ id: "1", title: "A", rating: 5 }),
      game({ id: "2", title: "B", rating: null }),
      game({ id: "3", title: "C", rating: 9 }),
    ];
    expect(sortGames(games, "rating").map((g) => g.id)).toEqual(["3", "1", "2"]);
  });

  it("does not mutate the input array", () => {
    const games = [game({ id: "1", title: "B" }), game({ id: "2", title: "A" })];
    const original = [...games];
    sortGames(games, "title");
    expect(games).toEqual(original);
  });
});
