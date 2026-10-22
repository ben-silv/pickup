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

/** A stored major only pre-fills the dropdown if it's still on the list (older free-text values aren't). */
export function knownMajor(major: string | null | undefined): string {
  return major && MAJORS.includes(major) ? major : "";
}
