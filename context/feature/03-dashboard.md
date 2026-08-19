# Spec: Dashboard

## 1. Goal

Home route (`/`) — an at-a-glance overview of the whole collection: totals, breakdowns
by genre and platform, and collection status.

## 2. Scope

**In scope:** stat cards, "By Genre" pie chart, "By Platform" bar chart, "Collection
Status" section (partially cut off in screenshot — build as a status breakdown, see
open question below).

**Out of scope:** any editing from this page — dashboard is read-only, links out to
brands/consoles/games for management.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/` | Server Component | No | Dashboard/home |

## 4. Data requirements

Models: `Game`, `Console`, `Brand`, `Genre`, `GameGenre`.

Queries needed:
- Total game count
- Count where `status = 'COMPLETED'` (+ percentage of total)
- Count where `status = 'PLAYING'`
- Distinct brand count / distinct console count (for "Brands / Consoles: 4 / 23" — note:
  screenshot shows 4, likely "brands *with at least one game*" not total brands; confirm)
- Games grouped by genre (via `GameGenre` join), as percentages, for the pie chart
- Games grouped by console `shortName`, as counts, for the bar chart
- Games grouped by `status` for the "Collection Status" section

## 5. UI requirements

Reference screenshot: `dashboard-opt1.png`

**Stat cards row (4 cards):**
- Total Games — big number + game-controller icon
- Completed — big number + "X% of total" subtext + trophy icon
- Now Playing — big number + trending-up icon
- Brands / Consoles — "4 / 23" format + stacked-layers icon

**By Genre (pie chart):** genre name + percentage as labels around the pie, teal-toned
palette varying by shade/opacity per slice, consistent with theme.

**By Platform (bar chart):** console `shortName` on x-axis (rotated labels, e.g.
"Nintendo Switch", "PS5", "Super Nintendo"), game count on y-axis, teal bars.

**Collection Status:** visible header only in screenshot, content cut off — build as a
horizontal breakdown (e.g. small bar or stat row) of counts per `GameStatus` value
(Wishlist / Backlog / Owned / Playing / Completed). Confirm exact layout once you can
scroll the reference screenshot further, or treat this as a reasonable placeholder to
refine later.

Suggested chart library: `recharts` (already available in this environment).

## 6. States to handle

- [ ] Loading (skeleton cards/charts while queries run)
- [ ] Empty (zero games — show zeroed stats and an empty-state message instead of a
      broken/empty chart)
- [ ] Error (DB query failure — fallback message, don't crash the page)

## 7. Acceptance criteria

- [ ] All 4 stat cards show correct live numbers from the seeded data
- [ ] Pie chart percentages sum to ~100% and match genre distribution in the DB
- [ ] Bar chart shows one bar per console with games, sorted sensibly (by count desc,
      matching the screenshot's apparent order)
- [ ] Page matches screenshot's visual layout (2x2 stat grid, then 2-column chart row)
- [ ] Works correctly with zero data (fresh DB) without erroring

## 8. Dependencies

- `00-schema-review.md`, `01-seed-data.md`, `02-app-shell-navbar.md`

## 9. Notes / open questions

- Clarify "Brands / Consoles: 4 / 23" — is the first number "brands with ≥1 game" or
  "brands with ≥1 console"? Confirm before implementing that stat card.
- Get a full (unscrolled/cropped) screenshot of the "Collection Status" section if
  possible — current one is cut off.
