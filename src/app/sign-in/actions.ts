"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { siteOrigin } from "@/lib/site-origin";
import { safeNextPath } from "@/lib/auth/paths";
import { isProfileComplete } from "@/lib/onboarding";
import { requestSignInLink, type SignInState } from "@/lib/auth/sign-in";
import { createAccount, passwordSignIn, requestPasswordReset, type AuthState } from "@/lib/auth/password";

export async function sendSignInLink(_prev: SignInState, form: FormData): Promise<SignInState> {
  const supabase = supabaseConfigured() ? await createClient() : null;
  return requestSignInLink(
    { email: form.get("email"), next: form.get("next") },
    {
      origin: await siteOrigin(),
      sendLink: supabase
        ? (email, redirectTo) => supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: true } })
        : null,
    },
  );
}

/** After a password sign-in: new accounts finish the welcome step first, everyone else goes where they were headed. */
async function continueAfterSignIn(supabase: Awaited<ReturnType<typeof createClient>>, rawNext: FormDataEntryValue | null): Promise<never> {
  const next = safeNextPath(rawNext);
  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = auth.user
    ? await supabase.from("profiles").select("full_name, class_year, major").eq("id", auth.user.id).maybeSingle()
    : { data: null };
  redirect(isProfileComplete(profile) ? next : `/welcome?next=${encodeURIComponent(next)}`);
}

export async function signInWithPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const supabase = supabaseConfigured() ? await createClient() : null;
  const result = await passwordSignIn(
    { email: form.get("email"), password: form.get("password") },
    { signIn: supabase ? (email, password) => supabase.auth.signInWithPassword({ email, password }) : null },
  );
  if (result || !supabase) return result ?? { status: "idle" };
  return continueAfterSignIn(supabase, form.get("next"));
}

export async function signUpWithPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const supabase = supabaseConfigured() ? await createClient() : null;
  const result = await createAccount(
    { email: form.get("email"), password: form.get("password"), next: form.get("next") },
    {
      origin: await siteOrigin(),
      signUp: supabase
        ? async (email, password, redirectTo) => {
            const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
            return {
              error,
              signedIn: Boolean(data.session),
              alreadyRegistered: !error && Array.isArray(data.user?.identities) && data.user.identities.length === 0,
            };
          }
        : null,
    },
  );
  if (result || !supabase) return result ?? { status: "idle" };
  return continueAfterSignIn(supabase, form.get("next"));
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
