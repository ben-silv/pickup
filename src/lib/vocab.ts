/** Shared vocabulary. Matches the Postgres enums. No imports, so client components can use it freely. */
export const STAGES = ["idea", "mockup", "prototype", "live"] as const;
export const CATEGORIES = ["design", "frontend", "backend", "data", "ml", "mobile", "writing", "testing", "other"] as const;
export const CLASS_YEARS = ["2027", "2028", "2029", "2030", "Grad", "Other"] as const;
export const TUFTS_EMAIL = /^[^@\s]+@tufts\.edu$/i;

export type Stage = (typeof STAGES)[number];
export type Category = (typeof CATEGORIES)[number];

export const STAGE_LABEL: Record<Stage, string> = { idea: "Idea", mockup: "Mockup", prototype: "Prototype", live: "Live" };

export const CATEGORY_LABEL: Record<Category, string> = {
  design: "UI/UX design",
  frontend: "Frontend",
  backend: "Backend",
  data: "Data science",
  ml: "ML",
  mobile: "Mobile",
  writing: "Copywriting",
  testing: "User testing",
  other: "Other",
};

/** Short labels for the Browse filter chips. */
export const CATEGORY_CHIP_LABEL: Record<Category, string> = {
  design: "Design",
  frontend: "Frontend",
  backend: "Backend",
  data: "Data",
  ml: "ML",
  mobile: "Mobile",
  writing: "Writing",
  testing: "Testing",
  other: "Other",
};

export const PROJECT_STATUSES = ["draft", "published", "archived"] as const;
export const ROLE_STATUSES = ["open", "in_progress", "filled", "closed"] as const;
export const OFFER_STATUSES = ["pending", "accepted", "declined", "withdrawn"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type RoleStatus = (typeof ROLE_STATUSES)[number];
export type OfferStatus = (typeof OFFER_STATUSES)[number];
