"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { sendMessage } from "../actions";
import { idleState } from "@/lib/action-state";
import { buildTimeline, isChatMessage, mergeMessages, messageTime, type ChatMessage, type TimelineInput } from "@/lib/messages";
import { createClient } from "@/lib/supabase/browser";
import { supabaseConfigured } from "@/lib/env";

type Props = {
  offerId: string;
  initialMessages: ChatMessage[];
  timeline: Omit<TimelineInput, "messages">;
  canSend: boolean;
  closedNote: string;
};

/** The conversation: status lines and messages, new ones arriving live, plus the composer. */
export function Thread({ offerId, initialMessages, timeline, canSend, closedNote }: Props) {
  const [live, setLive] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [state, action, pending] = useActionState(sendMessage, idleState);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentRef = useRef("");

  // New messages for this conversation stream in through Supabase Realtime (RLS still applies).
  useEffect(() => {
    if (!supabaseConfigured()) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${offerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `offer_id=eq.${offerId}` }, (payload) => {
        if (isChatMessage(payload.new) && payload.new.offer_id === offerId) {
          const message = payload.new;
          setLive((list) => [...list, message]);
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [offerId]);

  const items = useMemo(() => buildTimeline({ ...timeline, messages: mergeMessages(initialMessages, live) }), [timeline, initialMessages, live]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items.length]);

  // Clear the box once the message is sent, unless more was typed meanwhile; keep it (and focus it) if sending failed.
  useEffect(() => {
    if (state.status === "done") setDraft((d) => (d === sentRef.current ? "" : d));
    if (state.status === "error") inputRef.current?.focus();
  }, [state]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    sentRef.current = draft;
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  const error = state.status === "error" ? state.message : "";

  return (
    <>
      <div ref={bodyRef} className="thread-body" role="log" aria-label="Messages" aria-live="polite">
        {items.map((item) =>
          item.kind === "status" ? (
            <p key={item.key} className="label thread-status">
              {item.text}
            </p>
          ) : (
            <div key={item.key} className={`bubble-wrap${item.mine ? " mine" : ""}`}>
              <p className="bubble">
                <span className="sr-only">{item.mine ? "You: " : "Them: "}</span>
                {item.body}
              </p>
              <span className="msg-time">{messageTime(item.at)}</span>
            </div>
          ),
        )}
      </div>
      {canSend ? (
        <form action={action} onSubmit={onSubmit} className="composer">
          <input type="hidden" name="offerId" value={offerId} />
          <label className="composer-field">
            <span className="sr-only">Message</span>
            <input
              ref={inputRef}
              name="body"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              autoComplete="off"
              placeholder="Write a message"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "composer-error" : undefined}
            />
          </label>
          <button type="submit" className="btn btn-sm glass-dark" disabled={pending}>
            {pending ? "Sending…" : "Send"}
          </button>
          {error ? (
            <p id="composer-error" role="alert" className="error-text composer-error">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="composer composer-closed small muted">{closedNote}</p>
      )}
    </>
  );
}
