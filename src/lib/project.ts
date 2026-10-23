import type { OfferStatus, ProjectStatus, RoleStatus } from "./vocab";

/** Project page helpers. Plain functions, no Supabase, so they're unit-testable. */

/** A profile as the app pages select it. */
export type Person = { id: string; full_name: string; class_year: string | null; major: string | null };

/** "No open roles", "1 open role", "3 open roles" */
export function openRolesLabel(count: number): string {
  if (count <= 0) return "No open roles";
  return `${count} open ${count === 1 ? "role" : "roles"}`;
}

/** "Jamie Lee" → "Jamie". Falls back when the name isn't set. */
export function firstName(fullName: string, fallback = "The owner"): string {
  return fullName.trim().split(/\s+/)[0] || fallback;
}

/** "1 hr", "6 hrs" */
export function hrs(hours: number): string {
  return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
}

/** Groups rows by role, keeping their order. */
export function byRole<T extends { role_id: string }>(rows: readonly T[]): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const list = out.get(row.role_id);
    if (list) list.push(row);
    else out.set(row.role_id, [row]);
  }
  return out;
}

/** What the person looking at the page can do with a role. */
export type RoleViewerState =
  | { kind: "owner" }
  | { kind: "can-offer" }
  | { kind: "offered"; status: OfferStatus }
  | { kind: "unavailable" }
  /** The sample project shown to new students: labelled, and never takes offers. */
  | { kind: "example" };

export function roleViewerState(
  role: { status: RoleStatus },
  project: { status: ProjectStatus; isOwner: boolean; isExample?: boolean },
  myOffer: { status: OfferStatus } | null | undefined,
): RoleViewerState {
  if (project.isOwner) return { kind: "owner" };
  if (project.isExample) return { kind: "example" };
  if (myOffer) return { kind: "offered", status: myOffer.status };
  if (role.status === "open" && project.status === "published") return { kind: "can-offer" };
  return { kind: "unavailable" };
}

/** Badge text and tone for an offer, from the helper's side and the owner's side. Green only for success. */
export const OFFER_BADGE: Record<OfferStatus, { mine: string; owner: string; success: boolean }> = {
  pending: { mine: "Offer sent · waiting to hear back", owner: "Pending", success: false },
  accepted: { mine: "Offer accepted", owner: "Accepted · chat opened", success: true },
  declined: { mine: "Declined, with thanks", owner: "Declined, with thanks", success: false },
  withdrawn: { mine: "You withdrew this offer", owner: "Withdrawn", success: false },
};

/** Must match supabase/migrations/20261023000000_resend_offer.sql. */
export const RESEND_COOLDOWN_MINUTES = 60;
export const MAX_RESENDS = 2;

export type ResendState = { kind: "ready" } | { kind: "wait"; minutes: number } | { kind: "used-up" } | { kind: "closed" };

/**
 * After withdrawing, can the helper send a new offer? Null for offers that aren't withdrawn.
 * The database enforces the same rules; this only decides what to show.
 */
export function resendState(
  offer: { status: OfferStatus; decided_at: string | null; resend_count: number },
  roleTakingOffers: boolean,
  now: Date = new Date(),
): ResendState | null {
  if (offer.status !== "withdrawn") return null;
  if (!roleTakingOffers) return { kind: "closed" };
  if (offer.resend_count >= MAX_RESENDS) return { kind: "used-up" };
  const withdrawnAt = offer.decided_at ? Date.parse(offer.decided_at) : NaN;
  const left = Number.isNaN(withdrawnAt) ? 0 : withdrawnAt + RESEND_COOLDOWN_MINUTES * 60_000 - now.getTime();
  return left > 0 ? { kind: "wait", minutes: Math.ceil(left / 60_000) } : { kind: "ready" };
}

/** "in 42 minutes" / "in 1 minute" */
export function minutesLabel(minutes: number): string {
  return `in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

/** Offers that still have a conversation worth opening. */
export function hasConversation(status: OfferStatus): boolean {
  return status === "pending" || status === "accepted";
}
