# Spec: Brands Page

## 1. Goal

`/brands` — entry point into the collection browse flow. Shows every brand as a card;
clicking one navigates to that brand's consoles.

## 2. Scope

**In scope:** brand grid, per-card console count, "Add Brand" button (button visible now
for layout parity with later CRUD, but wired to the real create flow in
`10-admin-brands-crud.md` — for this spec it can link to `/admin/brands/new` or be a
no-op placeholder).

**Out of scope:** actual create/edit/delete logic (Phase 3).

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
- "+ Add Brand" button, top-right, teal, visible regardless of auth state for layout
  parity — but see note below on gating
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
- [ ] "Add Brand" button is present but only *functional* once the user is logged in
      (until then, either hide it or route to `/login` — decide and note in code comments;
      real gating logic lands in Phase 2/3)

## 8. Dependencies

- `00-schema-review.md`, `01-seed-data.md`, `02-app-shell-navbar.md`

## 9. Notes / open questions

- Confirm whether "Add Brand" should be hidden entirely for logged-out users on this
  page, or shown-but-redirects-to-login. Screenshot alone doesn't tell us since it's
  ambiguous whether that screenshot was taken while logged in.
