import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app/AppNav";
import { createClient, getUser } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { menuUser } from "@/lib/nav";
import { hasPassword, isProfileComplete } from "@/lib/onboarding";

// Signed-in pages are per-user: never prerender or cache them.
export const dynamic = "force-dynamic";

/** Everything under (app) needs a signed-in Tufts student. The middleware redirects too; this is the backstop. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = supabaseConfigured() ? await getUser() : null;
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, email, class_year, major").eq("id", user.id).single();
  // New students (and anyone with an old free-text major, or no password yet) finish setting up first.
  if (!hasPassword(user) || (profile && !isProfileComplete(profile))) redirect("/welcome");

  return (
    <div className="app">
      <AppNav user={menuUser(profile?.full_name, profile?.email ?? user.email)} />
      {children}
    </div>
  );
}
