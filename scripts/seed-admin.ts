import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Provisions the single admin User row from env vars. Idempotent — re-running
 * upserts the same row rather than creating a duplicate.
 *
 * Usage:
 *   ADMIN_EMAIL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run seed:admin
 *   (or set the three ADMIN_* vars in .env and run `npm run seed:admin`)
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const email = requireEnv("ADMIN_EMAIL");
  const username = requireEnv("ADMIN_USERNAME");
  const password = requireEnv("ADMIN_PASSWORD");

  const adapter = new PrismaPg({ connectionString: requireEnv("DATABASE_URL") });
  const db = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.upsert({
    where: { email },
    update: { username, password: passwordHash },
    create: { name: "Admin", username, email, password: passwordHash },
  });

  console.log(`Admin user ready: ${user.email} (${user.id})`);

  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
