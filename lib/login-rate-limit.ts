import { db } from "@/lib/prisma";

export const FAILURE_THRESHOLD = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const LOCKOUT_MS = 15 * 60 * 1000;

export function normalizeIdentifier(email: string): string {
  return email.trim().toLowerCase();
}

export interface LockoutStatus {
  locked: boolean;
  retryAfterMs: number;
}

export async function checkLockout(email: string): Promise<LockoutStatus> {
  const identifier = normalizeIdentifier(email);
  const row = await db.loginAttempt.findUnique({ where: { identifier } });
  const now = new Date();

  if (row?.lockedUntil && row.lockedUntil > now) {
    return { locked: true, retryAfterMs: row.lockedUntil.getTime() - now.getTime() };
  }
  return { locked: false, retryAfterMs: 0 };
}

export async function recordFailedAttempt(email: string): Promise<void> {
  const identifier = normalizeIdentifier(email);
  const now = new Date();

  await db.$transaction(async (tx) => {
    const existing = await tx.loginAttempt.findUnique({ where: { identifier } });
    const windowExpired =
      !existing?.firstFailedAt || now.getTime() - existing.firstFailedAt.getTime() > WINDOW_MS;

    if (!existing || windowExpired) {
      await tx.loginAttempt.upsert({
        where: { identifier },
        create: { identifier, failedCount: 1, firstFailedAt: now },
        update: { failedCount: 1, firstFailedAt: now, lockedUntil: null },
      });
      return;
    }

    const updated = await tx.loginAttempt.update({
      where: { identifier },
      data: { failedCount: { increment: 1 } },
    });

    if (updated.failedCount >= FAILURE_THRESHOLD) {
      await tx.loginAttempt.update({
        where: { identifier },
        data: { lockedUntil: new Date(now.getTime() + LOCKOUT_MS) },
      });
    }
  });
}

export async function resetAttempts(email: string): Promise<void> {
  const identifier = normalizeIdentifier(email);
  await db.loginAttempt.deleteMany({ where: { identifier } });
}
