import { describe, expect, it } from "vitest";
import { normalizeIdentifier } from "@/lib/login-rate-limit";

describe("normalizeIdentifier", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeIdentifier("  admin@test.com  ")).toBe("admin@test.com");
  });

  it("lowercases the email", () => {
    expect(normalizeIdentifier("Admin@Test.com")).toBe("admin@test.com");
  });

  it("trims and lowercases together", () => {
    expect(normalizeIdentifier("  Admin@Test.com  ")).toBe("admin@test.com");
  });

  it("leaves an already-normalized email unchanged", () => {
    expect(normalizeIdentifier("admin@test.com")).toBe("admin@test.com");
  });
});
