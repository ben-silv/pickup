import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageBand } from "@/components/app/PageBand";
import { ComingNext } from "@/components/app/ComingNext";
import { createClient, getUser } from "@/lib/supabase/server";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Profile · Pickup" };

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, full_name, class_year, major, open_to_requests")
    .eq("id", user.id)
    .single();

  return (
    <>
      <PageBand title={profile?.full_name || "Your profile"} lede={profile?.email ?? user.email ?? undefined} />
      <main className="wrap overlap stack-lg">
        <section className="card stack-md">
          <h2 className="display h3">Signed in</h2>
          {error ? (
            <p className="error-text">Couldn&apos;t load your profile. Check that the database migration has been applied.</p>
          ) : (
            <dl className="facts">
              <dt>Email</dt>
              <dd>{profile?.email}</dd>
              <dt>Class year</dt>
              <dd>{profile?.class_year ?? "Not set"}</dd>
              <dt>Major</dt>
              <dd>{profile?.major ?? "Not set"}</dd>
              <dt>Open to requests</dt>
              <dd>{profile?.open_to_requests ? "Yes" : "No"}</dd>
            </dl>
          )}
          <form action={signOut}>
            <button type="submit" className="btn btn-outline">Sign out</button>
          </form>
        </section>
        <ComingNext
          title="Profile editing and credits land here"
          body="Edit name, skills and availability (profileInputSchema), list your projects, and show credit notes from people you've helped."
          design="design/Profile.dc.html"
        />
      </main>
    </>
  );
}
