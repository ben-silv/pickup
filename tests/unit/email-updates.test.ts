import { describe, expect, it } from "vitest";
import { wantsEmailUpdates } from "@/lib/email-updates";

describe("wantsEmailUpdates", () => {
  it("is yes only when the box is ticked", () => {
    const ticked = new FormData();
    ticked.set("emailUpdates", "on");
    expect(wantsEmailUpdates(ticked)).toBe(true);
    expect(wantsEmailUpdates(new FormData())).toBe(false);
    const odd = new FormData();
    odd.set("emailUpdates", "yes please");
    expect(wantsEmailUpdates(odd)).toBe(false);
  });
});
