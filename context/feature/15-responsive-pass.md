# Spec: Responsive Pass

## 1. Goal

Every Phase 1 read-only page (dashboard, brands, consoles, games) was already screenshot-
verified at desktop/tablet/mobile widths when it was originally built. Phase 3's CRUD
additions (the three form dialogs, per-card edit/delete icon buttons, the genres table)
were **not** — their feature specs' verification sections mention Playwright click-throughs
but stop short of explicit mobile-width checks, unlike the earlier pages. This spec closes
that gap: verify the CRUD surfaces at mobile/tablet widths and fix one concrete issue found
during the pre-spec audit.

## 2. Scope

**In scope:**
- Fix `BrandFormDialog` and `ConsoleFormDialog`: neither has a max-height/scroll
  constraint on its form body, unlike `GameFormDialog` (which already wraps its form in
  `className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1"`, added because it's
  the longest form). The shadcn `DialogContent` base is vertically centered
  (`top-1/2 -translate-y-1/2`) with no built-in scroll handling of its own — on a short
  mobile viewport (e.g. landscape phone, or portrait with the on-screen keyboard open),
  `ConsoleFormDialog`'s five fields (Name, Short Name, Brand, Year, Generation selects +
  checkbox) plus its footer buttons can extend above the visible viewport with no way to
  scroll to the Save button. Apply the same `max-h-[70vh] overflow-y-auto` treatment
  `GameFormDialog` already uses to both dialogs' form bodies for consistency.
- Manual verification pass (screenshots, not new code, unless a real issue turns up) at
  desktop (~1280px+), tablet (~768px), and mobile (~375px) widths for every surface added
  in Phase 3, since none of them got this treatment when built:
  - `BrandFormDialog` / `ConsoleFormDialog` / `GameFormDialog` open on top of their
    respective grid pages at each width, including with a pre-filled edit (longer content
    than a blank Add) and with at least one visible validation error shown
  - `BrandCard` / `ConsoleCard` / `GameCard` edit+delete icon buttons — confirm they don't
    overlap card content or each other, and remain tappable (not too small) at 375px
  - The delete confirmation `alert-dialog` (both the "blocked, has children" variant and
    the normal confirm variant) at 375px
  - `/admin/genres`'s `GenresTable` — inline edit, "+ Add Genre" new row, and its delete
    confirmation, all at 375px (this page is a `<table>`-based layout, the highest risk
    of horizontal overflow of anything added in Phase 3)
  - Navbar's Admin dropdown (both desktop dropdown and mobile hamburger-menu variant) —
    confirm the "Genre" item renders correctly in both, since it was added after the
    original navbar responsive pass in `02-app-shell-navbar.md`

**Out of scope (explicitly not doing this now):**
- Re-verifying Phase 1 pages (dashboard/brands/consoles/games grids, charts, filter tabs)
  — already screenshot-verified at desktop/mobile per their own specs' history, and
  nothing in Phase 3 changed their layout structure.
- Any new breakpoint beyond the existing `sm`/`md`/`lg` Tailwind defaults already used
  throughout — no new custom breakpoints.
- Landscape-orientation-specific handling beyond what the `max-h-[70vh]` fix already buys.

## 3. Routes / Pages

No new routes. Touches the same routes as `10`/`11`/`12`/`09`:

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/brands` | Server Component | View: no. CRUD: yes | Verify `BrandFormDialog` + `BrandCard` controls at mobile/tablet |
| `/brands/[brandId]/consoles` | Server Component | View: no. CRUD: yes | Verify `ConsoleFormDialog` (+ its new scroll fix) + `ConsoleCard` controls |
| `/consoles/[consoleId]/games` | Server Component | View: no. CRUD: yes | Verify `GameFormDialog` + `GameCard` controls (baseline already has the scroll fix) |
| `/admin/genres` | Server Component | Yes, all actions | Verify `GenresTable` at 375px for horizontal overflow |

## 4. Data requirements

None — no schema or query changes, styling/layout only.

## 5. UI requirements

Reference screenshots: reuse the existing `screenshots/form-console.png`,
`screenshots/form-game-1.png`/`form-game-2.png` as the desktop-width source of truth;
no new reference mocks exist for mobile CRUD layouts, so "correct" here means no clipped
content, no horizontal scroll on the page body, all interactive controls reachable and
tappable — not a pixel match to a new mock.

Key elements:
- `BrandFormDialog` / `ConsoleFormDialog`: form body gets `max-h-[70vh] overflow-y-auto`
  (matching `GameFormDialog`'s existing `className`), footer buttons stay visible/reachable

Component breakdown:
- `components/brands/BrandFormDialog.tsx` — add scroll constraint to the form element
- `components/consoles/ConsoleFormDialog.tsx` — add scroll constraint to the form element

## 6. States to handle

- [ ] Loading — n/a, not touched by this spec
- [ ] Empty — n/a, not touched by this spec
- [ ] Error — n/a, not touched by this spec
- [ ] Success — n/a; this spec is layout-only, no new interaction states

## 7. Acceptance criteria

- [ ] `BrandFormDialog` and `ConsoleFormDialog` both cap their form body height and scroll
      internally, matching `GameFormDialog`'s existing pattern — verified by opening each
      at a short mobile viewport and confirming the Save button is reachable
- [ ] Screenshots taken at desktop/tablet/mobile widths for every surface listed in §2's
      verification pass, with zero horizontal page-body overflow and no clipped/unreachable
      controls found (or, if found, fixed as part of this spec)
- [ ] Edit/delete icon buttons on `BrandCard`/`ConsoleCard`/`GameCard` remain distinct,
      non-overlapping, and tappable at 375px
- [ ] `GenresTable` has no horizontal overflow at 375px
- [ ] Navbar's Admin → Genre item renders correctly in both the desktop dropdown and the
      mobile hamburger menu
- [ ] `npm run build` and `npm run lint` pass (no new tests expected — this is a styling/
      layout spec, consistent with the "skip thin/no-branching-logic" precedent already
      used for other pure-UI passes in this project)

## 8. Dependencies

- `02-app-shell-navbar.md` (established the `sm`/`md`/`lg` breakpoint conventions and the
  mobile hamburger menu this spec re-verifies)
- `09-admin-genres.md`, `10-brands-crud.md`, `11-consoles-crud.md`, `12-games-crud.md`
  (all the surfaces being verified/fixed here)

## 9. Notes / open questions

- `GameFormDialog`'s `max-h-[70vh] overflow-y-auto` was added during `12-games-crud.md`
  because it's by far the longest form (Console/Title/Year/Developer/Publisher/media
  status/playable status/Notes/Genre(s)/Sagas/Rating). This spec's audit found the same
  risk applies to `ConsoleFormDialog` (five fields, still enough to overflow a short
  viewport) and, to a lesser extent, `BrandFormDialog` (only Name/Origin — low risk, but
  fixed anyway for consistency and because it's a one-line change).
