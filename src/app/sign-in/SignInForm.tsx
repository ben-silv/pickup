"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { sendPasswordReset, signInWithPassword } from "./actions";
import { initialAuthState, type AuthState } from "@/lib/auth/auth-state";
import { PasswordField } from "@/components/forms/PasswordField";

export type SignInMode = "signin" | "forgot";

// Submit manually so React 19 doesn't clear the fields when there's an error.
const submitWith = (action: (data: FormData) => void) => (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  startTransition(() => action(data));
};

export function SignInForm({ next, linkError, initialMode }: { next: string; linkError: boolean; initialMode: SignInMode }) {
  const [mode, setMode] = useState<SignInMode>(initialMode);
  const [email, setEmail] = useState("");
  const [signInState, signInAction, signingIn] = useActionState(signInWithPassword, initialAuthState);
  const [resetState, resetAction, resetting] = useActionState(sendPasswordReset, initialAuthState);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const current: AuthState = useMemo(() => (mode === "signin" ? signInState : resetState), [mode, signInState, resetState]);
  const action = mode === "signin" ? signInAction : resetAction;
  const pending = mode === "signin" ? signingIn : resetting;

  useEffect(() => {
    if (current.status !== "error") return;
    (current.field === "password" ? passwordRef : emailRef).current?.focus();
  }, [current]);

  const signUpHref = next === "/browse" ? "/sign-up" : `/sign-up?next=${encodeURIComponent(next)}`;

  if (current.status === "sent") {
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
          If <strong>{current.email}</strong> has an account, we sent it a link to set a new password. Open it on this device.
        </p>
        <button type="button" className="link-button" onClick={() => window.location.reload()}>
          Back to sign in
        </button>
      </div>
    );
  }

  const error =
    current.status === "error"
      ? current.message
      : linkError && mode === "signin"
        ? "That email link expired or was already used. Sign in, or ask for a new link."
        : "";
  const emailInvalid = current.status === "error" ? current.field !== "password" : Boolean(error);
  const passwordInvalid = current.status === "error" && current.field === "password";

  return (
    <div className="stack-md">
      <form key={mode} action={action} onSubmit={submitWith(action)} noValidate className="stack-md">
        <div className="stack-sm">
          <h1 className="display" style={{ fontSize: 38 }}>{mode === "signin" ? "Sign in" : "Reset your password"}</h1>
          <p className="muted">
            {mode === "signin" ? "Welcome back. Use your Tufts email and password." : "We'll email you a link to set a new one."}
          </p>
        </div>
        <label className="field">
          <span>Tufts email</span>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@tufts.edu"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailInvalid ? true : undefined}
            aria-describedby={error && emailInvalid ? "sign-in-error" : undefined}
          />
        </label>
        {mode === "signin" ? (
          <PasswordField inputRef={passwordRef} autoComplete="current-password" error={passwordInvalid} errorId="sign-in-error" />
        ) : null}
        {error ? (
          <p id="sign-in-error" role="alert" className="error-text">
            {error}
          </p>
        ) : null}
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn glass-dark" disabled={pending}>
          {mode === "signin" ? (pending ? "Signing in…" : "Sign in") : pending ? "Sending…" : "Email me a reset link"}
        </button>
      </form>

      <div className="auth-links">
        {mode === "signin" ? (
          <button type="button" className="link-button" onClick={() => setMode("forgot")}>
            Forgot password?
          </button>
        ) : (
          <button type="button" className="link-button" onClick={() => setMode("signin")}>
            Back to sign in
          </button>
        )}
      </div>
      <p className="auth-switch">
        New to Project Pickup? <Link href={signUpHref}>Create an account</Link>
      </p>
    </div>
  );
}
