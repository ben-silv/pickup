import Link from "next/link";
import type { ReactNode } from "react";
import { RoleTag } from "../RoleTag";
import { CATEGORY_LABEL, STAGE_LABEL } from "@/lib/vocab";
import { avatarTone, initials, ownerName } from "@/lib/feed";
import { hrs } from "@/lib/project";
import { availabilityLabel, profileSubtitle, projectStats } from "@/lib/profile";
import type { CreditRow, ProfileRow, ProjectTileRow } from "@/app/(app)/profile/data";

/** Identity card shared by /profile and /people/[id]. `actions` = Edit profile / Sign out on my own page. */
export function ProfileCard({ profile, email, actions }: { profile: ProfileRow; email?: string; actions?: ReactNode }) {
  const name = profile.full_name.trim() || "A Tufts student";
  const subtitle = profileSubtitle(profile.major, profile.class_year);
  return (
    <section className="card profile-card stack-md" aria-labelledby="profile-name">
      <span className={`avatar avatar-xl ${avatarTone(profile.id)}`} aria-hidden="true">
        {initials(profile.full_name)}
      </span>
      <div className="stack-xs">
        <h1 id="profile-name" className="display profile-name">
          {name}
        </h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
        {email ? <p className="small muted">{email}</p> : null}
      </div>
      {profile.bio ? <p className="muted prose">{profile.bio}</p> : null}
      {profile.skills.length > 0 ? (
        <div className="stack-sm">
          <h2 className="label muted">Can help with</h2>
          <ul className="tag-list">
            {profile.skills.map((s) => (
              <li key={s} className="tag">
                {CATEGORY_LABEL[s]}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="availability">
        <span className="availability-title">
          {profile.open_to_requests ? <span className="dot-success" aria-hidden="true" /> : null}
          {profile.open_to_requests ? "Open to requests" : "Not open to requests"}
        </span>
        {profile.open_to_requests ? <span className="small muted">{availabilityLabel(true, profile.hours_per_week)}</span> : null}
      </div>
      <div className="row-wrap">
        {actions}
        {profile.github_url ? (
          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="profile-link">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function ProjectTiles({ projects, own, failed }: { projects: ProjectTileRow[]; own: boolean; failed: boolean }) {
  return (
    <section className="stack-sm" aria-labelledby="projects-heading">
      <h2 id="projects-heading" className="display h3 on-band">
        {own ? "Your projects" : "Projects"}
      </h2>
      {failed ? (
        <p role="alert" className="card error-text">
          Couldn&apos;t load projects. Refresh to try again.
        </p>
      ) : (
        <div className="tile-grid">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="project-tile">
              <span className="row-wrap">
                <span className={`label stage stage-${p.stage}`}>{STAGE_LABEL[p.stage]}</span>
                {p.status === "draft" ? <span className="label badge badge-neutral">Draft</span> : null}
              </span>
              <span className="display h4 tile-title">{p.title}</span>
              <span className="small muted tile-pitch">{p.pitch}</span>
              <span className="small tile-stats">{projectStats(p.roles, own)}</span>
            </Link>
          ))}
          {own ? (
            <Link href="/post" className="project-tile tile-new">
              <span className="tile-plus" aria-hidden="true">
                +
              </span>
              {projects.length ? "Post another project" : "Post your first project"}
            </Link>
          ) : projects.length === 0 ? (
            <p className="card muted">No published projects yet.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function CreditList({ credits, own, failed }: { credits: CreditRow[]; own: boolean; failed: boolean }) {
  return (
    <section className="stack-sm" aria-labelledby="credits-heading">
      <h2 id="credits-heading" className="display h3">
        Credits
      </h2>
      <p className="small muted">{own ? "Projects you've helped ship, with notes from their owners." : "Projects they've helped ship, with notes from their owners."}</p>
      {failed ? (
        <p role="alert" className="card error-text">
          Couldn&apos;t load credits. Refresh to try again.
        </p>
      ) : credits.length === 0 ? (
        <p className="card muted">
          {own ? (
            <>
              No credits yet. <Link href="/browse">Offer to help on a role</Link> and they&apos;ll show up here.
            </>
          ) : (
            "No credits yet."
          )}
        </p>
      ) : (
        credits.map((c) => {
          const project = c.role?.project ?? null;
          const by = project?.owner ? ownerName(project.owner.full_name) : "";
          return (
            <article key={c.id} className="card stack-sm">
              <div className="row-between">
                {project ? (
                  <Link href={`/projects/${project.id}`} className="display h4 tile-title">
                    {project.title}
                  </Link>
                ) : (
                  <span className="display h4">A project that&apos;s no longer listed</span>
                )}
                <RoleTag role={c.role ? CATEGORY_LABEL[c.role.category] : "Role"} scope={hrs(c.hours)} />
              </div>
              <p className="muted prose">
                &ldquo;{c.note}&rdquo;{by ? ` · ${by}` : ""}
              </p>
            </article>
          );
        })
      )}
    </section>
  );
}
