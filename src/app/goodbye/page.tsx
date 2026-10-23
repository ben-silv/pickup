import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Account deleted · Project Pickup", robots: { index: false } };

/** Where you land after deleting your account. */
export default function GoodbyePage() {
  return (
    <main className="sign-in">
      <div className="sign-in-shape one" aria-hidden="true" />
      <div className="sign-in-shape two" aria-hidden="true" />
      <div className="sign-in-logo">
        <Logo tone="light" />
      </div>
      <section className="sign-in-card glass stack-md">
        <h1 className="display" style={{ fontSize: 38 }}>Your account is deleted</h1>
        <p className="muted">Your profile, projects, offers and messages are gone. Thanks for trying Project Pickup.</p>
        <Link href="/" className="btn glass-dark">
          Back to the home page
        </Link>
      </section>
    </main>
  );
}
