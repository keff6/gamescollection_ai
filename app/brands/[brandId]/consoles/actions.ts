"use server";

import {
  createConsole,
  deleteConsole,
  updateConsole,
  type ConsoleWithGameCount,
} from "@/lib/consoles";
import { toConsoleErrorMessage } from "@/lib/console-utils";
import { requireAuth, type ActionResult } from "@/lib/server-action";

export async function createConsoleAction(
  brandId: string,
  input: {
    name: string;
    shortName: string;
    year: string;
    generation: string;
    isPortable: boolean;
  }
): Promise<ActionResult<ConsoleWithGameCount>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const consoleItem = await createConsole(brandId, input);
    return { success: true, data: consoleItem };
  } catch (error) {
    return {
      success: false,
      error: toConsoleErrorMessage(error, "Couldn't add console — try again"),
    };
  }
}

export async function updateConsoleAction(
  id: string,
  input: {
    name: string;
    shortName: string;
    brandId: string;
    year: string;
    generation: string;
    isPortable: boolean;
  }
): Promise<ActionResult<ConsoleWithGameCount>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const consoleItem = await updateConsole(id, input);
    return { success: true, data: consoleItem };
  } catch (error) {
    return {
      success: false,
      error: toConsoleErrorMessage(error, "Couldn't update console — try again"),
    };
  }
}

export async function deleteConsoleAction(id: string): Promise<ActionResult<null>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    await deleteConsole(id);
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: toConsoleErrorMessage(error, "Couldn't delete console — try again"),
    };
  }
}
