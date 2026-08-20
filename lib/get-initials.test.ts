import { describe, expect, it } from "vitest";
import { getInitials } from "@/lib/get-initials";

describe("getInitials", () => {
  it("uses the first letter of the first and last name for multi-word names", () => {
    expect(getInitials("Kevin Fallas")).toBe("KF");
  });

  it("ignores middle names, using only the first and last", () => {
    expect(getInitials("Kevin M Fallas")).toBe("KF");
  });

  it("uses the first two characters for a single-word name", () => {
    expect(getInitials("Admin")).toBe("AD");
  });

  it("collapses repeated whitespace", () => {
    expect(getInitials("  Kevin   Fallas  ")).toBe("KF");
  });

  it("falls back to a placeholder for an empty name", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});
