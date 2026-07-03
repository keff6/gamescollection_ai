# Current Feature

## Status

In Progress

## Goals

Migrate legacy data from the existing MySQL database into the new Neon PostgreSQL database.

- Connect live to the running MySQL instance (via `MY_SQL_URL`) and read `brand`, `console`, `genre`, `game`, `game_x_genre` tables
- Generate fresh UUID primary keys for migrated rows and remap foreign keys via in-memory old-id → new-id maps
- Truncate target Postgres tables (FK-safe order) before importing so the script is safe to re-run, wrapped in a transaction
- Handle MySQL `tinyint(1)` → boolean, `Game.saga` JSON, and empty-string → null coercions
- Skip `User`/`Account`/`Session`/`VerificationToken` in this pass (NextAuth-only / password hash compatibility not yet confirmed)
- Verify row counts and spot-check relations (game → console → brand, game → genres) after import

## Notes

- Script lives at `scripts/migrate-mysql-legacy.ts`, run via `npm run migrate:legacy:dry` (dry run) and `npm run migrate:legacy` (real run)
- Legacy MySQL table/column names are assumed from the Prisma `@map` values — verify against the real DB via `--dry-run` before a real run
- Reference: `/home/kevin/.claude/plans/the-database-is-created-wild-finch.md`

## History

<!-- Keep this updated. Earliest to Latest -->

- **2026-07-03** — Set up Prisma 7 ORM with Neon PostgreSQL as the database layer: `schema.prisma` with `Brand`, `Console`, `Genre`, `Game`, `GameGenre`, `User` models plus NextAuth v5 `Account`/`Session`/`VerificationToken`; indexes and cascade deletes added; initial migration (`20260703170030_init`) created and verified against the Neon development branch.

