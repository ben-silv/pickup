"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { sendSignInLink } from "./actions";
import { initialSignInState } from "@/lib/auth/sign-in-state";

export function SignInForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, action, pending] = useActionState(sendSignInLink, initialSignInState);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "error") emailRef.current?.focus();
  }, [state]);

  // Submit manually so React 19 doesn't clear the field when there's an error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  if (state.status === "sent") {
    return (
      <div className="stack-md" role="status">
        <span className="icon-badge" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M4 7l8 6 8-6" />
          </svg>
        </span>
        <h1 className="display" style={{ fontSize: 36 }}>Check your inbox</h1>
        <p className="muted">
          We sent a sign-in link to <strong>{state.email}</strong>. Open it on this device. It works for one hour.
        </p>
        <button type="button" className="link-button" onClick={() => window.location.reload()}>
          Use a different email
        </button>
      </div>
    );
  }

  const error = state.status === "error" ? state.message : linkError ? "That sign-in link expired or was already used. Send a new one." : "";

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="stack-md">
      <div className="stack-sm">
        <h1 className="display" style={{ fontSize: 38 }}>Sign in</h1>
        <p className="muted">Use your Tufts email. We&apos;ll send a one-time link, so there&apos;s no password to remember.</p>
      </div>
      <label className="field">
        <span>Tufts email</span>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@tufts.edu"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "sign-in-error" : undefined}
        />
      </label>
      {error ? (
        <p id="sign-in-error" role="alert" className="error-text">
          {error}
        </p>
      ) : null}
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="btn glass-dark" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="muted small">New here? The same link creates your account.</p>
    </form>
  );
}
