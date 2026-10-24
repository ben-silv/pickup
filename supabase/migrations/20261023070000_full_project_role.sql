-- A "Full project" role: someone to build a whole app or site with you (full stack), not just one piece.
-- Regular roles stay small (up to 40 hours); a full-project role can be estimated at up to 120.
-- Credits ("hours it took") go up to 300 so a finished full project can be logged.
-- Keep in sync with CATEGORIES, ROLE_MAX_HOURS and FULL_PROJECT_MAX_HOURS in src/lib/vocab.ts.

alter type public.role_category add value if not exists 'fullstack' after 'mobile';

-- Compares as text so this file can add the enum value and use it in one go.
alter table public.roles drop constraint roles_hours_check;
alter table public.roles add constraint roles_hours_check
  check (hours between 1 and (case when category::text = 'fullstack' then 120 else 40 end));

alter table public.credits drop constraint credits_hours_check;
alter table public.credits add constraint credits_hours_check check (hours between 1 and 300);
