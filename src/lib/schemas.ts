import { z } from "zod";
import { CATEGORIES, CLASS_YEARS, STAGES, TUFTS_EMAIL } from "./vocab";
import { FEED_SORTS, sanitizeSearch } from "./feed";

/**
 * Input validation for everything users submit. Mirrors the CHECK constraints in
 * supabase/migrations — change both together.
 */
const trimmed = (min: number, max: number, tooShort: string, tooLong: string) =>
  z.string().trim().min(min, tooShort).max(max, tooLong);

const optionalUrl = z
  .string()
  .trim()
  .transform((s) => s || null)
  .refine((s) => s === null || /^https?:\/\//.test(s), "Links start with http:// or https://");

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().regex(TUFTS_EMAIL, "Use your @tufts.edu email."),
});

export const roleInputSchema = z.object({
  category: z.enum(CATEGORIES, { error: "Pick a role." }),
  need: trimmed(5, 200, "Say what's needed in a few words.", "Keep it under 200 characters."),
  hours: z.coerce.number().int("Use whole hours.").min(1, "At least 1 hour.").max(40, "Keep it under 40 hours. Split bigger jobs into two roles."),
});

export const projectInputSchema = z.object({
  title: trimmed(3, 80, "Give it a name (3+ characters).", "Keep the name under 80 characters."),
  pitch: trimmed(10, 120, "Write a one-line pitch (10+ characters).", "Keep the pitch under 120 characters."),
  description: z.string().trim().max(4000, "Keep the description under 4,000 characters."),
  stage: z.enum(STAGES, { error: "Pick how far along it is." }),
  prototypeUrl: optionalUrl,
  repoUrl: optionalUrl,
  roles: z.array(roleInputSchema).min(1, "Add at least one role.").max(5, "Up to 5 roles per project."),
});

/** Which button submitted the post form. */
export const postIntentSchema = z.enum(["publish", "draft"]).catch("draft");

export const offerInputSchema = z.object({
  roleId: z.uuid(),
  note: trimmed(10, 600, "Say why you're a good fit (10+ characters).", "Keep it under 600 characters."),
});

export const messageInputSchema = z.object({
  offerId: z.uuid(),
  body: trimmed(1, 2000, "Write a message first.", "Keep messages under 2,000 characters."),
});

/** Owner marks a role filled and leaves a credit note (complete_role). Limits match the credits table. */
export const completeRoleInputSchema = z.object({
  roleId: z.uuid(),
  offerId: z.uuid(),
  hours: z.coerce.number().int("Use whole hours.").min(1, "At least 1 hour.").max(80, "Up to 80 hours."),
  note: trimmed(1, 400, "Write a short credit note.", "Keep the note under 400 characters."),
});

export const profileInputSchema = z.object({
  fullName: z.string().trim().max(80, "Keep your name under 80 characters."),
  classYear: z.enum(CLASS_YEARS, { error: "Pick a class year." }).nullable(),
  major: z.string().trim().max(80, "Keep your major under 80 characters.").transform((s) => s || null),
  bio: z.string().trim().max(400, "Keep your bio under 400 characters.").transform((s) => s || null),
  skills: z.array(z.enum(CATEGORIES)).max(CATEGORIES.length),
  openToRequests: z.boolean(),
  hoursPerWeek: z.coerce.number().int("Use whole hours.").min(1, "At least 1 hour a week.").max(40, "Up to 40 hours a week.").nullable(),
  githubUrl: z
    .string()
    .trim()
    .transform((s) => s || null)
    .refine((s) => s === null || s.startsWith("https://"), "Use the full https:// link."),
});

/** Browse page search params. Anything unexpected falls back to the default instead of erroring. */
const firstParam = (v: unknown) => (Array.isArray(v) ? v[0] : v);
export const feedQuerySchema = z.object({
  skill: z.preprocess(firstParam, z.enum(CATEGORIES).nullable().catch(null)),
  q: z.preprocess(firstParam, z.string().catch("").transform(sanitizeSearch)),
  sort: z.preprocess(firstParam, z.enum(FEED_SORTS).catch("newest")),
});

export const projectIdSchema = z.uuid();
export const offerIdSchema = z.uuid();
export const personIdSchema = z.uuid();

/** Owner's Publish / Unpublish button. Archiving isn't offered in the app. */
export const projectStatusInputSchema = z.object({ projectId: z.uuid(), status: z.enum(["draft", "published"]) });

export type FeedQuery = z.output<typeof feedQuerySchema>;
export type ProjectInput = z.output<typeof projectInputSchema>;
export type RoleInput = z.output<typeof roleInputSchema>;
export type OfferInput = z.output<typeof offerInputSchema>;
export type MessageInput = z.output<typeof messageInputSchema>;
export type ProfileInput = z.output<typeof profileInputSchema>;
