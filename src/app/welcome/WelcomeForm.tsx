"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { completeOnboarding } from "./actions";
import { idleState } from "@/lib/action-state";
import { BasicsFields } from "@/components/forms/BasicsFields";
import { PasswordField } from "@/components/forms/PasswordField";

type Props = {
  next: string;
  email: string;
  needsBasics: boolean;
  needsPassword: boolean;
  fullName: string;
  classYear: string;
  major: string;
};

export function WelcomeForm({ next, email, needsBasics, needsPassword, fullName, classYear, major }: Props) {
  const [state, action, pending] = useActionState(completeOnboarding, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  useEffect(() => {
    if (state.status === "error") formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  // Submit manually so React 19 doesn't reset the choices when there's an error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} noValidate className="stack-md">
      <div className="stack-sm">
        <h1 className="display" style={{ fontSize: 38 }}>{needsBasics ? "Welcome to Project Pickup" : "Pick a password"}</h1>
        <p className="muted">
          {needsBasics
            ? "Tell classmates who you are and pick a password. Your name, year and major show on your projects and offers."
            : "You'll sign in with your Tufts email and this password from now on."}
        </p>
      </div>
      {needsBasics ? (
        <>
      <label className="field">
        <span>Your name</span>
        <input
          name="fullName"
          type="text"
          maxLength={80}
          autoComplete="name"
          defaultValue={fullName}
          placeholder="First and last name"
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "err-fullName" : undefined}
        />
      </label>
      {errors.fullName ? (
        <p id="err-fullName" className="error-text">
          {errors.fullName}
        </p>
      ) : null}
      <BasicsFields classYear={classYear} major={major} errors={errors} />
        </>
      ) : null}
      {needsPassword ? (
        <>
          {/* Lets password managers save the new password under the right account. */}
          <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
          <PasswordField label="Pick a password" autoComplete="new-password" error={Boolean(errors.password)} errorId="err-password" />
          {errors.password ? (
            <p id="err-password" className="error-text">
              {errors.password}
            </p>
          ) : null}
        </>
      ) : null}
      <input type="hidden" name="next" value={next} />
      {state.status === "error" && !Object.keys(errors).length ? (
        <p role="alert" className="error-text">
          {state.message}
        </p>
      ) : null}
      <button type="submit" className="btn glass-dark" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
