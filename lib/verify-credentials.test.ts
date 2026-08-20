import bcrypt from "bcryptjs";
import { beforeAll, describe, expect, it } from "vitest";
import { verifyCredentials, type CredentialsUser } from "@/lib/verify-credentials";

const PLAINTEXT_PASSWORD = "correct-horse-battery-staple";
let passwordHash: string;

beforeAll(async () => {
  passwordHash = await bcrypt.hash(PLAINTEXT_PASSWORD, 10);
});

function user(overrides: Partial<CredentialsUser> = {}): CredentialsUser {
  return {
    id: "user-1",
    name: "Admin",
    email: "admin@test.com",
    password: passwordHash,
    ...overrides,
  };
}

describe("verifyCredentials", () => {
  it("returns null when no user matches the email", async () => {
    expect(await verifyCredentials(null, PLAINTEXT_PASSWORD)).toBeNull();
  });

  it("returns null when the user has no password set", async () => {
    expect(await verifyCredentials(user({ password: null }), PLAINTEXT_PASSWORD)).toBeNull();
  });

  it("returns null when the password doesn't match", async () => {
    expect(await verifyCredentials(user(), "wrong-password")).toBeNull();
  });

  it("returns the user's id, name, and email when the password matches", async () => {
    expect(await verifyCredentials(user(), PLAINTEXT_PASSWORD)).toEqual({
      id: "user-1",
      name: "Admin",
      email: "admin@test.com",
    });
  });
});
