import { newPasswordSchema, passwordSignInSchema, signInSchema } from "@/lib/schemas";
import { safeNextPath } from "./paths";
import type { AuthState } from "./auth-state";

export { initialAuthState, type AuthState } from "./auth-state";

/** The parts of a Supabase AuthError we look at. */
export type AuthErr = { status?: number; code?: string; message: string } | null;

type Field = "email" | "password";
const fieldOf = (path: readonly PropertyKey[]): Field => (path[0] === "password" ? "password" : "email");

function invalid(issues: readonly { path: readonly PropertyKey[]; message: string }[]): AuthState {
  const first = issues[0];
  return { status: "error", message: first?.message ?? "Check what you entered.", field: first ? fieldOf(first.path) : undefined };
}

const notConnected: AuthState = { status: "error", message: "Sign-in isn't connected yet. Add the Supabase keys to .env.local." };
const tooMany: AuthState = { status: "error", message: "Too many tries. Wait a minute and try again." };

/** Where a confirmation or reset email should land, always on this site. */
export const callbackUrl = (origin: string, next: unknown) => `${origin}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`;

/**
 * Email + password sign-in. Returns null on success (the caller redirects); otherwise a plain-English error.
 * Wrong email and wrong password get the same message so the form doesn't reveal who has an account.
 */
export async function passwordSignIn(
  input: { email: unknown; password: unknown },
  deps: { signIn: ((email: string, password: string) => Promise<{ error: AuthErr }>) | null },
): Promise<AuthState | null> {
  const parsed = passwordSignInSchema.safeParse({ email: input.email ?? "", password: input.password ?? "" });
  if (!parsed.success) return invalid(parsed.error.issues);
  if (!deps.signIn) return notConnected;

  const { error } = await deps.signIn(parsed.data.email, parsed.data.password);
  if (!error) return null;
  if (error.code === "email_not_confirmed") {
    return { status: "error", message: "Confirm your email first: open the link we sent when you made your account." };
  }
  if (error.status === 429) return tooMany;
  if (error.code === "invalid_credentials" || error.status === 400) {
    return {
      status: "error",
      field: "password",
      message: "Wrong email or password.",
    };
  }
  console.error("password sign-in failed", error);
  return { status: "error", message: "Couldn't sign you in. Try again in a minute." };
}

/** Emails a link that signs the user in and opens the set-a-new-password page. */
export async function requestPasswordReset(
  input: { email: unknown },
  deps: { sendReset: ((email: string, redirectTo: string) => Promise<{ error: AuthErr }>) | null; origin: string },
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({ email: input.email ?? "" });
  if (!parsed.success) return invalid(parsed.error.issues);
  if (!deps.sendReset) return notConnected;

  const { error } = await deps.sendReset(parsed.data.email, callbackUrl(deps.origin, "/reset-password"));
  if (error) {
    if (error.status === 429) return { status: "error", message: "Too many emails. Wait a minute and try again." };
    console.error("password reset email failed", error);
    return { status: "error", message: "We couldn't send the email. Try again in a minute." };
  }
  // Same answer whether or not the account exists.
  return { status: "sent", email: parsed.data.email, kind: "reset" };
}

/** Saves a new password for the signed-in user. Returns null on success. */
export async function setNewPassword(
  input: { password: unknown },
  deps: { update: ((password: string) => Promise<{ error: AuthErr }>) | null },
): Promise<AuthState | null> {
  const parsed = newPasswordSchema.safeParse({ password: input.password ?? "" });
  if (!parsed.success) return invalid(parsed.error.issues);
  if (!deps.update) return notConnected;

  const { error } = await deps.update(parsed.data.password);
  if (!error) return null;
  if (error.code === "same_password") return { status: "error", field: "password", message: "That's your current password. Pick a new one." };
  if (error.code === "weak_password") return { status: "error", field: "password", message: "Pick a stronger password." };
  if (error.status === 401 || error.code === "session_not_found") {
    return { status: "error", message: "Your reset link expired. Request a new one from the sign-in page." };
  }
  console.error("password update failed", error);
  return { status: "error", message: "Couldn't save your password. Try again." };
}
