# Project Pickup — project rules

Claude reads this file at the start of every session in this folder. Follow it over your own defaults. If a request conflicts with it, say so before doing anything.

## What this is
The product name is **Project Pickup** (plain "Pickup" read like pickup sports). Use the full name in titles, the logo and copy; code, folders and the repo stay `pickup`.
Project Pickup is a Tufts-only app where students post app/website projects and ask classmates for one scoped role ("UI/UX design · 3 screens · ~5 hrs"). Helpers send an offer, the owner accepts or declines, they chat, and when the work is done the owner marks the role filled and leaves a credit note. Audience: Tufts students, mostly on phones.

Approved screens live in `design/` (see `design/README.md`). They are the spec for layout and copy.

## Stack (don't change without asking)
- **Next.js 15 (App Router) + React 19 + TypeScript (strict).** Server Components by default; `"use client"` only for state, effects or browser APIs.
- **Server Actions** for mutations. No API routes unless something outside the site calls them (the only route is `/auth/callback`).
- **Supabase**: Postgres + Auth (Tufts only: new accounts confirm their email with a one-time link, then set a password on the welcome step; returning users sign in with email + password) + Realtime for messages. Accessed with `@supabase/ssr`:
  - `src/lib/supabase/server.ts` in Server Components/Actions (acts as the signed-in user, so RLS applies)
  - `src/lib/supabase/browser.ts` in Client Components (realtime only)
  - `src/middleware.ts` refreshes the session and guards app pages.
  - **No service-role key in the app.** Every query runs as the user; the database decides what they can see.
- **Zod** validates every input in `src/lib/schemas.ts`. The migration enforces the same limits with CHECK constraints.
- **Plain CSS** with tokens and classes in `src/app/globals.css`. No Tailwind, no CSS-in-JS, no UI kits.
- Fonts self-hosted with `@fontsource-variable` (imported in `src/app/layout.tsx`).
- **Vitest** (unit + database), **Playwright** (end-to-end, desktop + phone), **ESLint**, **GitHub Actions** CI.

## Project map
```
src/app/page.tsx              landing page (public)
src/app/sign-in/              sign in (email + password) and forgot password
src/app/sign-up/              create an account: email → confirmation link → /welcome (basics + password)
src/app/auth/confirm/         where email links land: a button spends the one-time token (scanners only open links), then /welcome or onward
src/app/auth/callback/        older links: exchanges the code for a session, then sends unfinished accounts to /welcome
src/app/reset-password/       set a new password (reset emails and the account menu land here)
src/app/privacy/              plain-language privacy note (keep it true to what the app does; bump PRIVACY_UPDATED in src/content.ts)
src/app/(app)/                signed-in app: layout (auth backstop + nav), browse, post, messages, profile
src/components/landing/       landing sections
src/components/app/           AppNav, PageBand, ComingNext (delete ComingNext from a page once it's built)
src/components/               Logo, RoleTag (signature element), Elephant, Analytics
src/content.ts                landing copy lists
src/lib/vocab.ts              enums shared with Postgres (stages, categories, class years) + labels
src/lib/schemas.ts            Zod input schemas
src/lib/auth/                 sign-in, sign-up and password logic (pure, tested), safe redirect paths
src/lib/supabase/             clients
supabase/migrations/          timestamped SQL; never edit an applied migration, add a new one
tests/unit, tests/db, tests/e2e
design/                       approved screens from Claude Design
.claude/agents/reviewer.md    independent reviewer subagent (see Workflow)
.claude/hooks/                Stop hook that runs `npm run check` before a turn ends
```

## Data model and security
Tables: `profiles` (1 per auth user, created by trigger, Tufts emails only), `projects` (draft/published/archived), `roles` (open → in_progress → filled, or closed), `offers` (pending → accepted/declined/withdrawn → pending again via resend, one per helper per role), `messages` (one thread per offer), `credits` (one per filled role). View: `open_roles` (the feed).

