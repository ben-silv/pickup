"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { completeRoleInputSchema, messageInputSchema } from "@/lib/schemas";
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
      message: friendlyDbError(error, "Couldn't send your message. Try again.", { "42501": "This conversation is closed, so messages can't be sent." }),
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
