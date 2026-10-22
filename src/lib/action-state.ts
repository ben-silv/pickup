/** Result of a Server Action, for `useActionState`. No imports, so client components can use it. */
export type ActionState =
  | { status: "idle" }
  | { status: "done"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const idleState: ActionState = { status: "idle" };
