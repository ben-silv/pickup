import type { OfferStatus, RoleStatus } from "./vocab";

/**
 * Messages helpers: conversation list order, thread timeline, live-message merging, times.
 * Plain functions with no dependencies, so the realtime thread (a client component) can use them.
 */

export type ChatMessage = { id: string; offer_id: string; sender_id: string; body: string; created_at: string };

export type TimelineItem =
  | { kind: "status"; key: string; text: string; at: string }
  | { kind: "message"; key: string; mine: boolean; body: string; at: string };

/** Times are shown in campus time on both server and browser, so the page hydrates without mismatches. */
const ZONE = "America/New_York";

/** Newest of the given timestamps (ISO strings); nulls ignored. */
export function latest(...times: (string | null | undefined)[]): string {
  let best = "";
  let bestMs = -Infinity;
  for (const t of times) {
    if (!t) continue;
    const ms = Date.parse(t);
    if (ms > bestMs) {
      best = t;
      bestMs = ms;
    }
  }
  return best;
}

/** Newest message per offer, whatever order the rows come in. */
export function lastMessageByOffer<T extends { offer_id: string; created_at: string }>(rows: readonly T[]): Map<string, T> {
  const out = new Map<string, T>();
  for (const row of rows) {
    const current = out.get(row.offer_id);
    if (!current || Date.parse(row.created_at) > Date.parse(current.created_at)) out.set(row.offer_id, row);
  }
  return out;
}

/** Newest activity first. Ties keep their order. */
export function byActivity<T extends { activityAt: string }>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => Date.parse(b.activityAt) - Date.parse(a.activityAt));
}

/** Messages already on the page plus live ones, without duplicates, oldest first. */
export function mergeMessages(...lists: readonly (readonly ChatMessage[])[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const list of lists) for (const m of list) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

/** Messages can be sent while an offer is pending or accepted (the database enforces the same rule). */
export function canSend(status: OfferStatus): boolean {
  return status === "pending" || status === "accepted";
}

/** The status pill for a conversation. Green only for success. */
export function threadStatus(offer: OfferStatus, role: RoleStatus, viewerIsHelper = false): { label: string; success: boolean } {
  if (offer === "accepted" && role === "filled") return { label: "Role filled", success: true };
  if (offer === "accepted") return { label: "Offer accepted", success: true };
  if (offer === "pending") return { label: "Offer pending", success: false };
  if (offer === "declined") return { label: "Declined", success: false };
  return { label: viewerIsHelper ? "You withdrew this offer" : "Withdrawn", success: false };
}

export type TimelineInput = {
  viewerIsHelper: boolean;
  helperFirst: string;
  ownerFirst: string;
  /** "UI/UX design · ~5 hrs" */
  roleSummary: string;
  roleLabel: string;
  offer: { status: OfferStatus; note: string; created_at: string; decided_at: string | null; resent_at?: string | null };
  credit: { hours: number; created_at: string } | null;
  messages: readonly ChatMessage[];
  viewerId: string;
};

/**
 * One conversation: status lines (offered, accepted, declined, withdrawn, filled) between the messages.
 * The offer's note is shown as the helper's first message.
 */
export function buildTimeline(t: TimelineInput): TimelineItem[] {
  const { offer } = t;
  const who = (helperSide: boolean) => (helperSide === t.viewerIsHelper ? "You" : helperSide ? t.helperFirst : t.ownerFirst);
  // After a resend, the note on the offer is the new one, so it sits under the "sent a new offer" line.
  const items: TimelineItem[] = offer.resent_at
    ? [
        { kind: "status", key: "offered", text: `${who(true)} offered to help · ${t.roleSummary}`, at: offer.created_at },
        { kind: "status", key: "resent", text: `${who(true)} withdrew and sent a new offer`, at: offer.resent_at },
        { kind: "message", key: "note", mine: t.viewerIsHelper, body: offer.note, at: offer.resent_at },
      ]
    : [
        { kind: "status", key: "offered", text: `${who(true)} offered to help · ${t.roleSummary}`, at: offer.created_at },
        { kind: "message", key: "note", mine: t.viewerIsHelper, body: offer.note, at: offer.created_at },
      ];
  if (offer.decided_at) {
    const text =
      offer.status === "accepted"
        ? t.viewerIsHelper
          ? `${t.ownerFirst} accepted your offer`
          : "You accepted the offer"
        : offer.status === "declined"
          ? t.viewerIsHelper
            ? `${t.ownerFirst} declined, with thanks`
            : "You declined the offer"
          : offer.status === "withdrawn"
            ? `${who(true)} withdrew the offer`
            : null;
    if (text) items.push({ kind: "status", key: "decided", text, at: offer.decided_at });
  }
  if (t.credit) {
    items.push({ kind: "status", key: "filled", text: `Role filled · ${t.roleLabel} · ${t.credit.hours} ${t.credit.hours === 1 ? "hr" : "hrs"}`, at: t.credit.created_at });
  }
  for (const m of t.messages) {
    items.push({ kind: "message", key: m.id, mine: m.sender_id === t.viewerId, body: m.body, at: m.created_at });
  }
  // Stable sort keeps "offered" before the note when they share a timestamp.
  return items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** "4:12 PM" today, "Tue" this week, "Oct 3" before that. */
export function shortTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (dayKey(d) === dayKey(now)) return new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hour: "numeric", minute: "2-digit" }).format(d);
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (days >= 0 && days < 6) return new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "short" }).format(d);
  return new Intl.DateTimeFormat("en-US", { timeZone: ZONE, month: "short", day: "numeric" }).format(d);
}

/** Realtime payloads arrive untyped; only accept rows that look like a message. */
export function isChatMessage(row: unknown): row is ChatMessage {
  if (typeof row !== "object" || row === null) return false;
  const r = row as Record<string, unknown>;
  return ["id", "offer_id", "sender_id", "body", "created_at"].every((k) => typeof r[k] === "string");
}

/** "Tue 4:12 PM", under each message. */
export function messageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "short", hour: "numeric", minute: "2-digit" }).format(d);
}
