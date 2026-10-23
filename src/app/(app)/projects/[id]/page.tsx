import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageBand } from "@/components/app/PageBand";
import { PersonLine } from "@/components/app/PersonLine";
import { ActionButton } from "@/components/app/ActionButton";
import { RoleTag } from "@/components/RoleTag";
import { OfferForm } from "./OfferForm";
import { acceptOffer, declineOffer, setProjectStatus, withdrawOffer } from "./actions";
import { createClient, getUser } from "@/lib/supabase/server";
import { projectIdSchema } from "@/lib/schemas";
import { CATEGORY_LABEL, STAGE_LABEL, type Category, type OfferStatus, type ProjectStatus, type RoleStatus, type Stage } from "@/lib/vocab";
import { avatarTone, initials, ownerName, ownerYear, scopeLabel } from "@/lib/feed";
import { OFFER_BADGE, byRole, firstName, hasConversation, hrs, minutesLabel, openRolesLabel, resendState, roleViewerState, type Person } from "@/lib/project";

export const metadata: Metadata = { title: "Project · Project Pickup" };

const PERSON = "id, full_name, class_year, major";

type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  pitch: string;
  description: string;
  stage: Stage;
  prototype_url: string | null;
  repo_url: string | null;
  status: ProjectStatus;
  owner: Person;
};
type RoleRow = { id: string; category: Category; need: string; hours: number; status: RoleStatus; helper: Person | null };
type OfferRow = { id: string; role_id: string; note: string; status: OfferStatus; decided_at: string | null; resend_count: number; helper: Person };
type CreditRow = { role_id: string; hours: number; note: string; helper: Person };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = projectIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const projectId = parsed.data;

  // No status filter: RLS shows published projects to everyone and drafts to their owner.
  const supabase = await createClient();
  const [user, projectRes, rolesRes] = await Promise.all([
    getUser(),
    supabase
      .from("projects")
      .select(`id, owner_id, title, pitch, description, stage, prototype_url, repo_url, status, owner:profiles!projects_owner_id_fkey(${PERSON})`)
      .eq("id", projectId)
      .maybeSingle()
      .overrideTypes<ProjectRow, { merge: false }>(),
    supabase
      .from("roles")
      .select(`id, category, need, hours, status, helper:profiles!roles_helper_id_fkey(${PERSON})`)
      .eq("project_id", projectId)
      .order("created_at")
      .overrideTypes<RoleRow[], { merge: false }>(),
  ]);
  if (projectRes.error) console.error("project: query failed", projectRes.error);
  const project = projectRes.data;
  if (!project) notFound();
  if (rolesRes.error) console.error("project: roles query failed", rolesRes.error);
  const roles = rolesRes.data ?? [];
  const roleIds = roles.map((r) => r.id);

  // RLS: the owner sees every offer on these roles; anyone else sees only their own.
  const [offersRes, creditsRes] = roleIds.length
    ? await Promise.all([
        supabase
          .from("offers")
          .select(`id, role_id, note, status, decided_at, resend_count, helper:profiles!offers_helper_id_fkey(${PERSON})`)
          .in("role_id", roleIds)
          .order("created_at")
          .overrideTypes<OfferRow[], { merge: false }>(),
        supabase
          .from("credits")
          .select(`role_id, hours, note, helper:profiles!credits_helper_id_fkey(${PERSON})`)
          .in("role_id", roleIds)
          .overrideTypes<CreditRow[], { merge: false }>(),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (offersRes.error) console.error("project: offers query failed", offersRes.error);
  if (creditsRes.error) console.error("project: credits query failed", creditsRes.error);
  const offers = offersRes.data ?? [];
  const credits = creditsRes.data ?? [];

  const viewerId = user?.id ?? "";
  const isOwner = project.owner_id === viewerId;
  const ownerFirst = firstName(project.owner.full_name);
  const offersFor = byRole(offers);
  const creditFor = new Map(credits.map((c) => [c.role_id, c]));
  const openRoles = roles.filter((r) => r.status === "open");
  const myOffer = (roleId: string) => (isOwner ? undefined : offersFor.get(roleId)?.find((o) => o.helper.id === viewerId));
  // Open roles, plus any role this helper has offered on so they can follow their offer.
  const listed = roles.filter((r) => r.status === "open" || myOffer(r.id));
  const team = roles.filter((r) => (r.status === "in_progress" || r.status === "filled") && r.helper);
  const filled = roles.filter((r) => r.status === "filled" && creditFor.has(r.id));
  const roleById = new Map(roles.map((r) => [r.id, r]));
  const fields = (offerId: string) => ({ offerId, projectId });

  return (
    <>
      <PageBand
        title={project.title}
        lede={project.pitch}
        tall={false}
        top={
          <>
            <Link href="/browse" className="band-back">
              <span aria-hidden="true">←</span> All open roles
            </Link>
            <div className="row-wrap">
              <span className="label pill pill-sky">{STAGE_LABEL[project.stage]}</span>
              <span className="label pill pill-navy">{openRolesLabel(openRoles.length)}</span>
              {project.status === "draft" ? <span className="label pill pill-navy">Draft · only you can see it</span> : null}
              {project.status === "archived" ? <span className="label pill pill-navy">Archived</span> : null}
            </div>
          </>
        }
      >
        {project.prototype_url || project.repo_url ? (
          <div className="row-wrap band-links">
            {project.prototype_url ? (
              <a href={project.prototype_url} className="btn btn-sm glass" target="_blank" rel="noopener noreferrer">
                Try the prototype <span aria-hidden="true">↗</span>
              </a>
            ) : null}
            {project.repo_url ? (
              <a href={project.repo_url} className="btn btn-sm glass" target="_blank" rel="noopener noreferrer">
                Code repo <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </PageBand>

      <main className="wrap overlap-sm split">
        <div className="split-main stack-lg">
          {project.description.trim() ? (
            <section className="card stack-sm">
              <h2 className="display h3">About the project</h2>
              <p className="muted prose">{project.description}</p>
            </section>
          ) : null}

          <section className="stack-sm" aria-labelledby="roles-heading">
            <h2 id="roles-heading" className="display h3">
              {listed.every((r) => r.status === "open") ? "Open roles" : "Roles"}
            </h2>
            {listed.length === 0 ? (
              <p className="card muted">
                {isOwner ? "No open roles right now." : "No open roles right now. Check back, or browse other projects."}
              </p>
            ) : (
              listed.map((role) => {
                const state = roleViewerState(role, { status: project.status, isOwner }, myOffer(role.id));
                const mine = myOffer(role.id);
                const resend = mine ? resendState(mine, role.status === "open" && project.status === "published") : null;
                const count = offersFor.get(role.id)?.filter((o) => o.status === "pending").length ?? 0;
                return (
                  <article key={role.id} className="card role-item">
                    <div className="role-item-head">
                      <RoleTag role={CATEGORY_LABEL[role.category]} scope={scopeLabel(role.need, role.hours)} />
                      {state.kind === "owner" ? (
                        <span className="small muted">{count === 0 ? "No pending offers" : `${count} pending ${count === 1 ? "offer" : "offers"}`}</span>
                      ) : null}
                    </div>
                    {state.kind === "can-offer" ? (
                      <OfferForm roleId={role.id} projectId={projectId} ownerFirstName={ownerFirst} />
                    ) : null}
                    {state.kind === "offered" && mine ? (
                      <div className="row-wrap">
                        <span className={`label badge ${OFFER_BADGE[state.status].success ? "badge-success" : "badge-neutral"}`}>
                          {OFFER_BADGE[state.status].mine}
                        </span>
                        {hasConversation(state.status) ? <Link href={`/messages/${mine.id}`}>Open conversation</Link> : null}
                        {state.status === "pending" ? (
                          <ActionButton action={withdrawOffer} fields={fields(mine.id)} label="Withdraw offer" pendingLabel="Withdrawing…" className="btn btn-sm btn-outline" />
                        ) : null}
                        {resend?.kind === "wait" ? (
                          <span className="small muted">You can send a new offer {minutesLabel(resend.minutes)}.</span>
                        ) : null}
                        {resend?.kind === "used-up" ? (
                          <span className="small muted">You&apos;ve sent this offer again twice, so it&apos;s closed for this role.</span>
                        ) : null}
                      </div>
                    ) : null}
                    {state.kind === "offered" && mine && resend?.kind === "ready" ? (
                      <OfferForm roleId={role.id} projectId={projectId} ownerFirstName={ownerFirst} resendOfferId={mine.id} />
                    ) : null}
                    {state.kind === "unavailable" ? <p className="small muted">Not taking offers right now.</p> : null}
                  </article>
                );
              })
            )}
          </section>

          {filled.length > 0 ? (
            <section className="stack-sm" aria-labelledby="credits-heading">
              <h2 id="credits-heading" className="display h3">
                Credits
              </h2>
              {filled.map((role) => {
                const credit = creditFor.get(role.id);
                if (!credit) return null;
                return (
                  <article key={role.id} className="card credit-item">
                    <span className={`avatar ${avatarTone(credit.helper.id)} avatar-check`} aria-hidden="true">
                      {initials(credit.helper.full_name)}
                      <span className="avatar-tick">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      </span>
                    </span>
                    <div className="stack-xs">
                      <p className="credit-line">
                        <strong>{ownerName(credit.helper.full_name)}</strong> · {CATEGORY_LABEL[role.category]} · {hrs(credit.hours)}{" "}
                        <span className="label badge badge-success">Filled</span>
                      </p>
                      <p className="muted prose">
                        &ldquo;{credit.note}&rdquo; · {ownerFirst}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : null}
        </div>

        <aside className="split-side stack-md">
          {isOwner && project.status !== "archived" ? (
            <section className="card stack-sm">
              <h2 className="label muted">{project.status === "draft" ? "Draft" : "Published"}</h2>
              <p className="small muted">
                {project.status === "draft"
                  ? "Only you can see this project. Publish it to list its open roles on Browse."
                  : "Listed on Browse. Unpublish to hide it while you make changes."}
              </p>
              <ActionButton
                action={setProjectStatus}
                fields={{ projectId, status: project.status === "draft" ? "published" : "draft" }}
                label={project.status === "draft" ? "Publish project" : "Unpublish"}
                pendingLabel={project.status === "draft" ? "Publishing…" : "Unpublishing…"}
                className={project.status === "draft" ? "btn btn-sm glass-dark" : "btn btn-sm btn-outline"}
              />
            </section>
          ) : null}

          <section className="card stack-sm" aria-labelledby="team-heading">
            <h2 id="team-heading" className="label muted">
              Team
            </h2>
            <PersonLine person={project.owner} meta={["Owner", ownerYear(project.owner.major, project.owner.class_year)].filter(Boolean).join(" · ")} />
            {team.map((role) =>
              role.helper ? (
                <PersonLine
                  key={role.id}
                  person={role.helper}
                  meta={[CATEGORY_LABEL[role.category], ownerYear(role.helper.major, role.helper.class_year)].filter(Boolean).join(" · ")}
                />
              ) : null,
            )}
          </section>

          {isOwner ? (
            <section className="card owner-panel stack-sm" aria-labelledby="offers-heading">
              <div className="row-between">
                <h2 id="offers-heading" className="display h4">
                  Offers
                </h2>
                <span className="label badge badge-neutral">Only you see this</span>
              </div>
              {offers.length === 0 ? <p className="small muted">No offers yet. They&apos;ll show up here.</p> : null}
              {[...offersFor].map(([roleId, list]) => {
                const role = roleById.get(roleId);
                if (!role) return null;
                return (
                  <div key={roleId} className="stack-sm">
                    <RoleTag role={CATEGORY_LABEL[role.category]} scope={scopeLabel(role.need, role.hours)} />
                    {list.map((offer) => (
                      <article key={offer.id} className="offer-item stack-sm">
                        <PersonLine person={offer.helper} meta={ownerYear(offer.helper.major, offer.helper.class_year)} small />
                        <p className="small muted prose">{offer.note}</p>
                        {offer.status === "pending" && role.status === "open" ? (
                          <div className="row-wrap">
                            <ActionButton
                              action={acceptOffer}
                              fields={fields(offer.id)}
                              label="Accept"
                              pendingLabel="Accepting…"
                              srContext={` ${ownerName(offer.helper.full_name)}'s offer`}
                            />
                            <ActionButton
                              action={declineOffer}
                              fields={fields(offer.id)}
                              label="Decline"
                              pendingLabel="Declining…"
                              srContext={` ${ownerName(offer.helper.full_name)}'s offer`}
                              className="btn btn-sm btn-outline"
                            />
                          </div>
                        ) : (
                          <span className={`label badge ${OFFER_BADGE[offer.status].success ? "badge-success" : "badge-neutral"}`}>
                            {OFFER_BADGE[offer.status].owner}
                          </span>
                        )}
                        {hasConversation(offer.status) ? (
                          <Link href={`/messages/${offer.id}`} className="small">
                            {offer.status === "accepted" ? "Open conversation" : "Reply before deciding"}
                          </Link>
                        ) : null}
                      </article>
                    ))}
                  </div>
                );
              })}
            </section>
          ) : null}
        </aside>
      </main>
    </>
  );
}
