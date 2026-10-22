import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app/AppNav";
import { createClient, getUser } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

// Signed-in pages are per-user: never prerender or cache them.
export const dynamic = "force-dynamic";

function initialsOf(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Everything under (app) needs a signed-in Tufts student. The middleware redirects too; this is the backstop. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = supabaseConfigured() ? await getUser() : null;
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single();

  return (
    <div className="app">
      <AppNav initials={initialsOf(profile?.full_name ?? "", profile?.email ?? user.email ?? "")} />
      {children}
    </div>
  );
}
