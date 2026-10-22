import Link from "next/link";
import type { Metadata } from "next";
import { PageBand } from "@/components/app/PageBand";
import { ComingNext } from "@/components/app/ComingNext";

export const metadata: Metadata = { title: "Browse · Pickup" };

export default function BrowsePage() {
  return (
    <>
      <PageBand
        title="Open roles"
        lede="Small, scoped asks from Tufts students. Pick one you can finish in a weekend."
        actions={<Link href="/post" className="btn glass-dark">Post a project</Link>}
      />
      <main className="wrap overlap">
        <ComingNext
          title="The feed lands here"
          body="Open roles from the open_roles view, with skill filters and search. Each card links to its project page."
          design="design/Feed.dc.html"
        />
      </main>
    </>
  );
}
