import { describe, expect, it } from "vitest";
import { messageInputSchema, offerInputSchema, profileInputSchema, projectInputSchema } from "@/lib/schemas";

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
    const base = { fullName: "Ben", classYear: "2028", major: "", bio: "", skills: ["backend"], openToRequests: true, hoursPerWeek: "4" };
    expect(profileInputSchema.safeParse({ ...base, githubUrl: "http://github.com/x" }).success).toBe(false);
    const ok = profileInputSchema.parse({ ...base, githubUrl: "" });
    expect(ok).toMatchObject({ githubUrl: null, major: null, hoursPerWeek: 4 });
  });
});
