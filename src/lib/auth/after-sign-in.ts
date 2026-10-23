import "server-only";
import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
import { needsSetup, isProfileComplete } from "@/lib/onboarding";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Where to go right after signing in. Anyone missing a password or their basics finishes the welcome step first;
 * a password-reset link goes straight to the new-password page once the profile is complete.
 */
export async function afterSignInPath(supabase: Supabase, user: User, next: string): Promise<string> {
  const { data: profile } = await supabase.from("profiles").select("full_name, class_year, major").eq("id", user.id).maybeSingle();
  if (next === "/reset-password" && isProfileComplete(profile)) return next;
  if (needsSetup(profile, user)) {
    // The welcome step sets a password itself, so don't send them on to set another one.
    const after = next === "/reset-password" ? "/browse" : next;
    return `/welcome?next=${encodeURIComponent(after)}`;
  }
  return next;
}
