import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageBand } from "@/components/app/PageBand";
import { ConversationList } from "./ConversationList";
import { loadConversations } from "./conversations";
import { createClient, getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages · Project Pickup" };

export default async function MessagesPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=%2Fmessages");
  const supabase = await createClient();
  const { list, failed } = await loadConversations(supabase, user.id);

  return (
    <>
      <PageBand title="Messages" tall={false} />
      <main className="wrap overlap-sm msg-layout">
        <ConversationList list={list} failed={failed} />
        <section className="card msg-thread msg-pick" aria-label="Conversation">
          <p className="muted">{list.length > 0 ? "Pick a conversation to read it." : "Your conversations will show up here."}</p>
        </section>
      </main>
    </>
  );
}
