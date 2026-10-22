import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageBand } from "@/components/app/PageBand";
import { ComingNext } from "@/components/app/ComingNext";
import { createClient } from "@/lib/supabase/server";
import { projectIdSchema } from "@/lib/schemas";
import { STAGE_LABEL, type Stage } from "@/lib/vocab";

export const metadata: Metadata = { title: "Project · Pickup" };

type ProjectRow = { id: string; title: string; pitch: string; stage: Stage };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = projectIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();

  // No status filter: RLS shows published projects to everyone and drafts to their owner.
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, title, pitch, stage")
    .eq("id", parsed.data)
    .maybeSingle()
    .overrideTypes<ProjectRow, { merge: false }>();
  if (error) console.error("project: query failed", error);
  if (!project) notFound();

  return (
    <>
      <PageBand title={project.title} lede={project.pitch} actions={<Link href="/browse" className="btn glass-dark">Back to Browse</Link>} />
      <main className="wrap overlap stack-lg">
        <ComingNext
          title="The project page lands here"
          body={`Stage: ${STAGE_LABEL[project.stage]}. Description, roles with "Send offer", the owner's offer inbox, and credits.`}
          design="design/Project.dc.html"
        />
      </main>
    </>
  );
}
