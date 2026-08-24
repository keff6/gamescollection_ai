# Spec: Games CRUD

## 1. Goal

Wire real create/edit/delete into `/consoles/[consoleId]/games`, replacing the no-op
stub left behind by `06-games-page.md`'s `GameFormDialog`, and add a per-card delete
action. This is the last of the three browse-page CRUD specs and the most involved:
`Game` has by far the most fields, and this pass also brings the form in line with
`screenshots/form-game-1.png`/`form-game-2.png`, which differ from the currently-built
form in several real ways (see §9) — not just "wire up the submit handler."

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
- Form field changes (see §9 for full rationale/mapping), all driven by the reference
  screenshots and by explicit limits given for this review:
  - **Console**: new field, a `select` of every console, defaulting to the current
    route's console (create) or the game's current console (edit) — and *editable*,
    i.e. saving with a different console reassigns the game, same pattern as
    `11-consoles-crud.md`'s Brand reassignment. Needs a new lean query,
    `getAllConsoles()` in `lib/consoles.ts` (id/name/brandName), mirroring
    `getAllBrands()`.
  - **Title**: add a 80-character max (client `maxLength` + server zod).
  - **Year**: changes from a free-text 4-digit input to a `select`, options generated
    1985 → current year, **descending** (newest first) — mirrors
    `lib/console-utils.ts`'s `getConsoleYearOptions` pattern exactly, just a
    different start year and already-descending order.
  - **Developer** / **Publisher**: add a 50-character max each.
  - **Notes**: add a 200-character max.
  - **Genre(s)**: restyle from the current checkbox-list-in-a-box to a
    select-dropdown ("Add genre(s)") + removable chips below it, matching
    `form-game-2.png`. Still backed by the same `genreIds: string[]`, still
    required (at least one).
  - **Sagas/Tags**: new field, not previously built. A tag input — text box + "Add"
    button (or Enter) appends a chip, each chip has an inline "x" to remove. Each
    tag ≤ 50 characters, trimmed, non-empty; zero or more allowed. Maps to the
    existing `Game.saga` `Json?` column as a plain `string[]` (`null` when empty).
  - **Rating**: unchanged — stays the existing 1–10 number input. It isn't visible in
    either reference screenshot, but nothing about this review's field-by-field
    instructions calls for removing it, so it's left exactly as currently built.
  - **Wishlist removed**: the current form's "Status: Owned / Wishlist" `RadioGroup`
    (`ownedStatus`) is dropped entirely — neither screenshot shows it, and
    `isWishlist`/`GameStatus.WISHLIST` are explicitly out of scope for v1 (see §9).
    "Game media status" and "Game playable status" stop being conditionally rendered
    (previously shown only when `ownedStatus === "owned"`) and are now always shown.
- `lib/games.ts`: add `createGame`, `updateGame`, `deleteGame`, plus the
  `GameFormValues` → Prisma-shape mapping resolved in §9.
- Server Actions (`app/consoles/[consoleId]/games/actions.ts`, alongside the existing
  `loadMoreGames`) wrapping those three, each re-checking `auth()` server-side.
- Genre multi-select on create/edit writes/rewrites the game's `GameGenre` join rows
  (replace-all-on-save, not a diff — simplest correct behavior given the form always
  submits the full current genre set).
- `GamesList` (the existing client component that already owns `games`/`total` as
  local state for pagination, per `06-games-page.md`) also owns add/edit/delete/
  reassign so the list updates immediately without a router refresh — same role
  `BrandsGrid`/`ConsolesGrid` play for their pages. Reassigning a game to a different
  console removes it from the current page's list immediately, same UX as
  `11-consoles-crud.md`'s brand reassignment.

**Out of scope (explicitly not doing this now):**
- Brand or Console CRUD — those are `10-brands-crud.md` and `11-consoles-crud.md`.
- `coverUrl` upload/edit — explicit PRD non-goal (`project-overview.md` §4).
- `isWishlist` / `GameStatus.WISHLIST` — out of scope for v1 per this review. The
  enum value and boolean column stay in the schema (untouched, in case a later phase
  adds it back), but this spec's form has no control that can set either.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/consoles/[consoleId]/games` | Server Component | View: no. Add/edit/delete: yes | Existing page; add/edit/delete now functional |

No new routes — CRUD happens in place via the existing modal, per
`project-overview.md` §8.4. Create still defaults to the route's `consoleId`, but
(per §2) the form's new Console field can target a different console.

## 4. Data requirements

