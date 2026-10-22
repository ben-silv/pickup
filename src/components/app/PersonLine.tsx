import Link from "next/link";
import { avatarTone, initials, ownerName } from "@/lib/feed";
import type { Person } from "@/lib/project";

/** Avatar, short name (linking to their profile) and one line of context ("Owner · CS '28"). */
export function PersonLine({ person, meta, small = false }: { person: Person; meta?: string; small?: boolean }) {
  return (
    <div className="person">
      <span className={`avatar ${avatarTone(person.id)}${small ? " small" : ""}`} aria-hidden="true">
        {initials(person.full_name)}
      </span>
      <div className="person-text">
        <Link href={`/people/${person.id}`} className="person-name">
          {ownerName(person.full_name)}
        </Link>
        {meta ? <span className="muted">{meta}</span> : null}
      </div>
    </div>
  );
}
