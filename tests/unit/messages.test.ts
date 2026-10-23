import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  byActivity,
  canSend,
  isChatMessage,
  lastMessageByOffer,
  latest,
  mergeMessages,
  messageTime,
  shortTime,
  threadStatus,
  unansweredLeft,
  UNANSWERED_LIMIT,
  type ChatMessage,
} from "@/lib/messages";

const msg = (id: string, at: string, sender = "helper", offer = "o1"): ChatMessage => ({ id, offer_id: offer, sender_id: sender, body: `body ${id}`, created_at: at });

describe("latest", () => {
  it("picks the newest timestamp and ignores blanks", () => {
    expect(latest("2026-10-20T10:00:00Z", null, "2026-10-21T09:00:00Z", undefined)).toBe("2026-10-21T09:00:00Z");
    expect(latest(null)).toBe("");
  });
});

describe("lastMessageByOffer and byActivity", () => {
  it("finds the newest message per offer whatever the order", () => {
    const rows = [msg("a", "2026-10-20T10:00:00Z"), msg("b", "2026-10-21T10:00:00Z"), msg("c", "2026-10-19T10:00:00Z", "x", "o2")];
    const last = lastMessageByOffer(rows);
    expect(last.get("o1")?.id).toBe("b");
    expect(last.get("o2")?.id).toBe("c");
  });

  it("sorts conversations newest activity first", () => {
    const sorted = byActivity([
      { id: 1, activityAt: "2026-10-19T10:00:00Z" },
      { id: 2, activityAt: "2026-10-21T10:00:00Z" },
      { id: 3, activityAt: "2026-10-20T10:00:00Z" },
    ]);
    expect(sorted.map((c) => c.id)).toEqual([2, 3, 1]);
  });
});

describe("mergeMessages", () => {
  it("drops duplicates (a live message that's also in the next page render) and sorts oldest first", () => {
    const a = [msg("1", "2026-10-20T10:00:00Z"), msg("2", "2026-10-20T11:00:00Z")];
    const live = [msg("3", "2026-10-20T12:00:00Z"), msg("2", "2026-10-20T11:00:00Z")];
    expect(mergeMessages(a, live).map((m) => m.id)).toEqual(["1", "2", "3"]);
  });
});

describe("canSend and threadStatus", () => {
  it("closes the composer once an offer is declined or withdrawn", () => {
    expect(canSend("pending")).toBe(true);
    expect(canSend("accepted")).toBe(true);
    expect(canSend("declined")).toBe(false);
    expect(canSend("withdrawn")).toBe(false);
  });

  it("labels the conversation and uses green only for success", () => {
    expect(threadStatus("accepted", "filled")).toEqual({ label: "Role filled", success: true });
    expect(threadStatus("accepted", "in_progress")).toEqual({ label: "Offer accepted", success: true });
    expect(threadStatus("pending", "open")).toEqual({ label: "Offer pending", success: false });
    expect(threadStatus("declined", "in_progress").success).toBe(false);
    expect(threadStatus("withdrawn", "open").label).toBe("Withdrawn");
  });
});

describe("buildTimeline", () => {
  const base = {
    viewerId: "owner",
    viewerIsHelper: false,
    helperFirst: "Maya",
    ownerFirst: "Jamie",
    roleLabel: "UI/UX design",
    roleSummary: "UI/UX design · ~5 hrs",
    offer: { status: "accepted" as const, note: "Free this weekend.", created_at: "2026-10-20T10:00:00Z", decided_at: "2026-10-20T12:00:00Z" },
    credit: null,
    messages: [msg("m1", "2026-10-20T11:00:00Z", "helper"), msg("m2", "2026-10-20T13:00:00Z", "owner")],
  };

  it("puts status lines between messages in time order, with the offer note first", () => {
    const items = buildTimeline(base);
    expect(items.map((i) => (i.kind === "status" ? i.text : `${i.mine ? "me" : "them"}:${i.body}`))).toEqual([
      "Maya offered to help · UI/UX design · ~5 hrs",
      "them:Free this weekend.",
      "them:body m1",
      "You accepted the offer",
      "me:body m2",
    ]);
  });

  it("words status lines from the helper's side", () => {
    const items = buildTimeline({ ...base, viewerId: "helper", viewerIsHelper: true });
    const texts = items.filter((i) => i.kind === "status").map((i) => i.text);
    expect(texts).toEqual(["You offered to help · UI/UX design · ~5 hrs", "Jamie accepted your offer"]);
    expect(items.find((i) => i.key === "note")).toMatchObject({ mine: true });
  });

  it("shows declined, withdrawn and filled", () => {
    const declined = buildTimeline({ ...base, viewerIsHelper: true, viewerId: "helper", offer: { ...base.offer, status: "declined" }, messages: [] });
    expect(declined.at(-1)).toMatchObject({ text: "Jamie declined, with thanks" });
    const withdrawn = buildTimeline({ ...base, offer: { ...base.offer, status: "withdrawn" }, messages: [] });
    expect(withdrawn.at(-1)).toMatchObject({ text: "Maya withdrew the offer" });
    const filled = buildTimeline({ ...base, credit: { hours: 6, created_at: "2026-10-22T10:00:00Z" } });
    expect(filled.at(-1)).toMatchObject({ text: "Role filled · UI/UX design · 6 hrs" });
  });

  it("has no decision line while the offer is pending", () => {
    const items = buildTimeline({ ...base, offer: { ...base.offer, status: "pending", decided_at: null }, messages: [] });
    expect(items.filter((i) => i.kind === "status")).toHaveLength(1);
  });
});

