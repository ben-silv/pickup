import type { Metadata } from "next";
import { PageBand } from "@/components/app/PageBand";
import { PostForm } from "./PostForm";

export const metadata: Metadata = { title: "Post a project · Pickup" };

export default function PostPage() {
  return (
    <>
      <PageBand title="Post a project" lede="Say what you're building and the one thing you need help with. Small asks get answered fastest." />
      <main className="wrap overlap">
        <PostForm />
      </main>
    </>
  );
}
