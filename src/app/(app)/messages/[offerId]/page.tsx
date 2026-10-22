import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageBand } from "@/components/app/PageBand";
import { ConversationList } from "../ConversationList";
import { OFFER_SELECT, loadConversations, type OfferThreadRow } from "../conversations";
import { Thread } from "./Thread";
import { MarkFilledForm } from "./MarkFilledForm";
import { createClient, getUser } from "@/lib/supabase/server";
import { offerIdSchema } from "@/lib/schemas";
import { CATEGORY_LABEL } from "@/lib/vocab";
import { ownerName } from "@/lib/feed";
import { firstName } from "@/lib/project";
import { canSend, threadStatus, type ChatMessage } from "@/lib/messages";

export const metadata: Metadata = { title: "Messages · Pickup" };

const THREAD_LIMIT = 500;

export default async function ThreadPage({ params }: { params: Promise<{ offerId: string }> }) {
  const parsed = offerIdSchema.safeParse((await params).offerId);
  if (!parsed.success) notFound();
  const offerId = parsed.data;
  const user = await getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/messages/${offerId}`)}`);

  // RLS: only the helper and the project owner can see this offer and its messages.
  const supabase = await createClient();
  const [conversations, offerRes, messagesRes] = await Promise.all([
    loadConversations(supabase, user.id),
    supabase.from("offers").select(OFFER_SELECT).eq("id", offerId).maybeSingle().overrideTypes<OfferThreadRow, { merge: false }>(),
    supabase
      .from("messages")
      .select("id, offer_id, sender_id, body, created_at")
      .eq("offer_id", offerId)
      .order("created_at", { ascending: false })
      .limit(THREAD_LIMIT)
      .overrideTypes<ChatMessage[], { merge: false }>(),
  ]);
  if (offerRes.error) console.error("thread: offer query failed", offerRes.error);
  const offer = offerRes.data;
  if (!offer) notFound();
  if (messagesRes.error) console.error("thread: messages query failed", messagesRes.error);
  const messages = [...(messagesRes.data ?? [])].reverse();

  const role = offer.role;
  const project = role?.project ?? null;
  const viewerIsHelper = offer.helper.id === user.id;
  const isOwner = !viewerIsHelper && project?.owner.id === user.id;
  const other = viewerIsHelper ? (project?.owner ?? null) : offer.helper;
  const helperFirst = firstName(offer.helper.full_name, "The helper");
  const ownerFirst = firstName(project?.owner.full_name ?? "", "The owner");

  const { data: credit, error: creditError } =
    role?.status === "filled"
      ? await supabase.from("credits").select("hours, created_at").eq("role_id", role.id).maybeSingle<{ hours: number; created_at: string }>()
      : { data: null, error: null };
  if (creditError) console.error("thread: credit query failed", creditError);

  const status = threadStatus(offer.status, role?.status ?? "closed");
  const roleLabel = role ? CATEGORY_LABEL[role.category] : "Role";
  const closedNote =
    offer.status === "declined"
      ? "This offer was declined, so the conversation is closed."
      : "This offer was withdrawn, so the conversation is closed.";

  return (
    <>
      <PageBand title="Messages" tall={false} />
      <main className="wrap overlap-sm msg-layout">
        <ConversationList list={conversations.list} failed={conversations.failed} current={offerId} secondary />
        <section className="card msg-thread" aria-labelledby="thread-heading">
          <header className="thread-head">
            <div className="stack-xs">
              <Link href="/messages" className="small thread-back">
                <span aria-hidden="true">←</span> All conversations
              </Link>
              <h2 id="thread-heading" className="thread-name">
                {other ? ownerName(other.full_name) : "A Tufts student"}
              </h2>
              {project ? (
                <Link href={`/projects/${project.id}`} className="small">
                  {project.title} · {roleLabel}
                </Link>
              ) : (
                <span className="small muted">A project that&apos;s no longer listed</span>
              )}
            </div>
            <div className="row-wrap thread-actions">
              <span className={`label badge ${status.success ? "badge-success" : "badge-neutral"}`}>{status.label}</span>
              {isOwner && role && offer.status === "accepted" && role.status === "in_progress" ? (
                <MarkFilledForm roleId={role.id} offerId={offerId} defaultHours={role.hours} helperFirst={helperFirst} />
              ) : null}
            </div>
          </header>
          <Thread
            offerId={offerId}
            initialMessages={messages}
            canSend={canSend(offer.status)}
            closedNote={closedNote}
            timeline={{
              viewerId: user.id,
              viewerIsHelper,
              helperFirst,
              ownerFirst,
              roleLabel,
              roleSummary: role ? `${roleLabel} · ~${role.hours} ${role.hours === 1 ? "hr" : "hrs"}` : roleLabel,
              offer: { status: offer.status, note: offer.note, created_at: offer.created_at, decided_at: offer.decided_at },
              credit: credit ?? null,
            }}
          />
        </section>
      </main>
    </>
  );
}
