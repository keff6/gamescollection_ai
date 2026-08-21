# Spec: Games CRUD

## 1. Goal

Wire real create/edit/delete into `/consoles/[consoleId]/games`, replacing the no-op
stub left behind by `06-games-page.md`'s `GameFormDialog`, and add a per-card delete
action. This is the last of the three browse-page CRUD specs and the most involved,
since `Game` has by far the most fields and the existing form's shape doesn't map
1:1 onto the schema's authoritative `status` enum (see §9 — needs a decision before
implementation).

## 2. Scope

**In scope:**
- `GameFormDialog`'s `handleSubmit` gets a real Server Action instead of its
  `// TODO` no-op, using the same `zod` + `sonner` pattern as `09`/`10`/`11`. The
  dialog already supports an edit mode (`game?: GameFormValues` prop, per
  `06-games-page.md`) — this spec wires that path too, it just has no live callers yet.
- Edit entry point per `GameCard`: icon button, visible only when logged in, opening
  `GameFormDialog` pre-filled via the `trigger`/`game` props it already accepts.
- Delete entry point per `GameCard`: icon button, visible only when logged in,
  opening the shared confirmation dialog (per `10-brands-crud.md`'s note) — no
  cascade warning needed here, `Game` is the leaf entity.
- `lib/games.ts`: add `createGame`, `updateGame`, `deleteGame`, each scoped to/
  validated against the `consoleId` route param, plus the `GameFormValues` →
  Prisma-shape mapping resolved in §9.
- Server Actions (`app/consoles/[consoleId]/games/actions.ts`, alongside the existing
  `loadMoreGames`) wrapping those three, each re-checking `auth()` server-side.
- Genre multi-select on create/edit writes/rewrites the game's `GameGenre` join rows
  (replace-all-on-save, not a diff — simplest correct behavior given the form always
  submits the full current genre set).

**Out of scope (explicitly not doing this now):**
- Brand or Console CRUD — those are `10-brands-crud.md` and `11-consoles-crud.md`.
- `coverUrl` upload/edit — explicit PRD non-goal (`project-overview.md` §4).
- `saga` field — explicit PRD non-goal, no UI defined.
- Changing which console a game belongs to (edit only changes the game's own fields,
  not `consoleId`) — no UI affordance implies this is needed.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/consoles/[consoleId]/games` | Server Component | View: no. Add/edit/delete: yes | Existing page; add/edit/delete now functional |

No new routes — CRUD happens in place via the existing modal, per
`project-overview.md` §8.4. Create is implicitly scoped to the console via the
route's `consoleId` param.

## 4. Data requirements

No schema changes. `Game.console` already has `onDelete: Cascade` (irrelevant here
since `Game` is the leaf of the hierarchy — nothing cascades *from* deleting a game).

```prisma
model Game {
  id         String      @id @default(uuid())
  title      String
  consoleId  String
  saga       Json?
  year       String?
  developer  String?
  publisher  String?
  status     GameStatus  @default(OWNED)
  rating     Int?
  isNew      Boolean?
  isComplete Boolean?
  isWishlist Boolean?
  isDigital  Boolean?
  notes      String?
  coverUrl   String?
  isFinished Boolean?
  isBacklog  Boolean?
  isPlaying  Boolean?
  console    Console     @relation(fields: [consoleId], references: [id], onDelete: Cascade)
  genres     GameGenre[]
}
```

Queries needed (rough shape):
- `createGame(consoleId, values)` → maps `GameFormValues` to the Prisma shape per
  §9's resolution, `db.game.create` with a nested `genres: { create: [...] }` for the
  selected `genreIds`
- `updateGame(id, values)` → same mapping, `db.game.update`; genre join rows handled
  as delete-all-then-recreate (or Prisma's `set`/`deleteMany`+`create` inside the
  update) for the selected `genreIds`; verify the game's `consoleId` matches the
  route param before writing
- `deleteGame(id)` → `db.game.delete` (cascades to its own `GameGenre` rows only)

Zod schema mirrors `GameFormDialog`'s existing client-side checks (already
established, just needs a server-side twin): `title` required non-empty; `genreIds`
non-empty array; `year` optional, `/^\d{4}$/`; `rating` optional, integer 1–10;
`developer`/`publisher`/`notes` optional strings.

## 5. UI requirements

Reference screenshot: `screenshots/games.png` (card layout) and `screenshots/forms.png`
(Add Game modal) — this spec doesn't change either's visual layout, only makes the
existing form/modal functional and adds edit/delete controls to `GameCard`.

Key elements:
- `GameCard`: add edit/delete icon buttons (visible only when logged in), same
  corner/icon-set/size convention established by `10`'s `BrandCard` and `11`'s
  `ConsoleCard`.
- Edit reuses `GameFormDialog` exactly as built in `06-games-page.md` — no visual
  changes to the form itself, just a live submit handler.
- Toast confirms each successful add/edit/delete; toast surfaces errors on failure.

Component breakdown:
- `components/games/GameFormDialog.tsx` — `handleSubmit` calls the real Server
  Action instead of the `// TODO` no-op; no structural changes to the form itself
- `components/games/GameCard.tsx` — add edit/delete controls when `isLoggedIn`
  (needs the flag threaded down from `GamesList`, which already receives it)
- `app/consoles/[consoleId]/games/actions.ts` — add `createGameAction`,
  `updateGameAction`, `deleteGameAction` alongside the existing `loadMoreGames`
- `lib/games.ts` — add `createGame`, `updateGame`, `deleteGame` plus the
  `GameFormValues` → Prisma mapping helper (unit-test this mapping given its
  branching complexity, same precedent as `sortGames` in `lib/games.test.ts`)

## 6. States to handle

- [ ] Loading — existing skeleton/pagination unaffected
- [ ] Empty — existing empty/search-empty states unaffected
- [ ] Error — create/update/delete failure surfaces via toast, dialog stays open
      (create/edit) or closes without deleting (delete) so the user can retry
- [ ] Success:
  - [ ] Add a game → appears in the current sort/search view (or a toast + no
        visible change if it's filtered out by the active search — decide during
        implementation which is less surprising), toast confirms
  - [ ] Edit a game → fields update in place, including genre tags, toast confirms
  - [ ] Delete a game → removed immediately after confirmation, toast confirms
  - [ ] Edit/delete controls hidden entirely when logged out
  - [ ] Editing a game's genres correctly replaces its old tag set, not adds to it

## 7. Acceptance criteria

- [ ] Logged-in users can add a game via the existing "+ Add Game" button, which now
      actually persists (previously a no-op) and correctly attaches to the current
      `consoleId`
- [ ] Logged-in users can edit any of a game's fields (title, genres, status fields,
      year, rating, developer, publisher, notes) from its card
