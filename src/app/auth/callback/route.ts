import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/paths";
import { afterSignInPath } from "@/lib/auth/after-sign-in";

/** Email links (new account, password reset) land here. Swaps the one-time code for a session cookie, then continues. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (code && supabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(await afterSignInPath(supabase, data.user, next), url.origin));
    }
    console.error("auth callback failed", error.message);
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", url.origin));
}
