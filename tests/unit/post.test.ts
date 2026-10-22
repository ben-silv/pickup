import { describe, expect, it } from "vitest";
import { projectFormValues } from "@/lib/post";
import { fieldErrors } from "@/lib/action-state";
import { projectInputSchema } from "@/lib/schemas";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [k, v] of entries) data.append(k, v);
  return data;
}

const base: [string, string][] = [
  ["title", "Dewick wait-time tracker"],
  ["pitch", "Live line length at the dining halls."],
  ["description", ""],
  ["stage", "prototype"],
  ["prototypeUrl", ""],
  ["repoUrl", "https://github.com/x/y"],
];

describe("projectFormValues", () => {
  it("zips the parallel role lists into rows, in order", () => {
    const values = projectFormValues(
      form([
        ...base,
        ["roleCategory", "design"],
        ["roleNeed", "Redesign three screens"],
        ["roleHours", "5"],
        ["roleCategory", "writing"],
        ["roleNeed", "App Store text"],
        ["roleHours", "2"],
      ]),
    );
    expect(values.roles).toEqual([
      { category: "design", need: "Redesign three screens", hours: "5" },
      { category: "writing", need: "App Store text", hours: "2" },
    ]);
    const parsed = projectInputSchema.parse(values);
    expect(parsed.roles.map((r) => r.hours)).toEqual([5, 2]);
    expect(parsed.prototypeUrl).toBeNull();
  });

  it("fills missing trailing cells with blanks so validation catches them", () => {
    const values = projectFormValues(form([...base, ["roleCategory", "design"], ["roleCategory", "ml"], ["roleNeed", "One thing"]]));
    expect(values.roles).toEqual([
      { category: "design", need: "One thing", hours: "" },
      { category: "ml", need: "", hours: "" },
    ]);
  });

  it("gives no roles when there are no rows, which validation rejects", () => {
    const values = projectFormValues(form(base));
    expect(values.roles).toEqual([]);
    expect(projectInputSchema.safeParse(values).success).toBe(false);
  });
});

describe("role rows with a blank first category", () => {
  it("puts the error on the row that's missing its role, not the one after it", () => {
    const values = projectFormValues(
      form([...base, ["roleCategory", ""], ["roleNeed", "Redesign three screens"], ["roleHours", "5"], ["roleCategory", "design"], ["roleNeed", "Logo and app icon"], ["roleHours", "2"]]),
    );
    expect(values.roles.map((r) => r.category)).toEqual(["", "design"]);
    const result = projectInputSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(fieldErrors(result.error.issues))).toEqual(["roles.0.category"]);
  });
});

describe("fieldErrors", () => {
  it("keys the first message per field by its path", () => {
    expect(
      fieldErrors([
        { path: ["title"], message: "Give it a name (3+ characters)." },
        { path: ["roles", 1, "hours"], message: "At least 1 hour." },
        { path: ["title"], message: "second message" },
        { path: [], message: "Whole form" },
      ]),
    ).toEqual({ title: "Give it a name (3+ characters).", "roles.1.hours": "At least 1 hour.", form: "Whole form" });
  });

  it("matches the keys the form uses for real validation errors", () => {
    const result = projectInputSchema.safeParse(
      projectFormValues(form([...base, ["title", ""], ["roleCategory", ""], ["roleNeed", "x"], ["roleHours", "0"]])),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = fieldErrors(result.error.issues);
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["roles.0.category", "roles.0.need", "roles.0.hours"]));
  });
});
