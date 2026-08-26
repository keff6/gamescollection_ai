# GamesCollection

A personal web app for cataloging a video game collection — browse by Brand → Console → Game, view collection-wide stats on a dashboard, and manage the catalog through an admin area gated behind a single-user login.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript 5
- [Prisma](https://www.prisma.io) ORM with PostgreSQL ([Neon](https://neon.tech))
- [NextAuth v5](https://authjs.dev) (Credentials provider) for single-user auth
- [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Recharts](https://recharts.org)
- [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev) for forms/validation
- [Vitest](https://vitest.dev) for unit tests

## Getting Started

### Prerequisites

- Node (see `.nvmrc` for the pinned version)
- A PostgreSQL database (this project uses [Neon](https://neon.tech))

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   You'll need `DATABASE_URL` (Postgres connection string), `AUTH_SECRET`, and `ADMIN_EMAIL`/`ADMIN_USERNAME`/`ADMIN_PASSWORD` for the seeded admin user.

3. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Seed the admin user:

   ```bash
   npm run seed:admin
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # run ESLint
npm test         # run unit tests (Vitest)
```

## Deployment

Deployed on [Vercel](https://vercel.com), backed by a Neon Postgres database. Run `npx prisma migrate deploy` before the app starts in production.
