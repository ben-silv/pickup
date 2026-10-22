import { describe, expect, it } from "vitest";
import { avatarTone, countLabel, initials, ownerName, ownerYear, sanitizeSearch, scopeLabel, searchFilter } from "@/lib/feed";
import { feedQuerySchema } from "@/lib/schemas";

describe("sanitizeSearch", () => {
  it("drops PostgREST syntax and wildcards", () => {
    expect(sanitizeSearch("a,b)")).toBe("ab");
    expect(sanitizeSearch("%")).toBe("");
    expect(sanitizeSearch("50% * off")).toBe("50 off");
    expect(sanitizeSearch('x"),owner_id.eq.(y')).toBe("xownerid.eq.y");
    expect(sanitizeSearch("a:b\\c")).toBe("abc");
  });

  it("keeps letters, numbers, spaces and ' - .", () => {
    expect(sanitizeSearch("Dewick's wait-time v2.0")).toBe("Dewick's wait-time v2.0");
    expect(sanitizeSearch("Café  Zoë")).toBe("Café Zoë");
    expect(sanitizeSearch("title.eq.x")).toBe("title.eq.x");
  });

  it("trims and caps at 80 characters", () => {
    expect(sanitizeSearch("   hi   ")).toBe("hi");
    expect(sanitizeSearch("a".repeat(200))).toHaveLength(80);
  });
});

describe("searchFilter", () => {
  it("is null when nothing searchable is left", () => {
    expect(searchFilter("")).toBeNull();
    expect(searchFilter("%,()")).toBeNull();
  });

  it("quotes values so dots and spaces can't be read as filter syntax", () => {
    expect(searchFilter("title.eq.x")).toBe(
      'title.ilike."%title.eq.x%",pitch.ilike."%title.eq.x%",need.ilike."%title.eq.x%",owner_name.ilike."%title.eq.x%"',
    );
    expect(searchFilter("a,b)")).toBe('title.ilike."%ab%",pitch.ilike."%ab%",need.ilike."%ab%",owner_name.ilike."%ab%"');
  });
});

describe("card labels", () => {
  it("shortens owner names", () => {
    expect(ownerName("Jamie Lee")).toBe("Jamie L.");
    expect(ownerName("Priya  van der Berg")).toBe("Priya B.");
    expect(ownerName("Sam")).toBe("Sam");
    expect(ownerName("  ")).toBe("A Tufts student");
    expect(initials("Jamie Lee")).toBe("JL");
    expect(initials("")).toBe("?");
  });

  it("formats major and class year", () => {
    expect(ownerYear("CS", "2028")).toBe("CS '28");
    expect(ownerYear("Biology", "Grad")).toBe("Biology · Grad");
    expect(ownerYear(null, "2027")).toBe("'27");
    expect(ownerYear("Economics", "Other")).toBe("Economics");
    expect(ownerYear(null, null)).toBe("");
  });

  it("formats scope and counts", () => {
    expect(scopeLabel("3 screens", 5)).toBe("3 screens · ~5 hrs");
    expect(scopeLabel("Quick review", 1)).toBe("Quick review · ~1 hr");
    expect(countLabel(0)).toBe("0 open roles");
    expect(countLabel(1)).toBe("1 open role");
    expect(countLabel(59)).toBe("59 open roles");
    expect(countLabel(60)).toBe("60+ open roles");
  });

  it("gives the same person the same avatar", () => {
    const id = "5eed0000-0000-4000-8000-000000000001";
    expect(avatarTone(id)).toBe(avatarTone(id));
    expect(["avatar-sky", "avatar-navy", "avatar-blue"]).toContain(avatarTone(id));
  });
});

describe("feedQuerySchema", () => {
  it("falls back to defaults on missing or bad params", () => {
    expect(feedQuerySchema.parse({})).toEqual({ skill: null, q: "", sort: "newest" });
    expect(feedQuerySchema.parse({ skill: "hacking", sort: "random", q: ["%"] })).toEqual({ skill: null, q: "", sort: "newest" });
    expect(feedQuerySchema.parse({ skill: "" }).skill).toBeNull();
  });

  it("accepts valid params and sanitizes the search", () => {
    expect(feedQuerySchema.parse({ skill: "design", q: "a,b)", sort: "hours" })).toEqual({ skill: "design", q: "ab", sort: "hours" });
    expect(feedQuerySchema.parse({ skill: ["ml", "data"] }).skill).toBe("ml");
  });
});
