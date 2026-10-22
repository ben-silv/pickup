import { describe, expect, it, vi } from "vitest";
import { requestSignInLink, type SendLink } from "@/lib/auth/sign-in";

const origin = "https://pickup.example";

describe("requestSignInLink", () => {
  it("sends a link to Tufts emails with a safe redirect", async () => {
    const sendLink = vi.fn<SendLink>().mockResolvedValue({ error: null });
    const res = await requestSignInLink({ email: "  Ben@Tufts.edu ", next: "/projects/1" }, { sendLink, origin });
    expect(res).toEqual({ status: "sent", email: "ben@tufts.edu" });
    expect(sendLink).toHaveBeenCalledWith("ben@tufts.edu", "https://pickup.example/auth/callback?next=%2Fprojects%2F1");
  });

  it("rejects other emails without calling Supabase", async () => {
    const sendLink = vi.fn<SendLink>();
    for (const email of ["ben@gmail.com", "ben@tufts.edu.evil.com", "", undefined]) {
      const res = await requestSignInLink({ email, next: null }, { sendLink, origin });
      expect(res).toEqual({ status: "error", message: "Use your @tufts.edu email." });
    }
    expect(sendLink).not.toHaveBeenCalled();
  });

  it("never forwards an external redirect", async () => {
    const sendLink = vi.fn<SendLink>().mockResolvedValue({ error: null });
    await requestSignInLink({ email: "ben@tufts.edu", next: "https://evil.example" }, { sendLink, origin });
    expect(sendLink.mock.calls[0]?.[1]).toBe("https://pickup.example/auth/callback?next=%2Fbrowse");
  });

  it("explains rate limits and other failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const limited = vi.fn<SendLink>().mockResolvedValue({ error: { status: 429, message: "rate limit" } });
    expect(await requestSignInLink({ email: "ben@tufts.edu", next: null }, { sendLink: limited, origin })).toMatchObject({
      status: "error",
      message: expect.stringMatching(/Too many/),
    });
    const broken = vi.fn<SendLink>().mockResolvedValue({ error: { message: "boom" } });
    expect(await requestSignInLink({ email: "ben@tufts.edu", next: null }, { sendLink: broken, origin })).toMatchObject({
      message: expect.stringMatching(/couldn't send/),
    });
  });

  it("says so when Supabase isn't configured", async () => {
    expect(await requestSignInLink({ email: "ben@tufts.edu", next: null }, { sendLink: null, origin })).toMatchObject({
      message: expect.stringMatching(/isn't connected/),
    });
  });
});
