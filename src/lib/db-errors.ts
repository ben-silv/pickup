/** Turns a Supabase/PostgREST error into something a student can read. The raw error is logged by the caller. */
export type DbError = { code?: string | null; message?: string | null };

/** Error codes our own SQL functions raise with plain-English messages written for users. */
const OWN_CODES = new Set(["P0002", "22023", "42501"]);
/** Postgres wording that must never reach the page. */
const RAW_WORDING = /row-level security|permission denied|violates|relation|column|syntax|function/i;

export function friendlyDbError(error: DbError, fallback: string, byCode: Partial<Record<string, string>> = {}): string {
  const code = error.code ?? "";
  const override = byCode[code];
  if (override) return override;
  const message = error.message?.trim() ?? "";
  if (OWN_CODES.has(code) && message && !RAW_WORDING.test(message)) return message;
  if (code === "23514" || code === "22001") return "Something is too long or too short. Check the fields and try again.";
  if (code === "PGRST301" || code === "401") return "Your session expired. Sign in again.";
  return fallback;
}
