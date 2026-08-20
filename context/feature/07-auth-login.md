# Spec: Auth Login

## 1. Goal

Let the collection owner log in with a single seeded account (email + password) so
write actions can be gated in later phases. No public registration.

## 2. Scope

**In scope:**
- NextAuth v5 (Auth.js) Credentials provider, backed by the existing `User` model
  (`email` + `password`) via `@prisma/client` (no new adapter package needed — see
  §9 on why the Prisma adapter itself isn't used for sessions).
- `/login` page: email + password form, inline error on bad credentials, redirects to
  `/admin` (or an incoming `callbackUrl`) on success.
- `AUTH_SECRET` env var + NextAuth config (`auth.ts`, `app/api/auth/[...nextauth]/route.ts`).
- Env-driven admin provisioning script (`scripts/seed-admin.ts`) that reads
  `ADMIN_EMAIL` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`, hashes the password
  with bcrypt, and upserts the single `User` row. No credentials are ever hardcoded
  in the repo.

**Out of scope (explicitly not doing this now):**
- Protecting `/admin/*` or any other route (`08-auth-middleware.md`).
- Wiring the Navbar's login-state indicator or the existing `isLoggedIn` stubs on
  brands/consoles/games pages to the real session (also `08-auth-middleware.md`).
- Registration, password reset/change, "remember me", multi-user support.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/login` | Server Component page + Client Component form | No (redirects away if already logged in) | Credential login form |
| `/api/auth/[...nextauth]` | Route Handler | N/A | NextAuth catch-all (signIn/signOut/session/csrf) |

## 4. Data requirements

Models touched: `User` only (`email`, `password`, `username`). No schema/migration
changes — `email` and `password` already exist and are nullable/optional at the DB
level, which is fine since only the one seeded row will ever have them set.

```prisma
model User {
  id            String    @id @default(uuid())
  name          String
  lastname      String?
  username      String    @unique
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          String?
  refreshToken  String?   @map("refresh_token")
  accounts      Account[]
  sessions      Session[]
  @@map("user")
}
```

Queries needed (rough shape):
- `authorize()` callback: `prisma.user.findUnique({ where: { email } })`, then
  `bcrypt.compare(password, user.password)`.
- `scripts/seed-admin.ts`: `prisma.user.upsert({ where: { email: ADMIN_EMAIL }, ... })`
  with `bcrypt.hash(ADMIN_PASSWORD, 10)`.

New env vars (add to `.env`, document a `.env.example`):
- `AUTH_SECRET` — random secret for NextAuth JWT signing (`npx auth secret` or
  `openssl rand -base64 33`)
- `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` — consumed only by
  `scripts/seed-admin.ts`, not read at app runtime

New dependency: `bcryptjs` (pure JS, no native build step — safer for Vercel) +
`next-auth@beta` (v5).

## 5. UI requirements

No reference screenshot provided for this screen — build against the existing dark
theme (teal accent, `Card`/`Button`/`Input`/`Label` shadcn primitives already in the
repo from the brands/consoles pages).

Key elements:
- Centered card, app wordmark/logo above the form (reuse Navbar's logo mark)
- Email input, Password input (masked), "Log In" submit button (teal, full-width)
- Inline error banner/text on invalid credentials ("Invalid email or password") —
  do not reveal whether the email or the password was wrong
- Submit button shows a loading/disabled state while the request is in flight

Component breakdown:
- `app/login/page.tsx` — Server Component; redirects to `/admin` (or `callbackUrl`
  search param) if a session already exists
- `components/auth/LoginForm.tsx` — Client Component; calls NextAuth's `signIn`
  ("credentials") and handles pending/error state

## 6. States to handle

- [ ] Loading (submit button disabled + spinner while `signIn` resolves)
- [ ] Empty (n/a — no list data on this page)
- [ ] Error (invalid credentials → inline message; unexpected/server error → generic
      inline message, form stays filled except password)
- [ ] Success (redirect to `callbackUrl` if present, else `/admin`)
- [ ] Already-authenticated visit to `/login` → immediate redirect, form never renders

## 7. Acceptance criteria

- [ ] Logging in with the seeded admin's correct email + password redirects to `/admin`
- [ ] Logging in with a wrong password or unknown email shows one generic inline error,
      no field-level leak of which part was wrong
- [ ] Session persists across a full page reload (cookie-backed JWT session)
- [ ] Visiting `/login` while already logged in redirects immediately, no flash of the form
- [ ] `scripts/seed-admin.ts` run against a fresh DB (with `ADMIN_EMAIL`/`ADMIN_USERNAME`/
      `ADMIN_PASSWORD` set in `.env`) creates exactly one `User` row with a bcrypt hash
      in `password`, never the plaintext
- [ ] Re-running `scripts/seed-admin.ts` is idempotent (upsert, not a duplicate row or crash)
- [ ] No credentials, secrets, or `.env` values are committed to the repo

## 8. Dependencies

- `00-database-spec.md`, `01-schema-review.md` (User model already has the needed columns)
- `02-app-shell-navbar.md` (theme tokens, logo mark reused on the login card)

## 9. Notes / open questions

- **Resolved:** login identifier is **email** (not `username`) — confirmed with the
  user. `scripts/seed-admin.ts` must set both `email` and `username` on the row since
  `username` is a required, unique column even though login itself only checks email.
- **Resolved:** the admin account is provisioned via an **env-driven seed script**
  (`scripts/seed-admin.ts`), not a Prisma `seed` hook or manual insert — confirmed
  with the user.
- **Why no Prisma adapter for sessions:** the `Account`/`Session` tables already in
  `schema.prisma` were scaffolded for future OAuth providers, but NextAuth v5's
  Credentials provider only supports the **JWT** session strategy (database sessions
  require an OAuth-style adapter flow Credentials doesn't participate in). This spec
  configures `session: { strategy: "jwt" }` and leaves `Account`/`Session` unused for
  now — this is expected NextAuth behavior, not a schema gap.
- **Split config heads-up for `08-auth-middleware.md`:** the `authorize()` callback
  needs Prisma + `bcryptjs`, which don't run on the Edge runtime middleware uses. Auth.js's
  documented pattern is to split config into an edge-safe `auth.config.ts` (no
  Credentials provider/Prisma) imported by `middleware.ts`, and a full `auth.ts` (with
  Credentials + Prisma) used by the route handler and server components. Structure
  this spec's `auth.ts` so `08` can do that split without a rewrite.
- Confirm `bcryptjs` (vs. native `bcrypt`) is acceptable — chosen for zero native
  build step on Vercel; flag if there's a reason to prefer something else. Confirmed.
