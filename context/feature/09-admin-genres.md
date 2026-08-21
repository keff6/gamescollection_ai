# Spec: Admin Genres CRUD

## 1. Goal

Give the collection owner a dedicated `/admin/genres` page to manage genres — the
entity the Game form's genre picker depends on — and add the Navbar's "Admin"
dropdown (referenced in `project-overview.md` §6/§8.5 but never actually built) so a
logged-in user can reach it. Genres are the one entity with a real admin page: a
single-field entity better served by an inline-editable table than a modal per row.

This spec is also where the project adopts `zod` and a toast library (`sonner`) for
the first time, per `coding-standards.md`'s "validate inputs with Zod" / "display
errors via toast" rules — every CRUD spec after this one (`10`, `11`, `12`) builds on
that same pattern rather than each inventing its own.

## 2. Scope

**In scope:**
- New dependencies: `zod` (Server Action input validation) and `sonner` (toast
  mutation feedback) — add via npm, mount `<Toaster />` once in `app/layout.tsx`.
- Navbar: new "Admin" dropdown nav item, visible only when logged in, reusing the
  `dropdown-menu` primitive already added for `UserMenu`. One item for now: "Genre" →
  `/admin/genres`.
- `/admin/genres` page — already covered by `proxy.ts`'s existing `/admin/:path*`
  matcher from `08-auth-middleware.md`, so no new middleware work.
- `lib/genres.ts`: extend the existing `getAllGenres` with `createGenre`,
  `updateGenre`, `deleteGenre`, each zod-validating its input.
- Server Actions (`app/admin/genres/actions.ts`) wrapping those three, each re-checking
  `auth()` server-side and returning `{ success, data, error }` per
  `coding-standards.md` — defense in depth, since Server Actions are directly
  callable regardless of what the page renders.
- UI: a table of all genres inside a card. Each row's name is inline-editable — click
  into it, edit, and either blur or press Enter to save, Esc to revert. "+ Add Genre"
  appends a new blank row, focused immediately, editable the same way; Esc or blur-while-empty
  discards it without a server call. Each row has a Delete icon button that opens a
  confirmation dialog before it fires.
