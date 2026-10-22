import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBand } from "@/components/app/PageBand";
import { CreditList, ProfileCard, ProjectTiles } from "@/components/app/ProfileParts";
import { loadProfile } from "../../profile/data";
import { createClient, getUser } from "@/lib/supabase/server";
import { personIdSchema } from "@/lib/schemas";
import { ownerName } from "@/lib/feed";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const parsed = personIdSchema.safeParse((await params).id);
  if (!parsed.success) return { title: "Profile · Pickup" };
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name").eq("id", parsed.data).maybeSingle<{ full_name: string }>();
  return { title: `${data?.full_name.trim() ? ownerName(data.full_name) : "Profile"} · Pickup` };
}

/** Someone's public profile: read-only, published projects and credits. */
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = personIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const supabase = await createClient();
  const [user, data] = await Promise.all([getUser(), loadProfile(supabase, parsed.data, false)]);
  if (!data.profile) {
    if (!data.profileFailed) notFound();
    return (
      <>
        <PageBand title="Profile" tall={false} />
        <main className="wrap overlap-sm">
          <p role="alert" className="card error-text">
            Couldn&apos;t load this profile. Refresh to try again.
          </p>
        </main>
      </>
    );
  }
  const isMe = user?.id === data.profile.id;

  return (
    <>
      <PageBand />
      <main className="wrap overlap split">
        <div className="split-side stack-md">
          <ProfileCard
            profile={data.profile}
            actions={
              isMe ? (
                <Link href="/profile?edit=1" className="btn btn-sm glass-dark">
                  Edit profile
                </Link>
              ) : null
            }
          />
          {isMe ? <p className="small muted">This is what other students see. Drafts stay hidden.</p> : null}
        </div>
        <div className="split-main stack-lg">
          <ProjectTiles projects={data.projects} own={false} failed={data.projectsFailed} />
          <CreditList credits={data.credits} own={false} failed={data.creditsFailed} />
        </div>
      </main>
    </>
  );
}
