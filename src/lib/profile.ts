import { CLASS_YEARS, CLASS_YEAR_LABEL, type OfferStatus, type RoleStatus } from "./vocab";

/** Profile helpers. Plain functions (only vocab), so the client form can use them too. */

type FormLike = { get(name: string): unknown; getAll(name: string): unknown[] };
const text = (v: unknown) => (typeof v === "string" ? v : "");

/** Reads the profile form into the shape `profileInputSchema` expects. Blank selects and numbers mean "not set". */
export function profileFormValues(form: FormLike) {
  const classYear = text(form.get("classYear"));
  const hours = text(form.get("hoursPerWeek")).trim();
  return {
    fullName: text(form.get("fullName")),
    classYear: classYear || null,
    major: text(form.get("major")),
    bio: text(form.get("bio")),
    skills: [...new Set(form.getAll("skills").map(text).filter(Boolean))],
    openToRequests: form.get("openToRequests") === "on",
    hoursPerWeek: hours || null,
    githubUrl: text(form.get("githubUrl")),
  };
}

/** "Computer Science · Class of 2028", "Grad student", "" */
export function profileSubtitle(major: string | null, classYear: string | null): string {
  // "Other" says nothing on its own, so it's left out of the subtitle.
  const known = CLASS_YEARS.find((y) => y === classYear && y !== "Other");
  const year = known ? CLASS_YEAR_LABEL[known] : "";
  return [major?.trim(), year].filter(Boolean).join(" · ");
}

/** "About 4 hrs a week", or a nudge when it isn't set. */
export function availabilityLabel(openToRequests: boolean, hoursPerWeek: number | null): string {
  if (!openToRequests) return "Not taking requests right now";
  if (!hoursPerWeek) return "Hours not set";
  return `About ${hoursPerWeek} ${hoursPerWeek === 1 ? "hr" : "hrs"} a week`;
}

/** "1 open role · 2 pending offers". Offers are only counted for the owner (RLS hides them from everyone else). */
export function projectStats(roles: readonly { status: RoleStatus; offers?: readonly { status: OfferStatus }[] | null }[], withOffers: boolean): string {
  const open = roles.filter((r) => r.status === "open").length;
  const parts = [open === 0 ? "No open roles" : `${open} open ${open === 1 ? "role" : "roles"}`];
  if (withOffers) {
    const pending = roles.reduce((n, r) => n + (r.offers ?? []).filter((o) => o.status === "pending").length, 0);
    if (pending > 0) parts.push(`${pending} pending ${pending === 1 ? "offer" : "offers"}`);
  }
  return parts.join(" · ");
}
