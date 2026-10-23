import Link from "next/link";
import type { Metadata } from "next";
import { PageBand } from "@/components/app/PageBand";
import { FeedFilters } from "@/components/app/FeedFilters";
import { FeedCard } from "@/components/app/FeedCard";
import { createClient } from "@/lib/supabase/server";
import { feedQuerySchema } from "@/lib/schemas";
import { FEED_LIMIT, countLabel, searchFilter, type FeedRow } from "@/lib/feed";

export const metadata: Metadata = { title: "Browse · Project Pickup" };

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { skill, q, sort } = feedQuerySchema.parse(await searchParams);

  const supabase = await createClient();
  let query = supabase
    .from("open_roles")
    .select("role_id, category, need, hours, created_at, project_id, title, pitch, stage, owner_id, owner_name, owner_class_year, owner_major, is_example");
  if (skill) query = query.eq("category", skill);
  const or = searchFilter(q);
  if (or) query = query.or(or);
  query = sort === "hours" ? query.order("hours").order("created_at", { ascending: false }) : query.order("created_at", { ascending: false });
  const { data, error } = await query.limit(FEED_LIMIT).overrideTypes<FeedRow[], { merge: false }>();
  if (error) console.error("browse: open_roles query failed", error);
  const rows = data ?? [];
  const filtered = Boolean(skill || q);

  return (
    <>
      <PageBand
        title="Open roles"
        lede="Small, scoped asks from Tufts students. Pick one you can finish in a weekend."
        actions={
          <Link href="/post" className="btn btn-lg btn-post glass">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Post a project
          </Link>
        }
      />
      <main className="wrap overlap stack-md">
        <FeedFilters skill={skill} q={q} sort={sort} />
        {error ? (
          <p className="card error-text" role="alert">
            Couldn&apos;t load open roles right now. Refresh to try again.
          </p>
        ) : (
          <>
            <p className="label muted" aria-live="polite">{countLabel(rows.length)}</p>
            {rows.length > 0 ? (
              <div className="feed-grid">
                {rows.map((row) => (
                  <FeedCard key={row.role_id} row={row} />
                ))}
              </div>
            ) : (
              <section className="card stack-sm">
                <h2 className="display h3">{filtered ? "No open roles match that" : "No open roles yet"}</h2>
                {filtered ? (
                  <p>
                    <Link href="/browse">Clear filters</Link>
                  </p>
                ) : (
                  <p className="muted">
                    Be the first. <Link href="/post">Post a project</Link> and ask for one role.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