describe("isChatMessage", () => {
  it("accepts message rows and rejects anything else", () => {
    expect(isChatMessage(msg("1", "2026-10-20T10:00:00Z"))).toBe(true);
    expect(isChatMessage({ id: "1", body: "hi" })).toBe(false);
    expect(isChatMessage(null)).toBe(false);
    expect(isChatMessage("hi")).toBe(false);
  });
});

describe("times (campus time)", () => {
  const now = new Date("2026-10-22T18:00:00Z"); // Thu 2:00 PM in Boston

  it("shows the time today, the weekday this week, the date before that", () => {
    expect(shortTime("2026-10-22T13:05:00Z", now)).toBe("9:05 AM");
    expect(shortTime("2026-10-20T13:05:00Z", now)).toBe("Tue");
    expect(shortTime("2026-10-01T13:05:00Z", now)).toBe("Oct 1");
    expect(shortTime("not a date", now)).toBe("");
  });

  it("uses Boston's day, not UTC's", () => {
    // 1:30 AM UTC on the 23rd is still the evening of the 22nd on campus.
    expect(shortTime("2026-10-23T01:30:00Z", new Date("2026-10-23T02:00:00Z"))).toBe("9:30 PM");
  });

  it("formats message times with the weekday", () => {
    expect(messageTime("2026-10-20T20:12:00Z")).toBe("Tue 4:12 PM");
  });
});

describe("withdrawn offers and resends", () => {
  it("tells the helper it was their withdrawal", () => {
    expect(threadStatus("withdrawn", "open", true).label).toBe("You withdrew this offer");
    expect(threadStatus("withdrawn", "open").label).toBe("Withdrawn");
  });

  it("shows a resent offer's new note under a 'sent a new offer' line", () => {
    const items = buildTimeline({
      viewerId: "owner",
      viewerIsHelper: false,
      helperFirst: "Maya",
      ownerFirst: "Jamie",
      roleLabel: "UI/UX design",
      roleSummary: "UI/UX design · ~5 hrs",
      offer: { status: "pending", note: "Back with more time.", created_at: "2026-10-20T10:00:00Z", decided_at: null, resent_at: "2026-10-21T10:00:00Z" },
      credit: null,
      messages: [msg("m1", "2026-10-20T11:00:00Z", "helper")],
    });
    expect(items.map((i) => (i.kind === "status" ? i.text : `${i.mine ? "me" : "them"}:${i.body}`))).toEqual([
      "Maya offered to help · UI/UX design · ~5 hrs",
      "them:body m1",
      "Maya withdrew and sent a new offer",
      "them:Back with more time.",
    ]);
  });
});

describe("unansweredLeft", () => {
  const offer = { status: "pending" as const, created_at: "2026-10-20T10:00:00Z", resent_at: null };
  const mine = (n: number, from = "2026-10-20T11:00:00Z") => Array.from({ length: n }, (_, i) => msg(`m${i}`, new Date(Date.parse(from) + i * 60_000).toISOString(), "helper"));

  it("counts down the helper's messages until the owner writes back", () => {
    expect(unansweredLeft({ viewerIsHelper: true, viewerId: "helper", offer, messages: [] })).toBe(UNANSWERED_LIMIT);
    expect(unansweredLeft({ viewerIsHelper: true, viewerId: "helper", offer, messages: mine(3) })).toBe(2);
    expect(unansweredLeft({ viewerIsHelper: true, viewerId: "helper", offer, messages: mine(7) })).toBe(0);
  });

  it("lifts the limit once the owner replies or accepts, and never applies to the owner", () => {
    expect(unansweredLeft({ viewerIsHelper: true, viewerId: "helper", offer, messages: [...mine(5), msg("r", "2026-10-21T10:00:00Z", "owner")] })).toBeNull();
    expect(unansweredLeft({ viewerIsHelper: true, viewerId: "helper", offer: { ...offer, status: "accepted" }, messages: mine(9) })).toBeNull();
    expect(unansweredLeft({ viewerIsHelper: false, viewerId: "owner", offer, messages: mine(9) })).toBeNull();
  });

  it("starts the count again after a resend", () => {
    const resent = { ...offer, resent_at: "2026-10-22T10:00:00Z" };
    expect(unansweredLeft({ viewerIsHelper: true, viewerId: "helper", offer: resent, messages: [...mine(5), ...mine(1, "2026-10-22T11:00:00Z")] })).toBe(4);
  });
});
