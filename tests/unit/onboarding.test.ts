import { describe, expect, it } from "vitest";
import { hasPassword, isProfileComplete, knownMajor, needsSetup, setupNeeds } from "@/lib/onboarding";
import { onboardingSchema, setupSchema } from "@/lib/schemas";
import { MAJORS, MAJOR_GROUPS } from "@/lib/vocab";

describe("isProfileComplete", () => {
  it("needs a name, a class year and a major from the list", () => {
    expect(isProfileComplete({ full_name: "Ben Silver", class_year: "2028", major: "Computer Science" })).toBe(true);
    expect(isProfileComplete({ full_name: "  ", class_year: "2028", major: "Computer Science" })).toBe(false);
    expect(isProfileComplete({ full_name: "Ben", class_year: null, major: "Computer Science" })).toBe(false);
    expect(isProfileComplete({ full_name: "Ben", class_year: "2028", major: null })).toBe(false);
    expect(isProfileComplete(null)).toBe(false);
  });

  it("sends people with an old free-text major back to pick one", () => {
    expect(isProfileComplete({ full_name: "Ben", class_year: "2028", major: "CS" })).toBe(false);
    expect(knownMajor("CS")).toBe("");
    expect(knownMajor("Biology")).toBe("Biology");
  });
});

describe("onboardingSchema", () => {
  it("accepts dropdown values and rejects anything else", () => {
    expect(onboardingSchema.parse({ fullName: " Ben Silver ", classYear: "Grad", major: "Undeclared" })).toEqual({
      fullName: "Ben Silver",
      classYear: "Grad",
      major: "Undeclared",
    });
    const bad = onboardingSchema.safeParse({ fullName: "", classYear: "1999", major: "Basket Weaving" });
    expect(bad.error?.issues.map((i) => [i.path[0], i.message])).toEqual([
      ["fullName", "Add your name."],
      ["classYear", "Pick your class year."],
      ["major", "Pick your major from the list."],
    ]);
  });
});

describe("majors list", () => {
  it("has no duplicates and fits the database column", () => {
    expect(new Set(MAJORS).size).toBe(MAJORS.length);
    expect(MAJORS.every((m) => m.length <= 80)).toBe(true);
    expect(MAJOR_GROUPS.map((g) => g.label)).toEqual(["Arts and Sciences", "Engineering", "Other"]);
    expect(MAJORS).toContain("Computer Science");
  });
});

describe("account setup", () => {
  const complete = { full_name: "Ben Silver", class_year: "2028", major: "Computer Science" };
  const withPassword = { user_metadata: { password_set: true } };

  it("only counts a password once it has been recorded", () => {
    expect(hasPassword(withPassword)).toBe(true);
    expect(hasPassword({ user_metadata: {} })).toBe(false);
    expect(hasPassword({ user_metadata: { password_set: "true" } })).toBe(false);
    expect(hasPassword(null)).toBe(false);
  });

  it("asks new accounts for both, and existing link-only accounts for just a password", () => {
    expect(setupNeeds(null, { user_metadata: {} })).toEqual({ basics: true, password: true });
    expect(setupNeeds(complete, { user_metadata: {} })).toEqual({ basics: false, password: true });
    expect(setupNeeds({ ...complete, major: "CS" }, withPassword)).toEqual({ basics: true, password: false });
    expect(needsSetup(complete, withPassword)).toBe(false);
  });

  it("validates only the missing parts", () => {
    const both = setupSchema({ basics: true, password: true }).safeParse({ fullName: "", classYear: "2028", major: "Biology", password: "short" });
    expect(both.error?.issues.map((i) => i.path[0])).toEqual(["fullName", "password"]);
    expect(setupSchema({ basics: false, password: true }).safeParse({ password: "long enough" }).success).toBe(true);
    expect(setupSchema({ basics: true, password: false }).safeParse({ ...{ fullName: "Ben", classYear: "2028", major: "Biology" } }).success).toBe(true);
  });
});
