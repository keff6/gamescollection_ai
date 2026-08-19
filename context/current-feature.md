# Current Feature

## Status

Not Started

## Goals

<!-- What does success look like? -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## History

<!-- Keep this updated. Earliest to Latest -->

- **2026-07-03** — Set up Prisma 7 ORM with Neon PostgreSQL as the database layer: `schema.prisma` with `Brand`, `Console`, `Genre`, `Game`, `GameGenre`, `User` models plus NextAuth v5 `Account`/`Session`/`VerificationToken`; indexes and cascade deletes added; initial migration (`20260703170030_init`) created and verified against the Neon development branch.
- **2026-07-03** — Migrated legacy data from the MySQL database (Railway) into Neon PostgreSQL via `scripts/migrate-mysql-legacy.ts`: connected live to the `gamescollection` MySQL schema, carried over original UUID primary keys as-is (legacy IDs were already varchar(36) UUIDs), applied boolean/JSON/empty-string coercions, and fell back to console `name` for the ~20 rows with a missing `short_name`. Imported 7 brands, 27 consoles, 24 genres, 1504 games, and 2422 game-genre links; row counts and spot-checked relations verified. `User`/`Account`/`Session`/`VerificationToken` were left untouched.
- **2026-07-04** — Schema Review & Fixes: added `GameStatus` enum (`WISHLIST`, `BACKLOG`, `OWNED`, `PLAYING`, `COMPLETED`) and a `status @default(OWNED)` field to `Game`, replacing the 7 independent status booleans going forward (old boolean columns kept, non-destructive); added `rating Int?` (1-10, app-layer validated). `isDigital` and `isComplete` (clarified as "complete in box" condition, not a lifecycle stage) stay independent. Confirmed Brand→Console→Game cascade deletes were already correct. Ran `prisma migrate dev --name add-game-status-and-rating` against the Neon development branch and backfilled `status` for all 1504 existing rows from `isFinished`/`isPlaying` (1467 OWNED, 1 PLAYING, 36 COMPLETED) — verified zero mismatches post-backfill. Added `.nvmrc` pinning Node `25.6.1` since Prisma 7.8.0 requires newer than the local `20.11.1`.
- **2026-08-19** — App Shell & Navbar: built the root layout shell (`app/layout.tsx`) with a shared, responsive `Navbar` (`components/layout/Navbar.tsx`) and reusable `Breadcrumb` (`components/layout/Breadcrumb.tsx`), rendered on every route. Navbar links are Home and Brands only — mid-implementation, dropped the spec's separate "Dashboard" nav link/route since dashboard content will live at `/` (Home) per `project-overview.md` §6's actual route table. Nav collapses behind a hamburger button below the `md` breakpoint into a vertical mobile menu (not in the original spec/screenshots, added per user request); active-link state matches the current route (Brands stays active under both `/brands*` and `/consoles*`, since Games lives at `/consoles/[consoleId]` per the route table but the screenshots show it under the Brands flow). Log In/Log Out is stubbed via an `isLoggedIn` prop, defaulting to logged-out — real auth wiring is Phase 2. Dark theme tokens (background, card, border, muted-foreground, accent teal) defined once via Tailwind v4 `@theme` in `globals.css`. Verified with `npm run lint`, `npm run build`, and headless-Chromium screenshots at desktop/tablet/mobile widths (including the open mobile menu and post-navigation auto-close).
