import { CLASS_YEARS, MAJORS } from "./vocab";

/** What every profile needs before using the app: a name, a class year and a major from the list. */
export type ProfileBasics = { full_name: string | null; class_year: string | null; major: string | null };

export function isProfileComplete(p: ProfileBasics | null | undefined): boolean {
  if (!p) return false;
  return (
    Boolean(p.full_name?.trim()) &&
    (CLASS_YEARS as readonly string[]).includes(p.class_year ?? "") &&
    MAJORS.includes(p.major ?? "")
  );
}

/** Supabase auth user fields we read. `password_set` is written to user_metadata whenever the user sets a password. */
export type SetupUser = { user_metadata?: Record<string, unknown> | null } | null | undefined;

/** True once the user has picked a password (new accounts start from an email link and have none). */
export function hasPassword(user: SetupUser): boolean {
  return user?.user_metadata?.password_set === true;
}

/** What's left before someone can use the app: their basics, a password, or both. */
export function setupNeeds(profile: ProfileBasics | null | undefined, user: SetupUser): { basics: boolean; password: boolean } {
  return { basics: !isProfileComplete(profile), password: !hasPassword(user) };
}

export function needsSetup(profile: ProfileBasics | null | undefined, user: SetupUser): boolean {
  const needs = setupNeeds(profile, user);
  return needs.basics || needs.password;
}

/** A stored major only pre-fills the dropdown if it's still on the list (older free-text values aren't). */
export function knownMajor(major: string | null | undefined): string {
  return major && MAJORS.includes(major) ? major : "";
}
