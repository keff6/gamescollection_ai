import { ZodError, z } from "zod";
import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/app-error";
import { toEntityErrorMessage } from "@/lib/error-utils";

describe("toEntityErrorMessage", () => {
  it("uses the first Zod issue message", () => {
    const result = z.string().min(1, "Required").safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toEntityErrorMessage(result.error, "fallback")).toBe("Required");
    }
  });

  it("falls back when a ZodError has no issues", () => {
    expect(toEntityErrorMessage(new ZodError([]), "fallback")).toBe("fallback");
  });

  it("uses an AppError's message", () => {
    expect(toEntityErrorMessage(new AppError("Not found"), "fallback")).toBe(
      "Not found"
    );
  });

  it("falls back for a plain Error (not an AppError), to avoid leaking internal driver errors", () => {
    expect(toEntityErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
  });

  it("falls back for a non-Error value", () => {
    expect(toEntityErrorMessage("nope", "fallback")).toBe("fallback");
  });
});
