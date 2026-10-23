import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { getUser } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "New password · Project Pickup" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const user = supabaseConfigured() ? await getUser() : null;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent("/reset-password")}`);

  return (
    <main className="sign-in">
      <div className="sign-in-shape one" aria-hidden="true" />
      <div className="sign-in-shape two" aria-hidden="true" />
      <div className="sign-in-logo">
        <Logo tone="light" />
      </div>
      <section className="sign-in-card glass">
        <ResetPasswordForm email={user.email ?? ""} />
      </section>
    </main>
  );
}
