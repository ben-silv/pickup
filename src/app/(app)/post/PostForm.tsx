"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { createProject } from "./actions";
import { idleState } from "@/lib/action-state";
import { MAX_ROLES } from "@/lib/post";
import { CATEGORIES, CATEGORY_LABEL, STAGES, STAGE_LABEL, type Category } from "@/lib/vocab";
import { RoleTag } from "@/components/RoleTag";

type RoleRow = { key: number; category: Category | ""; need: string; hours: string };

const PLACEHOLDERS = ["Redesign the home and settings screens", "Set up sign-in and a database", "Write the App Store description"];

/**
 * Post a project: details, 1–5 role rows, "Publish project" or "Save draft".
 * Works as a plain form before JavaScript loads (one role row); adding and removing rows needs JavaScript.
 */
export function PostForm() {
  const [state, action, pending] = useActionState(createProject, idleState);
  const [intent, setIntent] = useState<"publish" | "draft">("publish");
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [roles, setRoles] = useState<RoleRow[]>([{ key: 0, category: "", need: "", hours: "5" }]);
  const nextKey = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);

  // Role errors are keyed by row position, so they're hidden once a row is removed until the next save.
  const [rolesChangedSince, setRolesChangedSince] = useState<typeof state | null>(null);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const err = (key: string) => (key.startsWith("roles.") && rolesChangedSince === state ? undefined : errors[key]);
  const invalid = (key: string) => (err(key) ? true : undefined);
  const describedBy = (key: string) => (err(key) ? `err-${key.replace(/\./g, "-")}` : undefined);
  const errorText = (field: string) =>
    err(field) ? (
      <p id={describedBy(field)} className="error-text">
        {err(field)}
      </p>
    ) : null;

  // After a failed save, move focus to the first field that needs fixing.
  useEffect(() => {
    if (state.status !== "error") return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid] input');
    (first ?? formRef.current?.querySelector<HTMLElement>("#post-error"))?.focus();
  }, [state]);

  // Submit manually so React 19 doesn't clear the form when there's an error. The pressed button picks publish or draft.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    setIntent(data.get("intent") === "draft" ? "draft" : "publish");
    startTransition(() => action(data));
  };

  const updateRole = (key: number, patch: Partial<RoleRow>) => setRoles((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRole = () => {
    setRoles((rs) => (rs.length >= MAX_ROLES ? rs : [...rs, { key: nextKey.current++, category: "", need: "", hours: "" }]));
  };
  const removeRole = (key: number) => {
    setRoles((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
    setRolesChangedSince(state);
  };

  const first = roles[0];
  const firstHours = Number(first?.hours);

  return (
    <div className="split">
      <form ref={formRef} action={action} onSubmit={onSubmit} noValidate aria-label="New project" className="card split-main post-form">
        {/* First submit button = what Enter presses. Enter saves a draft; publishing takes the real button. */}
        <button type="submit" name="intent" value="draft" hidden tabIndex={-1} disabled={pending}>
          Save draft
        </button>
        <section className="stack-md">
          <h2 className="display h3">The project</h2>
          <label className="field">
            <span>Project name</span>
            <input
              name="title"
              type="text"
              maxLength={80}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={invalid("title")}
              aria-describedby={describedBy("title")}
            />
          </label>
          {errorText("title")}
          <label className="field">
            <span>
              One-line pitch <span className="hint">Shown on the feed. Under 120 characters.</span>
            </span>
            <input
              name="pitch"
              type="text"
              maxLength={120}
              required
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              aria-invalid={invalid("pitch")}
              aria-describedby={describedBy("pitch")}
            />
          </label>
          {errorText("pitch")}
          <fieldset className="choice-set" aria-describedby={describedBy("stage")} data-invalid={invalid("stage")}>
            <legend>How far along is it?</legend>
            <div className="row-wrap">
              {STAGES.map((s) => (
                <label key={s} className="choice">
                  <input type="radio" name="stage" value={s} defaultChecked={s === "prototype"} />
                  {STAGE_LABEL[s]}
                </label>
              ))}
            </div>
          </fieldset>
          {errorText("stage")}
          <label className="field">
            <span>What it does and why</span>
            <textarea name="description" rows={4} maxLength={4000} aria-invalid={invalid("description")} aria-describedby={describedBy("description")} />
          </label>
          {errorText("description")}
          <div className="field-grid">
            <div className="stack-sm">
              <label className="field">
                <span>
                  Prototype link <span className="hint">Optional</span>
                </span>
                <input name="prototypeUrl" type="url" placeholder="https://" aria-invalid={invalid("prototypeUrl")} aria-describedby={describedBy("prototypeUrl")} />
              </label>
              {errorText("prototypeUrl")}
            </div>
            <div className="stack-sm">
              <label className="field">
                <span>
                  Code repo <span className="hint">Optional</span>
                </span>
                <input name="repoUrl" type="url" placeholder="https://github.com/…" aria-invalid={invalid("repoUrl")} aria-describedby={describedBy("repoUrl")} />
              </label>
              {errorText("repoUrl")}
            </div>
          </div>
        </section>

        <section className="stack-md post-section">
          <div className="stack-xs">
            <h2 className="display h3">Roles you need</h2>
            <p className="small muted">One row per role. Say exactly what&apos;s needed and roughly how long it takes.</p>
          </div>
          {roles.map((r, i) => (
            <fieldset key={r.key} className="role-row">
              <legend className="sr-only">Role {i + 1}</legend>
              <label className="field">
                <span>Role</span>
                <select
                  name="roleCategory"
                  value={r.category}
                  onChange={(e) => updateRole(r.key, { category: e.target.value as Category })}
                  aria-invalid={invalid(`roles.${i}.category`)}
                  aria-describedby={describedBy(`roles.${i}.category`)}
                >
                  {/* Not disabled: a disabled option is left out of the form data, which would shift later rows. */}
                  <option value="">Pick one</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field role-row-need">
                <span>What&apos;s needed</span>
                <input
                  name="roleNeed"
                  type="text"
                  maxLength={200}
                  placeholder={PLACEHOLDERS[i % PLACEHOLDERS.length]}
                  value={r.need}
                  onChange={(e) => updateRole(r.key, { need: e.target.value })}
                  aria-invalid={invalid(`roles.${i}.need`)}
                  aria-describedby={describedBy(`roles.${i}.need`)}
                />
              </label>
              <label className="field">
                <span>Hours (est.)</span>
                <input
                  name="roleHours"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={40}
                  value={r.hours}
                  onChange={(e) => updateRole(r.key, { hours: e.target.value })}
                  aria-invalid={invalid(`roles.${i}.hours`)}
                  aria-describedby={describedBy(`roles.${i}.hours`)}
                />
              </label>
              <div className="role-row-foot">
                {errorText(`roles.${i}.category`)}
                {errorText(`roles.${i}.need`)}
                {errorText(`roles.${i}.hours`)}
                {roles.length > 1 ? (
                  <button type="button" className="link-button" onClick={() => removeRole(r.key)}>
                    Remove role<span className="sr-only"> {i + 1}</span>
                  </button>
                ) : null}
              </div>
            </fieldset>
          ))}
          {errorText("roles")}
          {roles.length < MAX_ROLES ? (
            <button type="button" className="btn btn-sm glass add-role" onClick={addRole}>
              + Add another role
            </button>
          ) : (
            <p className="small muted">That&apos;s the most roles per project. Split bigger jobs into another project.</p>
          )}
        </section>

        <section className="stack-md post-section">
          {state.status === "error" && (!state.fieldErrors || Object.keys(state.fieldErrors).some((k) => err(k))) ? (
            <p id="post-error" role="alert" tabIndex={-1} className="error-text">
              {state.message}
            </p>
          ) : null}
          <div className="row-wrap">
            <button type="submit" name="intent" value="publish" className="btn glass-dark" disabled={pending}>
              {pending && intent === "publish" ? "Publishing…" : "Publish project"}
            </button>
            <button type="submit" name="intent" value="draft" className="btn btn-outline" disabled={pending}>
              {pending && intent === "draft" ? "Saving…" : "Save draft"}
            </button>
          </div>
          <p className="small muted">Drafts are only visible to you. Publish from the project page when you&apos;re ready.</p>
        </section>
      </form>

      <aside className="split-side stack-md">
        <section className="tip-card stack-sm">
          <h2 className="display h4">Asks that get answered</h2>
          <ul className="tip-list">
            <li>One role, one deliverable. &ldquo;3 onboarding screens&rdquo;, not &ldquo;help with design&rdquo;.</li>
            <li>Under 10 hours. Bigger jobs can be split into two roles.</li>
            <li>Show what exists. A link to the prototype or repo doubles replies.</li>
          </ul>
        </section>
        <section className="card stack-sm" aria-label="Preview on the feed">
          <p className="label muted">Preview on the feed</p>
          <p className="display h4 preview-text">{title.trim() || "Your project name"}</p>
          <p className="small muted preview-text">{pitch.trim() || "Your one-line pitch."}</p>
          <RoleTag
            role={first?.category ? CATEGORY_LABEL[first.category] : "Role"}
            scope={Number.isInteger(firstHours) && firstHours > 0 ? `~${firstHours} ${firstHours === 1 ? "hr" : "hrs"}` : "~? hrs"}
          />
        </section>
      </aside>
    </div>
  );
}
