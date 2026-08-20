# Spec: <Feature Name>

> Copy this file to `specs/<phase>-<slug>.md` and fill it in before starting work.
> Claude Code should read this spec fully before writing any code, and should stop
> and ask if anything below is ambiguous rather than guessing.

## 1. Goal

One or two sentences: what does this feature let the user do, and why does it matter?

## 2. Scope

**In scope:**
-

**Out of scope (explicitly not doing this now):**
-

## 3. Routes / Pages

| Route | Type | Auth required? | Description |
|---|---|---|---|
| `/example` | Server Component | No | ... |

## 4. Data requirements

Which Prisma models/fields does this touch? Any new fields, relations, or migrations needed?

```prisma
// paste or reference relevant model(s) here
```

Queries needed (rough shape, not final code):
-

## 5. UI requirements

Reference screenshot: `screenshots/<file>.png` (attach or link)

Key elements:
-

Component breakdown (if known):
-

## 6. States to handle

- [ ] Loading
- [ ] Empty (no data yet)
- [ ] Error (fetch/mutation failure)
- [ ] Success

## 7. Acceptance criteria

Written as checkable statements — this is what "done" means:

- [ ]
- [ ]
- [ ]

## 8. Dependencies

Specs or infra this depends on being done first:
-

## 9. Notes / open questions

Anything uncertain that needs a decision before/during implementation.
