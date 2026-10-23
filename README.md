# Project Pickup

[![CI](https://github.com/ben-silv/pickup/actions/workflows/ci.yml/badge.svg)](https://github.com/ben-silv/pickup/actions/workflows/ci.yml)

Project Pickup is a Tufts-only app where students post app and website projects and ask classmates for one scoped role ("UI/UX design · 3 screens · ~5 hrs"). Helpers send an offer, the owner accepts or declines, they chat, and when the work ships the owner leaves a credit note that shows up on the helper's profile.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Supabase (Postgres, Auth, Realtime) · Row Level Security · Zod · Vitest · Playwright · GitHub Actions · Vercel

## Architecture

```
Browser ──▶ Next.js middleware (refreshes session, guards /browse /post /messages /profile)
   │
   ├─ Server Components ──▶ Supabase as the signed-in user ──▶ Postgres + Row Level Security
   ├─ Server Actions (Zod-validated) ──▶ inserts / rpc(accept_offer, complete_role, …)
   └─ Client Components ──▶ Supabase Realtime (new messages)
```

Decisions worth knowing:

- **The database is the security boundary.** Every table has RLS and there is no service-role key in the app, so every query runs as the user. Offers and messages are visible only to the helper and the project owner; drafts only to their owner; signed-out visitors see nothing.
- **Workflow rules live in Postgres functions.** Accepting an offer, declining the others and putting the role in progress happen in one `SECURITY DEFINER` function that checks the caller. Users have no UPDATE permission on those columns, so the rules can't be skipped.
- **Tufts-only, enforced twice.** The sign-in form rejects non-Tufts emails, and a trigger on `auth.users` refuses to create the account anyway.
- **Sign-up confirms the Tufts address first:** a one-time email link (PKCE), then the student sets a password on the welcome step. Returning users sign in with email and password, with a password-reset flow. Redirects after sign-in are restricted to same-site paths to prevent open redirects.
- **Tested at three levels:** unit tests for validation and sign-in logic, database tests that run the real migrations on Postgres and act as different users, and Playwright on desktop and phone.

```
src/app/            pages: landing, sign-in, auth callback, (app)/browse|post|messages|profile
src/components/     landing sections, app shell, shared pieces
src/lib/            schemas (Zod), vocab, auth logic, Supabase clients
supabase/migrations database schema, access rules, workflow functions
tests/unit · tests/db · tests/e2e
design/             approved screens from Claude Design (the spec for Phase 2)
```

## Run it locally

Requires Node 20.9+ (or the Docker command below).

```bash
npm install
cp .env.example .env.local      # then fill in the two Supabase values
npm run dev                     # http://localhost:3000
```

With Docker on Windows, from the project folder:

```
docker run -it --rm -v "%cd%":/app -v /app/node_modules -w /app -p 3000:3000 -e WATCHPACK_POLLING=true node:22 bash
npm install && npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run check` | Lint + typecheck + unit tests |
| `npm run test:db` | Database access-rule tests (needs `DATABASE_URL`, see below) |
| `npm run test:e2e` | Builds the site and runs Playwright on desktop and phone |
| `npm run build` | Production build (shows bundle sizes) |

`npm run test:db` wipes and rebuilds the database it points at, so use a throwaway one:

```bash
docker run -d --name pickup-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run test:db
```

## Set up Supabase (about 15 minutes)

1. Create a free project at supabase.com.
2. **SQL Editor** → New query → paste `supabase/migrations/20261022000000_core_schema.sql` → Run.
3. **Project Settings → API**: copy the Project URL and the `anon` public key into `.env.local`.
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (change to your Vercel URL after deploying)
   - Redirect URLs: add `http://localhost:3000/auth/callback` and, later, `https://<your-site>/auth/callback`
5. **Authentication → Sign In / Providers → Email**: keep Email enabled and set the minimum password length to 8.
6. Supabase's built-in email sender is rate-limited (a few emails per hour), which is fine for testing. Before inviting people, add a custom SMTP sender under **Authentication → Emails → SMTP** (Resend has a free tier).

Then sign in at `/sign-in` with your @tufts.edu email.

## Deploy

Push to GitHub, import the repo in Vercel, add the two `NEXT_PUBLIC_SUPABASE_*` variables (and `NEXT_PUBLIC_SITE_URL`), deploy, then add the Vercel URL to Supabase's Site URL and Redirect URLs.

## Roadmap

- [x] Landing page, Tufts-only sign-in, schema with access rules, CI
- [ ] Browse open roles (`design/Feed.dc.html`)
- [ ] Project page with offers and credits (`design/Project.dc.html`)
- [ ] Post a project (`design/Post.dc.html`)
- [ ] Messages with live updates (`design/Messages.dc.html`)
- [ ] Profile editing and credits (`design/Profile.dc.html`)

## Working on this with Claude Code

`CLAUDE.md` holds the design system, architecture and code rules, plus a recipe for building each Phase 2 screen. Claude Code reads it at the start of every session.
