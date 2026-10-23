import { describe, expect, it } from "vitest";
import { flagsUnread } from "@/lib/unread-state";

describe("flagsUnread", () => {
  const msg = { sender_id: "maya", offer_id: "o1" };
  it("lights the dot for their messages, unless that conversation is open", () => {
    expect(flagsUnread(msg, "ben", "/browse")).toBe(true);
    expect(flagsUnread(msg, "ben", "/messages")).toBe(true);
    expect(flagsUnread(msg, "ben", "/messages/o2")).toBe(true);
    expect(flagsUnread(msg, "ben", "/messages/o1")).toBe(false);
  });

  it("never for my own messages", () => {
    expect(flagsUnread(msg, "maya", "/browse")).toBe(false);
  });
});
