import { describe, expect, it } from "vitest";
import { completeRoleInputSchema, messageInputSchema, offerInputSchema, profileInputSchema, projectInputSchema, reportInputSchema, deleteAccountSchema } from "@/lib/schemas";

const role = { category: "design", need: "Redesign three screens", hours: "5" };
const project = {
  title: "Dewick wait-time tracker",
  pitch: "Live line length at the dining halls.",
  description: "",
  stage: "prototype",
  prototypeUrl: "",
  repoUrl: "https://github.com/ben-silv/dewick",
  roles: [role],
};

describe("projectInputSchema", () => {
  it("accepts a valid project and normalizes it", () => {
    const out = projectInputSchema.parse(project);
    expect(out.prototypeUrl).toBeNull();
    expect(out.roles[0]?.hours).toBe(5);
  });

  it("matches the database limits", () => {
    const issue = (patch: object) => projectInputSchema.safeParse({ ...project, ...patch }).error?.issues[0]?.message;
    expect(issue({ title: "ab" })).toMatch(/3\+ characters/);
    expect(issue({ pitch: "x".repeat(121) })).toMatch(/under 120/);
    expect(issue({ stage: "launched" })).toMatch(/how far along/);
    expect(issue({ repoUrl: "github.com/x" })).toMatch(/https/);
    expect(issue({ roles: [] })).toMatch(/at least one role/);
    expect(issue({ roles: [{ ...role, hours: 41 }] })).toMatch(/under 40 hours/);
    expect(issue({ roles: [{ ...role, category: "hacking" }] })).toMatch(/Pick a role/);
  });
});

describe("offer, message and profile inputs", () => {
  const id = "3f1c2a6e-8b0d-4f1e-9a4b-2c7d5e6f8a90";
  it("validates offers and messages", () => {
    expect(offerInputSchema.safeParse({ roleId: id, note: "short" }).success).toBe(false);
    expect(offerInputSchema.safeParse({ roleId: id, note: "Free this weekend, can do it." }).success).toBe(true);
    expect(messageInputSchema.safeParse({ offerId: id, body: "   " }).success).toBe(false);
    expect(messageInputSchema.safeParse({ offerId: "not-a-uuid", body: "hi" }).success).toBe(false);
  });

  it("only allows https GitHub links on profiles", () => {
    const base = { fullName: "Ben", classYear: "2028", major: "Computer Science", bio: "", skills: ["backend"], openToRequests: true, hoursPerWeek: "4" };
    expect(profileInputSchema.safeParse({ ...base, githubUrl: "http://github.com/x" }).success).toBe(false);
    const ok = profileInputSchema.parse({ ...base, githubUrl: "" });
    expect(ok).toMatchObject({ githubUrl: null, major: "Computer Science", hoursPerWeek: 4 });
  });
});

describe("completeRoleInputSchema", () => {
  const ok = { roleId: "5eed0000-0000-4000-8000-0000000000c2", offerId: "5eed0000-0000-4000-8000-0000000000d1", hours: "6", note: " Great work. " };

  it("matches the credits table limits (hours 1–80, note 1–400)", () => {
    expect(completeRoleInputSchema.parse(ok)).toMatchObject({ hours: 6, note: "Great work." });
    expect(completeRoleInputSchema.safeParse({ ...ok, hours: "80" }).success).toBe(true);
    for (const hours of ["0", "81", "2.5", ""]) expect(completeRoleInputSchema.safeParse({ ...ok, hours }).success).toBe(false);
    expect(completeRoleInputSchema.safeParse({ ...ok, note: "   " }).success).toBe(false);
    expect(completeRoleInputSchema.safeParse({ ...ok, note: "x".repeat(401) }).success).toBe(false);
    expect(completeRoleInputSchema.safeParse({ ...ok, roleId: "nope" }).success).toBe(false);
  });
});

describe("reportInputSchema", () => {
  const offerId = "5eed0000-0000-4000-8000-0000000000d1";
  it("needs a known reason; details are optional and capped", () => {
    expect(reportInputSchema.parse({ offerId, reason: "harassment", details: "  rude  " })).toEqual({ offerId, reason: "harassment", details: "rude" });
    expect(reportInputSchema.safeParse({ offerId, reason: "", details: "" }).error?.issues[0]?.message).toBe("Pick a reason.");
    expect(reportInputSchema.safeParse({ offerId, reason: "other", details: "x".repeat(501) }).success).toBe(false);
    expect(reportInputSchema.safeParse({ offerId: "nope", reason: "spam", details: "" }).success).toBe(false);
  });
});

describe("deleteAccountSchema", () => {
  it("only accepts DELETE, in any case", () => {
    expect(deleteAccountSchema.safeParse({ confirm: " delete " }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirm: "DELETE" }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirm: "yes" }).error?.issues[0]?.message).toBe("Type DELETE to confirm.");
    expect(deleteAccountSchema.safeParse({ confirm: "" }).success).toBe(false);
  });
});
