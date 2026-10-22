import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { SignInForm } from "./SignInForm";
import { safeNextPath } from "@/lib/auth/paths";

export const metadata: Metadata = { title: "Sign in · Pickup" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  return (
    <main className="sign-in">
      <div className="sign-in-shape one" aria-hidden="true" />
      <div className="sign-in-shape two" aria-hidden="true" />
      <div className="sign-in-logo">
        <Logo tone="light" />
      </div>
      <section className="sign-in-card glass">
        <SignInForm next={next} linkError={params.error === "link"} />
      </section>
    </main>
  );
}
