# GamesCollection — Roadmap

Spec-driven workflow: every task below gets its own file in `specs/`, written *before*
any code is touched. Claude Code implements against the spec, not against a chat message.
Use `SPEC_TEMPLATE.md` to write each one.

Naming convention: `specs/<phase>-<slug>.md`, e.g. `specs/01-navbar-layout.md`.

Priority order chosen: **visible pages first, admin CRUD later.** Auth is pulled in only
where it's actually a blocker (protecting admin actions), not before.

---

## Phase 0 — Foundation (do first, small scope)

Goal: confirm the data layer matches what the UI phases need, and get a working shell.

- [ ] `00-schema-review.md` — Audit existing Prisma schema against the features below.
  Confirm/adjust models: `Brand`, `Console` (FK → Brand), `Game` (FK → Console, FK → Genre),
  `Genre`, `User`. Confirm cascade rules (deleting a Brand — what happens to its Consoles?).
  No UI in this task — schema + migration only.
- [ ] `01-seed-data.md` — Seed script with realistic sample data (a handful of brands,
  consoles, games, genres) so every later page has something to render against.
- [ ] `02-app-shell-navbar.md` — Root layout, Navbar (Home / Brands / Admin / user area),
  base Tailwind theme tokens (colors, spacing, fonts) pulled from your screenshots.

**Exit criteria:** `npm run dev` shows an empty-but-styled shell with working nav links.

---

## Phase 1 — Public read-only pages (core value, no auth required)

These are the pages a visitor sees. No login needed to view any of this.

- [ ] `03-dashboard.md` — Home route `/`. Stats (totals: brands, consoles, games),
  charts (e.g. games per console, games per genre), recent additions. Reference your
  dashboard screenshot for layout/chart types.
- [ ] `04-brands-page.md` — `/brands`. Grid/list of brand cards (name, logo/image if
  you have one, count of consoles). Clicking a brand goes to its consoles page.
- [ ] `05-consoles-page.md` — `/brands/[brandId]/consoles`. List of
  consoles for a given brand. Clicking a console goes to its games page.
- [ ] `06-games-page.md` — `/consoles/[consoleId]/games`. List of games for a
  given console — cover art, title, genre, any metadata you're tracking.

**Exit criteria:** you can browse Brand → Consoles → Games end-to-end using seeded data,
matching your screenshots, with zero login required.

---

## Phase 2 — Simple authentication

Pulled in now because Phase 3 (admin CRUD) needs it to gate write actions.

- [ ] `07-auth-login.md` — `/login` page, single seeded `User` row, credential check
  (email/username + password, hashed), session cookie (e.g. `iron-session` or a minimal
  custom JWT-in-cookie — no NextAuth complexity needed for one user).
- [ ] `08-auth-middleware.md` — Route protection for `/admin/*`, navbar reflects
  logged-in vs logged-out state, logout action.

**Exit criteria:** logged-out users can browse everything from Phase 1 but get redirected
to `/login` if they hit `/admin`; logged-in state persists across refresh.

---

## Phase 3 — CRUD

CRUD is split across two places: Brand/Console/Game are managed in place on their
existing browse pages (no separate admin page for them), while Genre — a single-field
entity — gets a small dedicated admin page since an inline editable table is a better
fit for it than a modal per row.

- [ ] `09-admin-genres.md` — Navbar's Admin link becomes a dropdown (visible once
  logged in); its one item, "Genre", links to `/admin/genres`. That page is an editable
  table: existing genres edit inline, "Add" appends a new inline row, each row has a
  "Delete" action with a confirmation modal. Do this before Games since the game form's
  genre multi-select depends on real genres existing.
- [ ] `10-brands-crud.md` — wire real create/edit/delete into the `/brands` page: the
  existing `AddBrandDialog` stub gets a real submit handler, add an edit entry point per
  card, add a per-card "Delete" action with a confirmation modal (deleting a Brand
  cascades to its Consoles/Games — the modal must say so).
- [ ] `11-consoles-crud.md` — same pattern as Brands, on
  `/brands/[brandId]/consoles`; depends on Brands existing (console create needs a
  brand to attach to, which this page already has via the route param).
- [ ] `12-games-crud.md` — wire real create/edit/delete into
  `/consoles/[consoleId]/games`: the existing `GameFormDialog` stub gets a real
  submit handler for add/edit, add a per-card "Delete" action with a confirmation
  modal; depends on Consoles (route param) and Genres (dropdown) existing.

**Exit criteria:** a logged-in user can fully manage all four entities — Brand/Console/
Game from their own browse pages, Genre from `/admin/genres` — with every delete gated
behind a confirmation modal; changes show up immediately on the Phase 1 public pages.

---

## Phase 4 — Polish (only after everything above works)

- [ ] `14-empty-loading-error-states.md` — every list/page handles zero-data, loading,
  and fetch-failure gracefully.
- [ ] `15-responsive-pass.md` — mobile/tablet breakpoints checked against screenshots.
- [ ] `16-validation-feedback.md` — form validation + toast/inline errors on all CRUD forms.

---

## Why this order

- Phase 1 gives you something demoable fast and lets you validate the schema against
  real UI needs before locking in CRUD forms around it.
- Auth sits right before CRUD because it has no reason to exist until there's something
  to protect — building it earlier just adds friction to Phase 1 iteration.
- Genres before Games in Phase 3 avoids building the game form's genre dropdown against
  an entity that doesn't have CRUD yet. Brand/Console/Game CRUD lives on their own
  browse pages rather than under `/admin` — only Genre gets a dedicated admin page,
  since it's simple enough for an editable table and doesn't have a browse page of
  its own to host CRUD on.

## Decisions locked in from schema + screenshot review

- `Game` needs a `status` enum + `rating` field added via migration — see
  `00-schema-review.md` for the exact shape. **Confirm this before Phase 0 starts.**
- Auth will use NextAuth v5 Credentials provider — the schema already has the
  `Account`/`Session`/`VerificationToken` models scaffolded for it, so Phase 2 is
  lighter than initially assumed (no custom session/cookie code needed).
- `saga` (Json field) and cover-image upload are explicitly out of scope for now —
  no UI in the screenshots references them yet.

## Still open (small decisions, called out in individual specs)

- Genre field: single-select vs. multi-select in the Add Game modal (`06-games-page.md`)
- Exact meaning of the "4 / 23" Brands/Consoles dashboard stat (`03-dashboard.md`)
- Full view of the "Collection Status" dashboard section, currently cropped in the
  screenshot (`03-dashboard.md`)

Resolved since first draft: "Add Brand/Console/Game" buttons are hidden (not
shown-but-gated) for logged-out users; Phase 3 CRUD is split between the entities'
own browse pages (Brand/Console/Game) and a dedicated `/admin/genres` editable-table
page (Genre only) — see `context/project-overview.md` §8.4/§8.5.
