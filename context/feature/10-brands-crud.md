# Spec: Brands CRUD

## 1. Goal

Wire real create/edit/delete into the `/brands` page so a logged-in user can actually
manage brands, replacing the no-op stub left behind by `04-brands-page.md`'s
`AddBrandDialog`.

## 2. Scope

**In scope:**
- `AddBrandDialog`'s `handleSubmit` gets a real Server Action instead of its `// TODO`
  no-op, using `zod` for input validation and `sonner` for success/error feedback
  (pattern established in `09-admin-genres.md`).
- Reusing the same dialog component for edit: `AddBrandDialog` becomes a generic
  `BrandFormDialog` accepting an optional `brand` prop (mirrors how
  `GameFormDialog` already supports `game?:` for edit, per `06-games-page.md`),
  pre-filling Name/Origin and switching its title/submit label to "Edit Brand"/"Save".
- Edit entry point per `BrandCard`: an edit icon/button, visible only when logged in,
  opening `BrandFormDialog` in edit mode. Needs a small layout change since
  `BrandCard` is currently a single `<Link>` wrapping the whole card — the edit
  control must not itself navigate.
- Delete entry point per `BrandCard`: a delete icon/button, visible only when logged
  in, opening an `alert-dialog` confirmation that explicitly warns about the cascade
  ("Delete '<name>'? This also deletes its N console(s) and all of their games. This
  can't be undone.") before calling the delete Server Action.
- `lib/brands.ts`: extend with `createBrand`, `updateBrand`, `deleteBrand`.
- Server Actions (`app/brands/actions.ts`) wrapping those three, each re-checking
  `auth()` server-side.
- Cascade deletes are not permitted. You can't delete a Brad that has 1 or more Consoles
- | field name | max chars |
  | name | 30 |
  | country | 30 |

**Out of scope (explicitly not doing this now):**
- Console or Game CRUD — those are `11-consoles-crud.md` and `12-games-crud.md`.
- A `logoUrl` upload/edit flow — `Brand.logoUrl` exists on the schema but has no UI
  anywhere yet (matches the PRD's cover-image non-goal for `Game.coverUrl`); the
  form only covers `name`/`origin`.
- Undo/soft-delete for brands — deletion is immediate and permanent once confirmed.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/brands` | Server Component | View: no. Add/edit/delete: yes | Existing page; add/edit/delete now functional |

No new routes — CRUD happens in place via dialogs on the existing page, per
`project-overview.md` §8.4.

## 4. Data requirements

No schema changes — `Brand` already exists. Cascade delete to `Console`/`Game` is
already enforced at the DB level (`Console.brand` has `onDelete: Cascade`, confirmed
in `00-database-spec.md`/`01-schema-review.md`).

```prisma
model Brand {
  id       String    @id @default(uuid())
  name     String
  origin   String?
  logoUrl  String?
  consoles Console[]
}
```

Queries needed (rough shape):
- `createBrand({ name, origin? })` → `db.brand.create`
- `updateBrand(id, { name, origin? })` → `db.brand.update`
- `deleteBrand(id)` → `db.brand.delete` (cascade handles `Console`/`Game` cleanup)

Zod schema: `name` required non-empty string; `origin` optional string.

## 5. UI requirements

Reference screenshot: `screenshots/brands.png` for the existing read-only layout —
this spec doesn't change visual layout of the grid, only adds controls to each card
and reuses the existing Add Brand dialog's visual style for edit.

Key elements:
- `BrandCard`: currently the entire card is a `<Link>` to
  `/brands/[brandId]/consoles`. Restructure so the card's clickable navigation area
  and the edit/delete controls (top-right corner, small icon buttons, visible only
  when logged in) can coexist without the icon buttons triggering navigation — e.g.
  the outer element becomes a `<div>` with an inner `<Link>` covering the
  name/count area, or icon buttons with `event.preventDefault()`/`stopPropagation()`.
  Match whichever pattern reads cleanest against `brands.png`.
- `BrandFormDialog` (renamed from `AddBrandDialog`): same Name/Origin fields, title
  and submit label switch based on whether a `brand` prop is passed.
- Delete confirmation `alert-dialog` explicitly names the cascade impact using the
  brand's live `consoleCount` (already available from `getBrandsWithConsoleCounts`).
- Toast confirms each successful add/edit/delete; toast surfaces errors on failure.

Component breakdown:
- `components/brands/BrandFormDialog.tsx` — renamed/generalized from
  `AddBrandDialog.tsx`, accepts `brand?: { id, name, origin }`
- `components/brands/BrandCard.tsx` — updated to render edit/delete controls when
  `isLoggedIn`, receives the delete handler / opens its own `alert-dialog`
- `components/brands/DeleteBrandDialog.tsx` (or inlined in `BrandCard` — decide
  during implementation based on how much logic is shared with consoles/games'
  equivalent delete dialogs) — confirmation + calls `deleteBrand` Server Action
- `app/brands/actions.ts` — `createBrandAction`, `updateBrandAction`,
  `deleteBrandAction`
- `app/brands/page.tsx` — passes `isLoggedIn` through to `BrandCard` (already
  computed there) instead of only gating the Add dialog

## 6. States to handle

- [ ] Loading — existing skeleton grid unaffected
- [ ] Empty — existing empty state unaffected
- [ ] Error — create/update/delete failure surfaces via toast, dialog stays open
      (create/edit) or closes without deleting (delete) so the user can retry
- [ ] Success:
  - [ ] Add a brand → appears in the grid (alphabetical per existing `orderBy: name`),
        toast confirms
  - [ ] Edit a brand → name/origin update in place, toast confirms
  - [ ] Delete a brand with 0 consoles → removed immediately after confirmation, no
        special-cased copy needed beyond the standard warning
  - [ ] Delete a brand with N consoles → confirmation names the cascade explicitly,
        removed along with its consoles/games after confirmation
  - [ ] Edit/delete controls are hidden entirely when logged out (not just disabled)

## 7. Acceptance criteria

- [ ] Logged-in users can add a brand via the existing "+ Add Brand" button, which now
      actually persists (previously a no-op)
- [ ] Logged-in users can edit a brand's name/origin from its card
- [ ] Logged-in users can delete a brand from its card, gated behind a confirmation
      modal that mentions the cascade to its consoles/games
- [ ] Deleting a brand removes its consoles and games (already enforced by the DB;
      this spec verifies the UI path exercises it correctly)
- [ ] Logged-out users see no edit/delete controls anywhere on `/brands`
- [ ] Server Actions re-verify `auth()` independently of the page-level session check
- [ ] Changes are visible immediately on `/brands` without a manual refresh
      (Next.js revalidation/router refresh after each mutation)
- [ ] `npm run build`, `npm run lint`, and `npm test` pass

## 8. Dependencies

- `04-brands-page.md` (existing `/brands` page, `AddBrandDialog` stub, `BrandCard`,
  `lib/brands.ts`)
- `08-auth-middleware.md` (`auth()` helper, real `isLoggedIn` checks)
- `09-admin-genres.md` (establishes the `zod` + `sonner` + `alert-dialog` pattern this
  spec reuses — implement after `09`, not before)

## 9. Notes / open questions

- Exact placement/iconography of the edit/delete controls on `BrandCard` isn't
  pinned down by any screenshot (the reference mocks only show the read-only card) —
  use small ghost/icon buttons in a corner, consistent treatment to be carried over
  into `11-consoles-crud.md`'s `ConsoleCard` and `12-games-crud.md`'s `GameCard` so
  all three entity cards look like one system rather than three one-offs.
- Whether the delete confirmation dialog is a shared `components/shared/ConfirmDeleteDialog.tsx`
  (parameterized by entity name/warning copy) or three separate per-entity components
  is an implementation-time call — a shared component is likely the better fit given
  `10`, `11`, and `12` all need functionally the same alert-dialog, but decide once
  you see how much the copy/props actually diverge.
