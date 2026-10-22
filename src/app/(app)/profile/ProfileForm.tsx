"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { updateProfile } from "./actions";
import { idleState } from "@/lib/action-state";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/vocab";
import { knownMajor } from "@/lib/onboarding";
import { BasicsFields } from "@/components/forms/BasicsFields";

type Values = {
  fullName: string;
  classYear: string | null;
  major: string | null;
  bio: string | null;
  skills: Category[];
  openToRequests: boolean;
  hoursPerWeek: number | null;
  githubUrl: string | null;
};

/** Edit name, year, major, bio, skills, availability and GitHub. Fields are uncontrolled, so they survive an error. */
export function ProfileForm({ values }: { values: Values }) {
  const [state, action, pending] = useActionState(updateProfile, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const invalid = (key: string) => (errors[key] ? true : undefined);
  const describedBy = (key: string) => (errors[key] ? `err-${key}` : undefined);
  const errorText = (key: string) =>
    errors[key] ? (
      <p id={`err-${key}`} className="error-text">
        {errors[key]}
      </p>
    ) : null;

  useEffect(() => {
    if (state.status !== "error") return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (first ?? formRef.current?.querySelector<HTMLElement>("#profile-error"))?.focus();
  }, [state]);

  // Submit manually so React 19 doesn't reset the fields when there's an error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} noValidate aria-labelledby="edit-heading" className="card profile-card stack-md">
      <h1 id="edit-heading" className="display h3">
        Edit profile
      </h1>
      <label className="field">
        <span>Name</span>
        <input name="fullName" type="text" maxLength={80} autoComplete="name" defaultValue={values.fullName} aria-invalid={invalid("fullName")} aria-describedby={describedBy("fullName")} />
      </label>
      {errorText("fullName")}
      <BasicsFields classYear={values.classYear ?? ""} major={knownMajor(values.major)} errors={errors} />
      <label className="field">
        <span>
          Bio <span className="hint">Under 400 characters</span>
        </span>
        <textarea name="bio" rows={3} maxLength={400} defaultValue={values.bio ?? ""} aria-invalid={invalid("bio")} aria-describedby={describedBy("bio")} />
      </label>
      {errorText("bio")}
      <fieldset className="choice-set">
        <legend>Can help with</legend>
        <div className="row-wrap">
          {CATEGORIES.map((c) => (
            <label key={c} className="choice">
              <input type="checkbox" name="skills" value={c} defaultChecked={values.skills.includes(c)} />
              {CATEGORY_LABEL[c]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="availability stack-sm">
        <label className="switch-row">
          <span className="availability-title">Open to requests</span>
          <input type="checkbox" role="switch" name="openToRequests" className="switch" defaultChecked={values.openToRequests} />
        </label>
        <label className="field hours-field">
          <span>Hours a week</span>
          <input
            name="hoursPerWeek"
            type="number"
            inputMode="numeric"
            min={1}
            max={40}
            defaultValue={values.hoursPerWeek ?? ""}
            aria-invalid={invalid("hoursPerWeek")}
            aria-describedby={describedBy("hoursPerWeek")}
          />
        </label>
        {errorText("hoursPerWeek")}
      </div>
      <label className="field">
        <span>
          GitHub <span className="hint">Optional</span>
        </span>
        <input name="githubUrl" type="url" placeholder="https://github.com/…" defaultValue={values.githubUrl ?? ""} aria-invalid={invalid("githubUrl")} aria-describedby={describedBy("githubUrl")} />
      </label>
      {errorText("githubUrl")}
      {state.status === "error" ? (
        <p id="profile-error" role="alert" tabIndex={-1} className="error-text">
          {state.message}
        </p>
      ) : null}
      <div className="row-wrap">
        <button type="submit" className="btn glass-dark" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </button>
        <Link href="/profile" className="btn btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
