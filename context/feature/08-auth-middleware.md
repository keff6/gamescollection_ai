# Spec: Auth Middleware & Session-Aware UI

## 1. Goal

Enforce that `/admin/*` is only reachable while logged in, and make every already-built
page reflect real session state instead of the hardcoded stubs left behind by earlier
phases — so Phase 2's exit criteria ("browse everything logged out, get bounced to
`/login` from `/admin`, session survives a refresh") are actually true end to end.

## 2. Scope

**In scope:**
- `middleware.ts` protecting `/admin/:path*`, redirecting unauthenticated requests to
  `/login?callbackUrl=<original path>`.
- Navbar's login-state indicator and Log In/Log Out control wired to the real
  NextAuth session (replacing the `isLoggedIn` prop stub from `02-app-shell-navbar.md`).
- Logout action (NextAuth `signOut`), reachable from the Navbar.
- Replacing the module-level `isLoggedIn = false` stub constants on the brands,
  consoles, and games pages (`04-brands-page.md`, `05-consoles-page.md`,
  `06-games-page.md`) with the real server-side session check, so the "+ Add Brand" /
  "+ Add Console" / "+ Add Game" buttons actually appear once logged in.

**Out of scope (explicitly not doing this now):**
- Any `/admin/*` pages themselves — none exist yet, they arrive in Phase 3
  (`09-admin-shell.md` onward). This spec's middleware just needs to be correct and
  ready for when they land.
- Making the stubbed Add Brand/Console/Game modals actually submit/persist — that's
  each entity's Phase 3 CRUD spec. This spec only fixes *visibility* of those buttons.
- Redirecting logged-out users away from write *actions* they somehow trigger client-side
  (not currently possible — the buttons are hidden, not just disabled).

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/admin/*` (all, future) | N/A — middleware only | Yes | Redirects to `/login?callbackUrl=...` when logged out |
| `/brands`, `/brands/[brandId]/consoles`, `/consoles/[consoleId]/games` | Server Component | No to view | Add-entity buttons now driven by real session, not a stub |
| Navbar (every route) | Server Component wrapper | N/A | Log In/Log Out reflects real session |

## 4. Data requirements

No schema changes. Reads session only, via `auth()` (from `07-auth-login.md`'s
`auth.ts`) in server components, and the edge-safe `auth.config.ts` split (per
`07-auth-login.md` §9) inside `middleware.ts`.

Queries needed: none new — no direct Prisma calls from middleware (Edge runtime can't
run Prisma); page-level `isLoggedIn` checks call `auth()` (JWT session read, no DB hit).

## 5. UI requirements

No new visual design — this spec wires existing UI to real state, it doesn't add UI.

Key elements:
- Navbar: "Log In" link when logged out → `/login` (unchanged); when logged in, the
  Log In link is replaced by a circular avatar on the right showing the user's
  initials (derived from `name`, e.g. "Kevin Fallas" → "KF") — no "Log Out" text
  button inline in the bar
- Clicking the avatar opens a small dropdown/submenu, anchored to the circle, with a
  single "Log Out" item that calls `signOut()`. Dismisses on outside click, Esc, or
  after selecting Log Out.
- Same avatar + dropdown pattern in the mobile nav (inside the hamburger menu) — not
  a separate design, just rendered in that layout's flow instead of the desktop bar
- No visible change to brands/consoles/games pages while logged out (buttons already
  hidden via the stub); logged in, the "+ Add ..." buttons now actually render

Component breakdown:
- `middleware.ts` — root-level, `matcher: ["/admin/:path*"]`
- `components/layout/Navbar.tsx` — updated to receive real session data from its
  server-component parent (`app/layout.tsx`) instead of a hardcoded prop
- `components/auth/UserMenu.tsx` — Client Component rendering the avatar (initials)
  + dropdown with the "Log Out" item wired to `signOut()`; used in both the desktop
  and mobile Navbar layouts. Replaces the previously-planned `LogoutButton.tsx` (its
  one job — calling `signOut()` — now lives inside this menu's Log Out item)
- `app/brands/page.tsx`, `app/brands/[brandId]/consoles/page.tsx`,
  `app/consoles/[consoleId]/games/page.tsx` — swap the `isLoggedIn = false` constant
  for an `await auth()` check

## 6. States to handle

- [ ] Loading — n/a (server-side session check, no client loading flash)
- [ ] Empty — n/a
- [ ] Error — malformed/expired session token treated as logged-out, not a crash
- [ ] Success:
  - [ ] Logged out, visit `/admin` (once it exists) → redirected to `/login?callbackUrl=/admin`
  - [ ] Logged in, visit `/login` directly → redirected away (covered by `07`)
  - [ ] Logged in, click Log Out → session cleared, Navbar flips to logged-out state,
        redirected to `/`
  - [ ] Session persists across a full page reload/new tab (cookie-backed)
  - [ ] Logged in, click the avatar → dropdown opens with "Log Out"; click outside,
        press Esc, or select Log Out → dropdown closes

## 7. Acceptance criteria

- [ ] Unauthenticated request to any `/admin/*` path redirects to `/login` with a
      `callbackUrl` pointing back to the originally requested path
- [ ] After logging in via a `callbackUrl`-carrying redirect, the user lands back on
      the original `/admin/*` path, not always on `/admin`
- [ ] Navbar shows "Log In" when logged out and an initials avatar when logged in, on
      every route (desktop and mobile), without a client-side flash of the wrong state
- [ ] Clicking the avatar opens a dropdown with "Log Out"; selecting it ends the
      session and updates the Navbar immediately
- [ ] "+ Add Brand" / "+ Add Console" / "+ Add Game" buttons are visible when logged
      in and hidden when logged out (previously always hidden regardless of state)
- [ ] Middleware does not import Prisma or `bcryptjs` directly (Edge runtime
      compatibility) — verified by `npm run build` succeeding with no Edge runtime warnings
- [ ] `npm run build` and `npm run lint` pass

## 8. Dependencies

- `07-auth-login.md` (session/auth config to read from)
- `02-app-shell-navbar.md` (Navbar's existing `isLoggedIn` stub prop)
- `04-brands-page.md`, `05-consoles-page.md`, `06-games-page.md` (their `isLoggedIn`
  stub constants)

## 9. Notes / open questions

- Next.js 16 may have changed middleware conventions from what's in training data —
  per `AGENTS.md`, read `node_modules/next/dist/docs/` for the current middleware API
  before implementing (matcher config, edge runtime constraints, etc.).
- `/admin/*` pages don't exist until Phase 3, so this middleware can't be manually
  verified by visiting `/admin` and seeing real content — verify instead by confirming
  the redirect fires (e.g. a temporary route or checking the middleware runs via logs)
  and removing any temporary scaffolding before commit.
- **Resolved:** the logged-in indicator is a circular avatar showing initials derived
  from `User.name`, on the right of the Navbar in both desktop and mobile layouts,
  replacing the "Log In" link/text-button treatment. Clicking it opens a dropdown with
  a single "Log Out" item — confirmed with the user, supersedes the original stub's
  inline "Log Out" text link from `02-app-shell-navbar.md`.
- Needs a dropdown primitive — add shadcn `dropdown-menu` (and `avatar` if used for the
  circle) via the CLI; neither exists in `components/ui/` yet.
