import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageBand } from "@/components/app/PageBand";
import {
  CreditList,
  ProfileCard,
  ProjectTiles,
} from "@/components/app/ProfileParts";
import { ProfileForm } from "./ProfileForm";
import { DeleteAccount } from "./DeleteAccount";
import { loadProfile } from "./data";
import { createClient, getUser } from "@/lib/supabase/server";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Profile · Project Pickup" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=%2Fprofile");
  const editing = (await searchParams).edit === "1";
  const supabase = await createClient();
  const {
    profile,
    profileFailed,
    projects,
    projectsFailed,
    credits,
    creditsFailed,
  } = await loadProfile(supabase, user.id, true);

  const signOutForm = (
    <form action={signOut}>
      <button type="submit" className="btn btn-sm btn-outline">
        Sign out
      </button>
    </form>
  );

  return (
    <>
      <PageBand />
      <main className="wrap overlap split">
        <div className="split-side stack-md">
          {!profile ? (
            <section className="card stack-md">
              <h1 className="display h3">Your profile</h1>
              <p role="alert" className="error-text">
                {profileFailed
                  ? "Couldn't load your profile. Refresh to try again."
                  : "Your profile hasn't been set up. Check that the database migration has been applied."}
              </p>
              {signOutForm}
            </section>
          ) : editing ? (
            <>
              <ProfileForm
                values={{
                  fullName: profile.full_name,
                  classYear: profile.class_year,
                  major: profile.major,
                  bio: profile.bio,
                  skills: profile.skills,
                  openToRequests: profile.open_to_requests,
                  hoursPerWeek: profile.hours_per_week,
                  githubUrl: profile.github_url,
                }}
              />
              <DeleteAccount />
            </>
          ) : (
            <ProfileCard
              profile={profile}
              email={user.email ?? undefined}
              actions={
                <>
                  <Link
                    href="/profile?edit=1"
                    className="btn btn-sm glass-dark"
                  >
                    Edit profile
                  </Link>
                  {signOutForm}
                </>
              }
            />
          )}
          {profile && !editing ? (
            <Link href={`/people/${user.id}`} className="small">
              See your public profile
            </Link>
          ) : null}
        </div>
        <div className="split-main stack-lg">
          <ProjectTiles projects={projects} own failed={projectsFailed} />
          <CreditList credits={credits} own failed={creditsFailed} />
        </div>
      </main>
    </>
  );
}
