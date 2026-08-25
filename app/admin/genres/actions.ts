"use server";

import { createGenre, deleteGenre, updateGenre, type GenreOption } from "@/lib/genres";
import { toGenreErrorMessage } from "@/lib/genre-utils";
import { requireAuth, type ActionResult } from "@/lib/server-action";

export async function createGenreAction(
  name: string
): Promise<ActionResult<GenreOption>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const genre = await createGenre({ name });
    return { success: true, data: genre };
  } catch (error) {
    return { success: false, error: toGenreErrorMessage(error, "Couldn't add genre — try again") };
  }
}

export async function updateGenreAction(
  id: string,
  name: string
): Promise<ActionResult<GenreOption>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const genre = await updateGenre(id, { name });
    return { success: true, data: genre };
  } catch (error) {
    return { success: false, error: toGenreErrorMessage(error, "Couldn't update genre — try again") };
  }
}

export async function deleteGenreAction(
  id: string
): Promise<ActionResult<null>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    await deleteGenre(id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toGenreErrorMessage(error, "Couldn't delete genre — try again") };
  }
}
