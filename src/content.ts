/** Landing page copy that renders as lists. Edit copy here, not in the components. */

export const heroChips = ["UI/UX design", "Frontend", "Backend", "Full project", "Data science", "ML", "iOS / Android", "Copywriting", "User testing"];

export const exampleFeed = [
  { title: "Dewick wait-time tracker", role: "UI/UX", scope: "~5 hrs" },
  { title: "CS 15 study-group matcher", role: "Backend", scope: "~8 hrs" },
  { title: "Wet-lab protocol timer", role: "Data science", scope: "~4 hrs" },
  { title: "Textbook swap board", role: "Copywriting", scope: "~2 hrs" },
];

export const steps = [
  { title: "Post the project", body: "An idea, a mockup or a half-built app. Say what it does and how far along it is." },
  { title: "Ask for one role", body: "Pick the skill you're missing and scope it: what's needed and roughly how many hours." },
  { title: "Build it, get credit", body: "Work together, ship it, and you both get a project page you can put on a resume." },
];

export const roleExamples = [
  { task: "Onboarding screens", role: "UI/UX design", hours: "~5 hrs" },
  { task: "Sign-in + database", role: "Backend", hours: "~8 hrs" },
  { task: "Which steps do users skip?", role: "Data science", hours: "~4 hrs" },
  { task: "Landing page copy", role: "Writing", hours: "~2 hrs" },
  { task: "TestFlight build", role: "Mobile", hours: "~6 hrs" },
  { task: "Five user interviews", role: "User testing", hours: "~3 hrs" },
  { task: "Build the first version", role: "Full project", hours: "~60 hrs" },
];

export const points = [
  { title: "Any size of ask", body: "A few hours on one piece, or someone to build the whole thing with you from scratch. Say which, and the right person says yes." },
  { title: "People you can meet", body: "Everyone is a verified student on the Hill, so you can grab a table at Tisch instead of chasing strangers." },
  { title: "Credit that counts", body: "Every contribution is logged on the project page, with a note from the person you helped." },
];

export const faqs = [
  { q: "Who can join?", a: "Any current Tufts student with a @tufts.edu email, undergrad or grad, any major. Designers, writers and pre-meds with a good idea are as welcome as CS majors." },
  { q: "Does anyone get paid?", a: "No. Project Pickup is for side projects and learning. You trade your time for credit, portfolio work and a teammate." },
  { q: "Can I find someone to build a whole project with?", a: "Yes. Post your idea and pick the \"Full project\" role to look for a full-stack partner who builds it with you from scratch. Or ask for one piece, like design or a backend, and keep it small." },
  { q: "Who owns the project?", a: "The person who posts it. Before you start, agree in writing on what the helper gets credit for and what happens if the project turns into a business." },
  { q: "How do I sign up?", a: "Enter your Tufts email and we send a link to confirm it. Then pick a password and fill in your name, year and major. After that, sign in with your email and password." },
];

/** Example posts the hero card stack shuffles through. Illustrations, not real students. */
export const heroPosts = [
  {
    initials: "JL",
    tone: "avatar-sky",
    person: "Jamie L. · CS '28",
    stage: "Prototype live",
    title: "Dewick wait-time tracker",
    blurb: "Built with Cursor. Shows live line length at the dining halls. The screens need a real designer.",
    role: "UI/UX designer",
    scope: "3 screens · ~5 hrs",
  },
  {
    initials: "PK",
    tone: "avatar-navy",
    person: "Priya K. · CS '27",
    stage: "Mockup",
    title: "CS 15 study-group matcher",
    blurb: "Pairs people by section and free time. The front end is done; sign-in and storage are not.",
    role: "Backend dev",
    scope: "auth + database · ~8 hrs",
  },
  {
    initials: "SO",
    tone: "avatar-blue",
    person: "Sam O. · Biology '28",
    stage: "Prototype",
    title: "Wet-lab protocol timer",
    blurb: "Step timers for bench work, with a semester of usage logs. Which steps do people skip?",
    role: "Data scientist",
    scope: "one analysis · ~4 hrs",
  },
] as const;

/** Where people reach the team (privacy requests, account deletion). Set up forwarding for this address before launch. */
export const CONTACT_EMAIL = "hello@projpickup.com";

/** Shown on /privacy. Update the date whenever the text changes. */
export const PRIVACY_UPDATED = "October 23, 2026";
