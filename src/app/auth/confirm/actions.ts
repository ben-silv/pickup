"use server";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { afterSignInPath } from "@/lib/auth/after-sign-in";
import { confirmEmailLink } from "@/lib/auth/email-link";
import type { ActionState } from "@/lib/action-state";

/** The button on /auth/confirm: spends the email's one-time token, signs the person in, and continues. */
export async function confirmEmail(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = supabaseConfigured() ? await createClient() : null;
  const signedIn: { user: User | null } = { user: null };
  const result = await confirmEmailLink(
    { token_hash: form.get("token_hash"), type: form.get("type") },
    {
      verify: supabase
        ? async ({ tokenHash, type }) => {
            const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
            signedIn.user = data.user;
            return { ok: !error && Boolean(data.user), error };
          }
        : null,
    },
  );
  if (!result.ok) return { status: "error", message: result.message };
  if (!supabase || !signedIn.user) return { status: "error", message: "Couldn't sign you in. Try again." };
  redirect(await afterSignInPath(supabase, signedIn.user, result.next));
}
