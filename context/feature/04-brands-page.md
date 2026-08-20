# Spec: Brands Page

## 1. Goal

`/brands` — entry point into the collection browse flow, and (once logged in) the place
to add new brands directly in place. Shows every brand as a card; clicking one navigates
to that brand's consoles.

## 2. Scope

**In scope:** brand grid, per-card console count, "Add Brand" button. The button/modal
can be built now with a stubbed submit handler; the real create mutation is wired in
`10-brands-crud.md` once auth exists to gate it — but build the actual UI (modal or
inline form) here rather than linking to a separate page, since there is no separate
`/admin` route for brands (see `ROADMAP.md` Phase 3 note).

**Out of scope:** the create mutation actually persisting (Phase 3), edit/delete (Phase 3).

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/brands` | Server Component | No | Brand picker grid |

## 4. Data requirements

Model: `Brand`, `Console` (for count).

Query: all brands with a count of related `Console` rows
(`prisma.brand.findMany({ include: { _count: { select: { consoles: true } } } })`).

## 5. UI requirements

Reference screenshot: `brands-opt1.png`

- Page header: "Pick a brand" (h1) + "7 brands in collection" subtext
- "+ Add Brand" button, top-right, teal — opens a modal (same pattern as the Add Game
  modal in `forms-opt1.png`), not a separate route
- 2-column card grid (responsive: likely 1 column on mobile)
- Each card: brand name (bold, larger) + "{N} Console{s}" subtext, whole card clickable,
  subtle hover state, links to `/brands/[brandId]` (consoles page)

## 6. States to handle

- [ ] Loading (skeleton cards)
- [ ] Empty (no brands yet — show an empty state with a prompt to add one)
- [ ] Error (DB failure — fallback message)

## 7. Acceptance criteria

- [ ] All seeded brands render with correct console counts
- [ ] Clicking a card navigates to `/brands/[brandId]`
- [ ] Layout matches the 2-column card grid in the screenshot
- [ ] "Add Brand" button is **hidden entirely** for logged-out users (per the CRUD
      placement decision — logged-out visitors see the same pages minus write affordances,
      not a disabled/redirecting button)

## 8. Dependencies

- `00-schema-review.md`, `01-seed-data.md`, `02-app-shell-navbar.md`

## 9. Notes / open questions

- None currently — "Add Brand" visibility is settled (hidden when logged out), consistent
  with the same decision applied in `05-consoles-page.md` and `06-games-page.md`.
