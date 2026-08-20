# Spec: Consoles Page

## 1. Goal

`/brands/[brandId]/consoles` — list of consoles belonging to one brand, filterable by console
type, linking through to each console's games, and (once logged in) the place to add
new consoles for that brand.

## 2. Scope

**In scope:** console grid for a given brand, All/Home/Portable filter tabs, per-card
game count + "View N Games" link, "Add Console" button (opens an inline modal, same
pattern as brands page — real mutation wired in `11-consoles-crud.md`).

**Out of scope:** create/edit/delete logic actually persisting (Phase 3).

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/brands/[brandId]/consoles` | Server Component | No | Consoles for one brand |

## 4. Data requirements

Models: `Brand` (for name/header), `Console` (filtered by `brandId`), `Game`
(for per-console count via `_count`).

Query: `prisma.console.findMany({ where: { brandId }, include: { _count: { select: { games: true } } } })`
plus a separate `prisma.brand.findUnique({ where: { id: brandId } })` for the header/count.

Filter logic (`All` / `Home` / `Portable`): client-side filter on `isPortable`, or a
`?type=` search param handled server-side — either is fine, pick one and be consistent
with how the games-page search/sort is implemented (see `06-games-page.md`).

## 5. UI requirements

Reference screenshot: `consoles.png`

- Breadcrumb: `Brands / Consoles` (Brands links back to `/brands`)
- Page header: brand name as h1 (e.g. "Microsoft") + "{N} consoles" subtext
- "+ Add Console" button, top-right, opens inline modal (hidden when logged out)
- Filter tabs row: `All` (active/teal pill by default), `Home`, `Portable` — filters by
  `isPortable`
- 2-column card grid, each card:
  - Small console icon (teal, game-controller style, reused from navbar logo)
  - Console name (bold)
  - `YEAR` / `GENERATION` labels with values below (e.g. "2001" / "6th (128 bits)")
  - Full-width "View {N} Games" button/link at the bottom of the card → navigates to
    that console's games page

## 6. States to handle

- [ ] Loading (skeleton cards)
- [ ] Empty (brand has zero consoles — empty state)
- [ ] Not found (invalid `brandId` — 404)
- [ ] Error (DB failure)

## 7. Acceptance criteria

- [ ] Correct consoles and game counts render for a given brand (verified against
      Microsoft: Xbox/15, Xbox 360/40, Xbox One/25, Xbox Series X/10 from seed data)
- [ ] Filter tabs correctly narrow results by `isPortable` and "All" shows everything
- [ ] "View N Games" links to `/consoles/[consoleId]/games`
- [ ] Invalid `brandId` renders a proper 404, not a crash
- [ ] "Add Console" hidden entirely for logged-out users

## 8. Dependencies

- `00-schema-review.md`, `01-seed-data.md`, `02-app-shell-navbar.md`, `04-brands-page.md`
  (for the incoming link)

## 9. Notes / open questions

- Decide the exact games-page route shape now so both this spec and `06-games-page.md`
  agree: `/consoles/[consoleId]/games` is assumed throughout these specs — confirm or adjust. Confirmed
