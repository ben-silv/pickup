import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Category, OfferStatus, RoleStatus } from "@/lib/vocab";
import { CATEGORY_LABEL } from "@/lib/vocab";
import type { Person } from "@/lib/project";
import { byActivity, lastMessageByOffer, latest, threadStatus, type ChatMessage } from "@/lib/messages";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const PERSON = "id, full_name, class_year, major";

/** An offer with everything a conversation needs. Role or project is null if the owner has since hidden the project. */
export const OFFER_SELECT = `id, status, note, created_at, decided_at, resent_at, helper:profiles(${PERSON}),
  role:roles(id, category, need, hours, status, project:projects(id, title, owner:profiles(${PERSON})))`;

export type OfferThreadRow = {
  id: string;
  status: OfferStatus;
  note: string;
  created_at: string;
  decided_at: string | null;
  resent_at: string | null;
  helper: Person;
  role: {
    id: string;
    category: Category;
    need: string;
    hours: number;
    status: RoleStatus;
    project: { id: string; title: string; owner: Person } | null;
  } | null;
};

export type Conversation = {
  offerId: string;
  other: Person | null;
  projectTitle: string;
  roleLabel: string;
  last: string;
  activityAt: string;
  status: { label: string; success: boolean };
};

/**
 * Known limits, fine at campus scale: the list covers my 200 newest offers, and the last message comes from
 * the 2,000 newest messages across them. Past that, a view with one row per offer would be the next step.
 */
const LIST_LIMIT = 200;
const MESSAGE_SCAN_LIMIT = 2000;

/** Every offer where I'm the helper or the owner (RLS decides), newest activity first. */
export async function loadConversations(supabase: Supabase, viewerId: string): Promise<{ list: Conversation[]; failed: boolean }> {
  const { data: offers, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT)
    .overrideTypes<OfferThreadRow[], { merge: false }>();
  if (error) {
    console.error("messages: offers query failed", error);
    return { list: [], failed: true };
  }
  const ids = (offers ?? []).map((o) => o.id);
  const { data: messages, error: msgError } = ids.length
    ? await supabase
        .from("messages")
        .select("id, offer_id, sender_id, body, created_at")
        .in("offer_id", ids)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_SCAN_LIMIT)
        .overrideTypes<ChatMessage[], { merge: false }>()
    : { data: [], error: null };
  if (msgError) console.error("messages: last-message query failed", msgError);
  const lastByOffer = lastMessageByOffer(messages ?? []);

  const list = (offers ?? []).map((o): Conversation => {
    const viewerIsHelper = o.helper.id === viewerId;
    const owner = o.role?.project?.owner ?? null;
    const lastMsg = lastByOffer.get(o.id);
    const lastText = lastMsg ? lastMsg.body : o.note;
    const lastMine = lastMsg ? lastMsg.sender_id === viewerId : viewerIsHelper;
    return {
      offerId: o.id,
      other: viewerIsHelper ? owner : o.helper,
      projectTitle: o.role?.project?.title ?? "A project that's no longer listed",
      roleLabel: o.role ? CATEGORY_LABEL[o.role.category] : "",
      last: `${lastMine ? "You: " : ""}${lastText}`,
      activityAt: latest(o.created_at, o.decided_at, o.resent_at, lastMsg?.created_at),
      status: threadStatus(o.status, o.role?.status ?? "closed", viewerIsHelper),
    };
  });
  return { list: byActivity(list), failed: false };
}
