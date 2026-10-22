"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { offerIdSchema, offerInputSchema, projectIdSchema, projectStatusInputSchema } from "@/lib/schemas";
import { friendlyDbError } from "@/lib/db-errors";
import type { ActionState } from "@/lib/action-state";

const signedOut: ActionState = { status: "error", message: "Your session expired. Sign in again." };

function refresh(projectId: unknown) {
  const id = projectIdSchema.safeParse(projectId);
  if (id.success) revalidatePath(`/projects/${id.data}`);
  revalidatePath("/messages");
}

export async function sendOffer(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = offerInputSchema.safeParse({ roleId: form.get("roleId"), note: form.get("note") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check your offer and try again." };
  const user = await getUser();
  if (!user) return signedOut;

  const supabase = await createClient();
  const { error } = await supabase.from("offers").insert({ role_id: parsed.data.roleId, helper_id: user.id, note: parsed.data.note });
  if (error) {
    console.error("sendOffer failed", error);
    return {
      status: "error",
      message: friendlyDbError(error, "Couldn't send your offer. Try again.", {
        "23505": "You've already offered on this role.",
        "42501": "This role isn't taking offers right now.",
      }),
    };
  }
  refresh(form.get("projectId"));
  return { status: "done", message: "Offer sent." };
}

/** Shared by withdraw, accept and decline: each is one SECURITY DEFINER function that checks who's calling. */
async function offerRpc(fn: "withdraw_offer" | "accept_offer" | "decline_offer", form: FormData, fallback: string): Promise<ActionState> {
  const offerId = offerIdSchema.safeParse(form.get("offerId"));
  if (!offerId.success) return { status: "error", message: fallback };
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_offer: offerId.data });
  if (error) {
    console.error(`${fn} failed`, error);
    return { status: "error", message: friendlyDbError(error, fallback) };
  }
  refresh(form.get("projectId"));
  return { status: "done", message: "Done." };
}

export async function withdrawOffer(_prev: ActionState, form: FormData): Promise<ActionState> {
  return offerRpc("withdraw_offer", form, "Couldn't withdraw your offer. Try again.");
}

export async function acceptOffer(_prev: ActionState, form: FormData): Promise<ActionState> {
  return offerRpc("accept_offer", form, "Couldn't accept this offer. Try again.");
}

export async function declineOffer(_prev: ActionState, form: FormData): Promise<ActionState> {
  return offerRpc("decline_offer", form, "Couldn't decline this offer. Try again.");
}

/** Publish a draft or take a published project back to draft. RLS only lets the owner update. */
export async function setProjectStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = projectStatusInputSchema.safeParse({ projectId: form.get("projectId"), status: form.get("status") });
  if (!parsed.success) return { status: "error", message: "Couldn't update the project. Try again." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.projectId)
    .neq("status", "archived")
    .select("id");
  if (error || !data?.length) {
    if (error) console.error("setProjectStatus failed", error);
    return { status: "error", message: error ? friendlyDbError(error, "Couldn't update the project. Try again.") : "Only the owner can change this project." };
  }
  refresh(parsed.data.projectId);
  revalidatePath("/browse");
  revalidatePath("/profile");
  return { status: "done", message: parsed.data.status === "published" ? "Published." : "Moved back to draft." };
}
