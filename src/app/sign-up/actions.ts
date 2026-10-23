"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { siteOrigin } from "@/lib/site-origin";
import { requestSignInLink, type SignInState } from "@/lib/auth/sign-in";

/** Step 1 of creating an account: email a link that proves the Tufts address. The welcome step then sets a password. */
export async function sendSignUpLink(_prev: SignInState, form: FormData): Promise<SignInState> {
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
