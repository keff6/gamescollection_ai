# Spec: Consoles CRUD

## 1. Goal

Wire real create/edit/delete into the `/brands/[brandId]/consoles` page, same pattern
as `10-brands-crud.md`, replacing the no-op stub left behind by
`05-consoles-page.md`'s `AddConsoleDialog`.

## 2. Scope

**In scope:**
- `AddConsoleDialog`'s `handleSubmit` gets a real Server Action instead of its
  `// TODO` no-op, using the same `zod` + `sonner` pattern as `09`/`10`.
- Generalize `AddConsoleDialog` → `ConsoleFormDialog` accepting an optional `console`
  prop for edit (title/submit label switch), matching `screenshots/form-console.png`
  exactly:
  - Name — text, required, max 60 chars
  - Short Name — text, required, max 30 chars (existing DB column had no UI field
    anywhere before this spec — see §9, resolved as an explicit field rather than
    derived from `name`)
  - Brand — select populated from all brands; see §9, this is a deviation from this
    spec's original "no brand picker" scoping
  - Year — select, 1980 → current year, newest first (not free text)
  - Generation — select, fixed `CONSOLE_GENERATIONS` list (not free text)
  - Is Portable — a single checkbox (not a Home/Portable radio pair — see §9, a
    deviation from this spec's original proposal)
- Edit entry point per `ConsoleCard`: icon button, visible only when logged in,
  opening `ConsoleFormDialog` in edit mode. `ConsoleCard` isn't a `<Link>` itself
  today (the "View N Games" button is), so this is simpler than `BrandCard`'s
  restructure in `10-brands-crud.md` — the edit/delete controls just need to sit
  alongside the existing content without interfering with that button.
- Delete entry point per `ConsoleCard`: icon button, visible only when logged in,
  opening a confirmation `alert-dialog`. Deletes are **blocked**, not cascaded, when
  the console still has 1+ games — matching `10-brands-crud.md`'s resolution for
  `Brand` → `Console` (that spec's cascade language had the same DB-enforces-it
  assumption this one did; both ended up blocking instead). Dialog shows "Can't
  delete "<name>" — it still has N game(s)" with a Close-only action in that case,
  falling back to a normal Cancel/Delete confirmation when `gameCount` is 0.
- `lib/consoles.ts`: extend with `createConsole`, `updateConsole`, `deleteConsole` —
  each validates its `brandId` against the DB (not necessarily the route param,
  since edit can reassign brands; see §9).
- Server Actions (`app/brands/[brandId]/consoles/actions.ts`) wrapping those three,
  each re-checking `auth()` server-side.

**Out of scope (explicitly not doing this now):**
- Brand or Game CRUD — those are `10-brands-crud.md` and `12-games-crud.md`.
- `logoUrl`/`consoleUrl` upload/edit flow — same non-goal as `Brand.logoUrl` in `10`.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/brands/[brandId]/consoles` | Server Component | View: no. Add/edit/delete: yes | Existing page; add/edit/delete now functional |

No new routes — CRUD happens in place via dialogs, per `project-overview.md` §8.4.
Create defaults to the route's `brandId` param, but the form's Brand select can
change it before submitting (see §9) — and editing an existing console can reassign
it to a different brand, at which point it disappears from the current page's grid
immediately (no manual refresh) since the page is scoped by the route's `brandId`.

## 4. Data requirements

No schema changes — `Console` already exists. Cascade delete to `Game` is already
enforced at the DB level (`Game.console` has `onDelete: Cascade`).

```prisma
model Console {
  id         String   @id @default(uuid())
  name       String
  shortName  String
  brandId    String
  year       String?
  generation String?
  isPortable Boolean?
  logoUrl    String?
  consoleUrl String?
  brand      Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
  games      Game[]
}
```

Queries needed (rough shape):
- `createConsole(brandId, { name, shortName, year?, generation?, isPortable })` →
  `db.console.create`, scoped to the brand selected in the form (defaults to the
  route's `brandId`, see §9) — re-verifies the selected brand exists before writing.
- `updateConsole(id, { name, shortName, brandId, year?, generation?, isPortable })` →
  `db.console.update`; `brandId` here is the (possibly changed) value from the form's
  Brand select, not re-derived from the route — re-verifies the selected brand
  exists before writing.
- `deleteConsole(id)` → blocked (not cascaded) when the console still has 1+ games;
  see §9 — this spec does **not** allow the DB-level `Game` cascade to fire from the
  UI path, matching `10-brands-crud.md`'s resolution for `Brand` → `Console`.

Zod schema: `name` required, max 60 chars; `shortName` required, max 30 chars;
`brandId` required non-empty string (re-checked against the DB, not just
non-empty); `year` optional, matches the existing 4-digit pattern already used for
`Game.year` validation in `GameFormDialog` (`/^\d{4}$/`) for consistency — but
selected from a fixed dropdown (1980 → current year) rather than freely typed;
`generation` optional string, selected from the fixed `CONSOLE_GENERATIONS` list
rather than freely typed; `isPortable` boolean, default `false`.

## 5. UI requirements

Reference screenshots: `screenshots/consoles.png` for the existing read-only grid
layout (unchanged, only adds controls to each card) and `screenshots/form-console.png`
for the Add/Edit Console dialog itself.

Key elements:
- `ConsoleFormDialog`: Name/Short Name text fields; Brand/Year/Generation selects
  (`components/ui/select`, same primitive as `GamesControls`' sort dropdown); a
  single Is Portable checkbox (`components/ui/checkbox`, same primitive as
  `GameFormDialog`'s playable-status checkboxes) rather than a radio pair.
- `ConsoleCard`: add edit/delete icon buttons (visible only when logged in),
  positioned consistently with wherever `10-brands-crud.md` lands on `BrandCard`'s
  treatment — same corner, same icon set, same size.
- Delete confirmation names the block using the console's live `gameCount` (already
  available from `getBrandConsoles`), not a cascade warning — see the delete entry
  point note above.
- Toast confirms each successful add/edit/delete; toast surfaces errors on failure.

Component breakdown:
- `components/consoles/ConsoleFormDialog.tsx` — renamed/generalized from
  `AddConsoleDialog.tsx`, accepts `console?: { id, name, shortName, brandId, year,
  generation, isPortable }`
- `components/consoles/ConsoleCard.tsx` — updated to render edit/delete controls
  when `isLoggedIn`
- `components/consoles/ConsolesGrid.tsx` — new client component owning the console
  list as local state (mirrors `10-brands-crud.md`'s `BrandsGrid.tsx`) so
  add/edit/delete/reassign update the grid immediately without a router refresh
- `app/brands/[brandId]/consoles/actions.ts` — `createConsoleAction`,
  `updateConsoleAction`, `deleteConsoleAction`
- `app/brands/[brandId]/consoles/page.tsx` — now just fetches data (including the
  full brand list, for the form's Brand select) and hands off to `ConsolesGrid`

## 6. States to handle

- [ ] Loading — existing skeleton unaffected
- [ ] Empty — existing empty/filtered-empty states unaffected
- [ ] Error — create/update/delete failure surfaces via toast, dialog stays open
      (create/edit) or closes without deleting (delete) so the user can retry
- [ ] Success:
  - [ ] Add a console → appears in the grid sorted by year (existing sort), toast
        confirms
  - [ ] Edit a console → fields update in place, toast confirms
  - [ ] Delete a console with 0 games → removed immediately after confirmation
  - [ ] Delete a console with N games → blocked; dialog explains it still has N
        game(s) and offers only Close, nothing is removed
  - [ ] Edit/delete controls hidden entirely when logged out
  - [ ] New/edited console respects the active `?type=` filter tab immediately (e.g.
        marking a console Portable while the Home filter is active makes it disappear
        from the current view without a manual refresh)
  - [ ] Reassigning a console to a different brand via edit removes it from the
        current brand's grid immediately

## 7. Acceptance criteria

- [ ] Logged-in users can add a console via the existing "+ Add Console" button,
      which now actually persists (previously a no-op) and defaults to the current
      `brandId` (changeable via the form's Brand select)
- [ ] Logged-in users can edit a console's name/short name/brand/year/generation/
      portability from its card
- [ ] Logged-in users can delete a console from its card, gated behind a confirmation
      modal — blocked (not cascaded) when the console still has games, per §9
- [ ] Logged-out users see no edit/delete controls anywhere on the page
- [ ] Server Actions re-verify `auth()` independently of the page-level session
      check, and re-verify the console's selected brand actually exists before
      writing (no longer required to match the route's `brandId`, since edit can
      reassign it — see §9)
- [ ] Changes are visible immediately without a manual refresh, including a
      reassigned console disappearing from its old brand's grid
- [ ] `npm run build`, `npm run lint`, and `npm test` pass

## 8. Dependencies

- `05-consoles-page.md` (existing page, `AddConsoleDialog` stub, `ConsoleCard`,
  `lib/consoles.ts`)
- `08-auth-middleware.md` (`auth()` helper, real `isLoggedIn` checks)
- `09-admin-genres.md` (establishes the `zod` + `sonner` + `alert-dialog` pattern)
- `10-brands-crud.md` (a console must attach to an existing brand; also sets the
  precedent for the shared confirm-delete dialog and card edit/delete treatment this
  spec should match — implement `10` first)

## 9. Notes / open questions

Both items below were originally open questions in this spec; both were resolved
against `screenshots/form-console.png` (added after this spec was first written) —
recorded here as deviations from the spec's original text:

- **Resolved: `Console.shortName` gets an explicit form field.** It's a required
  (non-nullable) DB column that had no UI field anywhere before this spec. Rather
  than deriving it from `name`, the screenshot shows a dedicated "Short Name" text
  input (max 30 chars) alongside "Name" (max 60 chars) — implemented as such.
- **Resolved: Is Portable is a single checkbox, not a Home/Portable radio pair.**
  This spec originally proposed reusing `GameFormDialog`'s Owned/Wishlist
  `RadioGroup` pattern for symmetry. The screenshot instead shows one "Is Portable"
  checkbox (unchecked = Home) — implemented as such, matching the schema's single
  `isPortable` boolean column more directly than a two-option radio group would.
- **Deviation: the form has a Brand select after all.** This spec originally said
  create is scoped entirely by the route's `brandId` with no picker, and explicitly
  called moving a console between brands out of scope. The screenshot shows a Brand
  dropdown (populated from all brands) pre-filled to the current brand — implemented
  as an editable field: create defaults to the route's brand but can target any
  brand, and editing can reassign a console to a different brand entirely. When a
  console is reassigned away from the brand whose page you're on, it's removed from
  that page's grid immediately.
- Year and Generation are selects, not free text as originally implied by `05`'s
  stub fields — Year is generated 1980 → current year (newest first); Generation
  uses a fixed `CONSOLE_GENERATIONS` list (1st–9th, with the same value/label pairs
  used elsewhere in the app for this field).
