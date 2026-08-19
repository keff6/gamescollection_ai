# Spec: Dashboard

## 1. Goal

Home route (`/`) — an at-a-glance overview of the whole collection: totals, breakdowns
by genre and platform, and collection condition.

## 2. Scope

**In scope:** stat cards, "By Genre" pie chart, "By Platform" bar chart, "Games
Condition" donut chart, "Top 5 Consoles by Games" bar chart.

**Out of scope:** any editing from this page — dashboard is read-only, links out to
brands/consoles/games for management. No separate GameStatus (Wishlist/Backlog/Owned/
Playing/Completed) breakdown section — resolved as not needed; the page ends after the
four chart cards below.

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
- Total distinct brand count, total distinct console count (plain totals, not filtered
  to "has games" — for the "Brands / Consoles: 4 / 23" stat card)
- Games grouped by genre (via `GameGenre` join). Percentages are computed against total
  `GameGenre` row count, not total game count — a game can carry multiple genres, so
  using game count as the denominator would prevent slices from summing to 100%
- Games grouped by console `shortName`, as counts, for the "By Platform" bar chart
  (all consoles with ≥1 game)
- Same games-per-console grouping, but by console `name` (full name, matching the
  screenshot's "PlayStation 2" / "Nintendo 64" labels — not the abbreviated
  `shortName` used in "By Platform"), sorted by count desc, limited to top 5, for
  "Top 5 Consoles by Games"
- Games bucketed into a single condition per game — `isDigital` → Digital;
  else `isNew` → New; else `isComplete` → Complete; else → Incomplete — for the
  "Games Condition" donut

## 5. UI requirements

Reference screenshots: `../screenshots/dashboard.png` (stat cards + top chart row),
`../screenshots/dashboard-2.png` (bottom chart row).

**Stat cards row (4 cards):**
- Total Games — big number + game-controller icon
- Completed — big number + "X% of total" subtext + trophy icon
- Now Playing — big number + trending-up icon
- Brands / Consoles — "4 / 23" format + stacked-layers icon

**Row 1 — By Genre (pie chart) / By Platform (bar chart):**
- By Genre: genre name + percentage as labels around the pie, teal-toned palette
  varying by shade/opacity per slice, consistent with theme
- By Platform: console `shortName` on x-axis (rotated labels, e.g. "Nintendo Switch",
  "PS5", "Super Nintendo"), game count on y-axis, teal bars

**Row 2 — Games Condition (donut) / Top 5 Consoles by Games (bar):**
- Games Condition: ring/donut chart with one slice per bucket (Complete / Digital /
  Incomplete / New) per the priority rule in §4; percentage in the center; legend
  lists only the buckets actually present in the data (the screenshot's single
  "complete 100%" legend reflects its mock data, not a fixed 4-slice requirement)
- Top 5 Consoles by Games: horizontal bar chart, console full `name` as the label,
  count shown at the end of each bar, sorted desc, top 5 only, **teal-monochrome**
  (matching the rest of the page — not the multi-color bars shown in the reference
  screenshot, which was a mockup artifact)

Suggested chart library: `recharts`. **Not currently installed** — add it to
`package.json` as part of this feature.
Use `shadcn` for cards. **Not currently initialized in this repo** (no
`components.json`) — run `npx shadcn init` and add the `card` component before
building the chart/stat cards.

## 6. States to handle

- [ ] Loading (skeleton cards/charts while queries run)
- [ ] Empty (zero games — show zeroed stats and an empty-state message instead of a
      broken/empty chart; Games Condition donut and Top 5 Consoles bar chart should
      also degrade gracefully with no data)
- [ ] Error (DB query failure — fallback message, don't crash the page)

## 7. Acceptance criteria

- [ ] All 4 stat cards show correct live numbers from the seeded data
- [ ] Pie chart percentages sum to ~100% and match genre-tag distribution in the DB
- [ ] "By Platform" bar chart shows one bar per console with games, sorted by count
      desc, matching the screenshot's apparent order
- [ ] "Games Condition" donut buckets every game into exactly one of Complete /
      Digital / Incomplete / New via the `isDigital` > `isNew` > `isComplete` >
      Incomplete priority, and percentages sum to 100%
- [ ] "Top 5 Consoles by Games" shows at most 5 bars (fewer if <5 consoles have
      games), sorted by count desc, teal-toned like the rest of the page
- [ ] Page matches screenshots' visual layout: 2x2 stat grid, then two 2-column chart
      rows (By Genre/By Platform, then Games Condition/Top 5 Consoles by Games)
- [ ] Works correctly with zero data (fresh DB) without erroring

## 8. Dependencies

- `00-schema-review.md`, `01-seed-data.md`, `02-app-shell-navbar.md`
- Setup work (part of this feature, not a prerequisite spec): install `recharts`;
  run `npx shadcn init` and add the `card` component

## 9. Notes / open questions

None outstanding — resolved during spec review on 2026-08-19:
- Brands / Consoles stat = plain totals (all brands, all consoles), not filtered to
  "has ≥1 game"
- "Collection Status" heading is removed as a distinct section; it's replaced by the
  Games Condition + Top 5 Consoles by Games row shown in `dashboard-2.png`
- Games Condition bucket priority: `isDigital` > `isNew` > `isComplete` > Incomplete
- Top 5 Consoles by Games stays teal-monochrome, not multi-color
