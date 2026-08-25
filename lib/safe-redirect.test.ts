import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("allows a relative path", () => {
    expect(getSafeRedirectPath("/admin/genres")).toBe("/admin/genres");
  });

  it("falls back to / for an absolute URL", () => {
    expect(getSafeRedirectPath("https://evil.example.com")).toBe("/");
  });

  it("falls back to / for a protocol-relative URL", () => {
    expect(getSafeRedirectPath("//evil.example.com")).toBe("/");
  });

  it("falls back to / for a path with no leading slash", () => {
    expect(getSafeRedirectPath("admin/genres")).toBe("/");
  });

  it("falls back to / for undefined/null/array input", () => {
    expect(getSafeRedirectPath(undefined)).toBe("/");
    expect(getSafeRedirectPath(null)).toBe("/");
    expect(getSafeRedirectPath(["/a", "/b"])).toBe("/");
  });

  it("uses a custom fallback when given", () => {
    expect(getSafeRedirectPath("https://evil.example.com", "/dashboard")).toBe(
      "/dashboard"
    );
  });
});
