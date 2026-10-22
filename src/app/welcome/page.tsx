import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { WelcomeForm } from "./WelcomeForm";
import { createClient, getUser } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/paths";
import { isProfileComplete, knownMajor } from "@/lib/onboarding";

export const metadata: Metadata = { title: "Welcome · Pickup" };
export const dynamic = "force-dynamic";

export default async function WelcomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = safeNextPath((await searchParams).next);
  const user = supabaseConfigured() ? await getUser() : null;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent("/welcome")}`);

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, class_year, major").eq("id", user.id).maybeSingle();
  if (isProfileComplete(profile)) redirect(next);

  return (
    <main className="sign-in">
      <div className="sign-in-shape one" aria-hidden="true" />
      <div className="sign-in-shape two" aria-hidden="true" />
      <div className="sign-in-logo">
        <Logo tone="light" />
      </div>
      <section className="sign-in-card welcome-card glass">
        <WelcomeForm
          next={next}
          fullName={profile?.full_name ?? ""}
          classYear={profile?.class_year ?? ""}
          major={knownMajor(profile?.major)}
        />
      </section>
    </main>
  );
}