No schema changes — `saga Json?` already exists and is the right shape for a
`string[]`. `Game.console` already has `onDelete: Cascade` (irrelevant here since
`Game` is the leaf of the hierarchy — nothing cascades *from* deleting a game).

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
- `getAllConsoles()` (new, `lib/consoles.ts`) → lean `{ id, name, brandName }[]`,
  ordered by brand name then console name, for the form's Console dropdown —
  mirrors `getAllBrands()`'s role in `11-consoles-crud.md`.
- `createGame(consoleId, values)` → maps `GameFormValues` to the Prisma shape per
  §9's resolution (note: `consoleId` here is *from the form*, not necessarily the
  route param — see §9), `db.game.create` with a nested `genres: { create: [...] }`
  for the selected `genreIds`.
- `updateGame(id, values)` → same mapping, `db.game.update`, including reassigning
  `consoleId` when the form's Console field changed; genre join rows handled as
  delete-all-then-recreate (or Prisma's `set`/`deleteMany`+`create` inside the
  update) for the selected `genreIds`.
- `deleteGame(id)` → `db.game.delete` (cascades to its own `GameGenre` rows only).

Zod schema (mirrors `GameFormDialog`'s client-side checks, needs a server-side
twin) — split into a new `lib/game-utils.ts` with **no Prisma import**, same
precedent as `lib/brand-utils.ts`/`lib/console-utils.ts` (a client component needs
these schemas/helpers at runtime, not just as types, and importing them from
`lib/games.ts` would pull `lib/prisma`'s Postgres driver into the client bundle and
break the Turbopack build — this exact failure already happened once, during
`09-admin-genres.md`):
- `title`: required, trimmed, 1–80 chars
- `consoleId`: required, non-empty string
- `genreIds`: non-empty array
- `year`: optional, must be one of `getGameYearOptions()`'s values (1985 →
  current year)
- `rating`: optional, integer 1–10
- `developer` / `publisher`: optional strings, ≤ 50 chars
- `notes`: optional string, ≤ 200 chars
- `saga`: optional array of trimmed strings, each 1–50 chars

## 5. UI requirements

Reference screenshots: `screenshots/form-game-1.png` (Title/Console/Year/Developer/
Publisher/Game media status) and `screenshots/form-game-2.png` (Game playable status/
Notes/Genre(s)/Sagas-Tags) — these supersede `screenshots/forms.png` for the Add/Edit
Game modal's exact field set and layout. `screenshots/games.png` is unchanged for the
card layout.

Key elements:
- `GameCard`: add edit/delete icon buttons (visible only when logged in), same
  corner/icon-set/size convention established by `10`'s `BrandCard` and `11`'s
  `ConsoleCard`.
- Edit reuses `GameFormDialog`, restructured per §2/§9 — Console field, restyled
  Genre picker, new Sagas field, no more Owned/Wishlist toggle.
- Toast confirms each successful add/edit/delete; toast surfaces errors on failure.

Component breakdown:
- `components/games/GameFormDialog.tsx` — field-level changes per §2, plus
  `handleSubmit` calls the real Server Action instead of the `// TODO` no-op
- `components/games/GameCard.tsx` — add edit/delete controls when `isLoggedIn`
  (threaded down from `GamesList`, which already receives it)
- `components/games/GamesList.tsx` — owns add/edit/delete/reassign against its
  existing `games`/`total` state (see §2)
- `app/consoles/[consoleId]/games/actions.ts` — add `createGameAction`,
  `updateGameAction`, `deleteGameAction` alongside the existing `loadMoreGames`
- `lib/games.ts` — add `createGame`, `updateGame`, `deleteGame`
- `lib/game-utils.ts` — new file: zod schemas, `getGameYearOptions()`, the
  `GameFormValues` → Prisma mapping helper (unit-test this given its branching
  complexity, same precedent as `sortGames` in `lib/games.test.ts`)
- `lib/consoles.ts` — add `getAllConsoles()`

## 6. States to handle

- [ ] Loading — existing skeleton/pagination unaffected
- [ ] Empty — existing empty/search-empty states unaffected
- [ ] Error — create/update/delete failure surfaces via toast, dialog stays open
      (create/edit) or closes without deleting (delete) so the user can retry
- [ ] Success:
  - [ ] Add a game → appears in the current sort/search view (or a toast + no
        visible change if it's filtered out by the active search — decide during
        implementation which is less surprising), toast confirms
  - [ ] Edit a game → fields update in place, including genre tags and saga tags,
        toast confirms
  - [ ] Edit a game and change its Console → game disappears from the current
        page's list immediately, toast confirms
  - [ ] Delete a game → removed immediately after confirmation, toast confirms
  - [ ] Edit/delete controls hidden entirely when logged out
  - [ ] Editing a game's genres correctly replaces its old tag set, not adds to it
  - [ ] Adding a duplicate saga tag (case-insensitive) or an empty/whitespace-only
        tag is rejected client-side without a server round-trip

