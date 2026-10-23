"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { setNewPassword, type AuthState } from "@/lib/auth/password";

/** The reset email signs the user in and lands here; this saves the new password. */
export async function saveNewPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const supabase = supabaseConfigured() ? await createClient() : null;
  const result = await setNewPassword(
    { password: form.get("password") },
    { update: supabase ? (password) => supabase.auth.updateUser({ password, data: { password_set: true } }) : null },
  );
  if (result) return result;
  redirect("/browse");
}
