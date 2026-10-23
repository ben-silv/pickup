import Link from "next/link";
import { avatarTone, initials, ownerName } from "@/lib/feed";
import { shortTime } from "@/lib/messages";
import type { Conversation } from "./conversations";

/** Left column of Messages. On phones it's hidden while a conversation is open (`secondary`). */
export function ConversationList({ list, failed, current, secondary = false }: { list: Conversation[]; failed: boolean; current?: string; secondary?: boolean }) {
  return (
    <nav aria-label="Conversations" className={`card msg-list${secondary ? " secondary" : ""}`}>
      {failed ? (
        <p role="alert" className="error-text msg-empty">
          Couldn&apos;t load your conversations. Refresh to try again.
        </p>
      ) : list.length === 0 ? (
        <div className="msg-empty stack-sm">
          <p className="display h4">No conversations yet</p>
          <p className="small muted">
            Offer to help on a role from <Link href="/browse">Browse</Link>, or <Link href="/post">post a project</Link>. Each offer gets its own
            thread here.
          </p>
        </div>
      ) : (
        <ul className="msg-items">
          {list.map((c) => (
            <li key={c.offerId}>
              <Link href={`/messages/${c.offerId}`} className="msg-item" aria-current={c.offerId === current ? "page" : undefined}>
                <span className={`avatar ${c.other ? avatarTone(c.other.id) : "avatar-sky"}`} aria-hidden="true">
                  {c.other ? initials(c.other.full_name) : "?"}
                </span>
                <span className="msg-item-text">
                  <span className="row-between">
                    <span className="person-name">
                      {c.unread ? (
                        <>
                          <span className="unread-dot inline" aria-hidden="true" />
                          <span className="sr-only">New: </span>
                        </>
                      ) : null}
                      {c.other ? ownerName(c.other.full_name) : "A Tufts student"}
                    </span>
                    <span className="msg-time">{shortTime(c.activityAt)}</span>
                  </span>
                  <span className="msg-meta">
                    {c.projectTitle}
                    {c.roleLabel ? ` · ${c.roleLabel}` : ""}
                  </span>
                  <span className="msg-last">{c.last}</span>
                  <span className={`label badge ${c.status.success ? "badge-success" : "badge-neutral"}`}>{c.status.label}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
