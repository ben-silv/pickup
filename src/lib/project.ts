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
  | { kind: "unavailable" };

export function roleViewerState(
  role: { status: RoleStatus },
  project: { status: ProjectStatus; isOwner: boolean },
  myOffer: { status: OfferStatus } | null | undefined,
): RoleViewerState {
  if (project.isOwner) return { kind: "owner" };
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

/** Offers that still have a conversation worth opening. */
export function hasConversation(status: OfferStatus): boolean {
  return status === "pending" || status === "accepted";
}
