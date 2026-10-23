import { describe, expect, it, vi } from "vitest";
import { passwordSignIn, requestPasswordReset, setNewPassword } from "@/lib/auth/password";

const origin = "https://pickup.example";
const ok = { error: null };

describe("passwordSignIn", () => {
  it("signs in Tufts emails, normalising the address but not the password", async () => {
    const signIn = vi.fn().mockResolvedValue(ok);
    expect(await passwordSignIn({ email: " Ben@Tufts.edu ", password: " pass word " }, { signIn })).toBeNull();
    expect(signIn).toHaveBeenCalledWith("ben@tufts.edu", " pass word ");
  });

  it("checks the email and password before calling Supabase", async () => {
    const signIn = vi.fn();
    expect(await passwordSignIn({ email: "ben@gmail.com", password: "x" }, { signIn })).toEqual({
      status: "error",
      message: "Use your @tufts.edu email.",
      field: "email",
    });
    expect(await passwordSignIn({ email: "ben@tufts.edu", password: null }, { signIn })).toEqual({
      status: "error",
      message: "Enter your password.",
      field: "password",
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("gives one message for a wrong email or password", async () => {
    const signIn = vi.fn().mockResolvedValue({ error: { status: 400, code: "invalid_credentials", message: "Invalid login credentials" } });
    const res = await passwordSignIn({ email: "ben@tufts.edu", password: "nope" }, { signIn });
    expect(res).toMatchObject({ status: "error", field: "password", message: "Wrong email or password." });
  });

  it("explains unconfirmed emails, rate limits and outages", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const run = (error: object) => passwordSignIn({ email: "ben@tufts.edu", password: "x" }, { signIn: vi.fn().mockResolvedValue({ error }) });
    expect(await run({ status: 400, code: "email_not_confirmed", message: "" })).toMatchObject({ message: expect.stringMatching(/Confirm your email/) });
    expect(await run({ status: 429, message: "" })).toMatchObject({ message: expect.stringMatching(/Too many/) });
    expect(await run({ status: 500, message: "boom" })).toMatchObject({ message: expect.stringMatching(/Couldn't sign you in/) });
  });

  it("says so when Supabase isn't configured", async () => {
    expect(await passwordSignIn({ email: "ben@tufts.edu", password: "x" }, { signIn: null })).toMatchObject({ message: expect.stringMatching(/isn't connected/) });
  });
});

describe("requestPasswordReset", () => {
  it("sends a link back to the set-password page and doesn't reveal whether the account exists", async () => {
    const sendReset = vi.fn().mockResolvedValue(ok);
    expect(await requestPasswordReset({ email: "ben@tufts.edu" }, { sendReset, origin })).toEqual({
      status: "sent",
      email: "ben@tufts.edu",
      kind: "reset",
    });
    expect(sendReset).toHaveBeenCalledWith("ben@tufts.edu", "https://pickup.example/auth/callback?next=%2Freset-password");
  });

  it("rejects non-Tufts emails and explains failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await requestPasswordReset({ email: "x@gmail.com" }, { sendReset: vi.fn(), origin })).toMatchObject({ field: "email" });
    const limited = vi.fn().mockResolvedValue({ error: { status: 429, message: "" } });
    expect(await requestPasswordReset({ email: "ben@tufts.edu" }, { sendReset: limited, origin })).toMatchObject({ message: expect.stringMatching(/Too many/) });
  });
});

describe("setNewPassword", () => {
  it("saves a valid password", async () => {
    const update = vi.fn().mockResolvedValue(ok);
    expect(await setNewPassword({ password: "brand new pass" }, { update })).toBeNull();
    expect(update).toHaveBeenCalledWith("brand new pass");
  });

  it("checks length, reuse and expired sessions", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await setNewPassword({ password: "short" }, { update: vi.fn() })).toMatchObject({ field: "password" });
    const same = vi.fn().mockResolvedValue({ error: { status: 422, code: "same_password", message: "" } });
    expect(await setNewPassword({ password: "longenough" }, { update: same })).toMatchObject({ message: expect.stringMatching(/current password/) });
    const expired = vi.fn().mockResolvedValue({ error: { status: 401, message: "" } });
    expect(await setNewPassword({ password: "longenough" }, { update: expired })).toMatchObject({ message: expect.stringMatching(/expired/) });
  });
});
