import { describe, expect, it, vi } from "vitest";
import { confirmEmailLink, nextAfterEmailLink, parseEmailLink } from "@/lib/auth/email-link";

const hash = "a3f1c2d4e5b6a7980a1b2c3d4e5f60718293a4b5c6d7e8f9";

describe("parseEmailLink", () => {
  it("accepts our link types with a token hash", () => {
    expect(parseEmailLink({ token_hash: hash, type: "email" })).toEqual({ tokenHash: hash, type: "email" });
    expect(parseEmailLink({ token_hash: [hash, "x"], type: ["recovery"] })).toEqual({ tokenHash: hash, type: "recovery" });
  });

  it("rejects missing, odd or unsupported values", () => {
    expect(parseEmailLink({})).toBeNull();
    expect(parseEmailLink({ token_hash: hash, type: "invite" })).toBeNull();
    expect(parseEmailLink({ token_hash: "short", type: "email" })).toBeNull();
    expect(parseEmailLink({ token_hash: "abc'; drop table--xxxxxxxx", type: "email" })).toBeNull();
  });
});

describe("confirmEmailLink", () => {
  it("verifies once and sends resets to the new-password page", async () => {
    const verify = vi.fn().mockResolvedValue({ ok: true });
    expect(await confirmEmailLink({ token_hash: hash, type: "recovery" }, { verify })).toEqual({ ok: true, next: "/reset-password" });
    expect(await confirmEmailLink({ token_hash: hash, type: "email" }, { verify })).toEqual({ ok: true, next: "/browse" });
    expect(verify).toHaveBeenCalledWith({ tokenHash: hash, type: "recovery" });
  });

  it("never calls Supabase for a malformed link", async () => {
    const verify = vi.fn();
    expect(await confirmEmailLink({ token_hash: null, type: "email" }, { verify })).toMatchObject({ ok: false, message: expect.stringMatching(/expired/) });
    expect(verify).not.toHaveBeenCalled();
  });

  it("explains expired links and rate limits", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const expired = vi.fn().mockResolvedValue({ ok: false, error: { status: 403, message: "Token has expired or is invalid" } });
    expect(await confirmEmailLink({ token_hash: hash, type: "email" }, { verify: expired })).toMatchObject({ message: expect.stringMatching(/expired/) });
    const limited = vi.fn().mockResolvedValue({ ok: false, error: { status: 429, message: "" } });
    expect(await confirmEmailLink({ token_hash: hash, type: "email" }, { verify: limited })).toMatchObject({ message: expect.stringMatching(/Too many/) });
  });

  it("says so when Supabase isn't configured", async () => {
    expect(await confirmEmailLink({ token_hash: hash, type: "email" }, { verify: null })).toMatchObject({ message: expect.stringMatching(/isn't connected/) });
  });
});

describe("nextAfterEmailLink", () => {
  it("only resets go to the password page", () => {
    expect(nextAfterEmailLink("recovery")).toBe("/reset-password");
    expect(nextAfterEmailLink("signup")).toBe("/browse");
  });
});
