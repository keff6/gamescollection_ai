import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { GamesList } from "@/components/games/GamesList";
import { getAllConsoles } from "@/lib/consoles";
import { GAMES_PAGE_SIZE, getConsoleGames, type GameSortKey } from "@/lib/games";
import { getAllGenres } from "@/lib/genres";

function parseSort(raw: string | string[] | undefined): GameSortKey {
  return raw === "year" || raw === "rating" ? raw : "title";
}

export default async function ConsoleGamesPage({
  params,
  searchParams,
}: {
  params: Promise<{ consoleId: string }>;
  searchParams: Promise<{ q?: string | string[]; sort?: string | string[] }>;
}) {
  const { consoleId } = await params;
  const { q, sort: sortParam } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const sort = parseSort(sortParam);
  const isLoggedIn = !!(await auth());

  let data;
  let genres;
  try {
    [data, genres] = await Promise.all([
      getConsoleGames(consoleId, { search, sort, skip: 0, take: GAMES_PAGE_SIZE }),
      getAllGenres(),
    ]);
  } catch (error) {
    console.error("Failed to load games:", error);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Games unavailable
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong loading this console. Try refreshing the page.
        </p>
      </div>
    );
  }

  if (!data) notFound();

  const { console: consoleInfo, totalGames, total, games } = data;
  const consoles = isLoggedIn ? await getAllConsoles() : [];

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        segments={[
          { label: "Brands", href: "/brands" },
          { label: "Consoles", href: `/brands/${consoleInfo.brandId}/consoles` },
          { label: "Games" },
        ]}
      />

      <GamesList
        key={`${search}-${sort}`}
        consoleId={consoleId}
        consoleName={consoleInfo.name}
        consoles={consoles}
        genres={genres}
        search={search}
        sort={sort}
        initialGames={games}
        initialTotal={total}
        initialTotalGames={totalGames}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
