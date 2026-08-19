# Spec: App Shell & Navbar

## 1. Goal

Build the root layout and navbar shared across every page, matching the visual style
in all five screenshots, before any page-specific content exists.

## 2. Scope

**In scope:** root layout, navbar component, global theme tokens (colors, fonts,
spacing) in Tailwind config / `globals.css`, breadcrumb component (reused by
consoles/games pages).

**Out of scope:** page content itself (Phase 1 specs), auth logic (Phase 2) — the
navbar's Log In/Log Out state can be static/stubbed for now (default to "Log In" shown).

## 3. Routes / Pages

Applies to `src/app/layout.tsx` (wraps every route). No new route.

## 4. Data requirements

None yet — navbar auth state is stubbed until `07-auth-login.md` / `08-auth-middleware.md`.

## 5. UI requirements

Reference screenshots: all five (`../screenshots/dashboard.png`, `../screenshots/brands.png`,
`../screenshots/consoles.png`, `../screenshots/games.png`, `../screenshots/forms.png`) — navbar is identical across all.

**Theme tokens** (read off the screenshots):
- Background: near-black, `#0a0e14`–`#0d1117` range
- Accent (buttons, active nav link, chart bars/slices, focus rings): teal, `#2dd4bf`–
  `#5eead4` range
- Card background: slightly lighter than page background, subtle border (`#1f2937`-ish),
  rounded corners (~`rounded-lg`/`rounded-xl`)
- Text: white/near-white for headings, muted gray (`#94a3b8`-ish) for secondary/label text
- Font: appears to be a clean sans-serif (system font stack or similar to Geist, which is
  already loaded in `layout.tsx` — reuse it, no new font needed)

**Navbar layout (left to right):**
- Logo: small game-controller icon (teal) + "Games Collection" wordmark, bold
- Nav links: `Home`, `Brands`, `Dashboard` — active link shown in teal with a subtle
  highlight/pill background (see `Brands` active state in `brands-opt1.png`, `Dashboard`
  active state in `dashboard-opt1.png`)
- Right side: `Log In` (logged out, shown in `dashboard-opt1.png`) or `Log Out` (logged
  in, shown in the other four) with a small icon, right-aligned
- Thin bottom border separating navbar from page content

**Breadcrumb component** (seen in consoles/games screenshots):
- Format: `Brands / Consoles / Games` or `Brands / Consoles`, teal for clickable
  ancestor segments, white/bold for current page — sits above the page `<h1>`

## 6. States to handle

- [ ] Active nav link styling per current route
- [ ] Logged-in vs logged-out navbar state (stub with a hardcoded boolean/prop for now;
      wire to real auth in Phase 2)

## 7. Acceptance criteria

- [ ] Navbar renders identically across all routes with correct active-link highlighting
- [ ] Breadcrumb component exists and accepts a list of `{ label, href? }` segments
      (last segment has no `href`, rendered as current page)
- [ ] Theme tokens are defined once (Tailwind CSS v4 `@theme` block in `globals.css` or
      equivalent) and reused — no ad-hoc hex codes scattered in components
- [ ] `npm run dev` shows a styled shell with working nav links and no console errors

## 8. Dependencies

None — can start immediately (parallel to `00`/`01`).

## 9. Notes / open questions

- Confirm the exact teal hex and font if you have design tokens elsewhere (Figma, etc.);
  otherwise the ranges above (sampled from the screenshots) are close enough to start.
