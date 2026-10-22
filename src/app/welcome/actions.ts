"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/schemas";
import { safeNextPath } from "@/lib/auth/paths";
import { friendlyDbError } from "@/lib/db-errors";
import { fieldErrors, type ActionState } from "@/lib/action-state";

/** First sign-in: save name, class year and major, then continue to where they were going. */
export async function completeOnboarding(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse({
    fullName: form.get("fullName") ?? "",
    classYear: form.get("classYear") ?? "",
    major: form.get("major") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Fill in all three to continue.", fieldErrors: fieldErrors(parsed.error.issues) };
  }
  const user = await getUser();
  if (!user) return { status: "error", message: "Your session expired. Sign in again." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, class_year: parsed.data.classYear, major: parsed.data.major })
    .eq("id", user.id)
    .select("id");
  if (error || !data?.length) {
    console.error("completeOnboarding failed", error ?? `no profile row for ${user.id}`);
    return { status: "error", message: friendlyDbError(error ?? {}, "Couldn't save that. Try again.") };
  }
  revalidatePath("/", "layout");
  redirect(safeNextPath(form.get("next")));
}