- Every table has RLS; the anon key reads nothing. Signed-in users see published projects, all profiles and credits; offers and messages only if they're the helper or the project owner.
- Multi-row state changes go through SECURITY DEFINER functions, called with `supabase.rpc(...)`:
  `accept_offer(p_offer)`, `decline_offer(p_offer)`, `withdraw_offer(p_offer)`, `resend_offer(p_offer, p_note)`, `complete_role(p_role, p_hours, p_note)`.
  `resend_offer` reopens a withdrawn offer: 1-hour cooldown, at most 2 resends per role (constants mirrored in `src/lib/project.ts`).
  Messages: a trigger caps a helper at 5 messages on a pending offer until the owner replies or accepts (`UNANSWERED_LIMIT` in `src/lib/messages.ts`).
  Safety: `report_conversation(p_offer, p_reason, p_details)` writes `reports` (reviewed by the admin in the Supabase dashboard); `block_in_conversation` / `unblock_in_conversation` manage `blocks`. A block (either way) stops messages via a restrictive policy and offers via `can_offer_on`; `blocked_between` stays private so nobody can probe who blocked whom.
  Unread: `thread_reads` remembers when each person last opened a conversation; `unread_offer_ids()` drives the red dot, `mark_thread_read(p_offer)` clears it (called when a conversation opens).
  Example project: `projects.is_example` (set only in the SQL Editor) is labelled everywhere, never takes offers (`can_offer_on`), and drops out of `open_roles` once 3 real projects are published.
  Account deletion: `delete_my_account()` deletes only the caller's auth user; everything they made cascades (Edit profile → Delete account → /goodbye).
  Role sizes: every role is up to 40 hours except `fullstack` ("Full project": someone to build the whole thing with you), up to 120 (`roles_hours_check`, mirrored by `maxHoursFor` in `src/lib/vocab.ts`). Credits log up to 300 hours.
  Never add an UPDATE policy that would let users skip these.
- Changing the schema = new migration + matching Zod change + a test in `tests/db/access-rules.test.ts` for any new rule.

## Design system
Final direction from the Claude Design canvas: calm, roomy pages (Dirtywave) with a few loud, rounded, colorful moments (Work Louder), in Tufts colors.

### Color (tokens in `globals.css`; never hardcode hex in components)
| Token | Hex | Use |
|---|---|---|
| `--tufts-blue` | `#3E8EDE` | **Ground**: hero, page bands, the one big block per page |
| `--navy` | `#002E6D` | Jumbo Blue. Text, buttons (glass-dark), avatars, dark tiles, footer |
| `--sky` | `#CFE2F6` | Light-blue pop: headline highlight, stage tags, decorative circles |
| `--sky-soft` | `#E3EEFA` | Role tags |
| `--cream` | `#F2EDE7` | Candle White: alternate sections, step cards |
| `--paper` | `#F7F5F2` | App background |
| `--green` | `#98D5C7` | Aurora Green. **Success states only**: shipped, live, filled, accepted, available. Never decoration, never large areas |
| `--muted` | `#45577A` | Secondary text |
| `--brown` | `#63493A` | Tiny accents only |

- No yellow or orange.
- Red (`--error`) only for errors, the small unread dot on Messages, and destructive actions (Delete account and its confirm pop-up).
- **Contrast on Tufts Blue:** white text only if bold ≥19px or regular ≥24px. Small labels on blue sit in a navy pill. Never Tufts Blue text on white under 24px.
- Single light theme by design. No dark mode.

### Type
- Display: **Playfair Display** 600 (`.display`), tight (-0.01em), short headlines. Stand-in for Tufts' IvyMode.
- Body: **Montserrat** 400/600/700, 15–19px, lines ≤ 65 characters. Stand-in for Proxima Nova.
- Labels: **Archivo** condensed 700 uppercase, 0.07em tracking (`.label`). Stand-in for Americane.
- No other typefaces.

### Shape, glass, motion
- Radii: tiles 36px, cards 28px, form inputs 16px, buttons/tags/nav fully pill-shaped. Search boxes and selects in filter bars are pill-shaped too (as in the designs).
- **Liquid glass** (`.glass` light, `.glass-dark` navy): the menu, all primary buttons, chips and the sign-in card. Don't invent new glass variants; don't put glass on plain white areas where it can't be seen.
- Depth from color blocks; cards get at most the one soft shadow in `.card`.
- Hover changes shade, never position: `.btn.glass-dark` gets a bit darker, `.btn.glass` a bit brighter, `.btn-outline` gets a paper fill (all in `globals.css`). Nothing lifts or scales.
- **Elephant pattern** (`BandPattern`): faint white elephants and logo dots on every Tufts Blue area (page bands by default, the home hero, the campus block, the sign-in pages). Text sitting directly on the pattern never says "Tufts" (use "on the Hill"); text inside a white card on top of it may.
- Two signature animations, and only these two: the **glass light** (`GlassLight` moves a soft highlight under the mouse on `.glass`/`.glass-dark`), and the **hero post stack** (`HeroStack` shuffles example posts every 4.5s, pauses on hover/focus, has a Next button). Don't add more motion without asking.
- State transitions (not decoration) are fine: the menu bar docks flush to the top once the page scrolls (`ScrollState` sets `data-scrolled` on `<html>`).
- Respect `prefers-reduced-motion`: both animations and all transitions switch off.

