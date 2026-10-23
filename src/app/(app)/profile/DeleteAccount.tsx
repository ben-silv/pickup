"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { deleteAccount } from "./actions";
import { idleState } from "@/lib/action-state";

/** Bottom of Edit profile. Typing DELETE stands in for a pop-up confirm, since this can't be undone. */
export function DeleteAccount() {
  const [state, action, pending] = useActionState(deleteAccount, idleState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "error") inputRef.current?.focus();
  }, [state]);

  // Submit manually so React 19 doesn't clear the field when there's an error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  const error = state.status === "error" ? state.message : "";
  return (
    <section className="card stack-sm" aria-labelledby="delete-heading">
      <h2 id="delete-heading" className="display h4">
        Delete account
      </h2>
      <p className="small muted">
        Deletes your profile, projects, offers and messages for good, including messages you sent in other people&apos;s conversations.
        This can&apos;t be undone.
      </p>
      <form action={action} onSubmit={onSubmit} noValidate className="stack-sm">
        <label className="field">
          <span>Type DELETE to confirm</span>
          <input
            ref={inputRef}
            name="confirm"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "delete-error" : undefined}
          />
        </label>
        {error ? (
          <p id="delete-error" role="alert" className="error-text">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-sm btn-outline delete-button" disabled={pending}>
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </form>
    </section>
  );
}
