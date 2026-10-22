-- Example data for development: three students, three published projects, five open roles.
-- DEV ONLY. The people and projects are made up; never run this against production.
--
-- Paste into Supabase → SQL Editor → Run (it runs as the database owner, so RLS doesn't apply).
-- `supabase db reset` also runs it locally. Safe to run twice: fixed ids + `on conflict do nothing`.
-- To remove everything it added, run the cleanup block at the bottom.

begin;

-- Example users. The on_auth_user_created trigger creates their profiles. They have no password or
-- identity, so nobody signs in as them. The empty-string token columns keep the Supabase dashboard's user list working.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, '', now(),
       '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()
from (values
  ('5eed0000-0000-4000-8000-000000000001'::uuid, 'pickup-example-1@tufts.edu'),
  ('5eed0000-0000-4000-8000-000000000002'::uuid, 'pickup-example-2@tufts.edu'),
  ('5eed0000-0000-4000-8000-000000000003'::uuid, 'pickup-example-3@tufts.edu')
) as u (id, email)
on conflict (id) do nothing;

update public.profiles p
set full_name = v.full_name, major = v.major, class_year = v.class_year, skills = v.skills::public.role_category[]
from (values
  ('5eed0000-0000-4000-8000-000000000001'::uuid, 'Jamie Lee',    'Computer Science', '2028', '{frontend}'),
  ('5eed0000-0000-4000-8000-000000000002'::uuid, 'Priya Kapoor', 'Computer Science', '2027', '{design,frontend}'),
  ('5eed0000-0000-4000-8000-000000000003'::uuid, 'Sam Okafor',   'Biology',          '2028', '{data}')
) as v (id, full_name, major, class_year, skills)
where p.id = v.id;

insert into public.projects (id, owner_id, title, pitch, description, stage, status, created_at)
values
  ('5eed0000-0000-4000-8000-0000000000a1', '5eed0000-0000-4000-8000-000000000001',
   'Dewick wait-time tracker',
   'Shows live line length at the dining halls. Built with Cursor; the screens need a real designer.',
   'Students tap when they join and leave the line, and the app estimates the wait at Dewick and Carm.',
   'prototype', 'published', now() - interval '1 day'),
  ('5eed0000-0000-4000-8000-0000000000a2', '5eed0000-0000-4000-8000-000000000002',
   'CS 15 study-group matcher',
   'Pairs people by section and free time. Front end is done; sign-in and storage are not.',
   '', 'mockup', 'published', now() - interval '3 days'),
  ('5eed0000-0000-4000-8000-0000000000a3', '5eed0000-0000-4000-8000-000000000003',
   'Wet-lab protocol timer',
   'Step timers for bench work, with a semester of usage logs. Which steps do people skip?',
   '', 'prototype', 'published', now() - interval '6 days')
on conflict (id) do nothing;

insert into public.roles (id, project_id, category, need, hours, created_at)
values
  ('5eed0000-0000-4000-8000-0000000000b1', '5eed0000-0000-4000-8000-0000000000a1', 'design',  '3 screens',         5, now() - interval '1 day'),
  ('5eed0000-0000-4000-8000-0000000000b2', '5eed0000-0000-4000-8000-0000000000a1', 'writing', 'Landing page copy', 2, now() - interval '1 day'),
  ('5eed0000-0000-4000-8000-0000000000b3', '5eed0000-0000-4000-8000-0000000000a2', 'backend', 'Auth + database',   8, now() - interval '3 days'),
  ('5eed0000-0000-4000-8000-0000000000b4', '5eed0000-0000-4000-8000-0000000000a2', 'testing', 'Five interviews',   3, now() - interval '3 days'),
  ('5eed0000-0000-4000-8000-0000000000b5', '5eed0000-0000-4000-8000-0000000000a3', 'data',    'One analysis',      4, now() - interval '6 days')
on conflict (id) do nothing;

commit;

-- ---------------------------------------------------------------------------
-- Cleanup: deletes the example users; profiles, projects, roles, offers and messages cascade.
-- ---------------------------------------------------------------------------
-- delete from auth.users where id in (
--   '5eed0000-0000-4000-8000-000000000001',
--   '5eed0000-0000-4000-8000-000000000002',
--   '5eed0000-0000-4000-8000-000000000003'
-- );
