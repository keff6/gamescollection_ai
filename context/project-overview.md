# GamesCollectio — Project Overview

> **A Tracking application for videogame collections with easy search and metrics.**

---

## Table of Contents

- [Problem](#problem)
- [Target Users](#target-users)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Data Models](#data-models)
- [UI/UX](#uiux)
- [Monetization](#monetization)

---

## Problem

People who collect games need a cleaer faster way to track their collection.

---

## Target Users

| User | Core Need |
|---|---|
| **Collector** | Add search and update collection |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | TypeScript |
| **Database** | [Neon](https://neon.tech/) (PostgreSQL) |
| **ORM** | [Prisma 7](https://www.prisma.io/docs) |
| **Auth** | [NextAuth v5](https://authjs.dev/) — Email/password |
| **AI** | OpenAI `gpt-4o-mini` |
| **CSS** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Caching** | Redis *(optional)* |
| **Rendering** | SSR pages with dynamic components |

> ⚠️ **Database rule:** Never use `db push`. Always create and run explicit migrations in dev before promoting to prod.

---

## Features

### A. Items & Item Types

Items are the core unit in GameesCollection. Each item has a **type** that determines its behavior.

---

### C. Search

Full-text search across:
- Item title
- Item content
- Tags
- Item type

---

### D. Authentication

- Email + password

---

### E. General Features

- Dashboard that includes first hand information and graphs fron the collection data
- Search for ay game
- Brands CRUD
- Consoles CRUD
- Games CRUD
- Game Genre CRUD
- Export data (csv)
- Dark mode default

---


## Data Models

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Brand {
  id       String    @id @default(uuid())
  name     String
  origin   String?
  logoUrl  String?   @map("logourl")
  consoles Console[]

  @@map("brand")
}

model Console {
  id          String   @id @default(uuid())
  name        String
  shortName   String   @map("short_name")
  brandId     String   @map("id_brand")
  year        String?
  generation  String?
  isPortable  Boolean? @map("is_portable")
  logoUrl     String?  @map("logourl")
  consoleUrl  String?  @map("consoleurl")
  brand       Brand    @relation(fields: [brandId], references: [id])
  games       Game[]

  @@map("console")
}

model Genre {
  id    String        @id @default(uuid())
  name  String
  games GameGenre[]

  @@map("genre")
}

model Game {
  id          String      @id @default(uuid())
  title       String
  consoleId   String      @map("id_console")
  saga        Json?
  year        String?
  developer   String?
  publisher   String?
  isNew       Boolean?    @map("is_new")
  isComplete  Boolean?    @map("is_complete")
  isWishlist  Boolean?    @map("is_wishlist")
  isDigital   Boolean?    @map("is_digital")
  notes       String?     @db.Text
  coverUrl    String?     @map("coverurl")
  isFinished  Boolean?    @map("is_finished")
  isBacklog   Boolean?    @map("is_backlog")
  isPlaying   Boolean?    @map("is_playing")
  console     Console     @relation(fields: [consoleId], references: [id])
  genres      GameGenre[]

  @@map("game")
}

model GameGenre {
  id      Int    @id @default(autoincrement())
  gameId  String @map("id_game")
  genreId String @map("id_genre")
  game    Game   @relation(fields: [gameId], references: [id])
  genre   Genre  @relation(fields: [genreId], references: [id])

  @@index([genreId])
  @@map("game_x_genre")
}

model User {
  id           String  @id @default(uuid())
  name         String
  lastname     String?
  username     String
  password     String
  role         String?
  refreshToken String? @map("refresh_token")

  @@map("user")
}
```

---


## UI/UX

### Layout
:TODO

### Design Principles

- Modern, minimal, gamer-focused
- **Dark mode default**
- Clean typography, generous whitespace, subtle borders and shadows
- References: [Notion](https://notion.so), [Linear](https://linear.app), [Raycast](https://www.raycast.com)

### Screenshots

Refer to the screenshots below for the dashboard ui design. It does not have to be exact, just a reference:
:TODO

### Micro-interactions

- Smooth drawer transitions
- Hover states on cards
- Toast notifications for all actions
- Loading skeleton screens

---

