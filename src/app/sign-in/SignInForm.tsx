"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { sendPasswordReset, sendSignInLink, signInWithPassword, signUpWithPassword } from "./actions";
import { initialSignInState } from "@/lib/auth/sign-in-state";
import { initialAuthState, type AuthState } from "@/lib/auth/auth-state";
import { PasswordField } from "@/components/forms/PasswordField";

export type SignInMode = "signin" | "signup" | "forgot" | "link";

const HEADINGS: Record<SignInMode, { title: string; lede: string }> = {
  signin: { title: "Sign in", lede: "Use your Tufts email and password." },
  signup: { title: "Create your account", lede: "Tufts students only. We'll email you a link to confirm your address." },
  forgot: { title: "Reset your password", lede: "We'll email you a link to set a new one." },
  link: { title: "Sign in with a link", lede: "We'll email you a one-time link, so there's no password to type." },
};

const SUBMIT: Record<SignInMode, [idle: string, pending: string]> = {
  signin: ["Sign in", "Signing in…"],
  signup: ["Create account", "Creating account…"],
  forgot: ["Email me a reset link", "Sending…"],
  link: ["Email me a sign-in link", "Sending…"],
};

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
  const [signUpState, signUpAction, signingUp] = useActionState(signUpWithPassword, initialAuthState);
  const [resetState, resetAction, resetting] = useActionState(sendPasswordReset, initialAuthState);
  const [linkState, linkAction, linking] = useActionState(sendSignInLink, initialSignInState);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const current: AuthState = useMemo(() => {
    if (mode === "signin") return signInState;
    if (mode === "signup") return signUpState;
    if (mode === "forgot") return resetState;
    return linkState.status === "sent" ? { status: "sent", email: linkState.email, kind: "confirm" } : linkState;
  }, [mode, signInState, signUpState, resetState, linkState]);
  const action = { signin: signInAction, signup: signUpAction, forgot: resetAction, link: linkAction }[mode];
  const pending = { signin: signingIn, signup: signingUp, forgot: resetting, link: linking }[mode];

  useEffect(() => {
    if (current.status !== "error") return;
    (current.field === "password" ? passwordRef : emailRef).current?.focus();
  }, [current]);

  if (current.status === "sent") {
    const body =
      mode === "forgot" ? (
        <>If <strong>{current.email}</strong> has an account, we sent it a link to set a new password. Open it on this device.</>
      ) : mode === "signup" ? (
        <>We sent a link to <strong>{current.email}</strong>. Open it on this device to confirm your account and sign in.</>
      ) : (
        <>We sent a sign-in link to <strong>{current.email}</strong>. Open it on this device. It works for one hour.</>
      );
    return (
      <div className="stack-md" role="status">
        <span className="icon-badge" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M4 7l8 6 8-6" />
          </svg>
        </span>
        <h1 className="display" style={{ fontSize: 36 }}>Check your inbox</h1>
        <p className="muted">{body}</p>
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
        ? "That email link expired or was already used. Sign in, or request a new link."
        : "";
  const emailInvalid = current.status === "error" ? current.field !== "password" : Boolean(error);
  const passwordInvalid = current.status === "error" && current.field === "password";
  const [submitIdle, submitPending] = SUBMIT[mode];
  const usesPassword = mode === "signin" || mode === "signup";

  return (
    <div className="stack-md">
      {mode === "signin" || mode === "signup" ? (
        <div className="auth-tabs" role="group" aria-label="Sign in or create an account">
          <button type="button" className="auth-tab" aria-pressed={mode === "signin"} onClick={() => setMode("signin")}>
            Sign in
          </button>
          <button type="button" className="auth-tab" aria-pressed={mode === "signup"} onClick={() => setMode("signup")}>
            Create account
          </button>
        </div>
      ) : null}

      <form key={mode} action={action} onSubmit={submitWith(action)} noValidate className="stack-md">
        <div className="stack-sm">
          <h1 className="display" style={{ fontSize: 38 }}>{HEADINGS[mode].title}</h1>
          <p className="muted">{HEADINGS[mode].lede}</p>
        </div>
        <label className="field">
          <span>Tufts email</span>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete={mode === "signup" ? "email" : "username"}
            placeholder="you@tufts.edu"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailInvalid ? true : undefined}
            aria-describedby={error && emailInvalid ? "sign-in-error" : undefined}
          />
        </label>
        {usesPassword ? (
          <PasswordField
            inputRef={passwordRef}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            error={passwordInvalid}
            errorId="sign-in-error"
          />
        ) : null}
        {error ? (
          <p id="sign-in-error" role="alert" className="error-text">
            {error}
          </p>
        ) : null}
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn glass-dark" disabled={pending}>
          {pending ? submitPending : submitIdle}
        </button>
      </form>

      <div className="auth-links">
        {mode === "signin" ? (
          <button type="button" className="link-button" onClick={() => setMode("forgot")}>
            Forgot password?
          </button>
        ) : null}
        {mode !== "link" ? (
          <button type="button" className="link-button" onClick={() => setMode("link")}>
            Email me a sign-in link instead
          </button>
        ) : null}
        {mode === "forgot" || mode === "link" ? (
          <button type="button" className="link-button" onClick={() => setMode("signin")}>
            Back to password sign-in
          </button>
        ) : null}
      </div>
    </div>
  );
}
