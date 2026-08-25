import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/prisma";
import { verifyCredentials } from "@/lib/verify-credentials";
import { checkLockout, recordFailedAttempt, resetAttempts } from "@/lib/login-rate-limit";
import { LoginLockedError } from "@/lib/login-locked-error";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const lockout = await checkLockout(email);
        if (lockout.locked) {
          throw new LoginLockedError(lockout.retryAfterMs);
        }

        const user = await db.user.findUnique({ where: { email } });
        const verified = await verifyCredentials(user, password);

        if (!verified) {
          await recordFailedAttempt(email);
          return null;
        }

        await resetAttempts(email);
        return verified;
      },
    }),
  ],
});
