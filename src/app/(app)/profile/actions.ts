"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { deleteAccountSchema, profileInputSchema } from "@/lib/schemas";
import { profileFormValues } from "@/lib/profile";
import { friendlyDbError } from "@/lib/db-errors";
import { fieldErrors, type ActionState } from "@/lib/action-state";

export async function updateProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = profileInputSchema.safeParse(profileFormValues(form));
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  }
  const user = await getUser();
  if (!user) return { status: "error", message: "Your session expired. Sign in again." };

  const p = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: p.fullName,
      class_year: p.classYear,
      major: p.major,
      bio: p.bio,
      skills: p.skills,
      open_to_requests: p.openToRequests,
      hours_per_week: p.hoursPerWeek,
      github_url: p.githubUrl,
    })
    .eq("id", user.id)
    .select("id");
  if (error || !data?.length) {
    console.error("updateProfile failed", error ?? `no profile row updated for ${user.id}`);
    return { status: "error", message: friendlyDbError(error ?? {}, "Couldn't save your profile. Try again.") };
  }
  revalidatePath("/", "layout");
  redirect("/profile");
}

/** Deletes my account and everything tied to it (delete_my_account), signs me out, and says goodbye. */
export async function deleteAccount(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = deleteAccountSchema.safeParse({ confirm: form.get("confirm") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Type DELETE to confirm." };
  const user = await getUser();
  if (!user) return { status: "error", message: "Your session expired. Sign in again." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("delete_my_account failed", error);
    return { status: "error", message: friendlyDbError(error, "Couldn't delete your account. Try again, or email us.") };
  }
  // The user no longer exists; clear this browser's session cookies.
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/goodbye");
}
