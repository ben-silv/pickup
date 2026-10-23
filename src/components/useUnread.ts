"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { checkUnread } from "@/app/(app)/actions";
import { createClient } from "@/lib/supabase/browser";
import { supabaseConfigured } from "@/lib/env";
import { isChatMessage } from "@/lib/messages";
import { flagsUnread } from "@/lib/unread-state";
import type { MenuUser } from "@/lib/nav";

/**
 * Whether to show the red dot on Messages. Starts from the server's answer, lights up live when a message arrives
 * (Realtime only delivers messages from my own conversations), and re-checks when the tab comes back into focus.
 * Pass null to switch it off.
 */
export function useUnread(user: MenuUser | null): boolean {
  const initial = Boolean(user?.unread);
  const me = user?.id ?? null;
  const [unread, setUnread] = useState(initial);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  // The layout re-renders after a conversation is marked read; follow its answer.
  useEffect(() => setUnread(initial), [initial]);

  useEffect(() => {
    if (!me || !supabaseConfigured()) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`unread:${me}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        if (isChatMessage(payload.new) && flagsUnread(payload.new, me, pathRef.current)) setUnread(true);
      })
      .subscribe();

    const recheck = () => {
      if (document.visibilityState !== "visible") return;
      checkUnread()
        .then(setUnread)
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      void supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [me]);

  return unread;
}