- [ ] Logged-in users can delete a game from its card, gated behind a confirmation modal
- [ ] The `GameFormValues` ↔ Prisma mapping resolved in §9 is implemented consistently
      for both create and edit, and is covered by unit tests
- [ ] Logged-out users see no edit/delete controls anywhere on the page
- [ ] Server Actions re-verify `auth()` independently of the page-level session check,
      and re-verify the game being edited/deleted actually belongs to the `consoleId`
      in the URL
- [ ] Changes are visible immediately without a manual refresh
- [ ] `npm run build`, `npm run lint`, and `npm test` pass

## 8. Dependencies

- `06-games-page.md` (existing page, `GameFormDialog`, `GameCard`, `GamesList`,
  `lib/games.ts`, `getAllGenres`)
- `08-auth-middleware.md` (`auth()` helper, real `isLoggedIn` checks, already threaded
  into `GamesList`)
- `09-admin-genres.md` (establishes the `zod` + `sonner` + `alert-dialog` pattern, and
  is where genres actually get created — implement after `09` so there's real genre
  data to attach)
- `10-brands-crud.md`, `11-consoles-crud.md` (set the precedent for the shared
  confirm-delete dialog and card edit/delete treatment this spec should match)

## 9. Notes / open questions

- **Needs a decision before implementation — the form's shape doesn't map 1:1 onto
  `status`:** `GameFormDialog` collects `ownedStatus` (owned/wishlist) plus three
  independent playable-status checkboxes (`isBacklog`, `isPlaying`, `isFinished`)
  that can all be checked at once. The schema's authoritative field, `Game.status`
  (`GameStatus`: `WISHLIST` / `BACKLOG` / `OWNED` / `PLAYING` / `COMPLETED`, added in
  `00-database-spec.md`/`01-schema-review.md` specifically to *replace* the
  independent booleans), is a single value — it can't represent "backlog and
  playing" simultaneously. Two ways to resolve, pick one before writing the mapping:
  - **(a) Precedence collapse (recommended, no form changes needed):** when
    `ownedStatus === "wishlist"` → `status = WISHLIST`; otherwise apply the same
    priority order already used for the one-time backfill in
    `01-schema-review.md`'s history entry (`isFinished` → `COMPLETED`, else
    `isPlaying` → `PLAYING`, else `isBacklog` → `BACKLOG`, else → `OWNED`). Keeps the
    existing three-checkbox UI as-is; the legacy boolean columns
    (`isFinished`/`isPlaying`/`isBacklog`/`isWishlist`) can still be written
    alongside `status` for consistency with old data, or left alone as dead columns
    — decide based on whether anything still reads them (dashboard queries do, per
    `lib/dashboard.ts` — check before dropping writes to them).
  - **(b) Change the form to a single status radio** (Wishlist/Backlog/Owned/
    Playing/Completed), matching `status`'s shape exactly. Cleaner data model but a
    real UI change to a form already built and screenshotted in `06-games-page.md`/
    `forms.png` — only do this if (a)'s precedence rule produces genuinely confusing
    results in practice.
  - Either way, `isNew`/`isComplete`/`isDigital` map directly and unambiguously from
    the existing `mediaStatus` radio (`incomplete` → all false, `complete` →
    `isComplete`, `new` → `isNew`, `digital` → `isDigital`).
- Checked `lib/dashboard.ts` directly: it reads `status` for the Completed/Now
  Playing stat cards (`db.game.count({ where: { status: "COMPLETED" | "PLAYING" } })`)
  and reads `isDigital`/`isNew`/`isComplete` for the Games Condition donut — it never
  reads `isFinished`/`isPlaying`/`isBacklog`/`isWishlist`. So this spec's create/update
  path must write `status` (per the precedence rule above) and `isNew`/`isComplete`/
  `isDigital` (direct from `mediaStatus`) accurately; writing the four now-unread
  legacy booleans is optional — leaving them `null` on new/edited rows won't break
  anything currently reading the DB, but keep writing them if it's cheap, for
  consistency with the pre-migration rows that still have them set.
