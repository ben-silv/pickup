"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { completeRoleInputSchema, messageInputSchema, offerIdSchema, reportInputSchema } from "@/lib/schemas";
import { friendlyDbError } from "@/lib/db-errors";
import { fieldErrors, type ActionState } from "@/lib/action-state";

export async function sendMessage(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = messageInputSchema.safeParse({ offerId: form.get("offerId"), body: form.get("body") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Write a message first." };
  const user = await getUser();
  if (!user) return { status: "error", message: "Your session expired. Sign in again." };

  // RLS checks that I'm in this conversation and that the offer is still pending or accepted.
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({ offer_id: parsed.data.offerId, sender_id: user.id, body: parsed.data.body });
  if (error) {
    console.error("sendMessage failed", error);
    return {
      status: "error",
      message: friendlyDbError(error, "Couldn't send your message. Try again.", {
        // Row-level security refusal: the offer is closed, or one of you blocked the other.
        "42501": "This conversation is closed, so messages can't be sent.",
      }),
    };
  }
  revalidatePath(`/messages/${parsed.data.offerId}`);
  revalidatePath("/messages");
  return { status: "done", message: "Sent." };
}

/** Owner marks the role filled and leaves a credit note, in one SECURITY DEFINER call. */
export async function completeRole(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = completeRoleInputSchema.safeParse({
    roleId: form.get("roleId"),
    offerId: form.get("offerId"),
    hours: form.get("hours"),
    note: form.get("note"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the hours and note.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_role", { p_role: parsed.data.roleId, p_hours: parsed.data.hours, p_note: parsed.data.note });
  if (error) {
    console.error("complete_role failed", error);
    return { status: "error", message: friendlyDbError(error, "Couldn't mark the role filled. Try again.") };
  }
  revalidatePath(`/messages/${parsed.data.offerId}`);
  revalidatePath("/messages");
  revalidatePath("/projects/[id]", "page");
  revalidatePath("/profile");
  return { status: "done", message: "Role filled. Your credit note is on their profile." };
}

/** Report the other person in a conversation. Reviewed by the site admin in Supabase (reports table). */
export async function reportConversation(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = reportInputSchema.safeParse({ offerId: form.get("offerId"), reason: form.get("reason"), details: form.get("details") ?? "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Pick a reason." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("report_conversation", {
    p_offer: parsed.data.offerId,
    p_reason: parsed.data.reason,
    p_details: parsed.data.details,
  });
  if (error) {
    console.error("report_conversation failed", error);
    return { status: "error", message: friendlyDbError(error, "Couldn't send your report. Try again.") };
  }
  return { status: "done", message: "Thanks for telling us. We'll look into it." };
}

async function blockRpc(fn: "block_in_conversation" | "unblock_in_conversation", form: FormData, fallback: string): Promise<ActionState> {
  const offerId = offerIdSchema.safeParse(form.get("offerId"));
  if (!offerId.success) return { status: "error", message: fallback };
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_offer: offerId.data });
  if (error) {
    console.error(`${fn} failed`, error);
    return { status: "error", message: friendlyDbError(error, fallback) };
  }
  revalidatePath(`/messages/${offerId.data}`);
  revalidatePath("/messages");
  revalidatePath("/projects/[id]", "page");
  return { status: "done", message: "Done." };
}

/** Block the other person: closes this conversation and any pending offers between you, and stops new ones. */
export async function blockPerson(_prev: ActionState, form: FormData): Promise<ActionState> {
  return blockRpc("block_in_conversation", form, "Couldn't block them. Try again.");
}

export async function unblockPerson(_prev: ActionState, form: FormData): Promise<ActionState> {
  return blockRpc("unblock_in_conversation", form, "Couldn't unblock them. Try again.");
}
