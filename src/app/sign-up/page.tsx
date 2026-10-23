import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { SignUpForm } from "./SignUpForm";
import { safeNextPath } from "@/lib/auth/paths";

export const metadata: Metadata = { title: "Create an account · Pickup" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = safeNextPath((await searchParams).next);
  return (
    <main className="sign-in">
      <div className="sign-in-shape one" aria-hidden="true" />
      <div className="sign-in-shape two" aria-hidden="true" />
      <div className="sign-in-logo">
        <Logo tone="light" />
      </div>
      <section className="sign-in-card glass">
        <SignUpForm next={next} />
      </section>
    </main>
  );
}