## 7. Acceptance criteria

- [ ] Logged-in users can add a game via the existing "+ Add Game" button, which now
      actually persists (previously a no-op), defaulting to the current `consoleId`
      but able to target any console via the new Console field
- [ ] Logged-in users can edit any of a game's fields (title, console, genres, media/
      playable status, year, rating, developer, publisher, notes, sagas) from its card
- [ ] Logged-in users can delete a game from its card, gated behind a confirmation modal
- [ ] The `GameFormValues` ↔ Prisma mapping resolved in §9 is implemented consistently
      for both create and edit, and is covered by unit tests
- [ ] Title/Developer/Publisher/Notes/each saga tag enforce their character limits
      client-side (`maxLength`) and server-side (zod)
- [ ] Year is a descending select (current year → 1985), not free text
- [ ] The form has no control that can set `isWishlist`/`GameStatus.WISHLIST`
- [ ] Logged-out users see no edit/delete controls anywhere on the page
- [ ] Server Actions re-verify `auth()` independently of the page-level session check
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
  confirm-delete dialog, card edit/delete treatment, the "lean list query for a
  reassignment dropdown" pattern (`getAllBrands`), and the year-`select` pattern
  (`getConsoleYearOptions`) this spec reuses directly)

## 9. Notes / decisions from this review

This review compared the previously-written spec against the real current
`GameFormDialog.tsx` and the new reference screenshots, and found three real
divergences (not just "wire up submit"). Resolved as follows:

- **Wishlist/status mapping — resolved, no longer an open decision.** The
  previous draft of this spec flagged that `GameFormDialog` collected an
  `ownedStatus` (owned/wishlist) toggle that couldn't map 1:1 onto the schema's
  single `Game.status` enum. Both reference screenshots confirm there's no
  Owned/Wishlist control in the form at all, and this review's instructions
  confirm `isWishlist` is out of scope for v1 — so the toggle is simply removed
  (see §2), and the mapping collapses to one unconditional precedence rule:
  `isFinished` → `COMPLETED`, else `isPlaying` → `PLAYING`, else `isBacklog` →
  `BACKLOG`, else → `OWNED` (same priority order as the one-time backfill in
  `01-schema-review.md`'s history entry, minus the wishlist branch, which is now
  unreachable from this UI). `WISHLIST` stays a valid enum value for any future
  phase, just not settable here. Checked `lib/dashboard.ts` directly: it reads
  `status` for the Completed/Now Playing stat cards and reads `isDigital`/`isNew`/
  `isComplete` for the Games Condition donut — it never reads `isFinished`/
  `isPlaying`/`isBacklog`/`isWishlist`. So create/update must write `status`
  (per the rule above) and `isNew`/`isComplete`/`isDigital` (direct from the
  existing `mediaStatus` radio: `incomplete` → all false, `complete` →
  `isComplete`, `new` → `isNew`, `digital` → `isDigital`) accurately; writing the
  four now-unread legacy booleans (`isFinished`/`isPlaying`/`isBacklog`/
  `isWishlist`) is optional — leaving them `null` won't break anything currently
  reading the DB, but keep writing the three that still apply
  (`isFinished`/`isPlaying`/`isBacklog`) if it's cheap, for consistency with
  pre-migration rows that still have them set. Never write `isWishlist`.
- **Console reassignment — now in scope.** The previous draft explicitly excluded
  changing a game's console ("no UI affordance implies this is needed"). The
  screenshot shows a Console field, and this review resolved it as editable/
  reassignable (confirmed against the user) — same pattern as `11-consoles-crud.md`'s
  Brand field on `Console`. This replaces the old "verify the game being edited
  belongs to the `consoleId` in the URL" constraint: reassignment is intentional, so
  `updateGame` writes whatever `consoleId` the form submits, and the edited game
  disappears from the current page's `GamesList` state when it no longer matches
  the route's console.
- **Saga — now in scope**, reversing `project-overview.md`'s prior open question #5
  and non-goal listing (updated alongside this spec). Stored as `string[]` directly
  in the existing `saga Json?` column; no schema change. UI is a tag input, matching
  `form-game-2.png`'s "Sagas/Tags" section exactly (text input + "Add" button, chips
  with an inline remove "x" below).
- Genre widget and field character limits (Title/Developer/Publisher/Notes/Year) are
  new information from this review, not previously specified — captured in §2/§4
  above, no further open question.
