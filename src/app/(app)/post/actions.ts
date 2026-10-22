"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { postIntentSchema, projectInputSchema } from "@/lib/schemas";
import { projectFormValues } from "@/lib/post";
import { friendlyDbError } from "@/lib/db-errors";
import { fieldErrors, type ActionState } from "@/lib/action-state";

/** Saves the project and its roles in one transaction (create_project), then opens the new project page. */
export async function createProject(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = projectInputSchema.safeParse(projectFormValues(form));
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  }
  const user = await getUser();
  if (!user) return { status: "error", message: "Your session expired. Sign in again." };

  const p = parsed.data;
  const status = postIntentSchema.parse(form.get("intent")) === "publish" ? "published" : "draft";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_project", {
    p_title: p.title,
    p_pitch: p.pitch,
    p_description: p.description,
    p_stage: p.stage,
    p_prototype_url: p.prototypeUrl ?? "",
    p_repo_url: p.repoUrl ?? "",
    p_status: status,
    p_roles: p.roles,
  });
  if (error || typeof data !== "string") {
    console.error("createProject failed", error);
    return { status: "error", message: friendlyDbError(error ?? {}, "Couldn't save your project. Try again.") };
  }
  revalidatePath("/browse");
  revalidatePath("/profile");
  redirect(`/projects/${data}`);
}
