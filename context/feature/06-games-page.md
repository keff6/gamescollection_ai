# Spec: Games Page (+ Add/Edit Game Form)

## 1. Goal

`/consoles/[consoleId]/games` — list every game tracked for a console, with search and sort,
plus the Add/Edit Game form used to create or update entries.

## 2. Scope

**In scope:** games list for a console, search box, sort dropdown, game cards, the Add
Game form (fields, validation, submit — as an inline modal, opened from this page).

**Out of scope:** the create/update mutation actually persisting and being gated by auth
(wired in `12-games-crud.md`, Phase 3) — build the form UI now, wire it to a real server
action once auth exists. Don't block the read-only list on auth.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/consoles/[consoleId]/games` | Server Component (list) + Client Component (modal) | No to view, yes to add/edit | Games for one console |

## 4. Data requirements

Models: `Console` (header), `Game` (filtered by `consoleId`), `Genre` (multi-select
options), `GameGenre` (many-to-many join, written on save).

Query for list: `prisma.game.findMany({ where: { consoleId }, include: { genres: { include: { genre: true } } } })`

**Pagination** — games load in batches of 25, oldest-loaded-first (i.e. appended in
current sort order), with a "Show More" button below the list while more remain. Query
extends with `take: 25, skip: loadedCount` per batch. Re-fetch and reset to the first
batch whenever search or sort changes.

**Status fields** — per `00-schema-review.md`, no enum. The form writes directly to:
- `isWishlist` (owned/wishlist toggle)
- `isComplete` / `isNew` / `isDigital` (media status — mutually exclusive radio group)
- `isBacklog` / `isPlaying` / `isFinished` (playable status — independent checkboxes)

**Genre** — many-to-many via `GameGenre`. Build as multi-select (matches what game cards
actually display, e.g. "JRPG, RPG" for one game), not the single `<select>` shown in the
simplified `forms-opt1.png` mock.

## 5. UI requirements

Reference screenshots: `games-opt1.png` (list), `forms-opt1.png` (form layout/fields),
`game-status.png` (status field detail)

**List page:**
- Breadcrumb: `Brands / Consoles / Games`
- Header: console name as h1 (e.g. "Game Boy") + "{N} games" subtext
- "+ Add Game" button, top-right, teal, hidden when logged out
- Search box ("Search games...") — filters by title, client-side or via search param
- Sort dropdown ("Sort: Title") — other likely options: Year, Rating
- "Showing results X / Y" counter — X reflects games loaded so far, not just visible
- Game cards (stacked list, not grid): title (bold) left, rating badge ("7/10") right;
  second row: YEAR / GENRE / DEVELOPER-PUBLISHER as three label+value columns — GENRE
  shows all of a game's genres comma-separated
- "Show More" button, centered below the list, loads the next batch of 25 games and
  appends to the current list; hidden once every matching game has been loaded

**Add/Edit Game form** (combining `forms-opt1.png` layout with `game-status.png` detail):
- Modal title "Add Game" (or "Edit Game"), close (×) top-right
- Title * — required text input
- Genre * — required multi-select (checkboxes or tag picker), at least one required
- **Owned / Wishlist** toggle (maps to `isWishlist` inverted) — assumption carried from
  `00-schema-review.md`, confirm this is the right read of the original "Status: Owned"
  dropdown before finalizing
- **Game media status** — radio group, shown only when marked Owned: `Incomplete`
  (default), `Complete (CIB)`, `New`, `Digital` — writes to `isComplete`/`isNew`/`isDigital`
- **Game playable status** — checkbox group, shown only when marked Owned: `Is on Backlog`,
  `Currently Playing`, `Finished` — writes to `isBacklog`/`isPlaying`/`isFinished`
  independently (any combination allowed)
- Release Year — text/number input, placeholder "1998"
- Rating (1-10) — number input, placeholder "8"
- Developer — text input, placeholder "e.g. Nintendo"
- Publisher — text input, placeholder "e.g. Nintendo"
- Notes — textarea, placeholder "Personal notes about this game..."
- Footer: "Cancel" (closes modal, discards) / "Add" (teal, submits) buttons, right-aligned

Reused for editing an existing game — same modal, pre-filled, "Add" button becomes "Save".

## 6. States to handle

- [ ] Loading (skeleton list)
- [ ] Empty (console has zero games — empty state prompting "Add Game")
- [ ] No search results ("Showing results 0 / N")
- [ ] Loading next batch (Show More button shows a loading state while fetching)
- [ ] Form validation errors (required fields, rating out of 1-10 range, year format)
- [ ] Submit success (modal closes, list refreshes)
- [ ] Submit failure (inline error, modal stays open)

## 7. Acceptance criteria

- [ ] Games for a console render correctly (verified against Game Boy: 6 games matching
      seed data titles/years/genres)
- [ ] Search narrows the list by title and updates the "Showing results" counter
- [ ] Sort dropdown correctly reorders by the selected field
- [ ] Games load 25 at a time; "Show More" appends the next 25 and disappears once all
      matching games are loaded
- [ ] Changing search or sort resets pagination back to the first batch of 25
- [ ] Form renders all fields per the combined layout above, required fields enforced
      client-side before submit
- [ ] Rating input rejects values outside 1-10
- [ ] Media status radio group enforces mutual exclusivity; playable status checkboxes
      allow any combination
- [ ] Form is fully keyboard-accessible (Esc closes, focus trapped while open)
- [ ] "Add Game" hidden entirely for logged-out users

## 8. Dependencies

- `00-schema-review.md` (needs `rating` field), `01-seed-data.md`,
  `02-app-shell-navbar.md`, `05-consoles-page.md` (incoming link)

## 9. Notes / open questions

- Confirm the Owned/Wishlist ↔ `isWishlist` mapping and whether media/playable status
  should really be hidden for wishlist items, or just optional. Confirmed.
