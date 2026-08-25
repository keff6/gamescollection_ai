import { auth } from "@/auth";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function requireAuth(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session) {
    return { success: false, error: "You must be logged in to do that." };
  }
  return null;
}
