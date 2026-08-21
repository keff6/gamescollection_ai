# PRD: GamesCollection

**Status:** Draft
**Owner:** (you)
**Last updated:** 2026-08-21

---

## 1. Summary

GamesCollection is a personal web app for cataloging a physical/digital video game
collection — organized by brand → console → game — with a dashboard for at-a-glance
stats and a simple admin area for managing the catalog. Single-user, no public sign-up.

## 2. Problem statement

Tracking a game collection across spreadsheets or memory doesn't scale and gives no
visibility into the shape of the collection (what's owned vs. wishlisted, genre spread,
platform spread, completion progress). This app replaces that with a structured,
browsable, self-hosted catalog.

## 3. Goals

- Browse the full collection by Brand → Console → Game, matching the reference UI
- See collection-wide stats (totals, completion %, genre/platform breakdown) on a dashboard
- Add/edit/delete brands, consoles, games, and genres through an admin area
- Gate write actions behind a simple login (single user, no public registration)
- Ship a clean, dark-themed, responsive UI matching the provided screenshots

## 4. Non-goals (explicitly out of scope for v1)

- Multi-user support, roles/permissions, public registration, or social features
  (sharing, following other collectors, etc.)
- Cover-image upload/hosting pipeline — `coverUrl` exists on `Game` but populating it
  is not part of v1's UI (may be pasted-URL only, or deferred entirely)
- Barcode scanning, third-party catalog import (e.g. IGDB/MobyGames sync), or price
  tracking/valuation
- The `saga` field's use case (game series grouping) — present in the schema, no
  UI defined for it yet
- Mobile native app — responsive web only
- Automated tests / CI — no test runner is configured yet per `CLAUDE.md`; add later
  if desired, not required for v1

## 5. Target user

One person: the collection owner. The app is built for personal use, not for
distribution to other collectors. "Auth" exists only to gate destructive actions
(add/edit/delete) behind a login on a device someone else might use — it's not a
security boundary against the internet at large.

## 6. Scope / Feature list

| Area | Description | Auth required |
|---|---|---|
| Dashboard (`/`) | Stats + charts overview of the collection | No (view only) |
| Brands (`/brands`) | Card grid of all brands, links to consoles; add/edit/delete a brand in place | View: no. Add/edit/delete: yes |
| Consoles (`/brands/[brandId]/consoles`) | Consoles for a brand, filterable by type; add/edit/delete a console in place | View: no. Add/edit/delete: yes |
| Games (`/consoles/[consoleId]/games`) | Games for a console, search/sort, add/edit/delete modal | View: no. Add/edit/delete: yes |
| Login (`/login`) | Single-user credential login | N/A |
| Admin (`/admin/genres`) | Genre CRUD only — reached via a "Genre" item under the Navbar's Admin dropdown | Yes, all actions |
| Navbar | Home / Brands / Admin (dropdown → Genre) / logged-in-user indicator, present on every page | N/A |

## 7. User stories

- As the collection owner, I can see a dashboard summarizing my whole collection so I
  know its size and shape without digging through pages.
- As the collection owner, I can drill from a brand into its consoles into its games,
  so I can browse the way I naturally think about my shelf.
- As the collection owner, I can search and sort games within a console so I can find
  a specific title quickly as the list grows.
- As the collection owner, I can log in and add/edit/delete a game (with status, rating,
  genre, developer/publisher, notes) so my catalog stays accurate over time.
- As the collection owner, I can add/edit/delete brands and consoles directly from their
  browse pages, and manage genres from a small admin table, so I'm not limited to
  whatever was in the seed data.
- As the collection owner, if I'm not logged in, I can still browse everything — I just
  can't change anything.

## 8. Functional requirements

### 8.1 Browsing (public, no auth)
- Brands page lists every brand with its console count
- Consoles page lists a brand's consoles, filterable by Home/Portable, with each
  console's game count
- Games page lists a console's games with search-by-title and sort (Title/Year/Rating)
- All pages show correct empty states when there's no data yet

### 8.2 Dashboard (public, no auth)
- Total games, completed count (+ %), now-playing count, brand/console counts
- Genre breakdown (pie chart), platform breakdown (bar chart)
- Status breakdown (Wishlist/Backlog/Owned/Playing/Completed)

### 8.3 Authentication
- Single seeded user, username + password login via NextAuth Credentials provider
- Session persists across page reloads until logout
- Logged-out users attempting a write action are redirected to `/login`

