import { db } from "@/lib/prisma";

export interface GenreOption {
  id: string;
  name: string;
}

export async function getAllGenres(): Promise<GenreOption[]> {
  const genres = await db.genre.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return genres;
}
