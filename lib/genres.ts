import { db } from "@/lib/prisma";
import { genreNameSchema, type GenreOption } from "@/lib/genre-utils";

export type { GenreOption };

export async function getAllGenres(): Promise<GenreOption[]> {
  const genres = await db.genre.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return genres;
}

async function assertNameAvailable(name: string, excludeId?: string) {
  const existing = await db.genre.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error(`A genre named "${name}" already exists`);
  }
}

export async function createGenre(input: { name: string }): Promise<GenreOption> {
  const name = genreNameSchema.parse(input.name);
  await assertNameAvailable(name);

  return db.genre.create({
    data: { name },
    select: { id: true, name: true },
  });
}

export async function updateGenre(
  id: string,
  input: { name: string }
): Promise<GenreOption> {
  const name = genreNameSchema.parse(input.name);
  await assertNameAvailable(name, id);

  return db.genre.update({
    where: { id },
    data: { name },
    select: { id: true, name: true },
  });
}

export async function deleteGenre(id: string): Promise<void> {
  await db.genre.delete({ where: { id } });
}
