import { emailLinkSchema, EMAIL_LINK_TYPES } from "@/lib/schemas";

export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];
export type EmailLink = { tokenHash: string; type: EmailLinkType };

/** Reads ?token_hash=…&type=… from an email link. Null when it isn't one of ours. */
export function parseEmailLink(params: { token_hash?: unknown; type?: unknown }): EmailLink | null {
  const parsed = emailLinkSchema.safeParse({ tokenHash: params.token_hash, type: params.type });
  return parsed.success ? parsed.data : null;
}

/** Password-reset links continue to the new-password page; sign-up and sign-in links to the feed. */
export function nextAfterEmailLink(type: EmailLinkType): string {
  return type === "recovery" ? "/reset-password" : "/browse";
}

export type VerifyLink = (link: EmailLink) => Promise<{ ok: boolean; error?: { status?: number; message: string } | null }>;

/**
 * Uses up the one-time token. Only called when the person presses the button on /auth/confirm, never on page load,
 * so email scanners that open links (like Microsoft Safe Links on Tufts mail) can't spend it first.
 */
export async function confirmEmailLink(
  input: { token_hash: unknown; type: unknown },
  deps: { verify: VerifyLink | null },
): Promise<{ ok: true; next: string } | { ok: false; message: string }> {
  const link = parseEmailLink(input);
  const expired = "That link expired or was already used. Request a new one and open the newest email.";
  if (!link) return { ok: false, message: expired };
  if (!deps.verify) return { ok: false, message: "Sign-in isn't connected yet. Add the Supabase keys to .env.local." };
  const { ok, error } = await deps.verify(link);
  if (!ok) {
    if (error) console.error("email link verify failed", error);
    if (error?.status === 429) return { ok: false, message: "Too many tries. Wait a minute and try again." };
    return { ok: false, message: expired };
  }
  return { ok: true, next: nextAfterEmailLink(link.type) };
}
