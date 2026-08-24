# Spec: Validation Feedback Cleanup

## 1. Goal

Toast confirmation, server-side zod validation, and a single client-side error message
are already wired into every CRUD form (`09`–`12`). What's not done: each of the three
form dialogs (`BrandFormDialog`, `ConsoleFormDialog`, `GameFormDialog`) validates
client-side with its own hand-rolled, sequential `if` chain — a second, hand-maintained
copy of a subset of the same rules already expressed once as a zod schema in
`lib/brand-utils.ts`/`lib/console-utils.ts`/`lib/game-utils.ts` for the server side. This
spec removes that duplication by having the client call the same schema, closing the gap
where the two validation paths can silently drift apart (e.g. a max-length changed on the
server schema but forgotten in the client's `if` chain, or vice versa).

Decision made explicitly for this spec (user confirmed): keep the current one-message-
at-a-time UX near the Save button — this is **not** a per-field inline-errors rebuild
(`GenresTable`'s pattern stays unique to that page). Scope is a refactor, not new UX.

## 2. Scope

**In scope:**
- `BrandFormDialog.tsx`: replace the `if (!name.trim()) setError("Name is required.")`
  check (~line 56) with `brandFormSchema.safeParse({ name, origin })` (or the closest
  existing exported schema/shape in `lib/brand-utils.ts` — extend it with an `.optional()`
  `origin` field if no single combined schema exists yet) and `setError` to
  `result.error.issues[0].message` on failure.
- `ConsoleFormDialog.tsx`: same treatment for its three hand-rolled checks (Name, Short
  name, Brand required — ~lines 89/93/97), replaced with the equivalent schema from
  `lib/console-utils.ts`.
- `GameFormDialog.tsx`: same treatment for its five hand-rolled checks (saga tag length,
  Title, Console, genre selection, Rating range — ~lines 148/170/174/178/184), replaced
  with the equivalent schema from `lib/game-utils.ts`.
- Where a dialog's existing schema in its `lib/*-utils.ts` file doesn't yet cover every
  field the hand-rolled checks cover (e.g. it may only have been written for the server
  mutation's shape, not the full form's), extend that schema rather than writing a second
  one — one schema per entity stays the single source of truth for both client and server.
- Confirm zod's issue ordering matches the same priority the current `if` chains use
  (e.g. Title-before-Console-before-Genre for games) so the "first error shown" doesn't
  silently reorder from what users already saw before this refactor — reorder the zod
  schema's field declarations if needed to match, since schema field order determines
  `safeParse`'s issue order for object schemas.

**Out of scope (explicitly not doing this now):**
- Per-field inline errors / `aria-invalid` wiring in the three dialogs — explicitly
  decided against for this spec; `GenresTable` remains the only page with that pattern.
- Any change to server-side validation, toast wording, or the Server Actions themselves
  — this spec only touches each dialog's client-side pre-submit check.
- Any change to the `isSaving`/disabled-during-submit behavior — already consistent
  across all three dialogs (`useState` + `disabled={isSaving}` on the Save button),
  confirmed working, not part of this spec.
- `GenresTable`'s validation — already schema-backed and per-field, not part of this gap.

## 3. Routes / Pages

No new routes. Touches the same routes as `10`/`11`/`12`:

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/brands` | Server Component | CRUD: yes | `BrandFormDialog`'s client validation now calls `brand-utils.ts`'s schema |
| `/brands/[brandId]/consoles` | Server Component | CRUD: yes | `ConsoleFormDialog`'s client validation now calls `console-utils.ts`'s schema |
| `/consoles/[consoleId]/games` | Server Component | CRUD: yes | `GameFormDialog`'s client validation now calls `game-utils.ts`'s schema |

## 4. Data requirements

No schema/migration changes. Touches only the zod schemas already living in
`lib/brand-utils.ts`, `lib/console-utils.ts`, `lib/game-utils.ts` (extending field
coverage if needed, per §2) — these already have no Prisma import (established in `09`'s
Turbopack-client-bundle fix), so calling them from a client component is already safe and
requires no new file split.

## 5. UI requirements

No visual/layout changes — the error message still renders in the same place
(`{error && <p className="text-sm text-destructive">{error}</p>}`, same location in all
three dialogs today). This is a logic-only refactor.

Component breakdown:
- `components/brands/BrandFormDialog.tsx` — swap hand-rolled check for
  `brandFormSchema.safeParse(...)`
- `components/consoles/ConsoleFormDialog.tsx` — swap hand-rolled checks for the
  equivalent `lib/console-utils.ts` schema
- `components/games/GameFormDialog.tsx` — swap hand-rolled checks for the equivalent
  `lib/game-utils.ts` schema
- `lib/brand-utils.ts` / `lib/console-utils.ts` / `lib/game-utils.ts` — extend the
  existing schema(s) only if a field currently checked client-side isn't yet covered

## 6. States to handle

- [ ] Loading — n/a, not touched
- [ ] Empty — n/a, not touched
- [ ] Error — client-side validation failure still shows the same single message near
      Save, now sourced from the shared schema instead of a duplicated `if` chain;
      server-side validation failure (already schema-backed) is unchanged
- [ ] Success — unchanged; a valid submission still calls the same Server Action as today

## 7. Acceptance criteria

- [ ] `BrandFormDialog`, `ConsoleFormDialog`, and `GameFormDialog` each validate
      client-side via `safeParse` against the same schema their Server Action validates
      against server-side — no hand-rolled `if`-chain duplication remains in any of the
      three
- [ ] For each dialog, triggering every validation rule that previously had its own
      `if` check (required fields, length limits, numeric ranges, saga tag length) still
      produces the same user-facing error message and still blocks submission
      client-side (no server round-trip for a client-catchable error)
- [ ] Error message ordering (which single message shows first when multiple fields are
      invalid) matches pre-refactor behavior, or any intentional reordering is called out
      explicitly during implementation
- [ ] No behavior change to the Server Actions, toast messages, or success paths
- [ ] Existing unit tests for `lib/brand-utils.ts`/`lib/console-utils.ts`/
      `lib/game-utils.ts` still pass; add tests only if a schema was extended to cover a
      field it didn't validate before
- [ ] `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm test` pass

## 8. Dependencies

- `09-admin-genres.md` (established the no-Prisma-import `lib/*-utils.ts` split that
  makes calling these schemas from client components safe)
- `10-brands-crud.md`, `11-consoles-crud.md`, `12-games-crud.md` (own the three dialogs
  and schemas this spec refactors)

## 9. Notes / open questions

- User was asked, before this spec was written, whether to (a) dedupe the client checks
  onto the existing shared zod schema while keeping today's one-message UX, (b) rebuild
  all three dialogs with full per-field inline errors matching `GenresTable`, or
  (c) leave validation UX as-is. Chose (a) — recorded here so a future pass doesn't
  re-litigate it without cause.
- If a later feature wants per-field inline errors for these three dialogs, this spec's
  refactor is a natural stepping stone (the schema's `.issues` array already carries a
  `path` per field, which per-field rendering would key off directly) — but that's not
  this spec's job.
