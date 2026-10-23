import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Category, OfferStatus, ProjectStatus, RoleStatus, Stage } from "@/lib/vocab";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ProfileRow = {
  id: string;
  full_name: string;
  class_year: string | null;
  major: string | null;
  bio: string | null;
  skills: Category[];
  open_to_requests: boolean;
  hours_per_week: number | null;
  github_url: string | null;
};

export type ProjectTileRow = {
  id: string;
  title: string;
  pitch: string;
  stage: Stage;
  status: ProjectStatus;
  roles: { status: RoleStatus; offers: { status: OfferStatus }[] | null }[];
};

/** Role or project is null when the project has since been hidden from the viewer. */
export type CreditRow = {
  id: string;
  hours: number;
  note: string;
  role: { category: Category; project: { id: string; title: string; owner: { full_name: string } | null } | null } | null;
};

export const PROFILE_SELECT = "id, full_name, class_year, major, bio, skills, open_to_requests, hours_per_week, github_url";

/**
 * Someone's profile, projects and credits. `own` = my profile page: drafts included and offer counts shown.
 * The public page lists published projects only, even when it's my own, because it shows what others see.
 */
export async function loadProfile(supabase: Supabase, personId: string, own: boolean) {
  let projects = supabase
    .from("projects")
    .select(own ? "id, title, pitch, stage, status, roles(status, offers(status))" : "id, title, pitch, stage, status, roles(status)")
    .eq("owner_id", personId)
    .neq("status", "archived");
  if (!own) projects = projects.eq("status", "published");

  const [profileRes, projectsRes, creditsRes] = await Promise.all([
    supabase.from("profiles").select(PROFILE_SELECT).eq("id", personId).maybeSingle().overrideTypes<ProfileRow, { merge: false }>(),
    projects.order("created_at", { ascending: false }).overrideTypes<ProjectTileRow[], { merge: false }>(),
    supabase
      .from("credits")
      .select("id, hours, note, role:roles(category, project:projects(id, title, owner:profiles!projects_owner_id_fkey(full_name)))")
      .eq("helper_id", personId)
      .order("created_at", { ascending: false })
      .overrideTypes<CreditRow[], { merge: false }>(),
  ]);
  if (profileRes.error) console.error("profile: query failed", profileRes.error);
  if (projectsRes.error) console.error("profile: projects query failed", projectsRes.error);
  if (creditsRes.error) console.error("profile: credits query failed", creditsRes.error);

  return {
    profile: profileRes.data,
    profileFailed: Boolean(profileRes.error),
    projects: projectsRes.data ?? [],
    projectsFailed: Boolean(projectsRes.error),
    credits: creditsRes.data ?? [],
    creditsFailed: Boolean(creditsRes.error),
  };
}
