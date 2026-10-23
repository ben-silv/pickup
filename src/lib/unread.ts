import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Conversations with something new from the other person since I last opened them (unread_offer_ids()). */
export async function unreadOfferIds(supabase: Supabase): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("unread_offer_ids");
  if (error) {
    console.error("unread_offer_ids failed", error);
    return new Set();
  }
  const rows: unknown[] = Array.isArray(data) ? data : [];
  return new Set(rows.map((r) => (typeof r === "string" ? r : String((r as { unread_offer_ids?: unknown }).unread_offer_ids ?? ""))).filter(Boolean));
}

export async function hasUnread(supabase: Supabase): Promise<boolean> {
  return (await unreadOfferIds(supabase)).size > 0;
}