### Components to reuse
`Logo`, `RoleTag` (light-blue role pill + hours: use it wherever a role appears), `Elephant` (original art, never next to the word "Tufts"), `PageBand` (blue header on app pages with the elephant pattern; content below uses `.overlap`), `.card`, `.field`, `.btn` + `.glass-dark`, `.badge-success`, `.avatar-*`, `.pill-*`.

### Tufts identity
- **Never** use the Tufts logo, seal, wordmark or Jumbo artwork (needs written permission; student groups can't use the logo at all). Don't combine "Tufts" with an elephant or any Tufts mark.
- OK: Tufts colors, plain-text mentions, campus place names (Tisch, Dewick, the Hill), the original `Elephant`.
- Footer keeps "Not affiliated with or endorsed by Tufts University."

### Images
- Real photos of students working, project screenshots. Never stock photos, AI photos of people, or official Tufts photography.
- `next/image` from `public/`, meaningful `alt`, files under 200KB. Until a photo exists, keep the labelled placeholder tile.

### Copy
- Short, warm, student voice. No emoji. Buttons say exactly what happens ("Send offer", "Email me a sign-in link").
- Example people/projects in mockups are marked as examples.

## Code rules
- Semantic HTML (nav, main, section, article, form, fieldset, label, button). Every input has a label. Interactive things are real `<button>`/`<a>`.
- Mobile-first CSS; check 375px and 1280px. Grid/flex with `gap`; give text-holding flex children `min-width: 0`.
- TypeScript strict; no `any`, no `@ts-ignore`. Input types come from Zod (`z.output`).
- Business logic in `src/lib` as plain functions with dependencies passed in (see `requestSignInLink(input, deps)`), so it's unit-testable without Supabase.
- Server Actions: parse with Zod → call Supabase as the user → return a typed state object (`{ status, message }`) for `useActionState`. Map database errors to plain-English messages; log the raw error server-side.
- Forms: submit through `onSubmit` + `startTransition(() => action(formData))` so React 19 doesn't wipe fields on error (see `SignInForm`).
- Client bundle: never import `zod`, `@/lib/schemas`, `@/lib/auth/sign-in` or `@/lib/supabase/server` into a client component. `@/lib/vocab`, `@/lib/feed` and `*-state.ts` files are fine (plain functions, no dependencies).
- Secrets in env vars only. The app needs just `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both public by design).
- Every bug fix gets a test that would have caught it. No new dependencies without saying why.

## Building a Phase 2 screen (recipe)
1. Read the screen in `design/`, then plan: data needed, queries, actions, components. Show the plan before coding.
2. Queries in the page (Server Component) with `createClient()` from `@/lib/supabase/server`. Use `open_roles` for the feed.
3. Mutations as Server Actions next to the page, validated with the schema in `src/lib/schemas.ts`; state changes via `supabase.rpc(...)`.
4. Interactive bits (filters, accept/decline buttons, chat composer) as small client components; realtime chat subscribes to `messages` inserts for the current `offer_id` with the browser client.
5. Remove the page's `ComingNext` block. Add unit tests for any new pure logic and an e2e test for the signed-out behaviour.

## Workflow (every task)
1. **Plan first** for anything bigger than a one-line fix: show the plan and wait for approval, unless the human said to run on autopilot.
2. **Build** following the rules above.
3. **Check**: `npm run check` must pass. The Stop hook runs it automatically and sends failures back to you; fix them rather than stopping.
4. **Review**: hand the finished work to the `reviewer` subagent ("Use the reviewer subagent to review the uncommitted changes"). Fix every "Must fix" item, then run the reviewer again. Repeat until it returns `VERDICT: APPROVE` (at most 3 rounds; if it still isn't approved, stop and explain what's blocking).
5. **Commit** with a short message describing the user-facing change (`git add -A && git commit -m "..."`). Never push; the human pushes.
6. **Report** in 3–6 lines: what changed, the reviewer's verdict, test results, anything the human must do by hand (e.g. run a SQL file in Supabase), and any rule from this file you bent and why.

**Autopilot.** When the human says "autopilot" (or asks you to build several screens in a row), skip waiting for plan approval: write the plan into your notes, build, check, review, commit, and move to the next screen. Stop and ask only for decisions that can't be undone or that change the data model in a way the design doesn't cover.

## Commands
`npm run dev` · `npm run check` (lint + typecheck + unit) · `npm run test:db` (needs `DATABASE_URL` to a throwaway Postgres) · `npm run test:e2e` · `npm run build`

## Before finishing any change
1. `npm run check` passes.
2. UI changes: look at 375px and 1280px. No sideways scroll; contrast rules above hold.
3. Schema or action changes: `npm run test:db` and `npm run test:e2e` pass.
4. Say what you changed in 1–3 lines. If you broke a rule in this file, say which and why.
