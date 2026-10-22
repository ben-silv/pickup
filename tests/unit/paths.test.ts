import { describe, expect, it } from "vitest";
import { isProtectedPath, safeNextPath } from "@/lib/auth/paths";

describe("safeNextPath", () => {
  it("keeps same-site paths and their query", () => {
    expect(safeNextPath("/projects/abc")).toBe("/projects/abc");
    expect(safeNextPath("/browse?skill=design")).toBe("/browse?skill=design");
  });

  it("blocks open redirects", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, 42]) {
      expect(safeNextPath(bad)).toBe("/browse");
    }
  });
});

describe("isProtectedPath", () => {
  it("guards app pages but not the landing or sign-in pages", () => {
    expect(isProtectedPath("/browse")).toBe(true);
    expect(isProtectedPath("/projects/123")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/sign-in")).toBe(false);
    expect(isProtectedPath("/browser-tips")).toBe(false);
  });
});
