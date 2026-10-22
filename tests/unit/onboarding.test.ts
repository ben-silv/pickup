import { describe, expect, it } from "vitest";
import { isProfileComplete, knownMajor } from "@/lib/onboarding";
import { onboardingSchema } from "@/lib/schemas";
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
