# Spec: Empty / Loading / Error States Audit

## 1. Goal

Every list-driven page already grew its own loading/empty/error handling incrementally
as it was built (Phase 1 pages) and extended (Phase 3 CRUD) — this is not a from-scratch
build. This spec is an audit against that existing coverage, plus two concrete gaps
found while auditing: no app-wide error boundary exists, and one client-side mutation
(pagination "Show More") has no failure handling at all.

## 2. Scope

**In scope:**
- Add `app/error.tsx` — a root [error boundary](https://nextjs.org/docs) styled to match
  the dashboard's existing inline "Dashboard unavailable" fallback (`app/page.tsx`'s
  catch block), with a "Try again" button calling the `reset()` prop Next.js passes in.
  Today the app has **zero** `error.tsx` files anywhere; the four data-fetching pages
  (`app/page.tsx`, `app/brands/page.tsx`, `app/brands/[brandId]/consoles/page.tsx`,
  `app/consoles/[consoleId]/games/page.tsx`) each catch their own initial-fetch failure
  inline and render a styled fallback, so a root boundary is a safety net for anything
  those inline `try`/`catch` blocks don't cover (client-side render-time throws,
  Server Action failures during hydViewed interaction, admin pages not yet covered by
  an inline catch).
- Fix `components/games/GamesList.tsx`'s `loadMoreGames` call (pagination "Show More",
  around line 108) — it currently calls the Server Action with no `try`/`catch` at all,
  unlike every other mutation in this component (add/edit/delete all wrap their action
  calls and `toast.error()` on failure). Wrap it the same way: on failure, `toast.error`
  with a retry-friendly message and leave the already-loaded games in place (no partial
  state change) so the user can press "Show More" again.
- Full audit pass (read-only unless a gap is found) confirming the following already-built
  states are still correct and consistent, since they were built across five separate
  features and never checked against each other in one pass:
  - Loading: `app/loading.tsx`, `app/brands/loading.tsx`, `app/admin/genres/loading.tsx`,
    `app/brands/[brandId]/consoles/loading.tsx`, `app/consoles/[consoleId]/games/loading.tsx`
    all exist — confirm each renders a skeleton matching its page's actual layout (not a
    generic spinner) and that none regressed since being written.
  - Empty: confirm every list still shows a distinct empty-state message — `BrandsGrid`
    ("No brands yet"), `ConsolesGrid` (zero-total vs. zero-after-filter, two messages),
    `GamesList` ("No games yet" vs. "No games match your search"), `GenresTable`
    ("No genres yet"). No new empty states needed — this is a regression check.
  - Error (initial fetch): confirm the four inline `try`/`catch` fallbacks in
    `app/page.tsx`, `app/brands/page.tsx`, `app/brands/[brandId]/consoles/page.tsx`,
    `app/consoles/[consoleId]/games/page.tsx` still log via `console.error` and render a
    styled (not raw-thrown) fallback.
  - Error (mutation): confirm `BrandFormDialog`, `ConsoleFormDialog`, `GameFormDialog`,
    and `GenresTable`'s inline add/edit/delete all still surface Server Action failures
    via `toast.error` without closing the dialog / discarding user input (already the
    pattern per `10`/`11`/`12`'s specs — verify no drift).

**Out of scope (explicitly not doing this now):**
- Any new loading/empty/error *design* — reusing exactly the visual language already
  established (skeletons, `text-muted-foreground` empty messages, `toast.error`, the
  dashboard's inline fallback card).
- Retry/offline handling beyond `error.tsx`'s built-in `reset()` — no service worker,
  no optimistic-retry queue.
- `app/admin/genres/page.tsx`'s own inline `try`/`catch` — already confirmed present via
  audit, only listed here for the "still consistent" check.

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/` (new `app/error.tsx`) | Client Component (error boundary) | No | Root error boundary, catches anything below it in the tree |

No other new routes — every other item in scope touches existing pages/components.

## 4. Data requirements

None — no schema or query changes. This spec is UI/error-handling only.

## 5. UI requirements

Reference: `app/page.tsx`'s existing inline dashboard-unavailable fallback (lines ~14–23)
is the closest existing pattern for `app/error.tsx`'s copy/layout — reuse its wording
style ("Something went wrong loading your collection...") rather than a generic Next.js
error page.

Key elements:
- `app/error.tsx`: centered heading + subtext (matching the dashboard fallback) + a
  "Try again" `Button` calling `reset()`. Must be a Client Component (`"use client"`)
  per Next.js's `error.tsx` contract.
- `GamesList.tsx`'s "Show More" button: no new UI element needed, just the same
  `toast.error` treatment its sibling add/edit/delete calls already use.

Component breakdown:
- `app/error.tsx` — new file
- `components/games/GamesList.tsx` — wrap the existing `loadMoreGames` call (~line 108)
  in `try`/`catch`

## 6. States to handle

- [ ] Loading — audit only, no changes expected
- [ ] Empty — audit only, no changes expected
- [ ] Error — `app/error.tsx` added as a safety net; `loadMoreGames` failure now surfaces
      via toast instead of failing silently (or crashing to Next's default error page if
      it happened to throw past hydration)
- [ ] Success — n/a, this spec doesn't touch success paths

## 7. Acceptance criteria

- [ ] `app/error.tsx` exists, is a Client Component, renders a styled fallback matching
      the app's existing dark theme, and has a working "Try again" button
- [ ] `loadMoreGames`'s Server Action call in `GamesList.tsx` is wrapped in `try`/`catch`;
      a simulated failure (e.g. temporarily throwing inside the action) shows a toast and
      leaves the currently-loaded games list unchanged
- [ ] Every loading/empty/error state enumerated in §2's audit list is manually re-verified
      in the browser and still matches its original spec's intended behavior — any drift
      found gets fixed as part of this spec, not deferred
- [ ] `npm run build`, `npm run lint`, and `npm test` pass

## 8. Dependencies

- All of Phase 1 (`03`–`06`) and Phase 3 (`09`–`12`) — this spec audits their existing
  loading/empty/error work rather than building new pages.

## 9. Notes / open questions

- Considered adding per-route `error.tsx` files (e.g. `app/brands/error.tsx`) instead of
  just a root one, but the four pages that fetch data already catch their own initial-load
  failures inline — a route-level boundary would only ever catch what those `catch` blocks
  already handle, since they never rethrow. One root `app/error.tsx` covers the actual gap
  (client-side/mutation-time throws that bypass those inline catches) without duplicating
  four nearly-identical files. Revisit if a future page's data-fetching pattern doesn't
  self-catch.
