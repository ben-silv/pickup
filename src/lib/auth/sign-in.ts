import { signInSchema } from "@/lib/schemas";
import { safeNextPath } from "./paths";
import type { SignInState } from "./sign-in-state";

export { initialSignInState, type SignInState } from "./sign-in-state";

export type SendLink = (email: string, redirectTo: string) => Promise<{ error: { status?: number; message: string } | null }>;

/** Validates the email and asks Supabase to send a one-time sign-in link. Dependencies injected for testing. */
export async function requestSignInLink(
  input: { email: unknown; next: unknown },
  deps: { sendLink: SendLink | null; origin: string },
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({ email: input.email ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check your email." };
  if (!deps.sendLink) return { status: "error", message: "Sign-in isn't connected yet. Add the Supabase keys to .env.local." };

  const next = safeNextPath(input.next);
  const redirectTo = `${deps.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await deps.sendLink(parsed.data.email, redirectTo);
  if (error) {
    console.error("sign-in link failed", error);
    if (error.status === 429) return { status: "error", message: "Too many sign-in emails. Wait a minute and try again." };
    return { status: "error", message: "We couldn't send the link. Try again in a minute." };
  }
  return { status: "sent", email: parsed.data.email };
}
