import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/paths";
import { isProfileComplete } from "@/lib/onboarding";

/** The sign-in email links here. Swaps the one-time code for a session cookie, then continues. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (code && supabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, class_year, major")
        .eq("id", data.user.id)
        .maybeSingle();
      const target = isProfileComplete(profile) ? next : `/welcome?next=${encodeURIComponent(next)}`;
      return NextResponse.redirect(new URL(target, url.origin));
    }
    console.error("auth callback failed", error.message);
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", url.origin));
}