- Duplicate-name guard: case-insensitive uniqueness check in `createGenre`/`updateGenre`,
  surfaced as an inline field error (not a toast, since it's tied to the specific input).
- New shadcn component: `alert-dialog` (for delete confirmation) — first use of this
  primitive in the repo; the existing `dialog` component is used for content dialogs
  (Add Brand, Add Console, Add/Edit Game), not confirmations.

**Out of scope (explicitly not doing this now):**
- Any other `/admin/*` page — Genre is the only entity with a dedicated admin page
  per `project-overview.md` §8.4; Brand/Console/Game CRUD lives on their own browse
  pages (`10`, `11`, `12`).
- Bulk operations (multi-select delete, drag-to-reorder).
- Editing which games use a genre from this page — that stays the Game form's job
  (`12-games-crud.md`).
- Merging/renaming a genre in a way that reassigns games from one genre to another —
  edit only renames the one row's `name`.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/admin/genres` | Server Component (page) + Client Component (table island) | Yes | Inline-editable genre table: add/edit/delete |
| Navbar (every route) | Server Component wrapper | N/A | New "Admin" dropdown, visible only when logged in |

## 4. Data requirements

No schema changes — `Genre` already exists. `GameGenre.genre` already has
`onDelete: Cascade`, so deleting a `Genre` row automatically removes its `GameGenre`
join rows; the games themselves are untouched, they just lose that genre tag.

```prisma
model Genre {
  id    String      @id @default(uuid())
  name  String
  games GameGenre[]
}
```

Queries needed (rough shape):
- `createGenre({ name })` → `db.genre.create`, after a case-insensitive
  `db.genre.findFirst({ where: { name: { equals, mode: "insensitive" } } })` uniqueness check
- `updateGenre(id, { name })` → same uniqueness check excluding its own `id`, then
  `db.genre.update`
- `deleteGenre(id)` → `db.genre.delete` (cascade handles `GameGenre` cleanup)

## 5. UI requirements

No reference screenshot exists for this page (not part of the original mock set) —
build it to match the established dark theme (`bg-card`, `ring-foreground/10`, accent
teal for primary actions/links) and the header layout already used on
`/brands`/`/brands/[brandId]/consoles`/`/consoles/[consoleId]/games` ("Genres" title +
count on the left, "+ Add Genre" button on the right).

Key elements:
- Table inside a card, one column ("Name"), each row: inline-editable text input +
  a trailing Delete icon button.
- New row from "+ Add Genre" appears at the top, auto-focused.
- Delete opens an `alert-dialog`: "Delete '<name>'? This removes it from every game
  currently tagged with it." with Cancel / Delete (destructive-styled) actions.
- Toast on save/delete success or failure (e.g. "Genre added", "Couldn't delete
  genre — try again").
- Empty state: "No genres yet" + "Add your first genre to start tagging games."

Component breakdown:
- `app/admin/genres/page.tsx` — server component, calls `getAllGenres`, renders
  `GenresTable`
- `app/admin/genres/actions.ts` — `createGenreAction`, `updateGenreAction`,
  `deleteGenreAction` Server Actions
- `components/admin/GenresTable.tsx` — client component, owns the add/edit/delete
  interaction and calls the Server Actions, shows toasts
- `components/ui/alert-dialog.tsx` — new shadcn primitive
- `components/layout/Navbar.tsx` — add the "Admin" dropdown (reuse
  `dropdown-menu`), gated on `user` being non-null, matching the existing `UserMenu`
  pattern in both desktop and mobile layouts

## 6. States to handle

- [ ] Loading — skeleton rows on initial page load
- [ ] Empty — "No genres yet" message + prompt
- [ ] Error — fetch failure on page load (existing try/catch → fallback message
      pattern from brands/consoles/games pages); mutation failure surfaced via toast,
      row reverts to its last saved value
- [ ] Success:
  - [ ] Add a genre → appears in the table, toast confirms
  - [ ] Edit a genre's name inline → saves on blur/Enter, toast confirms
  - [ ] Attempt a duplicate name → inline field error, no server call for update/create
        past the client-side check, plus a server-side re-check as the source of truth
  - [ ] Delete a genre → confirmation dialog, then removal + toast; games previously
        tagged with it keep their other tags and just lose this one
  - [ ] Esc while editing an existing row → reverts to the saved value, no server call
  - [ ] Esc or blur-while-empty on a newly added row → row is discarded, no server call

## 7. Acceptance criteria

- [ ] Logged-in Navbar shows an "Admin" dropdown with one item, "Genre", linking to
      `/admin/genres`; logged-out Navbar shows neither the dropdown nor the route
      (direct navigation to `/admin/genres` while logged out redirects to `/login`,
      already enforced by `proxy.ts`)
- [ ] `/admin/genres` lists every genre alphabetically (or however `getAllGenres`
      already orders them) with inline-editable names
- [ ] Adding, editing, and deleting a genre all persist to the database and are
      reflected immediately in the table and in the Game form's genre picker on next load
- [ ] Duplicate names (case-insensitive) are rejected with a clear inline error,
      both client-side and server-side
- [ ] Deleting a genre in use by games removes only the `GameGenre` tag, never the
      games themselves
- [ ] Every delete requires confirmation via `alert-dialog` before it fires
- [ ] Server Actions re-verify `auth()` independently of the page-level `proxy.ts`
      gate (i.e. calling them unauthenticated fails even if somehow invoked directly)
- [ ] `npm run build`, `npm run lint`, and `npm test` pass

## 8. Dependencies

- `08-auth-middleware.md` (`/admin/:path*` protection already in place, `auth()` helper)
- `06-games-page.md` (`lib/genres.ts`'s existing `getAllGenres` / `GenreOption` type,
  consumed by `GameFormDialog`)
- Introduces `zod` and `sonner` as new dependencies — `10-brands-crud.md`,
  `11-consoles-crud.md`, and `12-games-crud.md` all assume these are already installed
  and follow the same validation/toast pattern established here

## 9. Notes / open questions

- Inline-edit interaction (save-on-blur/Enter, Esc-to-revert, no separate "Save"
  button per row) is a reasonable default matching the "editable table" description
  in `project-overview.md` §8.4, but hasn't been visually confirmed against a
  screenshot since none exists for this page — flag any UX pushback during
  implementation rather than treating this as locked.
- Genre `name` has no `@unique` constraint at the schema level today; this spec
  enforces uniqueness at the application layer only (case-insensitive check before
  create/update). A DB-level unique constraint could be added later if desired, but
  isn't required for this spec's acceptance criteria.
- `sonner`'s toast styling will need to match the dark teal theme — confirm it reads
  correctly against `bg-background`/`bg-card` before calling this done, same kind of
  check that caught the shadcn-init theme regression during the dashboard phase.
