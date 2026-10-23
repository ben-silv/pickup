/** Shared vocabulary. Matches the Postgres enums. No imports, so client components can use it freely. */
export const STAGES = ["idea", "mockup", "prototype", "live"] as const;
export const CATEGORIES = ["design", "frontend", "backend", "data", "ml", "mobile", "writing", "testing", "other"] as const;
export const CLASS_YEARS = ["2027", "2028", "2029", "2030", "Grad", "Other"] as const;
export const TUFTS_EMAIL = /^[^@\s]+@tufts\.edu$/i;

export type Stage = (typeof STAGES)[number];
export type Category = (typeof CATEGORIES)[number];

export const CLASS_YEAR_LABEL: Record<(typeof CLASS_YEARS)[number], string> = {
  "2027": "Class of 2027",
  "2028": "Class of 2028",
  "2029": "Class of 2029",
  "2030": "Class of 2030",
  Grad: "Grad student",
  Other: "Other",
};

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

/** Postgres enum report_reason. */
export const REPORT_REASONS = ["spam", "harassment", "inappropriate", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  spam: "Spam or a scam",
  harassment: "Harassment or threats",
  inappropriate: "Inappropriate or offensive",
  other: "Something else",
};

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type RoleStatus = (typeof ROLE_STATUSES)[number];
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/**
 * Tufts undergraduate majors for the profile dropdown, grouped as in the course catalog.
 * Sources: as.tufts.edu/academics/undergraduate-studies/majors-and-minors and the School of Engineering.
 * Stored as the label text in profiles.major (max 80 characters).
 */
export const MAJOR_GROUPS = [
  {
    label: "Arts and Sciences",
    majors: [
      "Africana Studies", "American Studies", "Ancient World Studies", "Anthropology", "Applied Mathematics",
      "Applied Physics", "Arabic", "Archaeology", "Architectural Studies", "Art", "Astrophysics", "Biochemistry",
      "Biology", "Biomedical Sciences", "Biopsychology", "Biotechnology", "Chemical Physics", "Chemistry",
      "Child Study and Human Development", "Chinese", "Civic Studies", "Classical Studies", "Clinical Psychology",
      "Cognitive and Brain Sciences", "Community Health", "Computer Science", "Economics", "Education",
      "Engineering Psychology / Human Factors Engineering", "English", "Environmental Geology",
      "Environmental Studies", "Film and Media Studies", "French", "Geological Sciences", "German", "Greek",
      "Greek and Latin", "History", "History of Art and Architecture", "Interdisciplinary Studies",
      "International Literary and Visual Studies", "International Relations", "Italian Studies", "Japanese",
      "Judaic Studies", "Latin", "Latin American Studies", "Mathematics", "Middle Eastern Studies", "Music",
      "Music, Sound, and Culture", "Philosophy", "Physics", "Political Science", "Psychology",
      "Quantitative Economics", "Race, Colonialism, and Diaspora Studies", "Religion", "Romance Studies",
      "Russian and Eastern European Studies", "Russian Language and Cultural Studies",
      "Science, Technology, and Society", "Sociology", "Spanish", "Theatre and Performance Studies",
      "Women's, Gender, and Sexuality Studies",
    ],
  },
  {
    label: "Engineering",
    majors: [
      "Biomedical Engineering", "Chemical Engineering", "Civil Engineering", "Computer Engineering", "Data Science",
      "Electrical Engineering", "Environmental Engineering", "Mechanical Engineering",
    ],
  },
  { label: "Other", majors: ["Undeclared", "Other / not listed"] },
] as const;

export const MAJORS = MAJOR_GROUPS.flatMap((g) => g.majors) as readonly string[];