### 8.4 CRUD
- Full create/read/update/delete for Brand, Console, Game, Genre — but CRUD lives in two
  different places depending on the entity:
  - **Brand, Console, Game** — CRUD happens in place on their existing browse pages
    (`/brands`, `/brands/[brandId]/consoles`, `/consoles/[consoleId]/games`), not under
    `/admin`. Each page gets an "Add" button (already stubbed) plus, for logged-in users,
    an edit action per card and a "Delete" action per card with a confirmation modal
    before it fires.
  - **Genre** — the only entity with a real admin page, at `/admin/genres`, since it's a
    single-field (`name`) entity best managed as a simple editable table rather than a
    modal-per-row: existing genres are edited inline in the table, "Add" appends a new
    inline row to fill in, and each row gets a "Delete" action with a confirmation modal.
- Game create/edit reuses the Add Game modal (title, genre(s), status, year, rating,
  developer, publisher, notes)
- Deleting a Brand cascades to its Consoles and their Games (already enforced at the DB
  level via `onDelete: Cascade`) — UI must confirm this destructive action before it fires
- All Add/Edit/Delete controls (on the browse pages and on `/admin/genres`) are visible
  only to logged-in users; deletes always require a confirmation modal before they fire

### 8.5 Navbar
- Present on every route: logo/wordmark, Home/Brands/Dashboard links, login state
  indicator, Log In/Log Out action
- Admin link is a dropdown, visible once logged in; today it has a single item, "Genre",
  linking to `/admin/genres`

## 9. Data model (summary)

Already implemented in Prisma (Postgres via Neon), see `schema.prisma`:
`Brand` → `Console` → `Game` ← (many-to-many) → `Genre` via `GameGenre`; `User` with
NextAuth `Account`/`Session`/`VerificationToken` support.

**v1 migration required:** add `status` (`GameStatus` enum) and `rating` (`Int?`) to
`Game` — see `specs/00-schema-review.md` for the exact change and the reasoning
(replaces 7 overlapping booleans with one authoritative status).

## 10. Non-functional requirements

- **Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Prisma, shadcn, react-hook-form, zod,
  Postgres (Neon) — per `CLAUDE.md`
- **Performance:** no specific target (personal-scale data, low hundreds of rows) —
  standard Next.js server-rendering is sufficient, no special caching/pagination
  strategy needed at this scale
- **Accessibility:** modal (Add/Edit Game) must be keyboard-operable (Esc to close,
  focus trapped) — no broader a11y audit scoped for v1
- **Browser support:** modern evergreen browsers only
- **Deployment:** Vercel

## 11. Success criteria

Since this is a personal tool, "success" is functional completeness against the
screenshots and feature list, not growth/engagement metrics:

- All five reference screens (dashboard, brands, consoles, games, add-game form) are
  implemented and visually match the provided designs
- Full CRUD works for all four entities: Brand/Console/Game in place on their browse
  pages, Genre via `/admin/genres`
- Login gates write actions correctly; browsing works fully logged-out
- The owner actually uses it to replace their existing tracking method

## 12. Open questions

Carried over from spec review — resolve before or during implementation:

1. ~~Keep `Game`'s 7 status booleans, or migrate to a single `status` enum?~~ Resolved —
   migrated, see `specs/00-schema-review.md`.
2. Genre field on the Add Game form: single-select or multi-select? (game cards display
   multiple genres, so schema supports many-to-many already)
3. ~~Are "Add Brand/Console/Game" buttons hidden for logged-out users, or shown but
   redirect to login?~~ Resolved — hidden for logged-out users, matching the existing
   `isLoggedIn`-gated stub already in place on the brands/consoles/games pages.
4. What does the "4 / 23" Brands/Consoles dashboard stat actually mean (brands *with
   games* vs. total brands)?
5. What is the `saga` field for, and does it need UI in v1 or a later phase?
6. Deployment target — Vercel.

## 13. Milestones

See `ROADMAP.md` for the full phased task breakdown. Summary:

1. **Foundation** — schema fixes, seed data, app shell/navbar
2. **Public browsing** — dashboard, brands, consoles, games pages
3. **Auth** — login + route protection
4. **CRUD** — Brand/Console/Game CRUD in place on their browse pages, Genre CRUD via
   `/admin/genres`
5. **Polish** — empty/loading/error states, responsive pass, validation

## 14. References

- `CLAUDE.md` — repo conventions and stack
- `schema.prisma` — current data model
- `ROADMAP.md` — phased task breakdown
- `SPEC_TEMPLATE.md` — phased task breakdown
- `specs/*.md` — per-feature implementation specs
- Screenshots: `dashboard.png`, `brands.png`, `consoles.png`,
  `games.png`, `forms.png`