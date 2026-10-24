import type { createClient } from "@/lib/supabase/server";

/** Opt-in for occasional update emails, kept private in `email_preferences`. Account emails don't depend on it. */
type Supabase = Awaited<ReturnType<typeof createClient>>;

/** A ticked checkbox named `emailUpdates` means yes. Anything else (unticked, missing) means no. */
export function wantsEmailUpdates(form: { get(name: string): unknown }): boolean {
  return form.get("emailUpdates") === "on";
}

export async function getEmailUpdates(supabase: Supabase, userId: string): Promise<boolean> {
  const { data } = await supabase.from("email_preferences").select("updates").eq("user_id", userId).maybeSingle();
  return data?.updates ?? false;
}

/** Returns false if it couldn't save (logged); callers keep going, since this never blocks anything else. */
export async function saveEmailUpdates(supabase: Supabase, userId: string, updates: boolean): Promise<boolean> {
  const { error } = await supabase.from("email_preferences").upsert({ user_id: userId, updates }, { onConflict: "user_id" });
  if (error) console.error("saving email preference failed", error);
  return !error;
}
