/** Post-a-project helpers. Plain functions with no dependencies, so the client form can use them too. */

export const MAX_ROLES = 5;

type FormLike = { get(name: string): unknown; getAll(name: string): unknown[] };
const text = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Reads the post form into the shape `projectInputSchema` expects. Role rows arrive as parallel lists
 * (roleCategory / roleNeed / roleHours, one entry per row), so adding and removing rows needs no renumbering.
 */
export function projectFormValues(form: FormLike) {
  const categories = form.getAll("roleCategory").map(text);
  const needs = form.getAll("roleNeed").map(text);
  const hours = form.getAll("roleHours").map(text);
  const count = Math.max(categories.length, needs.length, hours.length);
  return {
    title: text(form.get("title")),
    pitch: text(form.get("pitch")),
    description: text(form.get("description")),
    stage: text(form.get("stage")),
    prototypeUrl: text(form.get("prototypeUrl")),
    repoUrl: text(form.get("repoUrl")),
    roles: Array.from({ length: count }, (_, i) => ({ category: categories[i] ?? "", need: needs[i] ?? "", hours: hours[i] ?? "" })),
  };
}
