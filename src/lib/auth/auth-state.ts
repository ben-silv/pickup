/** Result of the password sign-in actions. No imports, so client forms can use it without pulling in Zod. */
export type AuthState =
  | { status: "idle" }
  | { status: "sent"; email: string; kind: "confirm" | "reset" }
  | { status: "error"; message: string; field?: "email" | "password" };

export const initialAuthState: AuthState = { status: "idle" };
