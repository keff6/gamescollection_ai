import "dotenv/config";
import mysql from "mysql2/promise";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client";

/**
 * One-off migration: copies Brand/Console/Genre/Game/GameGenre rows from the
 * legacy MySQL database (gamescollection schema on Railway) into the new
 * Neon Postgres database.
 *
 * Legacy table/column names (verified against the live DB) match the
 * Prisma @map directives exactly:
 *
 *   brand(id, name, origin, logourl)
 *   console(id, name, short_name, id_brand, year, generation, is_portable, logourl, consoleurl)
 *   genre(id, name)
 *   game(id, title, id_console, saga, year, developer, publisher, is_new,
 *        is_complete, is_wishlist, is_digital, notes, coverurl, is_finished,
 *        is_backlog, is_playing)
 *   game_x_genre(id, id_game, id_genre)
 *
 * Legacy primary keys are already varchar(36) UUID strings, so they are
 * carried over as-is — no new IDs are generated and no FK remapping is
 * needed. game_x_genre.id is dropped (Postgres assigns a fresh serial).
 *
 * User/Account/Session/VerificationToken are intentionally NOT touched.
 *
 * Usage:
 *   npm run migrate:legacy:dry   # read + transform only, no writes
 *   npm run migrate:legacy       # truncates target tables and imports for real
 */

const DRY_RUN = process.argv.includes("--dry-run");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toBool(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (Buffer.isBuffer(v)) return v[0] !== 0;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return null;
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return v === "" ? null : v;
}

function parseSaga(v: unknown, legacyGameId: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (v === null || v === undefined) return Prisma.JsonNull;
  if (typeof v === "object") return v as Prisma.InputJsonValue;
  if (typeof v === "string") {
    if (v === "") return Prisma.JsonNull;
    try {
      return JSON.parse(v) as Prisma.InputJsonValue;
    } catch {
      console.warn(`Could not parse saga JSON for legacy game id=${legacyGameId}, preserving raw string`);
      return { raw: v };
    }
  }
  return Prisma.JsonNull;
}

type LegacyRow = Record<string, unknown>;

