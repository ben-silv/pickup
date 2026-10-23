"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { sendSignUpLink } from "./actions";
import { initialSignInState } from "@/lib/auth/sign-in-state";

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(sendSignUpLink, initialSignInState);
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

  const signInHref = next === "/browse" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`;

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
          We sent a link to <strong>{state.email}</strong>. Open it on this device to pick a password and finish your account. It works
          for one hour.
        </p>
        <button type="button" className="link-button" onClick={() => window.location.reload()}>
          Use a different email
        </button>
      </div>
    );
  }

  const error = state.status === "error" ? state.message : "";
  return (
    <div className="stack-md">
      <form action={action} onSubmit={onSubmit} noValidate className="stack-md">
        <div className="stack-sm">
          <h1 className="display" style={{ fontSize: 38 }}>Create your account</h1>
          <p className="muted">Tufts students only. We&apos;ll email you a link to confirm it&apos;s you, then you&apos;ll pick a password.</p>
        </div>
        <ol className="auth-steps label" aria-label="Steps">
          <li aria-current="step">1 · Email</li>
          <li>2 · Confirm</li>
          <li>3 · Password</li>
        </ol>
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
            aria-describedby={error ? "sign-up-error" : undefined}
          />
        </label>
        {error ? (
          <p id="sign-up-error" role="alert" className="error-text">
            {error}
          </p>
        ) : null}
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn glass-dark" disabled={pending}>
          {pending ? "Sending…" : "Send confirmation link"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link href={signInHref}>Sign in</Link>
      </p>
      <p className="small muted">
        Creating an account means you&apos;re OK with how we handle your data, set out in our <Link href="/privacy">privacy note</Link>.
      </p>
    </div>
  );
}
