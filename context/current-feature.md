# Current Feature: Dashboard

## Status

In Progress

## Goals

- Build the home route (`/`) as a read-only, at-a-glance overview of the whole collection
- 4 stat cards: Total Games, Completed (+% of total), Now Playing, Brands / Consoles ("4 / 23")
- "By Genre" pie chart (teal-toned palette, name + % labels) via `GameGenre` join, % of total genre-tag rows
- "By Platform" bar chart — games per console `shortName`, all consoles with ≥1 game
- "Games Condition" donut — one game bucketed into Digital > New > Complete > Incomplete (priority order), % in center, legend only shows present buckets
- "Top 5 Consoles by Games" horizontal bar chart — console full `name`, count desc, top 5, teal-monochrome (not multi-color like screenshot mockup)
- Layout: 2x2 stat grid, then two 2-column chart rows (By Genre/By Platform, then Games Condition/Top 5 Consoles)
- Handle loading (skeletons), empty (zero games), and error (DB failure) states gracefully without crashing
- Page is read-only — links out to brands/consoles/games for management, no editing here

## Notes

- Source spec: `context/feature/03-dashboard.md`
- Setup work included in this feature: install `recharts` (not yet installed); run `npx shadcn init` + add `card` component (shadcn not yet initialized, no `components.json`)
- Brands/Consoles stat = plain totals (all brands, all consoles), NOT filtered to "has ≥1 game"
- No separate GameStatus (Wishlist/Backlog/etc.) breakdown section — resolved as not needed, page ends after the 4 chart cards
- Games Condition bucket priority is strict: `isDigital` > `isNew` > `isComplete` > else Incomplete
- Depends on: `00-schema-review.md`, `01-seed-data.md`, `02-app-shell-navbar.md` (all already done per History below)
- Reference screenshots: `context/screenshots/dashboard.png` (stat cards + row 1), `dashboard-2.png` (row 2)
- Deviation from spec: "By Platform" bars are sorted by console `year` ascending (oldest → newest), not count desc as the original acceptance criteria stated — changed per explicit user request after initial implementation. Consoles with an unparseable/missing `year` sort last.
- Added Vitest (`vitest.config.mts`, `npm test`) — first test runner in the repo, since CLAUDE.md previously said none was configured. `npm test` requires Node ≥ the `.nvmrc`-pinned `25.6.1` (vitest's rolldown bundler needs a `node:util` export not present in the local default `20.11.1`) — same constraint that was already true for Prisma. Extracted the dashboard's aggregation logic (`buildGenreBreakdown`, `buildPlatformBreakdown`, `buildTop5Consoles`, `buildConditionBreakdown`, `bucketCondition`) out of `getDashboardStats` into pure, individually-exported functions in `lib/dashboard.ts` so they're unit-testable without mocking Prisma; behavior is unchanged. 24 unit tests added across `lib/dashboard.test.ts` and `lib/chart-colors.test.ts`, all passing.

## History

<!-- Keep this updated. Earliest to Latest -->

- **2026-07-03** — Set up Prisma 7 ORM with Neon PostgreSQL as the database layer: `schema.prisma` with `Brand`, `Console`, `Genre`, `Game`, `GameGenre`, `User` models plus NextAuth v5 `Account`/`Session`/`VerificationToken`; indexes and cascade deletes added; initial migration (`20260703170030_init`) created and verified against the Neon development branch.
- **2026-07-03** — Migrated legacy data from the MySQL database (Railway) into Neon PostgreSQL via `scripts/migrate-mysql-legacy.ts`: connected live to the `gamescollection` MySQL schema, carried over original UUID primary keys as-is (legacy IDs were already varchar(36) UUIDs), applied boolean/JSON/empty-string coercions, and fell back to console `name` for the ~20 rows with a missing `short_name`. Imported 7 brands, 27 consoles, 24 genres, 1504 games, and 2422 game-genre links; row counts and spot-checked relations verified. `User`/`Account`/`Session`/`VerificationToken` were left untouched.
- **2026-07-04** — Schema Review & Fixes: added `GameStatus` enum (`WISHLIST`, `BACKLOG`, `OWNED`, `PLAYING`, `COMPLETED`) and a `status @default(OWNED)` field to `Game`, replacing the 7 independent status booleans going forward (old boolean columns kept, non-destructive); added `rating Int?` (1-10, app-layer validated). `isDigital` and `isComplete` (clarified as "complete in box" condition, not a lifecycle stage) stay independent. Confirmed Brand→Console→Game cascade deletes were already correct. Ran `prisma migrate dev --name add-game-status-and-rating` against the Neon development branch and backfilled `status` for all 1504 existing rows from `isFinished`/`isPlaying` (1467 OWNED, 1 PLAYING, 36 COMPLETED) — verified zero mismatches post-backfill. Added `.nvmrc` pinning Node `25.6.1` since Prisma 7.8.0 requires newer than the local `20.11.1`.
- **2026-08-19** — App Shell & Navbar: built the root layout shell (`app/layout.tsx`) with a shared, responsive `Navbar` (`components/layout/Navbar.tsx`) and reusable `Breadcrumb` (`components/layout/Breadcrumb.tsx`), rendered on every route. Navbar links are Home and Brands only — mid-implementation, dropped the spec's separate "Dashboard" nav link/route since dashboard content will live at `/` (Home) per `project-overview.md` §6's actual route table. Nav collapses behind a hamburger button below the `md` breakpoint into a vertical mobile menu (not in the original spec/screenshots, added per user request); active-link state matches the current route (Brands stays active under both `/brands*` and `/consoles*`, since Games lives at `/consoles/[consoleId]` per the route table but the screenshots show it under the Brands flow). Log In/Log Out is stubbed via an `isLoggedIn` prop, defaulting to logged-out — real auth wiring is Phase 2. Dark theme tokens (background, card, border, muted-foreground, accent teal) defined once via Tailwind v4 `@theme` in `globals.css`. Verified with `npm run lint`, `npm run build`, and headless-Chromium screenshots at desktop/tablet/mobile widths (including the open mobile menu and post-navigation auto-close).
