"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { saveNewPassword } from "./actions";
import { initialAuthState } from "@/lib/auth/auth-state";
import { PasswordField } from "@/components/forms/PasswordField";

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(saveNewPassword, initialAuthState);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "error") passwordRef.current?.focus();
  }, [state]);

  // Submit manually so React 19 doesn't clear the field when there's an error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  const error = state.status === "error" ? state.message : "";
  return (
    <form action={action} onSubmit={onSubmit} noValidate className="stack-md">
      <div className="stack-sm">
        <h1 className="display" style={{ fontSize: 38 }}>Set a new password</h1>
        <p className="muted">
          For <strong>{email}</strong>. You&apos;ll use it with your Tufts email next time you sign in.
        </p>
      </div>
      {/* Lets password managers save the new password under the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <PasswordField inputRef={passwordRef} label="New password" autoComplete="new-password" error={Boolean(error)} errorId="reset-error" />
      {error ? (
        <p id="reset-error" role="alert" className="error-text">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn glass-dark" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
