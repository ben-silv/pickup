import { describe, expect, it } from "vitest";
import { availabilityLabel, profileFormValues, profileSubtitle, projectStats } from "@/lib/profile";
import { profileInputSchema } from "@/lib/schemas";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [k, v] of entries) data.append(k, v);
  return data;
}

describe("profileFormValues", () => {
  it("turns blank selects and numbers into 'not set' and reads the checkboxes", () => {
    const values = profileFormValues(
      form([
        ["fullName", "Ben Silver"],
        ["classYear", ""],
        ["major", ""],
        ["bio", ""],
        ["skills", "backend"],
        ["skills", "data"],
        ["skills", "backend"],
        ["hoursPerWeek", ""],
        ["githubUrl", ""],
      ]),
    );
    expect(values).toMatchObject({ classYear: null, hoursPerWeek: null, skills: ["backend", "data"], openToRequests: false });
    expect(profileInputSchema.parse(values)).toEqual({
      fullName: "Ben Silver",
      classYear: null,
      major: null,
      bio: null,
      skills: ["backend", "data"],
      openToRequests: false,
      hoursPerWeek: null,
      githubUrl: null,
    });
  });

  it("parses a filled-in form", () => {
    const values = profileFormValues(
      form([["fullName", "Ben"], ["classYear", "2028"], ["openToRequests", "on"], ["hoursPerWeek", "4"], ["githubUrl", "https://github.com/ben"]]),
    );
    expect(profileInputSchema.parse(values)).toMatchObject({ classYear: "2028", openToRequests: true, hoursPerWeek: 4 });
  });

  it("rejects out-of-range hours and unknown skills with readable messages", () => {
    const bad = profileInputSchema.safeParse(profileFormValues(form([["fullName", "Ben"], ["hoursPerWeek", "41"]])));
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.message).toBe("Up to 40 hours a week.");
    expect(profileInputSchema.safeParse(profileFormValues(form([["fullName", "Ben"], ["skills", "juggling"]]))).success).toBe(false);
  });
});

describe("profileSubtitle and availabilityLabel", () => {
  it("joins major and year", () => {
    expect(profileSubtitle("Computer Science", "2028")).toBe("Computer Science · Class of 2028");
    expect(profileSubtitle(null, "Grad")).toBe("Grad student");
    expect(profileSubtitle("Biology", "Other")).toBe("Biology");
    expect(profileSubtitle(null, null)).toBe("");
  });

  it("describes availability", () => {
    expect(availabilityLabel(true, 4)).toBe("About 4 hrs a week");
    expect(availabilityLabel(true, 1)).toBe("About 1 hr a week");
    expect(availabilityLabel(true, null)).toBe("Hours not set");
    expect(availabilityLabel(false, 4)).toBe("Not taking requests right now");
  });
});

describe("projectStats", () => {
  const roles = [
    { status: "open" as const, offers: [{ status: "pending" as const }, { status: "declined" as const }] },
    { status: "in_progress" as const, offers: [{ status: "accepted" as const }] },
    { status: "open" as const, offers: [{ status: "pending" as const }] },
  ];

  it("counts open roles and, for the owner, pending offers", () => {
    expect(projectStats(roles, true)).toBe("2 open roles · 2 pending offers");
    expect(projectStats(roles, false)).toBe("2 open roles");
    expect(projectStats([{ status: "filled", offers: null }], true)).toBe("No open roles");
  });
});
