import type { Metadata } from "next";
import { BandPattern } from "@/components/app/BandPattern";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ActionButton } from "@/components/app/ActionButton";
import { parseEmailLink } from "@/lib/auth/email-link";
import { confirmEmail } from "./actions";

export const metadata: Metadata = { title: "Confirm · Project Pickup", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Email links land here. Nothing happens until the person presses the button: school email scanners open every
 * link in a message, and a link that signed in on page load would be used up before the student ever saw it.
 * Works in any browser or device, because the token is in the link rather than a cookie from the sign-up tab.
 */
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const link = parseEmailLink({ token_hash: params.token_hash, type: params.type });
  const reset = link?.type === "recovery";

  return (
    <main className="sign-in">
      <BandPattern fade={false} />
      <div className="sign-in-shape one" aria-hidden="true" />
      <div className="sign-in-shape two" aria-hidden="true" />
      <div className="sign-in-logo">
        <Logo tone="light" />
      </div>
      <section className="sign-in-card glass">
        {link ? (
          <div className="stack-md">
            <div className="stack-sm">
              <h1 className="display" style={{ fontSize: 38 }}>{reset ? "Reset your password" : "Confirm your email"}</h1>
              <p className="muted">{reset ? "One tap and you can pick a new password." : "One tap and you're in. Next you'll pick a password and fill in your profile."}</p>
            </div>
            <ActionButton
              action={confirmEmail}
              fields={{ token_hash: link.tokenHash, type: link.type }}
              label={reset ? "Continue" : "Confirm my email"}
              pendingLabel="Confirming…"
              className="btn glass-dark confirm-button"
            />
          </div>
        ) : (
          <div className="stack-md">
            <div className="stack-sm">
              <h1 className="display" style={{ fontSize: 38 }}>That link didn&apos;t work</h1>
              <p className="muted">It may be incomplete. Open the newest email from us, or request a new link.</p>
            </div>
            <p className="auth-switch">
              <Link href="/sign-up">Create an account</Link> or <Link href="/sign-in">sign in</Link>
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
