/** Result of the sign-in action. No imports, so the client form can use it without pulling in Zod. */
export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

export const initialSignInState: SignInState = { status: "idle" };
