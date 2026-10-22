/** Result of a Server Action, for `useActionState`. No imports, so client components can use it. */
export type ActionState =
  | { status: "idle" }
  | { status: "done"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const idleState: ActionState = { status: "idle" };

/** Validation issues → first message per field, keyed like "title" or "roles.0.need". */
export function fieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
