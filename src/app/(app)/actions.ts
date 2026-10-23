"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { offerIdSchema } from "@/lib/schemas";
import { hasUnread } from "@/lib/unread";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Opening a conversation marks it read; refreshing the layout clears the red dot on Messages. */
export async function markThreadRead(offerId: string): Promise<void> {
  const id = offerIdSchema.safeParse(offerId);
  if (!id.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_thread_read", { p_offer: id.data });
  if (error) {
    console.error("mark_thread_read failed", error);
    return;
  }
  revalidatePath("/", "layout");
}

/** For the menu to re-check when the tab comes back into focus (new offers don't stream live). */
export async function checkUnread(): Promise<boolean> {
  return hasUnread(await createClient());
}
