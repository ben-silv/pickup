"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { requestSignInLink, type SignInState } from "@/lib/auth/sign-in";

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

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
