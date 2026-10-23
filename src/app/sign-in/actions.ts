"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { siteOrigin } from "@/lib/site-origin";
import { safeNextPath } from "@/lib/auth/paths";
import { hasPassword } from "@/lib/onboarding";
import { afterSignInPath } from "@/lib/auth/after-sign-in";
import { passwordSignIn, requestPasswordReset, type AuthState } from "@/lib/auth/password";

export async function signInWithPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const supabase = supabaseConfigured() ? await createClient() : null;
  const result = await passwordSignIn(
    { email: form.get("email"), password: form.get("password") },
    { signIn: supabase ? (email, password) => supabase.auth.signInWithPassword({ email, password }) : null },
  );
  if (result) return result;
  if (!supabase) return { status: "idle" };

  let { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "error", message: "Couldn't sign you in. Try again in a minute." };
  // Signing in with a password proves there is one (covers passwords set before we recorded this).
  if (!hasPassword(auth.user)) {
    const updated = await supabase.auth.updateUser({ data: { password_set: true } });
    if (updated.data.user) auth = { user: updated.data.user };
  }
  redirect(await afterSignInPath(supabase, auth.user, safeNextPath(form.get("next"))));
}

export async function sendPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const supabase = supabaseConfigured() ? await createClient() : null;
  return requestPasswordReset(
    { email: form.get("email") },
    {
      origin: await siteOrigin(),
      sendReset: supabase ? (email, redirectTo) => supabase.auth.resetPasswordForEmail(email, { redirectTo }) : null,
    },
  );
}
