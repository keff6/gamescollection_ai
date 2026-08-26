# Architecture & Design Decisions — GamesCollection (whole app)

Generated 2026-08-25. Scope: the full application as it exists in the repo root —
`app/`, `components/`, `lib/`, `prisma/schema.prisma`, `auth.ts`, `proxy.ts`. Excludes
one-off migration scripts (`scripts/migrate-mysql-legacy.ts`, `scripts/seed-admin.ts`)
beyond a passing mention, and does not re-derive history already narrated in
`context/current-feature.md` — that file is treated as corroborating evidence, not
re-explained line by line.

## System overview

GamesCollection is a single-user, personal video-game-collection tracker built on
Next.js 16 App Router + React 19 + Prisma 7 + Postgres (Neon). The data model is a
strict hierarchy — `Brand` → `Console` → `Game` — with `Game` ↔ `Genre` as a many-to-many
through an explicit `GameGenre` join table, plus NextAuth v5's `User`/`Account`/
`Session`/`VerificationToken` tables for a single-admin credentials login
(`prisma/schema.prisma:10-160`). Browsing (`/`, `/brands`, `/brands/[brandId]/consoles`,
`/consoles/[consoleId]/games`) is public and rendered by async Server Components that
query Prisma directly; every mutation (create/edit/delete) runs through a `"use server"`
Server Action file colocated with its route (`app/brands/actions.ts`,
`app/brands/[brandId]/consoles/actions.ts`, `app/consoles/[consoleId]/games/actions.ts`,
`app/admin/genres/actions.ts`), each independently re-checking the session via a shared
`requireAuth()` helper (`lib/server-action.ts`). A newcomer should start at
`prisma/schema.prisma` for the data shape, `lib/` for business logic (split file-by-file
into a pure/testable half and a Prisma-backed half), and `app/*/page.tsx` for how each
route wires the two together.

## Key decisions

### Data layer

#### Status modeled as both a single enum and legacy independent booleans, side by side
- **What was chosen:** `Game.status` (`GameStatus` enum: WISHLIST/BACKLOG/OWNED/PLAYING/
  COMPLETED, `@default(OWNED)`) coexists with 7 original boolean columns
  (`isNew`, `isComplete`, `isWishlist`, `isDigital`, `isFinished`, `isBacklog`,
  `isPlaying`) that predate it.
- **Evidence:** `prisma/schema.prisma:53-63`; `context/current-feature.md`'s
  2026-07-04 entry states the enum was added "replacing the 7 independent status
  booleans **going forward**... old boolean columns kept, non-destructive," with a
  backfill migration reconciling 1504 existing rows.
- **Alternative(s) it traded off against:** a hard cutover — migrate the booleans into
  `status` and drop the columns in the same migration, forcing every write path to be
  updated atomically.
- **Why this likely makes sense here:** `isDigital`/`isComplete` are not lifecycle
  states (a game can be complete-in-box AND owned AND playing simultaneously) — the
  schema doc calls this out directly, keeping them independent while only status
  booleans (`isFinished`/`isPlaying`/`isBacklog`/`isWishlist`) collapse into the enum.
  Keeping the old columns non-destructively let the migration ship without touching
  every read path in the same commit, at the cost of now carrying two overlapping
  representations of "is this finished" (`status === COMPLETED` and `isFinished`) that
  a future engineer could get out of sync — `resolveGameStatus` in `lib/game-utils.ts`
  is the single place that keeps them consistent on write, but nothing enforces it at
  the DB level.
- **Confidence:** confirmed intentional — documented in the PRD (`context/
  project-overview.md` §9, §12 item 1) and the feature history.

#### `year` stored as `String?`, not `Int?`, on both `Console` and `Game`
- **What was chosen:** `Console.year String?` and `Game.year String?`
  (`prisma/schema.prisma:25,50`), with year sorting/filtering done in application code
  against a parsed value (`lib/year-utils.ts`'s `parseYearOrInfinity`) rather than a SQL
  `ORDER BY`.
- **Evidence:** `prisma/schema.prisma:25,50`; `lib/year-utils.ts`; `lib/games.ts:174-186`
  fetches **all** of a console's games via `findMany` with no `skip`/`take` at the DB
  level, sorts in memory, then slices for pagination (`sorted.slice(skip, skip+take)`).
- **Alternative(s) it trades off against:** an `Int?` column with real DB-level sort/
  `skip`/`take`, avoiding the full-table fetch-then-slice.
- **Why this likely makes sense here:** the column is a straight carry-over from the
  legacy MySQL data migrated via `scripts/migrate-mysql-legacy.ts` (see the 2026-07-03
  history entry) — original data almost certainly had blank/inconsistent year strings
  that a strict `Int` migration would have had to clean up first. At "low hundreds of
  rows per console" scale (stated non-functional requirement, `project-overview.md`
  §10) the in-memory fetch-all-then-slice is genuinely fine. This was explicitly
  flagged and deferred rather than accidental: the 2026-08-24 Code Scan entry calls out
  "migrating `Game.year`/`Console.year` from string to `Int`... out of scope per
  explicit user decision."
