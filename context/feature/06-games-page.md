# Spec: Games Page (+ Add/Edit Game Form)

## 1. Goal

`/consoles/[consoleId]` — list every game owned/tracked for a console, with search and
sort, plus the Add/Edit Game modal used to create or update entries.

## 2. Scope

**In scope:** games list for a console, search box, sort dropdown, game cards, the
Add Game modal (form fields, validation, submit).

**Out of scope:** actual persistence wiring for create/edit (this spec defines the
*form and its fields*; `13-admin-games-crud.md` in Phase 3 wires it to real
create/update/delete server actions once auth exists to gate it). It's fine to build
the modal now and connect it to a real mutation once auth lands — do whichever makes
more sense sequentially when you get there, but don't block the read-only list on auth.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/consoles/[consoleId]` | Server Component (list) + Client Component (modal) | No to view, yes to add/edit | Games for one console |

## 4. Data requirements

Models: `Console` (header), `Game` (filtered by `consoleId`), `Genre` (dropdown options),
`GameGenre` (for the many-to-many save).

Query for list: `prisma.game.findMany({ where: { consoleId }, include: { genres: { include: { genre: true } } } })`

Note: a `Game` can have multiple genres (`GameGenre` is many-to-many), but the modal
shows a single `Select` for Genre. **Decide:** either make the Genre field multi-select
to match the schema's actual capability, or keep it single-select and treat "multiple
genres shown on a card" (e.g. "JRPG, RPG" in the screenshot) as an aggregation the UI
already supports but the *input* only sets one at a time (user adds more via edit).
Recommend multi-select to match what's actually displayed on cards — flag if you'd
rather keep it simple as single-select for now.

## 5. UI requirements

Reference screenshots: `games-opt1.png` (list), `forms-opt1.png` (Add Game modal)

**List page:**
- Breadcrumb: `Brands / Consoles / Games`
- Header: console name as h1 (e.g. "Game Boy") + "{N} games" subtext
- "+ Add Game" button, top-right, teal
- Search box ("Search games...") — filters by title, client-side or via search param
- Sort dropdown ("Sort: Title") — other likely options: Year, Rating
- "Showing results X / Y" counter
- Game cards (stacked list, not grid): title (bold) left, rating badge ("7/10") right;
  second row: YEAR / GENRE / DEVELOPER-PUBLISHER as three label+value columns

**Add Game modal** (`forms-opt1.png`):
- Modal title "Add Game", close (×) top-right
- Title * — required text input
- Genre * — required select (see multi-select decision above)
- Status * — required select, options matching `GameStatus` enum (Wishlist, Backlog,
  Owned, Playing, Completed), default "Owned"
- Release Year — text/number input, placeholder "1998"
- Rating (1-10) — number input, placeholder "8"
- Developer — text input, placeholder "e.g. Nintendo"
- Publisher — text input, placeholder "e.g. Nintendo"
- Notes — textarea, placeholder "Personal notes about this game..."
- Footer: "Cancel" (closes modal, discards) / "Add" (teal, submits) buttons, right-aligned

Reused for editing an existing game — same modal, pre-filled, "Add" button becomes
"Save" (confirm this assumption when building `13-admin-games-crud.md`).

## 6. States to handle

- [ ] Loading (skeleton list)
- [ ] Empty (console has zero games — empty state prompting "Add Game")
- [ ] No search results ("Showing results 0 / N")
- [ ] Form validation errors (required fields, rating out of 1-10 range, year format)
- [ ] Submit success (modal closes, list refreshes)
- [ ] Submit failure (inline error, modal stays open)

## 7. Acceptance criteria

- [ ] Games for a console render correctly (verified against Game Boy: 6 games matching
      seed data titles/years/genres)
- [ ] Search narrows the list by title and updates the "Showing results" counter
- [ ] Sort dropdown correctly reorders by the selected field
- [ ] Add Game modal renders all fields exactly as in `forms-opt1.png`, required fields
      enforced client-side before submit
- [ ] Rating input rejects values outside 1-10
- [ ] Modal is fully keyboard-accessible (Esc closes, focus trapped while open)

## 8. Dependencies

- `00-schema-review.md` (needs `status`/`rating` fields), `01-seed-data.md`,
  `02-app-shell-navbar.md`, `05-consoles-page.md` (incoming link)

## 9. Notes / open questions

- Confirm the Genre field: single-select (simpler, matches modal as literally
  screenshotted) vs. multi-select (matches what game cards actually display). This
  changes the `GameGenre` write logic.
- Confirm whether "Add Game" should be visible-but-gated or hidden for logged-out users,
  same question as raised in `04-brands-page.md` — keep the answer consistent across
  all three "Add X" buttons (Brand/Console/Game).
