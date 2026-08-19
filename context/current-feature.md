# Current Feature: App Shell & Navbar

## Status

In Progress

## Goals

- Root layout (`src/app/layout.tsx`) and shared navbar built before any page-specific content exists
- Navbar renders identically across all routes with correct active-link highlighting (Home / Brands — Home doubles as the dashboard route, no separate `/dashboard` link)
- Navbar is responsive: nav links + auth action collapse behind a hamburger button below `md`, expanding into a vertical mobile menu
- Right side shows Log In (logged out) or Log Out (logged in) with icon — stubbed/hardcoded for now, no real auth yet
- Breadcrumb component exists, accepts `{ label, href? }` segments (last segment = current page, no href)
- Global theme tokens (colors, fonts, spacing) defined once via Tailwind v4 `@theme` block in `globals.css` — no ad-hoc hex codes in components
- `npm run dev` shows a styled shell with working nav links and no console errors, at both desktop and mobile widths

## Notes

- Spec: `context/feature/02-app-shell-navbar.md`
- In scope: root layout, navbar component, theme tokens, breadcrumb component (reused by consoles/games pages)
- Out of scope: page-specific content (Phase 1), real auth logic (Phase 2) — navbar auth state stubbed, default to "Log In" shown
- Reference screenshots (all five, navbar identical across them): dashboard, brands, consoles, games, forms
- Theme tokens sampled from screenshots:
  - Background: near-black, `#0a0e14`–`#0d1117`
  - Accent (buttons, active nav link, chart bars/slices, focus rings): teal, `#2dd4bf`–`#5eead4`
  - Card background: slightly lighter than page bg, subtle border (`#1f2937`-ish), rounded-lg/xl
  - Text: white/near-white headings, muted gray (`#94a3b8`-ish) secondary text
  - Font: Geist (already loaded in `layout.tsx`) — reuse, no new font
- Navbar layout: logo (teal controller icon) + "Games Collection" wordmark (bold) — Home/Brands links, active in teal with pill background — Log In/Log Out right-aligned with icon — thin bottom border
- Breadcrumb format: `Brands / Consoles / Games`, teal for clickable ancestor segments, white/bold for current page, sits above page `<h1>`
- No dependencies — can start immediately, parallel to specs `00`/`01`
- Open question: confirm exact teal hex/font if design tokens exist elsewhere (Figma); otherwise sampled ranges above are close enough to start
- **2026-08-19 revision (mid-implementation):** dropped the separate `/dashboard` route/nav link — dashboard content will live at `/` (Home) per the actual route table in `project-overview.md` §6, so the screenshots' "Home" + "Dashboard" pair collapses to a single "Home" link. Also added a responsive hamburger menu (collapses nav links + auth action below the `md` breakpoint) since the original spec/screenshots only covered desktop widths.

## History

<!-- Keep this updated. Earliest to Latest -->

- **2026-07-03** — Set up Prisma 7 ORM with Neon PostgreSQL as the database layer: `schema.prisma` with `Brand`, `Console`, `Genre`, `Game`, `GameGenre`, `User` models plus NextAuth v5 `Account`/`Session`/`VerificationToken`; indexes and cascade deletes added; initial migration (`20260703170030_init`) created and verified against the Neon development branch.
- **2026-07-03** — Migrated legacy data from the MySQL database (Railway) into Neon PostgreSQL via `scripts/migrate-mysql-legacy.ts`: connected live to the `gamescollection` MySQL schema, carried over original UUID primary keys as-is (legacy IDs were already varchar(36) UUIDs), applied boolean/JSON/empty-string coercions, and fell back to console `name` for the ~20 rows with a missing `short_name`. Imported 7 brands, 27 consoles, 24 genres, 1504 games, and 2422 game-genre links; row counts and spot-checked relations verified. `User`/`Account`/`Session`/`VerificationToken` were left untouched.
- **2026-07-04** — Schema Review & Fixes: added `GameStatus` enum (`WISHLIST`, `BACKLOG`, `OWNED`, `PLAYING`, `COMPLETED`) and a `status @default(OWNED)` field to `Game`, replacing the 7 independent status booleans going forward (old boolean columns kept, non-destructive); added `rating Int?` (1-10, app-layer validated). `isDigital` and `isComplete` (clarified as "complete in box" condition, not a lifecycle stage) stay independent. Confirmed Brand→Console→Game cascade deletes were already correct. Ran `prisma migrate dev --name add-game-status-and-rating` against the Neon development branch and backfilled `status` for all 1504 existing rows from `isFinished`/`isPlaying` (1467 OWNED, 1 PLAYING, 36 COMPLETED) — verified zero mismatches post-backfill. Added `.nvmrc` pinning Node `25.6.1` since Prisma 7.8.0 requires newer than the local `20.11.1`.
