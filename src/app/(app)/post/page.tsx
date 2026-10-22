import type { Metadata } from "next";
import { PageBand } from "@/components/app/PageBand";
import { ComingNext } from "@/components/app/ComingNext";

export const metadata: Metadata = { title: "Post a project · Pickup" };

export default function PostPage() {
  return (
    <>
      <PageBand title="Post a project" lede="Say what you're building and the one thing you need help with. Small asks get answered fastest." />
      <main className="wrap overlap">
        <ComingNext
          title="The post form lands here"
          body="Project name, pitch, stage, links and up to five roles, validated with projectInputSchema and saved as a draft or published."
          design="design/Post.dc.html"
        />
      </main>
    </>
  );
}
