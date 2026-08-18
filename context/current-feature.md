# Current Feature

## Status

In Progress

## Goals

Schema Review & Fixes (see @context/feature/01-schema-review.md) — confirm the Prisma
schema supports every screen in the screenshots, and make two small changes before UI
work starts. Data-only task, no UI.

- Add a `rating` field (`Int?`, 1-10, app-layer validated) to `Game`
- Add a `GameStatus` enum (`WISHLIST`, `BACKLOG`, `OWNED`, `PLAYING`, `COMPLETED`) and a
  `status` field (`@default(OWNED)`) to `Game`, replacing the 7 independent booleans
  (`isNew`, `isComplete`, `isWishlist`, `isDigital`, `isFinished`, `isBacklog`,
  `isPlaying`) going forward — keep the old boolean columns for now (non-destructive),
  stop reading/writing them from new code
- `isDigital` stays as its own independent boolean (orthogonal to status)
- Confirm cascade behavior (Brand → Console → Game deletes) matches product expectations
- Run `npx prisma migrate dev --name add-game-status-and-rating` against the
  `development` branch (`br-dawn-lab-ahyhcal9`)
- Backfill `status` sensibly for existing rows based on the old booleans

Out of scope: `saga` field (untouched), cover image upload flow, NextAuth models
(already correct, no changes).

## Notes

- Decision confirmed: enum approach for `status` (not keeping the 7 booleans).
- `isComplete` clarified as "complete in box" (physical condition), not a play-lifecycle
  stage — it stays independent alongside `isDigital`/`isNew` and is NOT folded into
  `status`. Only `isFinished`→`COMPLETED` and `isPlaying`→`PLAYING` feed the backfill;
  no rows in the legacy data had `isWishlist`/`isBacklog` set.
- Cascade behavior already correct pre-existing: Brand→Console and Console→Game are both
  `onDelete: Cascade` in schema.prisma — no change needed.
- Local Node was v20.11.1, below Prisma 7.8.0's minimum (^20.19/22.12/24+), so
  `npm ci`/`prisma` CLI failed outright. Added `.nvmrc` pinning `25.6.1`; ran the
  migration under that version via nvm.

## History

<!-- Keep this updated. Earliest to Latest -->

- **2026-07-03** — Set up Prisma 7 ORM with Neon PostgreSQL as the database layer: `schema.prisma` with `Brand`, `Console`, `Genre`, `Game`, `GameGenre`, `User` models plus NextAuth v5 `Account`/`Session`/`VerificationToken`; indexes and cascade deletes added; initial migration (`20260703170030_init`) created and verified against the Neon development branch.
- **2026-07-03** — Migrated legacy data from the MySQL database (Railway) into Neon PostgreSQL via `scripts/migrate-mysql-legacy.ts`: connected live to the `gamescollection` MySQL schema, carried over original UUID primary keys as-is (legacy IDs were already varchar(36) UUIDs), applied boolean/JSON/empty-string coercions, and fell back to console `name` for the ~20 rows with a missing `short_name`. Imported 7 brands, 27 consoles, 24 genres, 1504 games, and 2422 game-genre links; row counts and spot-checked relations verified. `User`/`Account`/`Session`/`VerificationToken` were left untouched.

