"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { deleteAccount } from "./actions";
import { idleState } from "@/lib/action-state";

/**
 * Bottom of Edit profile. "Delete account" opens a pop-up (a native <dialog>, so focus stays inside and Escape closes it);
 * there you type DELETE and press "Confirm delete". The server checks DELETE again.
 */
export function DeleteAccount() {
  const [state, action, pending] = useActionState(deleteAccount, idleState);
  const [typed, setTyped] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ready = typed.trim().toUpperCase() === "DELETE";

  useEffect(() => {
    if (state.status === "error") inputRef.current?.focus();
  }, [state]);

  const open = () => {
    setTyped("");
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  };
  const close = () => dialogRef.current?.close();

  // Submit manually so React 19 doesn't clear the field when there's an error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending || !ready) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  const error = state.status === "error" ? state.message : "";
  return (
    <section className="card stack-sm" aria-labelledby="delete-heading">
      <h2 id="delete-heading" className="display h4 danger-text">
        Delete account
      </h2>
      <p className="small muted">Deletes your profile, projects, offers and messages for good. This can&apos;t be undone.</p>
      <button type="button" className="btn btn-sm btn-outline btn-danger delete-button" onClick={open} aria-haspopup="dialog">
        Delete account
      </button>

      <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-desc">
        <form action={action} onSubmit={onSubmit} noValidate className="stack-md">
          <div className="stack-sm">
            <h2 id="delete-dialog-title" className="display h3 danger-text">
              Delete your account?
            </h2>
            <p id="delete-dialog-desc" className="muted">
              Your profile, projects, offers and messages will be deleted for good, including messages you sent in other people&apos;s
              conversations. This can&apos;t be undone.
            </p>
          </div>
          <label className="field">
            <span>Type DELETE to confirm</span>
            <input
              ref={inputRef}
              name="confirm"
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
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
          <div className="row-wrap dialog-actions">
            <button type="button" className="btn btn-sm btn-outline" onClick={close} disabled={pending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-danger-solid" disabled={!ready || pending}>
              {pending ? "Deleting…" : "Confirm delete"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
