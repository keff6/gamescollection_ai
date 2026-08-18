# Spec: Schema Review & Fixes

## 1. Goal

Confirm the existing Prisma schema supports every screen in the screenshots, and make the
two small changes needed before UI work starts. This is a data-only task — no UI.

## 2. Scope

**In scope:**
- Add a `rating` field to `Game`
- Decide on and implement a single `status` representation for `Game` (see decision below)
- Confirm cascade behavior (Brand → Console → Game deletes) matches product expectations

**Out of scope:**
- `saga` field on `Game` — purpose unclear from current screenshots (no UI references it).
  Leave as-is, untouched, until a spec needs it.
- Cover image upload flow — `coverUrl` exists but the Add Game modal has no image field.
  Assume it's populated later (e.g. pasted URL in a future edit) — not required for MVP CRUD.
- NextAuth `Account`/`Session`/`VerificationToken` models — already correctly scaffolded,
  no changes needed. Confirmed compatible with a single Credentials-provider user.

## 3. Decision needed: Game status

**Problem:** the schema currently models game status as 7 independent booleans
(`isNew`, `isComplete`, `isWishlist`, `isDigital`, `isFinished`, `isBacklog`, `isPlaying`),
but the Add Game modal shows a single `Status` dropdown with one value (`Owned`) at a time.
Independent booleans allow contradictory states (e.g. `isWishlist: true` AND
`isPlaying: true` simultaneously), which the UI never intends to produce.

**Recommendation:** add a single enum field and stop writing to the old booleans going
forward:

```prisma
enum GameStatus {
  WISHLIST
  BACKLOG
  OWNED
  PLAYING
  COMPLETED
}

model Game {
  // ...existing fields
  status GameStatus @default(OWNED)
  rating Int?       // 1-10, nullable until user rates it
  // isNew, isComplete, isWishlist, isDigital, isFinished, isBacklog, isPlaying:
  // keep the columns for now (avoid a destructive migration) but stop reading/writing
  // them from new code. Revisit dropping them once the app is stable.
}
```

`isDigital` stays as its own independent boolean (physical vs. digital is orthogonal to
status, not a lifecycle stage) — keep using it as-is.

**If you'd rather keep the 7 booleans instead of migrating to an enum,** say so before
Phase 0 starts — it changes the shape of every CRUD form and the dashboard queries in
Phase 1 and Phase 3.

## 4. Data requirements

Migration needed:
```prisma
model Game {
  status GameStatus @default(OWNED)
  rating Int?
}

enum GameStatus {
  WISHLIST
  BACKLOG
  OWNED
  PLAYING
  COMPLETED
}
```

Run `npx prisma migrate dev --name add-game-status-and-rating` after confirming the
decision above.

## 5. UI requirements

None — this is schema/migration only.

## 6. States to handle

N/A

## 7. Acceptance criteria

- [ ] `GameStatus` enum added, `status` field added to `Game` with default `OWNED`
- [ ] `rating` field (`Int?`, expected range 1-10, validated at the application layer —
      Postgres won't enforce the range) added to `Game`
- [ ] Migration runs clean against the `development` branch (`br-dawn-lab-ahyhcal9`)
- [ ] Existing seeded/sample rows (if any) don't break — backfill `status` sensibly if
      there's pre-existing data using the old booleans

## 8. Dependencies

None

## 9. Notes / open questions

- Confirm the `status` enum approach above before starting Phase 0.
- Clarify what `saga` is for (game series grouping? e.g. "Final Fantasy" saga across
  multiple titles?) — not blocking, just needs an answer before any spec touches it.
