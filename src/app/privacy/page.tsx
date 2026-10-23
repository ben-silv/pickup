import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/landing/SiteNav";
import { Footer } from "@/components/landing/Sections";
import { PageBand } from "@/components/app/PageBand";
import { CONTACT_EMAIL, PRIVACY_UPDATED } from "@/content";

export const metadata: Metadata = { title: "Privacy · Project Pickup" };

/** Plain-language privacy note. Keep it true to what the app actually does; update PRIVACY_UPDATED when it changes. */
export default function PrivacyPage() {
  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  return (
    <>
      <SiteNav />
      <PageBand title="Privacy" lede="What Project Pickup collects, who can see it, and how to get it deleted." />
      <main className="wrap overlap-sm">
        <article className="card stack-lg privacy">
          <p className="small muted">Last updated {PRIVACY_UPDATED}</p>

          <section className="stack-sm">
            <h2 className="display h3">The short version</h2>
            <p>
              Project Pickup is a student project for Tufts students. We collect what the app needs to work, show your messages only to the
              person you&apos;re talking to, don&apos;t sell anything, and don&apos;t run ads. Email {mail} any time to have your account and
              everything in it deleted.
            </p>
          </section>

          <section className="stack-sm">
            <h2 className="display h3">What we collect</h2>
            <ul>
              <li>
                <strong>Your account:</strong> your Tufts email and a password (stored hashed, so nobody can read it).
              </li>
              <li>
                <strong>Your profile:</strong> name, class year and major, plus anything you add: bio, skills, hours a week, GitHub link.
              </li>
              <li>
                <strong>What you post and send:</strong> projects and roles, offers, messages, and credit notes.
              </li>
              <li>
                <strong>Housekeeping:</strong> when you last opened each conversation (for the unread dot), plus any reports or blocks you
                make.
              </li>
              <li>
                <strong>Visits:</strong> anonymous page-view counts through Vercel Web Analytics (pages visited, browser, device type and
                country). It uses no cookies and isn&apos;t linked to your account.
              </li>
            </ul>
          </section>

          <section className="stack-sm">
            <h2 className="display h3">Who can see what</h2>
            <ul>
              <li>
                <strong>Signed-in Tufts students</strong> can see profiles (including your Tufts email), published projects and credit notes.
                Nothing is visible to people who aren&apos;t signed in.
              </li>
              <li>
                <strong>Drafts</strong> are visible only to you.
              </li>
              <li>
                <strong>Offers and messages</strong> are visible only to the two people in that conversation.
              </li>
              <li>
                <strong>Reports</strong> go to the Project Pickup team. The person you report isn&apos;t told who reported them.{" "}
                <strong>Blocks</strong> are private: the person you block isn&apos;t told.
              </li>
              <li>
                <strong>The Project Pickup team</strong> can access the database to run the site and to look into reports. We only do that when
                we need to.
              </li>
            </ul>
          </section>

          <section className="stack-sm">
            <h2 className="display h3">Services we use</h2>
            <p>
              Supabase stores the database and handles sign-in. Vercel hosts the site and counts visits. Resend delivers sign-in and
              password-reset emails. Each only gets what it needs to do that job.
            </p>
          </section>

          <section className="stack-sm">
            <h2 className="display h3">Keeping and deleting your data</h2>
            <p>
              We keep your data while you have an account. Email {mail} from your Tufts address and we&apos;ll delete your account, profile,
              projects, offers and messages. Messages you sent are removed from the other person&apos;s conversation too.
            </p>
          </section>

          <section className="stack-sm">
            <h2 className="display h3">Questions</h2>
            <p>
              Email {mail}. If this note changes, we&apos;ll update the date at the top. Project Pickup is not affiliated with or endorsed by
              Tufts University.
            </p>
            <p>
              <Link href="/">Back to Project Pickup</Link>
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
