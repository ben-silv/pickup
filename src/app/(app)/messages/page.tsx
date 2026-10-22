import type { Metadata } from "next";
import { PageBand } from "@/components/app/PageBand";
import { ComingNext } from "@/components/app/ComingNext";

export const metadata: Metadata = { title: "Messages · Pickup" };

export default function MessagesPage() {
  return (
    <>
      <PageBand title="Messages" tall={false} />
      <main className="wrap overlap-sm">
        <ComingNext
          title="Conversations land here"
          body="One thread per offer between the helper and the project owner, updating live through Supabase Realtime."
          design="design/Messages.dc.html"
        />
      </main>
    </>
  );
}
