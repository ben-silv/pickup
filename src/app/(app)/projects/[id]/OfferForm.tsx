"use client";

import { startTransition, useActionState, useEffect, useId, useRef, type FormEvent } from "react";
import { sendOffer } from "./actions";
import { idleState } from "@/lib/action-state";

/**
 * "Offer to help" on an open role: opens an inline note and sends the offer.
 * Built on <details>, so it opens and submits even before JavaScript loads.
 */
export function OfferForm({ roleId, projectId, ownerFirstName }: { roleId: string; projectId: string; ownerFirstName: string }) {
  const [state, action, pending] = useActionState(sendOffer, idleState);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  useEffect(() => {
    if (state.status === "error") noteRef.current?.focus();
  }, [state]);

  // Submit manually so React 19 doesn't clear the note when there's an error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  const error = state.status === "error" ? state.message : "";

  return (
    <details className="reveal" open={state.status === "error" || undefined} onToggle={(e) => e.currentTarget.open && noteRef.current?.focus()}>
      <summary className="btn btn-sm glass-dark">
        <span className="when-closed">Offer to help</span>
        <span className="when-open">Cancel</span>
      </summary>
      <form action={action} onSubmit={onSubmit} noValidate className="offer-form">
        <input type="hidden" name="roleId" value={roleId} />
        <input type="hidden" name="projectId" value={projectId} />
        <label className="field">
          <span>Why you&apos;re a good fit</span>
          <textarea
            ref={noteRef}
            name="note"
            rows={3}
            maxLength={600}
            required
            placeholder="Link something you've made and say when you could start."
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </label>
        {error ? (
          <p id={`${id}-error`} role="alert" className="error-text">
            {error}
          </p>
        ) : null}
        <div className="row-wrap">
          <button type="submit" className="btn btn-sm glass-dark" disabled={pending}>
            {pending ? "Sending…" : "Send offer"}
          </button>
          <span className="small muted">{ownerFirstName} gets a message and can accept or decline.</span>
        </div>
      </form>
    </details>
  );
}
