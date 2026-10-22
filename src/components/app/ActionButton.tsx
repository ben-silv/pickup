"use client";

import { useActionState } from "react";
import { idleState, type ActionState } from "@/lib/action-state";

type Props = {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  className?: string;
  /** When several buttons share a label, says which thing this one acts on, for screen readers (" Maya R.'s offer"). */
  srContext?: string;
};

/**
 * A one-click Server Action (Accept, Decline, Withdraw, Publish) with its hidden fields.
 * A plain form underneath, so it works before JavaScript loads; shows the error if the action fails.
 */
export function ActionButton({ action, fields, label, pendingLabel, className = "btn btn-sm glass-dark", srContext }: Props) {
  const [state, formAction, pending] = useActionState(action, idleState);
  return (
    <form action={formAction} className="action-form">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={className} disabled={pending}>
        {pending ? pendingLabel : label}
        {srContext ? <span className="sr-only">{srContext}</span> : null}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="error-text">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
