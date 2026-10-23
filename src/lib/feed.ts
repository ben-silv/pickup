import type { Category, Stage } from "./vocab";

/** Browse feed helpers. Plain functions, no Supabase, so they're unit-testable. */

export const FEED_LIMIT = 60;
export const SEARCH_MAX = 80;

export const FEED_SORTS = ["newest", "hours"] as const;
export type FeedSort = (typeof FEED_SORTS)[number];

/** A row of the `open_roles` view, as the feed selects it. */
export type FeedRow = {
  role_id: string;
  category: Category;
  need: string;
  hours: number;
  created_at: string;
  project_id: string;
  title: string;
  pitch: string;
  stage: Stage;
  owner_id: string;
  owner_name: string;
  owner_class_year: string | null;
  owner_major: string | null;
  /** The sample project shown until real ones are posted. */
  is_example: boolean;
};

/** Columns searched by the box ("projects, skills, people"). */
const SEARCH_COLUMNS = ["title", "pitch", "need", "owner_name"] as const;

/**
 * Keeps letters, numbers, spaces and ' - . only, collapses whitespace, caps the length.
 * Everything PostgREST treats as syntax in `.or()` (commas, parens, colons, quotes) or as a wildcard (% *) is dropped.
 */
export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}\s'.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_MAX)
    .trim();
}

/**
 * The `.or()` filter for a search, or null when there's nothing to search.
 * Values are double-quoted because `.` is reserved in PostgREST filters; sanitizing removed any quotes.
 */
export function searchFilter(raw: string): string | null {
  const q = sanitizeSearch(raw);
  if (!q) return null;
  return SEARCH_COLUMNS.map((col) => `${col}.ilike."%${q}%"`).join(",");
}

/** "Jamie Lee" → "Jamie L." Falls back when the owner hasn't set a name. */
export function ownerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const [first, ...rest] = parts;
  if (!first) return "A Tufts student";
  const last = rest.at(-1);
  return last ? `${first} ${last[0]?.toUpperCase()}.` : first;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const out = (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "");
  return out.toUpperCase() || "?";
}

/** "CS '28", "CS · Grad", "'28", or "" when neither is set. */
export function ownerYear(major: string | null, classYear: string | null): string {
  const year = classYear && /^\d{4}$/.test(classYear) ? `'${classYear.slice(2)}` : classYear === "Grad" ? "Grad" : "";
  const m = major?.trim() ?? "";
  if (m && year) return year === "Grad" ? `${m} · Grad` : `${m} ${year}`;
  return m || year;
}

/** "3 screens · ~5 hrs" */
export function scopeLabel(need: string, hours: number): string {
  return `${need.trim()} · ~${hours} ${hours === 1 ? "hr" : "hrs"}`;
}

export const AVATAR_TONES = ["avatar-sky", "avatar-navy", "avatar-blue"] as const;

/** Same person, same avatar color, whatever the filter. */
export function avatarTone(ownerId: string): (typeof AVATAR_TONES)[number] {
  let h = 0;
  for (const ch of ownerId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length] ?? "avatar-sky";
}

/** "1 open role", "5 open roles", "60+ open roles" when the feed hit its limit. */
export function countLabel(count: number, limit: number = FEED_LIMIT): string {
  if (count >= limit) return `${limit}+ open roles`;
  return `${count} open ${count === 1 ? "role" : "roles"}`;
}

export const SORT_LABEL: Record<FeedSort, string> = { newest: "Newest", hours: "Fewest hours" };