async function main() {
  const mysqlUrl = requireEnv("MY_SQL_PUBLIC_URL");
  const databaseUrl = requireEnv("DATABASE_URL");

  const conn = await mysql.createConnection(mysqlUrl);
  await conn.query("USE gamescollection");
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(DRY_RUN ? "Running in --dry-run mode (no writes)\n" : "Running real migration\n");

    const [brandRows] = await conn.query<mysql.RowDataPacket[]>("SELECT * FROM brand");
    const [consoleRows] = await conn.query<mysql.RowDataPacket[]>("SELECT * FROM console");
    const [genreRows] = await conn.query<mysql.RowDataPacket[]>("SELECT * FROM genre");
    const [gameRows] = await conn.query<mysql.RowDataPacket[]>("SELECT * FROM game");
    const [gameGenreRows] = await conn.query<mysql.RowDataPacket[]>("SELECT * FROM game_x_genre");

    console.log("Legacy row counts:");
    console.log(`  brand: ${brandRows.length}`);
    console.log(`  console: ${consoleRows.length}`);
    console.log(`  genre: ${genreRows.length}`);
    console.log(`  game: ${gameRows.length}`);
    console.log(`  game_x_genre: ${gameGenreRows.length}\n`);

    if (DRY_RUN) {
      for (const [label, rows] of [
        ["brand", brandRows],
        ["console", consoleRows],
        ["genre", genreRows],
        ["game", gameRows],
        ["game_x_genre", gameGenreRows],
      ] as const) {
        if (rows.length > 0) {
          console.log(`Sample ${label} row:`, rows[0]);
          if (label === "game") {
            console.log("  typeof saga:", typeof rows[0].saga);
            console.log("  typeof is_new:", typeof rows[0].is_new, rows[0].is_new);
          }
        }
      }
    }

    // --- Transform phase (legacy IDs are already UUID strings, carried over as-is) ---
    const brandData = (brandRows as LegacyRow[]).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      origin: emptyToNull(row.origin as string | null),
      logoUrl: emptyToNull(row.logourl as string | null),
    }));

    const consoleData = (consoleRows as LegacyRow[]).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      shortName: emptyToNull(row.short_name as string | null) ?? (row.name as string),
      brandId: row.id_brand as string,
      year: emptyToNull(row.year as string | null),
      generation: emptyToNull(row.generation as string | null),
      isPortable: toBool(row.is_portable),
      logoUrl: emptyToNull(row.logourl as string | null),
      consoleUrl: emptyToNull(row.consoleurl as string | null),
    }));

    const genreData = (genreRows as LegacyRow[]).map((row) => ({
      id: row.id as string,
      name: row.name as string,
    }));

    const gameData = (gameRows as LegacyRow[]).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      consoleId: row.id_console as string,
      saga: parseSaga(row.saga, row.id),
      year: emptyToNull(row.year as string | null),
      developer: emptyToNull(row.developer as string | null),
      publisher: emptyToNull(row.publisher as string | null),
      isNew: toBool(row.is_new),
      isComplete: toBool(row.is_complete),
      isWishlist: toBool(row.is_wishlist),
      isDigital: toBool(row.is_digital),
      notes: emptyToNull(row.notes as string | null),
      coverUrl: emptyToNull(row.coverurl as string | null),
      isFinished: toBool(row.is_finished),
      isBacklog: toBool(row.is_backlog),
      isPlaying: toBool(row.is_playing),
    }));

    const gameGenreData = (gameGenreRows as LegacyRow[]).map((row) => ({
      gameId: row.id_game as string,
      genreId: row.id_genre as string,
    }));

    if (DRY_RUN) {
      console.log("\nDry run complete. No data was written. Review the assumptions above, then run:");
      console.log("  npm run migrate:legacy");
      return;
    }

    // --- Write phase ---
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          `TRUNCATE TABLE "game_x_genre", "game", "console", "genre", "brand" RESTART IDENTITY;`
        );

        const CHUNK_SIZE = 500;
        const chunk = <T>(arr: T[]): T[][] => {
          const out: T[][] = [];
          for (let i = 0; i < arr.length; i += CHUNK_SIZE) out.push(arr.slice(i, i + CHUNK_SIZE));
          return out;
        };

        for (const batch of chunk(brandData)) await tx.brand.createMany({ data: batch });
        for (const batch of chunk(consoleData)) await tx.console.createMany({ data: batch });
        for (const batch of chunk(genreData)) await tx.genre.createMany({ data: batch });
        for (const batch of chunk(gameData)) await tx.game.createMany({ data: batch });
        for (const batch of chunk(gameGenreData)) await tx.gameGenre.createMany({ data: batch });
      },
      { timeout: 120_000, maxWait: 15_000 }
    );

    console.log("Write phase complete.\n");

    // --- Verification phase ---
    const pgCounts = {
      brand: await prisma.brand.count(),
      console: await prisma.console.count(),
      genre: await prisma.genre.count(),
      game: await prisma.game.count(),
      gameGenre: await prisma.gameGenre.count(),
    };

    console.log("Row count comparison (legacy MySQL -> Postgres):");
    console.log(`  brand:        ${brandRows.length} -> ${pgCounts.brand}`);
    console.log(`  console:      ${consoleRows.length} -> ${pgCounts.console}`);
    console.log(`  genre:        ${genreRows.length} -> ${pgCounts.genre}`);
    console.log(`  game:         ${gameRows.length} -> ${pgCounts.game}`);
    console.log(`  game_x_genre: ${gameGenreRows.length} -> ${pgCounts.gameGenre}\n`);

    const mismatches: string[] = [];
    if (pgCounts.brand !== brandRows.length) mismatches.push("brand");
    if (pgCounts.console !== consoleRows.length) mismatches.push("console");
    if (pgCounts.genre !== genreRows.length) mismatches.push("genre");
    if (pgCounts.game !== gameRows.length) mismatches.push("game");

    console.log("Spot-checking a few migrated games:");
    const sampleLegacyGames = (gameRows as LegacyRow[]).slice(0, 5);
    for (const legacyGame of sampleLegacyGames) {
      const migrated = await prisma.game.findUnique({
        where: { id: legacyGame.id as string },
        include: { console: { include: { brand: true } }, genres: { include: { genre: true } } },
      });
      console.log(
        `  legacy game id=${legacyGame.id} title="${legacyGame.title}" ->`,
        migrated
          ? {
              title: migrated.title,
              console: migrated.console.name,
              brand: migrated.console.brand.name,
              genres: migrated.genres.map((g) => g.genre.name),
            }
          : "NOT FOUND"
      );
    }

    if (mismatches.length > 0) {
      console.error(`\nFAIL: row count mismatch in: ${mismatches.join(", ")}`);
      process.exitCode = 1;
    } else {
      console.log("\nPASS: all row counts match.");
    }
  } finally {
    await conn.end();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
