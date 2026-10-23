import Link from "next/link";
import { RoleTag } from "../RoleTag";
import { CATEGORY_LABEL, STAGE_LABEL } from "@/lib/vocab";
import { avatarTone, initials, ownerName, ownerYear, scopeLabel, type FeedRow } from "@/lib/feed";

/** One open role in the Browse feed. */
export function FeedCard({ row }: { row: FeedRow }) {
  const year = ownerYear(row.owner_major, row.owner_class_year);
  return (
    <article className="feed-card">
      <div className="feed-card-head">
        <div className="person">
          <span className={`avatar ${avatarTone(row.owner_id)}`} aria-hidden="true">
            {initials(row.owner_name)}
          </span>
          <div className="person-text">
            <Link href={`/people/${row.owner_id}`} className="feed-owner">
              {ownerName(row.owner_name)}
            </Link>
            {year ? <span className="muted">{year}</span> : null}
          </div>
        </div>
        <span className={`label stage stage-${row.stage}`}>{STAGE_LABEL[row.stage]}</span>
      </div>
      {row.is_example ? (
        <p className="label pill pill-navy example-tag">Example · not a real project</p>
      ) : null}
      <h2 className="display feed-title">{row.title}</h2>
      <p className="muted feed-pitch">{row.pitch}</p>
      <div className="feed-card-foot">
        <RoleTag role={CATEGORY_LABEL[row.category]} scope={scopeLabel(row.need, row.hours)} />
      </div>
      <Link href={`/projects/${row.project_id}`} className="feed-link">
        View project<span className="sr-only">: {row.title}</span>
      </Link>
    </article>
  );
}
