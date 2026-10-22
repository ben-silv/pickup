/** Pages that need a signed-in Tufts student. */
export const PROTECTED_PREFIXES = ["/browse", "/post", "/messages", "/profile", "/projects"] as const;

export const DEFAULT_AFTER_SIGN_IN = "/browse";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Where to send someone after sign-in. Only same-site paths are allowed, so a crafted
 * `?next=https://evil.example` (or `//evil.example`) can't turn the sign-in link into an open redirect.
 */
export function safeNextPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return DEFAULT_AFTER_SIGN_IN;
  }
  try {
    const url = new URL(raw, "https://pickup.invalid");
    if (url.origin !== "https://pickup.invalid") return DEFAULT_AFTER_SIGN_IN;
    return url.pathname + url.search;
  } catch {
    return DEFAULT_AFTER_SIGN_IN;
  }
}
