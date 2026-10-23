"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { setupSchema } from "@/lib/schemas";
import { safeNextPath } from "@/lib/auth/paths";
import { setupNeeds } from "@/lib/onboarding";
import { setNewPassword } from "@/lib/auth/password";
import { friendlyDbError } from "@/lib/db-errors";
import { fieldErrors, type ActionState } from "@/lib/action-state";

/** Finishing a new account: save name, class year and major, and the password, then continue. Asks only for what's missing. */
export async function completeOnboarding(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Your session expired. Sign in again." };

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, class_year, major").eq("id", user.id).maybeSingle();
  const needs = setupNeeds(profile, user);

  const parsed = setupSchema(needs).safeParse({
    fullName: form.get("fullName") ?? "",
    classYear: form.get("classYear") ?? "",
    major: form.get("major") ?? "",
    password: form.get("password") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Fill in everything to continue.", fieldErrors: fieldErrors(parsed.error.issues) };
  }
  const input = parsed.data as { fullName?: string; classYear?: string; major?: string; password?: string };

  if (needs.basics) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: input.fullName, class_year: input.classYear, major: input.major })
      .eq("id", user.id)
      .select("id");
    if (error || !data?.length) {
      console.error("completeOnboarding failed", error ?? `no profile row for ${user.id}`);
      return { status: "error", message: friendlyDbError(error ?? {}, "Couldn't save that. Try again.") };
    }
  }

  if (needs.password) {
    const failed = await setNewPassword(
      { password: input.password },
      { update: (password) => supabase.auth.updateUser({ password, data: { password_set: true } }) },
    );
    if (failed?.status === "error") {
      return { status: "error", message: failed.message, fieldErrors: { password: failed.message } };
    }
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(form.get("next")));
}
