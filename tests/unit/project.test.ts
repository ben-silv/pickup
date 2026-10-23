import { describe, expect, it } from "vitest";
import { OFFER_BADGE, byRole, firstName, hasConversation, hrs, openRolesLabel, roleViewerState, MAX_RESENDS, RESEND_COOLDOWN_MINUTES, minutesLabel, resendState } from "@/lib/project";

describe("openRolesLabel", () => {
  it("counts open roles in words", () => {
    expect(openRolesLabel(0)).toBe("No open roles");
    expect(openRolesLabel(1)).toBe("1 open role");
    expect(openRolesLabel(3)).toBe("3 open roles");
  });
});

describe("firstName and hrs", () => {
  it("uses the first word of the name, with a fallback", () => {
    expect(firstName("Jamie Lee")).toBe("Jamie");
    expect(firstName("  ")).toBe("The owner");
    expect(firstName("", "They")).toBe("They");
  });

  it("pluralizes hours", () => {
    expect(hrs(1)).toBe("1 hr");
    expect(hrs(6)).toBe("6 hrs");
  });
});

describe("byRole", () => {
  it("groups rows by role and keeps their order", () => {
    const rows = [
      { role_id: "a", id: 1 },
      { role_id: "b", id: 2 },
      { role_id: "a", id: 3 },
    ];
    const grouped = byRole(rows);
    expect([...grouped.keys()]).toEqual(["a", "b"]);
    expect(grouped.get("a")?.map((r) => r.id)).toEqual([1, 3]);
  });
});

describe("roleViewerState", () => {
  const published = { status: "published" as const, isOwner: false };

  it("never lets the owner offer on their own role", () => {
    expect(roleViewerState({ status: "open" }, { status: "published", isOwner: true }, null)).toEqual({ kind: "owner" });
  });

  it("lets other students offer on open roles of published projects", () => {
    expect(roleViewerState({ status: "open" }, published, null)).toEqual({ kind: "can-offer" });
  });

  it("shows my offer instead of the button once I've offered, whatever its status", () => {
    expect(roleViewerState({ status: "open" }, published, { status: "pending" })).toEqual({ kind: "offered", status: "pending" });
    expect(roleViewerState({ status: "in_progress" }, published, { status: "declined" })).toEqual({ kind: "offered", status: "declined" });
  });

  it("doesn't offer on roles that aren't open or projects that aren't published", () => {
    expect(roleViewerState({ status: "in_progress" }, published, null)).toEqual({ kind: "unavailable" });
    expect(roleViewerState({ status: "open" }, { status: "draft", isOwner: false }, null)).toEqual({ kind: "unavailable" });
  });
});

describe("hasConversation", () => {
  it("is true only while the offer is live", () => {
    expect(hasConversation("pending")).toBe(true);
    expect(hasConversation("accepted")).toBe(true);
    expect(hasConversation("declined")).toBe(false);
    expect(hasConversation("withdrawn")).toBe(false);
  });
});

describe("OFFER_BADGE", () => {
  it("is green (success) only for accepted offers", () => {
    const green = Object.entries(OFFER_BADGE).filter(([, b]) => b.success).map(([status]) => status);
    expect(green).toEqual(["accepted"]);
  });
});

describe("resendState", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  const withdrawn = (minutesAgo: number, resend_count = 0) => ({
    status: "withdrawn" as const,
    decided_at: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
    resend_count,
  });

  it("waits out the hour after withdrawing, rounding up", () => {
    expect(resendState(withdrawn(18), true, now)).toEqual({ kind: "wait", minutes: 42 });
    expect(resendState(withdrawn(59.5), true, now)).toEqual({ kind: "wait", minutes: 1 });
    expect(resendState(withdrawn(60), true, now)).toEqual({ kind: "ready" });
  });

  it("stops after two resends or once the role isn't taking offers", () => {
    expect(resendState(withdrawn(120, MAX_RESENDS), true, now)).toEqual({ kind: "used-up" });
    expect(resendState(withdrawn(120), false, now)).toEqual({ kind: "closed" });
  });

  it("only applies to withdrawn offers", () => {
    expect(resendState({ status: "pending", decided_at: null, resend_count: 0 }, true, now)).toBeNull();
    expect(resendState({ status: "declined", decided_at: now.toISOString(), resend_count: 0 }, true, now)).toBeNull();
  });

  it("labels minutes", () => {
    expect(minutesLabel(1)).toBe("in 1 minute");
    expect(minutesLabel(42)).toBe("in 42 minutes");
    expect(RESEND_COOLDOWN_MINUTES).toBe(60);
  });
});

describe("example projects", () => {
  it("never offer the offer form, even on open roles", () => {
    expect(roleViewerState({ status: "open" }, { status: "published", isOwner: false, isExample: true }, null)).toEqual({ kind: "example" });
    expect(roleViewerState({ status: "open" }, { status: "published", isOwner: false }, null)).toEqual({ kind: "can-offer" });
  });
});
