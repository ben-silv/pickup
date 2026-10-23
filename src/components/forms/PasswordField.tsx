"use client";

import { useId, useState, type Ref } from "react";

/** Password input with a Show/Hide toggle, so people can check what they typed on a phone keyboard. */
export function PasswordField({
  label = "Password",
  autoComplete,
  error,
  errorId,
  inputRef,
}: {
  label?: string;
  autoComplete: "current-password" | "new-password";
  error?: boolean;
  errorId?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const [shown, setShown] = useState(false);
  const id = useId();
  const hintId = `${id}-hint`;
  const isNew = autoComplete === "new-password";
  const describedBy = [isNew ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <span className="field-row">
        <label htmlFor={id}>{label}</label>
        <button type="button" className="link-button small" aria-controls={id} aria-pressed={shown} onClick={() => setShown((s) => !s)}>
          {shown ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      </span>
      <input
        ref={inputRef}
        id={id}
        name="password"
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={isNew ? 8 : undefined}
        maxLength={72}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {isNew ? (
        <span id={hintId} className="muted small field-hint">
          At least 8 characters.
        </span>
      ) : null}
    </div>
  );
}
