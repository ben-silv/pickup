import { describe, expect, it } from "vitest";
import { menuUser } from "@/lib/nav";

describe("menuUser", () => {
  it("uses the profile name for initials", () => {
    expect(menuUser("Ben Silver", "ben@tufts.edu")).toEqual({ name: "Ben Silver", email: "ben@tufts.edu", initials: "BS" });
    expect(menuUser("Jamie Lee Park", "j@tufts.edu").initials).toBe("JP");
  });

  it("falls back to the email when no name is set", () => {
    expect(menuUser("", "jamie.lee@tufts.edu")).toEqual({ name: "Your account", email: "jamie.lee@tufts.edu", initials: "JL" });
    expect(menuUser(null, "bsilver01@tufts.edu").initials).toBe("B");
  });

  it("never returns empty initials", () => {
    expect(menuUser(null, null).initials).toBe("?");
  });
});
