# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## GamesCollection

A tracking application for video games collectors.

## Context Files

Read the following to get the ull context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md


## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # run ESLint
```

No test runner is configured yet.

## Stack

- **Next.js 16.2.9** with the App Router — this is a newer major version with breaking changes; read `node_modules/next/dist/docs/` before writing Next.js-specific code
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS v4** via `@tailwindcss/postcss` — configured in `postcss.config.mjs`, imported with `@import "tailwindcss"` in `globals.css` (no `tailwind.config.*` file)
- **ESLint 9** via `eslint-config-next`

## Architecture

All source lives under `src/app/` using the Next.js App Router:

- `layout.tsx` — root layout; loads Geist Sans and Geist Mono via `next/font/google`, applies them as CSS variables (`--font-geist-sans`, `--font-geist-mono`)
- `globals.css` — single `@import "tailwindcss"` line; add global styles here
- `page.tsx` — home route (`/`)

New routes are added as `src/app/<segment>/page.tsx`. Shared UI components should go in `src/components/`. Server vs. client components follow Next.js App Router conventions (`"use client"` directive when needed).

**IMPORTANT:** Do not add Claude to any commit messages

## Neon Database

- **Project:** `gamescollection` — project ID `odd-flower-50737451`
- **Target branch:** `production` — branch ID `br-dawn-lab-ahyhcal9`

When using the Neon MCP tools, always use project ID `odd-flower-50737451` and branch ID `br-dawn-lab-ahyhcal9` (development) unless explicitly asked to query production.



