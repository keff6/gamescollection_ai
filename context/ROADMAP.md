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
- [ ] `05-consoles-page.md` — `/brands/[brandId]` (or `/consoles?brand=`). List of
  consoles for a given brand. Clicking a console goes to its games page.
- [ ] `06-games-page.md` — `/consoles/[consoleId]` (or similar). List of games for a
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

## Phase 3 — Admin CRUD

One spec per entity, each covering list/create/edit/delete for that entity.

- [ ] `09-admin-shell.md` — `/admin` layout, sidebar or tabs for Brands/Consoles/Games/Genres.
- [ ] `10-admin-brands-crud.md`
- [ ] `11-admin-genres-crud.md` — do this before consoles/games since both depend on it
  existing for dropdowns.
- [ ] `12-admin-consoles-crud.md` — depends on Brands existing (dropdown to assign brand).
- [ ] `13-admin-games-crud.md` — depends on Consoles + Genres existing (dropdowns).

**Exit criteria:** a logged-in user can fully manage all four entities; changes show up
immediately on the Phase 1 public pages.

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
- Genres before Consoles/Games in Phase 3 avoids building a dropdown against an entity
  that doesn't have CRUD yet.

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
- Whether "Add Brand/Console/Game" buttons are hidden or shown-but-gated for logged-out
  users (`04-brands-page.md`, `06-games-page.md`)
- Exact meaning of the "4 / 23" Brands/Consoles dashboard stat (`03-dashboard.md`)
- Full view of the "Collection Status" dashboard section, currently cropped in the
  screenshot (`03-dashboard.md`)
