"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { completeRole } from "../actions";
import { idleState } from "@/lib/action-state";

type Props = { roleId: string; offerId: string; defaultHours: number; helperFirst: string };

/** Owner only, once an offer is accepted: hours + credit note, then complete_role. */
export function MarkFilledForm({ roleId, offerId, defaultHours, helperFirst }: Props) {
  const [state, action, pending] = useActionState(completeRole, idleState);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const hoursRef = useRef<HTMLInputElement>(null);
  const hoursBad = state.status === "error" && Boolean(state.fieldErrors?.hours);

  useEffect(() => {
    if (state.status === "error") (hoursBad ? hoursRef.current : noteRef.current)?.focus();
  }, [state, hoursBad]);

  // Submit manually so React 19 doesn't clear the note when there's an error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  const error = state.status === "error" ? state.message : "";
  const noteBad = state.status === "error" && Boolean(state.fieldErrors?.note) && !hoursBad;

  return (
    <details className="reveal" open={state.status === "error" || undefined} onToggle={(e) => e.currentTarget.open && noteRef.current?.focus()}>
      <summary className="btn btn-sm glass">
        <span className="when-closed">Mark role filled</span>
        <span className="when-open">Cancel</span>
      </summary>
      <form action={action} onSubmit={onSubmit} noValidate className="offer-form">
        <input type="hidden" name="roleId" value={roleId} />
        <input type="hidden" name="offerId" value={offerId} />
        <label className="field hours-field">
          <span>Hours it took</span>
          <input
            ref={hoursRef}
            name="hours"
            type="number"
            inputMode="numeric"
            min={1}
            max={300}
            defaultValue={defaultHours}
            required
            aria-invalid={hoursBad ? true : undefined}
            aria-describedby={hoursBad ? "fill-error" : undefined}
          />
        </label>
        <label className="field">
          <span>Credit note for {helperFirst}</span>
          <textarea
            ref={noteRef}
            name="note"
            rows={3}
            maxLength={400}
            required
            placeholder="What they did, in a sentence. It shows on their profile."
            aria-invalid={noteBad ? true : undefined}
            aria-describedby={noteBad ? "fill-error" : undefined}
          />
        </label>
        {error ? (
          <p id="fill-error" role="alert" className="error-text">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-sm glass-dark" disabled={pending}>
          {pending ? "Saving…" : "Mark filled and leave credit"}
        </button>
      </form>
    </details>
  );
}
