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
  prop for edit (Name/Year/Generation pre-filled, title/submit label switch), plus a
  Home/Portable toggle for `isPortable` — the create form today has no field for it
  even though `ConsoleFilterTabs` filters by it; this spec adds the field since a
  console can't be meaningfully created without it.
- Edit entry point per `ConsoleCard`: icon button, visible only when logged in,
  opening `ConsoleFormDialog` in edit mode. `ConsoleCard` isn't a `<Link>` itself
  today (the "View N Games" button is), so this is simpler than `BrandCard`'s
  restructure in `10-brands-crud.md` — the edit/delete controls just need to sit
  alongside the existing content without interfering with that button.
- Delete entry point per `ConsoleCard`: icon button, visible only when logged in,
  opening the shared confirmation dialog (per `10-brands-crud.md`'s note on a shared
  `ConfirmDeleteDialog`, if that's how `10` ends up implemented) warning about the
  cascade to its games ("Delete '<name>'? This also deletes its N game(s). This can't
  be undone.").
- `lib/consoles.ts`: extend with `createConsole`, `updateConsole`, `deleteConsole`,
  each scoped to/validated against the `brandId` route param.
- Server Actions (`app/brands/[brandId]/consoles/actions.ts`) wrapping those three,
  each re-checking `auth()` server-side.

**Out of scope (explicitly not doing this now):**
- Brand or Game CRUD — those are `10-brands-crud.md` and `12-games-crud.md`.
- `logoUrl`/`consoleUrl` upload/edit flow — same non-goal as `Brand.logoUrl` in `10`.
- Moving a console between brands (edit only changes this console's own fields, not
  its `brandId`) — not implied by any current UI affordance.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/brands/[brandId]/consoles` | Server Component | View: no. Add/edit/delete: yes | Existing page; add/edit/delete now functional |

No new routes — CRUD happens in place via dialogs, per `project-overview.md` §8.4.
Create is implicitly scoped to the brand via the route's `brandId` param (the form
itself has no brand picker).

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
- `createConsole(brandId, { name, year?, generation?, isPortable })` → `db.console.create`
  — note `shortName` is `@map("short_name")` and required (non-nullable) on the
  schema with no UI field for it anywhere yet; decide during implementation whether
  to derive it from `name` (e.g. slugify) or add a field — flagged in §9.
- `updateConsole(id, { name, year?, generation?, isPortable })` → `db.console.update`,
  verify the console's `brandId` matches the route param before writing (defense
  against a stale/tampered form submitting against the wrong brand)
- `deleteConsole(id)` → `db.console.delete` (cascade handles `Game` cleanup)

Zod schema: `name` required non-empty string; `year` optional, matches the existing
4-digit pattern already used for `Game.year` validation in `GameFormDialog`
(`/^\d{4}$/`) for consistency; `generation` optional string; `isPortable` boolean,
default `false`.

## 5. UI requirements

Reference screenshot: `screenshots/consoles.png` for the existing read-only layout —
this spec doesn't change the grid's visual layout, only adds controls to each card
and a Home/Portable field to the form.

Key elements:
- `ConsoleFormDialog`: Name/Year/Generation fields (existing) plus a new
  Home/Portable choice — reuse the `RadioGroup` pattern already established in
  `GameFormDialog`'s Owned/Wishlist toggle for visual consistency.
- `ConsoleCard`: add edit/delete icon buttons (visible only when logged in),
  positioned consistently with wherever `10-brands-crud.md` lands on `BrandCard`'s
  treatment — same corner, same icon set, same size.
- Delete confirmation names the cascade using the console's live `gameCount`
  (already available from `getBrandConsoles`).
- Toast confirms each successful add/edit/delete; toast surfaces errors on failure.

Component breakdown:
- `components/consoles/ConsoleFormDialog.tsx` — renamed/generalized from
  `AddConsoleDialog.tsx`, accepts `console?: { id, name, year, generation, isPortable }`
- `components/consoles/ConsoleCard.tsx` — updated to render edit/delete controls
  when `isLoggedIn`
- `app/brands/[brandId]/consoles/actions.ts` — `createConsoleAction`,
  `updateConsoleAction`, `deleteConsoleAction`
- `app/brands/[brandId]/consoles/page.tsx` — passes `isLoggedIn` through to
  `ConsoleCard` (already computed there)

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
  - [ ] Delete a console with N games → confirmation names the cascade explicitly,
        removed along with its games after confirmation
  - [ ] Edit/delete controls hidden entirely when logged out
  - [ ] New/edited console respects the active `?type=` filter tab immediately (e.g.
        marking a console Portable while the Home filter is active makes it disappear
        from the current view without a manual refresh)

## 7. Acceptance criteria

- [ ] Logged-in users can add a console via the existing "+ Add Console" button,
      which now actually persists (previously a no-op) and correctly attaches to the
      current `brandId`
- [ ] Logged-in users can edit a console's name/year/generation/portability from its card
- [ ] Logged-in users can delete a console from its card, gated behind a confirmation
      modal that mentions the cascade to its games
- [ ] Deleting a console removes its games (already enforced by the DB; this spec
      verifies the UI path exercises it correctly)
- [ ] Logged-out users see no edit/delete controls anywhere on the page
- [ ] Server Actions re-verify `auth()` independently of the page-level session check,
      and re-verify the console being edited/deleted actually belongs to the
      `brandId` in the URL
- [ ] Changes are visible immediately without a manual refresh
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

- **Needs a decision before/during implementation:** `Console.shortName` is a
  required (non-nullable) DB column with no corresponding field anywhere in the
  existing UI (create form, edit form, or display). Options: (a) derive it
  automatically from `name` on create (e.g. strip whitespace/lowercase, matching
  whatever convention the seeded data already uses — check `01-schema-review.md`/the
  seed script for precedent), or (b) add a `Short Name` field to the form. Check the
  legacy migration script (`scripts/migrate-mysql-legacy.ts`) or existing seeded rows
  for what `shortName` is actually used for before deciding — it may just be a
  display convenience nothing in the current UI reads.
- Home/Portable field is new to the form (the existing `AddConsoleDialog` stub
  doesn't have it) — confirm the RadioGroup-based treatment reads well before
  finalizing, no screenshot covers the create/edit form for consoles.
