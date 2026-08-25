"use server";

import {
  createBrand,
  deleteBrand,
  updateBrand,
  type BrandWithConsoleCount,
} from "@/lib/brands";
import { toBrandErrorMessage } from "@/lib/brand-utils";
import { requireAuth, type ActionResult } from "@/lib/server-action";

export async function createBrandAction(
  name: string,
  origin: string
): Promise<ActionResult<BrandWithConsoleCount>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const brand = await createBrand({ name, origin });
    return { success: true, data: brand };
  } catch (error) {
    return { success: false, error: toBrandErrorMessage(error, "Couldn't add brand — try again") };
  }
}

export async function updateBrandAction(
  id: string,
  name: string,
  origin: string
): Promise<ActionResult<BrandWithConsoleCount>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const brand = await updateBrand(id, { name, origin });
    return { success: true, data: brand };
  } catch (error) {
    return { success: false, error: toBrandErrorMessage(error, "Couldn't update brand — try again") };
  }
}

export async function deleteBrandAction(id: string): Promise<ActionResult<null>> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    await deleteBrand(id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toBrandErrorMessage(error, "Couldn't delete brand — try again") };
  }
}