- **Confidence:** confirmed as a known, deliberately-deferred trade-off (not an
  oversight) — see the Code Scan history entry.

#### Delete semantics differ by relationship: DB-level cascade for Brand→Console→Game, app-level block for would-be-cascading UI actions
- **What was chosen:** the schema declares `onDelete: Cascade` on both
  `Console.brand` and `Game.console` (`prisma/schema.prisma:30,64`, also on
  `GameGenre`'s two relations), meaning a raw `db.brand.delete()` would cascade through
  consoles and games. But `deleteBrand`/`deleteConsole` in `lib/brands.ts:72-93` and
  `lib/consoles.ts` don't rely on that cascade for their own UI-triggered deletes —
  they explicitly count children first and throw `AppError` (blocking the delete) if
  any exist, wrapped in `db.$transaction` to narrow a TOCTOU race.
- **Evidence:** `prisma/schema.prisma:30,64`; `lib/brands.ts:72-93` (`deleteBrand`
  checks `_count.consoles > 0` and throws before ever calling `tx.brand.delete`).
- **Alternative(s) it traded off against:** actually using the cascade — let deleting a
  brand silently wipe its consoles and games, matching what the PRD's data-model
  section literally describes ("Deleting a Brand cascades to its Consoles and their
  Games... already enforced at the DB level").
  Note: this is a real discrepancy — the PRD (`project-overview.md` §8.4) still
  describes cascade-on-delete as the intended UX ("UI must confirm this destructive
  action before it fires"), but the shipped `deleteBrand`/`deleteConsole` behavior
  (confirmed in `lib/brands.ts`) is closer to "cascade exists as a DB safety net for
  direct SQL/future code paths, but the UI-facing action refuses instead."
- **Why this likely makes sense here:** blocking-with-a-message is safer for a
  personal collection UI where an accidental brand delete could silently erase
  hundreds of games with no undo — the 2026-08-21 Brands CRUD history entry explicitly
  calls this "an internal contradiction in the spec... resolved before implementing."
- **Confidence:** confirmed intentional per the feature history, but it means the PRD
  document itself is now stale/inaccurate on this point — worth flagging to whoever
  maintains `context/project-overview.md`.

### Rendering & routing

#### Server Components fetch directly with Prisma; Client Components own only the mutable list state
- **What was chosen:** every `page.tsx` under `app/` is an async Server Component that
  calls a `lib/*.ts` function directly (e.g. `getConsoleGames`, `getDashboardStats`),
  no API route in between. Each list-bearing page then hands its initial data to one
  `"use client"` component (`GamesList`, `BrandsGrid`, `ConsolesGrid`, `GenresTable`)
  that holds the list in `useState`, seeded from server props, and patches itself
  optimistically after each Server Action call rather than triggering a full
  `router.refresh()`.
- **Evidence:** `app/consoles/[consoleId]/games/page.tsx:26-31` (direct
  `getConsoleGames`/`getAllGenres` calls); `components/games/GamesList.tsx:47-49`
  (`useState(initialGames)`) and its `handleCreated`/`handleUpdated`/`confirmDelete`
  functions, which locally mutate `games`/`total`/`totalGames` in response to a
  Server Action's return value instead of re-fetching.
- **Alternative(s) it traded off against:** keep list pages fully server-rendered and
  call `revalidatePath`/`router.refresh()` after each mutation, letting the server be
  the sole source of truth; or a client-side data-fetching library (SWR/React Query)
  with cache invalidation.
- **Why this likely makes sense here:** avoids a full round-trip re-render for every
  add/edit/delete (snappier UX for a form-heavy CRUD app), at the cost of each client
  component re-implementing "what does this mutation do to my local list" logic by
  hand — and that hand-written logic has already had at least one real bug found and
  fixed (`GamesList.handleUpdated` not re-checking `matchesSearch()`/adjusting `total`
  the way `handleCreated` did — 2026-08-24 Code Scan entry, item 2). This is a
  legitimate cost of the chosen pattern, not just a note.
- **Confidence:** inferred from a consistent pattern across all four list components;
  no single doc states "we chose local-state patching over revalidatePath," but the
  repeated structure and the bug-fix history make it clearly a considered pattern, not
  an accident.

#### `saga`/tags stored as `Json?` rather than a normalized join table
- **What was chosen:** `Game.saga Json?` (`prisma/schema.prisma:49`) holds a plain
  `string[]` of freeform tag labels, read/written via `parseSaga()`/
  `Prisma.DbNull` in `lib/games.ts:50-53,115`, with no `Saga` model or join table.
- **Evidence:** `prisma/schema.prisma:49`; `lib/games.ts:115` (`saga: saga.length > 0
  ? saga : Prisma.DbNull` — noted in the 2026-08-20 history as needed because "the
  generated Prisma client's nullable-`Json` update type rejects a bare `null`").
- **Alternative(s) it traded off against:** a `Saga`/`GameSaga` model mirroring the
  `Genre`/`GameGenre` pattern already used elsewhere in the same schema, enabling
  querying/filtering games by saga, renaming a saga in one place, and referential
  integrity.
- **Why this likely makes sense here:** the PRD (`project-overview.md` §12 item 5)
  explicitly resolves this as "tag-style labels... stored as `string[]` in the
  existing `saga Json?` column" — a deliberate scope call given sagas are decorative
  metadata (not filtered/aggregated on the dashboard, unlike genre), so the join-table
  ceremony wasn't judged worth it for v1. The cost: a saga name typo can't be
  bulk-corrected, and there's no dedupe across games (each game's tag list is its own
  free text, only de-duped client-side within a single game's edit form per the
  2026-08-20 history).
- **Confidence:** confirmed intentional — explicit PRD resolution.

### Auth

#### `proxy.ts` middleware protects only `/admin/:path*`; Brand/Console/Game write actions are protected exclusively at the Server Action layer
- **What was chosen:** `proxy.ts:12-14`'s `matcher` is `["/admin/:path*"]` only. There
  is no middleware-level protection for `/brands`, `/brands/[brandId]/consoles`, or
  `/consoles/[consoleId]/games` — those routes are fully public for viewing, and their
  write operations are gated only inside each Server Action via `requireAuth()`
  (`lib/server-action.ts:7-13`, called at the top of every action in
  `app/brands/actions.ts`, `.../consoles/actions.ts`, `.../games/actions.ts`,
  `app/admin/genres/actions.ts`).
- **Evidence:** `proxy.ts:1-14`; `app/brands/actions.ts:16-17,32-33,44-45` (three
  separate `requireAuth()` calls, one per action, rather than one shared gate).
- **Alternative(s) it traded off against:** widen the middleware matcher to cover
  brand/console/game routes too (impossible without also blocking the *public browse*
  GET requests to those same paths, since Next's Proxy/middleware can't distinguish
  "GET this page" from "POST this Server Action" cleanly at the route level) — or add
  a single shared auth-check wrapper/HOF around all Server Actions instead of
  repeating `requireAuth()` in every function body.
- **Why this likely makes sense here:** this is a direct, load-bearing consequence of
  the PRD's route table (`project-overview.md` §6): Brand/Console/Game CRUD happens
  *in place* on public browse pages, not under a gated `/admin` prefix — only Genre
  CRUD lives under `/admin`. So middleware can't be the single auth boundary; each
  mutation has to check for itself. The repeated `requireAuth()` per action (rather
  than one shared wrapper) is a small amount of duplication that buys simplicity and
  makes each action's auth check visible at its call site — reasonable at this app's
  size (a handful of actions per entity).
- **Confidence:** confirmed by design, not a gap — the matcher scope matches the PRD's
  explicit routing table, and every action file was verified in this pass to call
  `requireAuth()` independently.

#### Login brute-force protection via a Postgres table, not Redis/Upstash, with a fixed (not sliding) window
- **What was chosen:** `LoginAttempt` model (`prisma/schema.prisma:108-118`) tracked
  by normalized email identifier; `lib/login-rate-limit.ts` implements a 5-attempts/
  15-minute fixed window, checked in `auth.ts:24-27` *before* `db.user.findUnique` and
  `bcrypt.compare` run.
- **Evidence:** `prisma/schema.prisma:108-118`; `lib/login-rate-limit.ts:16-57`;
  `auth.ts:17-39`.
- **Alternative(s) it traded off against:** an in-memory rate limiter (won't survive
  serverless cold starts / won't share state across concurrent Vercel function
  invocations — explicitly called out in the 2026-08-25 history entry); Upstash/Redis
  (new infra dependency for a personal single-user app); a sliding-window algorithm
  (more accurate, more complex to implement correctly).
- **Why this likely makes sense here:** the app already has a Postgres connection via
  Prisma, so reusing it avoids adding new infrastructure for what's a low-traffic,
  single-admin login form — the documented trade-off (accepted explicitly) is a narrow
  race window on the very first failed attempt in a window, whose worst case is
  undercounting by one, never a lockout bypass. Checking the identifier — not the real
  `User` row — before querying `User` at all closes a timing-based user-enumeration
  side channel as a side effect, which is a genuinely non-obvious, well-reasoned
  detail for a "personal app."
- **Confidence:** confirmed intentional with explicit reasoning — see the 2026-08-25
  Login Rate Limiting history entry, which documents the race-condition trade-off
  the team consciously accepted.

#### JWT sessions, no Prisma adapter for NextAuth
- **What was chosen:** `auth.ts:9` sets `session: { strategy: "jwt" }`; there's no
  `PrismaAdapter` wired into the `NextAuth()` config despite `Account`/`Session`/
  `VerificationToken` tables existing in the schema.
- **Evidence:** `auth.ts:1-42` (no adapter import/usage); `prisma/schema.prisma:122-160`
  (adapter tables present but seemingly unused by the actual auth config).
- **Alternative(s) it traded off against:** database sessions via `@auth/prisma-adapter`,
  which would use those `Account`/`Session` tables for real and allow server-side
  session revocation.
- **Why this likely makes sense here:** stated directly in the 2026-08-20 Auth Login
  history entry — "no Prisma adapter, since Credentials doesn't support database
  sessions" — this is a NextAuth v5 framework constraint (Credentials provider requires
  JWT strategy), not a discretionary choice the team weighed alternatives on. The
  `Account`/`Session`/`VerificationToken` tables in the schema are effectively dead
  weight for v1 (no OAuth provider is configured to populate `Account`), likely
  present because they're the standard NextAuth Prisma schema boilerplate copied in
  up front.
- **Confidence:** framework default given the Credentials provider choice — confirmed
  by the history entry's own reasoning, not an examined alternative.

### CRUD architecture split

#### Brand/Console/Game CRUD lives in-place on browse pages; Genre gets a dedicated `/admin/genres` table
- **What was chosen:** Brand, Console, and Game each get a modal dialog
  (`BrandFormDialog`, `ConsoleFormDialog`, `GameFormDialog`) triggered from their
  existing browse-page card grid, with edit/delete icon buttons on each card
  (`BrandCard.tsx`, `ConsoleCard.tsx`, `GameCard.tsx`). Genre instead gets its own
  route, `/admin/genres`, rendering `GenresTable.tsx` — a single-column inline-editable
  HTML `<table>` with click-to-edit cells, no modal.
- **Evidence:** `context/project-overview.md` §8.4's explicit split rationale
  ("Genre — the only entity with a real admin page... since it's a single-field
  (`name`) entity best managed as a simple editable table rather than a
  modal-per-row"); `components/admin/GenresTable.tsx:77-153` implements inline
  edit-in-place (click cell → `<Input>`, blur/Enter commits, Esc reverts) versus
  `components/brands/BrandFormDialog.tsx`'s modal-per-entity pattern.
  `proxy.ts`'s matcher (`/admin/:path*`) only needs to gate this one entity's routes
  precisely because it's the only one under `/admin`.
- **Alternative(s) it traded off against:** a single uniform CRUD pattern for all four
  entities — either all-modal (extra clicks for a trivial one-field rename) or
  all-inline-table (awkward for Game's ~10-field form with genre multi-select and
  saga tags).
- **Why this likely makes sense here:** Genre is a one-field entity; a modal for
  renaming a single string is arguably more friction than an inline-editable cell.
  Brand/Console/Game have multiple fields, relationships, and (for Console/Game)
  cross-entity reassignment (moving a console to a different brand, a game to a
  different console) that a table row can't represent cleanly. This means the app
  has two different edit-affordance idioms a new contributor has to learn (modal vs.
  inline-table), which is a real inconsistency cost, but it's a deliberate one tied
  to field-count, not an accident — it was decided in the PRD before implementation.
- **Confidence:** confirmed intentional — stated directly in the PRD.

### Shared `lib/` layer

#### Pure logic and Prisma-backed logic are split into separate files per entity, driven by a Turbopack client-bundle failure
- **What was chosen:** each entity has two `lib/` files: one Prisma-backed
  (`lib/brands.ts`, `lib/consoles.ts`, `lib/games.ts`, `lib/genres.ts`, importing
  `@/lib/prisma`) and one pure/framework-free (`lib/brand-utils.ts`,
  `lib/console-utils.ts`, `lib/game-utils.ts`, `lib/genre-utils.ts` — zod schemas,
  sort functions, error-message mappers, no `db` import). Client Components import
  only from the `*-utils.ts` half.
- **Evidence:** `lib/game-utils.ts:1-4` imports only `zod`, `@/lib/error-utils`,
  `@/lib/year-utils` — no Prisma; `lib/games.ts:1-18` imports both `@/generated/
  prisma/client` and re-exports `sortGames`/types from `game-utils.ts` for backward
  compatibility (`lib/games.ts:20-21`). `components/games/GamesList.tsx:21` imports
  `sortGames` from `@/lib/game-utils`, not `@/lib/games`.
- **Alternative(s) it traded off against:** one file per entity with both Prisma calls
  and pure helpers, relying on Next.js/Turbopack's `"use client"`/`"use server"`
  boundary analysis to tree-shake the server-only parts out of the client bundle
  automatically.
- **Why this likely makes sense here:** this split was **not** planned upfront —
  the 2026-08-21 Admin Genres history entry states it was done mid-implementation
  after `npm run build` broke with a real Turbopack error ("chunking context does not
  support external modules (node:module)") because a client component was importing
  a sort function from the same file that also imported the Postgres driver. The
  fix — physically separating pure logic into its own file — is a pragmatic
  workaround for a Next.js 16 Turbopack limitation encountered twice (repeated for
  `GamesList.tsx`/`sortGames` per the 2026-08-20 Games CRUD entry), not a stylistic
  preference. It's a good example of "framework constraint forced an architecture
  pattern," and it's now applied consistently across all four entities.
- **Confidence:** confirmed intentional and framework-forced — both history entries
  describe the exact build failure that triggered the split.

#### Centralized `AppError` + `toEntityErrorMessage`, replacing 4 duplicated per-entity error helpers
- **What was chosen:** `lib/app-error.ts`'s `AppError extends Error` marks
  "expected, user-facing" throws; `lib/error-utils.ts`'s `toEntityErrorMessage` only
  passes through `ZodError` issue messages and `AppError.message` — any other
  exception (e.g. a raw Prisma error) falls back to a generic message.
- **Evidence:** `lib/app-error.ts:1-6`; `lib/error-utils.ts:10-18`; used by
  `toBrandErrorMessage`(`lib/brand-utils.ts`)/equivalent console/game/genre helpers,
  called from every Server Action's `catch` block (e.g. `app/brands/actions.ts:22-24`).
- **Alternative(s) it traded off against:** let each entity keep its own hand-rolled
  `toXErrorMessage()` (which is what existed before this refactor) or pass
  `error.message` through unconditionally for any caught `Error`.
- **Why this likely makes sense here:** the 2026-08-24 Code Scan entry documents this
  was a security-adjacent fix, not just a DRY cleanup — the old duplicated helpers
  "passed through `.message` for *any* `Error` instance," meaning a raw Prisma driver
  error (which can include connection strings, internal query fragments, or column
  names) could reach a user-facing toast. Consolidating into one helper with an
  explicit allowlist (`ZodError` | `AppError`) closes that information-exposure gap in
  one place instead of four.
- **Confidence:** confirmed intentional, with a specific security rationale recorded
  in the same commit's history entry.

#### Deliberate double-validation: zod schemas run in both the client form and the Server Action
- **What was chosen:** each entity's form dialog (`BrandFormDialog`, etc.) validates
  client-side with the *same* zod schema the Server Action re-validates with
  server-side (`brandFormSchema`, `consoleFormSchema`, `gameFormSchema`, composed from
  the same per-field schemas each `lib/*.ts` uses for the real DB write).
- **Evidence:** the 2026-08-24 Validation Feedback Cleanup entry describes deduping
  "hand-rolled, sequential `if`-chain client-side validation onto the same zod schemas
  their Server Actions already validate against server-side, closing the gap where
  the two paths could silently drift apart"; `lib/game-utils.ts:43-53` defines
  `gameTitleSchema`/`gameConsoleIdSchema`/etc., consumed by both `lib/games.ts`'s
  `buildGameData` (server) and (per the same history entry) the client dialog's
  combined `gameFormSchema`.
- **Alternative(s) it traded off against:** client-only validation with a separate,
  hand-written server check (what existed before this refactor, and what silently
  drifted); or skip client validation entirely and rely on the Server Action's error
  return to populate the form (worse UX — no synchronous feedback).
- **Why this likely makes sense here:** matches `context/coding-standards.md`'s stated
  rule ("Validate all inputs with Zod") and eliminates an entire class of "client says
  valid, server rejects" bugs, at the cost of needing schemas importable from a
  client-safe file — which is exactly why the pure/Prisma `lib/` split above exists.
  The two decisions reinforce each other.
- **Confidence:** confirmed intentional — explicit rationale in the history entry.

### Styling & theming

#### Tailwind v4 CSS-based theme with a wide semantic token vocabulary, no `tailwind.config.*`
- **What was chosen:** all theming lives in `app/globals.css`'s `:root` block (raw hex
  values) mapped through a `@theme inline` block into Tailwind utility classes — no
  JS/TS Tailwind config file exists in the repo.
- **Evidence:** `app/globals.css:1-98`; `context/coding-standards.md`'s Tailwind
  section explicitly forbids `tailwind.config.ts`/`.js` ("those are for v3") and
  mandates the `@theme` directive instead.
- **Alternative(s) it traded off against:** Tailwind v3-style JS config (not viable —
  the pinned `tailwindcss@^4` package's PostCSS plugin doesn't read it the same way);
  or fewer, more generic tokens (e.g. reusing `--chart-*` for condition/status colors
  instead of dedicated `--condition-*`/`--status-*` tokens).
- **Why this likely makes sense here:** version-mandated, not discretionary — this is
  Tailwind v4's actual configuration model, correctly followed per the project's own
  written standard. The proliferation of narrowly-scoped tokens (`--divider`,
  `--surface`, `--condition-digital`, `--status-playing`, etc., each added
  incrementally as specific UI needs arose per the current-feature history) shows the
  team growing the design system reactively, feature-by-feature, rather than defining
  a complete palette up front — visible directly in the ordering/grouping of
  `globals.css`'s `:root` block, which reads like an accretion log matching the
  history entries almost 1:1 (condition tokens added for the games CRUD, divider
  added for the UI-tweaks pass, etc.). One caught real bug from this style
  (`--condition-digital`/`--condition-new` aliased through a second `var()`
  indirection that Tailwind v4 silently failed to generate a utility class for) is
  itself evidence this is a lived-in, incrementally-grown system rather than a
  from-scratch design — flagged explicitly in the 2026-08-25 UI Tweaks entry.
- **Confidence:** the v4-config choice is framework-mandated (confirmed via written
  standard); the incremental-token-growth pattern is inferred from the file's
  structure and corroborated by the feature history, not stated as a deliberate
  design-system strategy anywhere.

#### `--divider` shipped at a contrast ratio that fails the project's own accessibility bar, by explicit user override
- **What was chosen:** `--divider: #0e2e39` (`app/globals.css:39`) computes to
  ~1.24:1 against card backgrounds and ~1.35:1 against the page background — both
  under the 3:1 WCAG UI-component minimum a prior contrast-fix feature had explicitly
  targeted (per the same history entry, `ring-foreground/30` elsewhere was chosen for
  ~3.7:1 specifically to hit that bar).
- **Evidence:** `app/globals.css:39`; 2026-08-25 UI Tweaks history entry, which
  records the computed contrast numbers being shown to the user and the user
  "explicitly confirmed keeping it as specified after seeing the numbers... shipped
  as-is; not a bug, a deliberate design choice."
- **Alternative(s) it traded off against:** keeping `--border`'s existing #64748b/
  `ring-foreground/30`-style higher-contrast value that the same codebase had
  deliberately raised to 3:1+ elsewhere for accessibility.
- **Why this likely makes sense here:** it doesn't, by the project's own stated bar —
  this is flagged as a genuine, documented inconsistency: the app has two
  self-contradicting standards for visible-but-subtle chrome (borders/inputs fixed to
  ≥3:1 in one feature, dividers explicitly shipped at ~1.3:1 in a later one) and the
  discrepancy is fully attributable to an explicit personal-aesthetic override, not
  an oversight.
- **Confidence:** confirmed as a deliberate, documented exception — not a bug, per
  the history entry's own framing, but worth surfacing since it contradicts the
  a11y precedent set two features earlier in the same file.

### Dashboard aggregation

#### Dashboard stats computed in-process from raw Prisma queries, not SQL aggregation or a materialized view
- **What was chosen:** `lib/dashboard.ts`'s `getDashboardStats` issues 8 parallel
  Prisma queries (`Promise.all`, `lib/dashboard.ts:159-189`) — some are DB-level
  `count()`s, but genre/console/condition breakdowns fetch full row sets
  (`db.genre.findMany` with per-genre game counts, `db.console.findMany` with
  per-console game counts, `db.game.findMany` selecting only 3 boolean columns for
  every game) and do all bucketing/sorting/percent math in plain TypeScript
  (`buildGenreBreakdown`, `buildPlatformBreakdown`, `buildTop5Consoles`,
  `buildConditionBreakdown`, `lib/dashboard.ts:74-157`).
- **Evidence:** `lib/dashboard.ts:159-208`; `lib/dashboard.test.ts` (per the
  2026-08-19 history, 24 unit tests over these exact aggregation functions).
- **Alternative(s) it traded off against:** raw SQL `GROUP BY`/`COUNT` aggregation
  queries (via `$queryRaw` or Prisma's `groupBy`), pushing the bucketing to Postgres;
  or a scheduled/materialized summary table refreshed periodically.
- **Why this likely makes sense here:** at "low hundreds of rows" scale
  (`project-overview.md` §10's stated non-functional requirement — actual seeded data
  is 1504 games per the 2026-07-03 migration entry, still trivial for a single
  `findMany`), fetching full rows and reducing in JS is simpler to write, easier to
  unit-test as pure functions (which is exactly what happened — `buildGenreBreakdown`
  etc. are separately tested with no DB), and avoids hand-writing raw SQL for a
  personal app with no stated performance target. The genuine cost, unaddressed:
  `db.game.findMany({ select: { isDigital, isNew, isComplete } })` pulls one row per
  game just to bucket 3 booleans — a `groupBy` would scale better, but there's no
  evidence this was ever a measured problem.
- **Confidence:** inferred from the code and the stated non-functional requirement
  (no explicit comment says "we chose JS aggregation over SQL GROUP BY because..."),
  but the choice to extract and separately unit-test the pure aggregation functions
  is a clear, deliberate testing-driven pattern, confirmed by the dedicated test file.

## Trade-offs and known limitations

- **`context/project-overview.md` §8.4 describes cascade-delete as the shipped
  behavior for Brand→Console→Game, but the actual code (`lib/brands.ts:72-93`,
  presumably `lib/consoles.ts` similarly) blocks deletion when children exist instead**
  — the PRD document itself is stale on this specific point even though the resolution
  is otherwise well-documented in `context/current-feature.md`.
- **Two different edit-affordance idioms in the same app** (modal dialogs for Brand/
  Console/Game vs. inline-editable table for Genre) — deliberate per-entity, but a
  contributor building a fifth entity has no single obvious pattern to copy.
- **`--divider` token (`app/globals.css:39`) fails the project's own 3:1 contrast
  standard** that other chrome (borders, focus rings) was explicitly raised to meet
  one feature earlier — a known, user-confirmed exception, not fixed.
- **`Game.year`/`Console.year` as `String?`** forces full in-memory sort/pagination in
  `lib/games.ts:164-186` (fetch all of a console's games, sort in JS, then slice) —
  explicitly flagged and deferred, not yet a real problem at this app's data volume
  but would need a migration before the games list could scale past in-memory
  comfort.
- **NextAuth's `Account`/`Session`/`VerificationToken` Prisma tables exist but are
  unused** given the Credentials-provider/JWT-session setup (`auth.ts:9`, no
  `PrismaAdapter`) — likely copied in as NextAuth boilerplate rather than actively
  used, no OAuth provider configured to populate `Account`.
- **`GameStatus` enum and the legacy status booleans (`isFinished`/`isPlaying`/
  `isBacklog`/`isWishlist`) can drift** — nothing at the DB level enforces they stay
  consistent; `resolveGameStatus` in `lib/game-utils.ts` is the only code path that
  keeps them in sync, and only on writes that go through it.
- **`isWishlist`/`GameStatus.WISHLIST` are unreachable from the UI** — the schema and
  enum still carry the value, but per `project-overview.md` §4 no form control can
  set it in v1; dead-but-present schema surface.
- **Client-side list-state patching (`GamesList`, `BrandsGrid`, etc.) duplicates
  server-side filtering/sorting logic** (e.g. `matchesSearch()` in
  `GamesList.tsx:56-58` reimplements the search predicate that `getConsoleGames`
  applies server-side via Prisma's `contains`) — a real bug from exactly this
  duplication was already found and fixed once (`handleUpdated` not calling
  `matchesSearch()`, per the 2026-08-24 Code Scan entry), and the same class of bug
  could recur if the server-side filter logic changes without the client mirror being
  updated too.
- **Login rate limiting has an accepted, narrow race condition** in
  `lib/login-rate-limit.ts`'s `recordFailedAttempt` (first-failure-in-a-window path is
  read-then-write without row locking) — documented and deliberately accepted at this
  app's threat model, but worth knowing it's there.
- **No caching layer anywhere** — every Server Component page re-queries Prisma on
  every request (the root layout itself reads the session on every request via
  `auth()` in `app/layout.tsx:30`, which the 2026-08-20 Auth Middleware entry notes
  moved `/` and `/brands` from static to dynamic rendering). Acceptable at stated
  scale, but means there is no ISR/`revalidate` strategy to fall back on if traffic
  ever grew.

## Interview talking points

**On the pure/Prisma `lib/` split:** "Every entity in this app has two files in `lib/`
— one that touches Prisma, one that's pure functions and zod schemas. That wasn't a
plan up front, it came out of a real Turbopack build failure: a client component was
importing a sort helper from the same file that also imported the Postgres driver, and
Next 16's Turbopack refused to bundle that for the client. Splitting the pure logic out
fixed the build and, as a side effect, gave me files I could unit-test with zero DB
setup — so now that's the standing pattern for every new entity."

**On why Brand/Console/Game CRUD lives on the browse pages instead of under `/admin`
like Genre:** "Genre is a single field, so an inline-editable table row is less
friction than opening a modal to rename one string. Brand/Console/Game have multiple
fields and cross-entity reassignment — moving a console to a different brand, a game to
a different console — which doesn't fit a table row cleanly. So I intentionally have
two CRUD idioms in this app, which is a real inconsistency a new contributor has to
learn, but it's inconsistency I chose for a reason, not one I drifted into."

**On why there's no middleware protecting the brand/console/game write routes:** "My
proxy/middleware only guards `/admin/:path*`, because that's the only entity where the
whole route is behind a login wall. Brands, consoles, and games are publicly browsable
— you can view them logged out — but adding/editing/deleting them are Server Actions on
those same public pages. Middleware can't tell 'GET this page' from 'run this Server
Action' cleanly at the route level, so every one of those actions independently calls a
shared `requireAuth()` at the top of its function body. It's a little more repetition
than one global gate, but it's the correct boundary given the routing shape."

**On the status-enum-plus-legacy-booleans schema:** "I added a `GameStatus` enum but
deliberately didn't rip out the seven old boolean columns in the same migration — I
backfilled the enum from the booleans for all 1500-plus existing rows and kept the old
columns non-destructively so I could migrate read paths incrementally instead of in one
risky commit. The trade-off is that now there are two representations of 'is this game
finished' that could theoretically drift, and only one function in the codebase is
responsible for keeping them in sync on writes — that's a debt I took on knowingly, not
something I'd want to leave forever."

**On the dashboard's aggregation approach:** "The dashboard pulls raw rows out of
Postgres — full game/console/genre lists, not `GROUP BY` queries — and does all the
bucketing and percent math in plain TypeScript functions that I unit test in isolation
from the database. At this app's scale, a few hundred to low thousands of rows, that's
simpler to write and much easier to test than hand-written SQL aggregation, and I'm not
chasing a performance target that doesn't exist for a personal collection tracker. If
this ever needed to scale to a shared multi-tenant product, that's the first thing I'd
move to real `GROUP BY` queries."

## Questions an interviewer might ask

- "Why Server Components with direct Prisma calls instead of a typical API-route +
  client-fetch architecture?" — see *Rendering & routing*: no API layer exists between
  pages and Prisma; Server Actions cover the only client-triggered mutations, per
  `context/coding-standards.md`'s stated Next.js conventions.
- "Your `deleteBrand` schema declares `onDelete: Cascade`, but your UI blocks the
  delete instead of letting it cascade — why keep the DB-level cascade at all?" — see
  *Data layer → Delete semantics*; the PRD text and the shipped behavior actually
  disagree here, worth being honest about in an interview.
- "Why do you have two different CRUD UI patterns (modal vs. inline table) in the same
  app?" — see *CRUD architecture split*; field-count-driven, decided in the PRD before
  implementation.
- "How would this scale if a table grew to hundreds of thousands of rows?" — see
  *Data layer → `year` as String* and *Dashboard aggregation → Trade-offs*: in-memory
  sort/slice and full-row-fetch aggregation would both need to move to DB-level
  `ORDER BY`/`groupBy`, and `year` would need an `Int` migration first.
- "Why store `saga` as JSON instead of a normalized table like you did for genres?" —
  see *Rendering & routing → `saga` as `Json?`*: explicit PRD scope call, decorative
  metadata not queried/aggregated, versus genre which drives dashboard charts.
- "Walk me through what happens end-to-end when an unauthenticated user tries to POST
  a delete on a brand." — see *Auth → middleware scope*: middleware doesn't intercept
  it (route isn't in the matcher); the Server Action's `requireAuth()` call is what
  actually blocks it, returning `{success:false, error:"You must be logged in..."}`.
- "You built your own login rate limiter on Postgres instead of using an off-the-shelf
  service — why?" — see *Auth → Login brute-force protection*: no new infra for a
  single-admin app, reusing the existing Prisma connection, with an explicitly accepted
  narrow race condition.
- "If you started this over, what would you do differently?" — candidates drawn from
  *Trade-offs*: migrate `year` to `Int` from day one, decide the cascade-vs-block delete
  semantics before writing the PRD language that contradicts it, and pick one CRUD
  idiom (or document the field-count threshold that decides which one to use) before
  a fifth entity needs one.
