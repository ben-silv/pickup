/** Who the profile menu shows. Pure, so it's unit-tested and safe in client components. */
export type MenuUser = { name: string; email: string; initials: string };

export function menuUser(fullName: string | null | undefined, email: string | null | undefined): MenuUser {
  const name = (fullName ?? "").trim();
  const mail = (email ?? "").trim();
  const source = name || mail.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const initials = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase() || "?";
  return { name: name || "Your account", email: mail, initials };
}
