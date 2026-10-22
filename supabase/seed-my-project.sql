-- Owner-side test data: a published project owned by YOU, with 2 open roles, pending offers from the
-- example students in seed.sql, and a few messages. Use it to try Accept / Decline, chat and "Mark role filled".
-- DEV ONLY. The example people and their notes are made up.
--
-- 1. Sign in to Pickup once with your Tufts email (that creates your profile).
-- 2. Run supabase/seed.sql first (it creates the example students who send the offers).
-- 3. Replace the email on the next line with yours, then paste into Supabase → SQL Editor → Run.
--
-- Safe to run twice: fixed ids + `on conflict do nothing`. It never resets offers you've already
-- accepted or declined; run the cleanup block at the bottom first if you want a fresh start.

begin;

create temp table seed_me on commit drop as
select id from public.profiles where email = lower(btrim('YOUR_EMAIL@tufts.edu'));

do $$
begin
  if not exists (select 1 from seed_me) then
    raise exception 'No Pickup profile with that email. Sign in once, then put your email at the top of this file.';
  end if;
  if (select count(*) from public.profiles where id in (
        '5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000003')) < 3 then
    raise exception 'Run supabase/seed.sql first. It creates the example students who send you offers.';
  end if;
  if exists (select 1 from public.projects p where p.id = '5eed0000-0000-4000-8000-0000000000c1'
             and p.owner_id <> (select id from seed_me)) then
    raise exception 'The test project already belongs to another account. Run the cleanup block at the bottom first.';
  end if;
end $$;

insert into public.projects (id, owner_id, title, pitch, description, stage, prototype_url, status, created_at)
select '5eed0000-0000-4000-8000-0000000000c1', me.id,
       'Shadowing hours log',
       'Track clinical hours and reflections for med school applications.',
       'Pre-meds log shadowing hours in a spreadsheet and lose them. This keeps hours, sites and short reflections in one place and exports the summary applications ask for.',
       'prototype', 'https://example.com', 'published', now() - interval '2 days'
from seed_me me
on conflict (id) do nothing;

insert into public.roles (id, project_id, category, need, hours, created_at)
values
  ('5eed0000-0000-4000-8000-0000000000c2', '5eed0000-0000-4000-8000-0000000000c1', 'design', 'Log and summary screens', 5, now() - interval '2 days'),
  ('5eed0000-0000-4000-8000-0000000000c3', '5eed0000-0000-4000-8000-0000000000c1', 'data',   'One chart of hours by site', 3, now() - interval '2 days' + interval '1 microsecond')
on conflict (id) do nothing;

-- Pending offers: two on the design role (so accepting one declines the other), one on the data role.
insert into public.offers (id, role_id, helper_id, note, created_at)
values
  ('5eed0000-0000-4000-8000-0000000000d1', '5eed0000-0000-4000-8000-0000000000c2', '5eed0000-0000-4000-8000-000000000001',
   'I redid the screens for my own dining app last month. Could have two directions by Sunday.', now() - interval '30 hours'),
  ('5eed0000-0000-4000-8000-0000000000d2', '5eed0000-0000-4000-8000-0000000000c2', '5eed0000-0000-4000-8000-000000000002',
   'Designed two apps for my HCI class. Free this weekend, happy to meet at Tisch.', now() - interval '26 hours'),
  ('5eed0000-0000-4000-8000-0000000000d3', '5eed0000-0000-4000-8000-0000000000c3', '5eed0000-0000-4000-8000-000000000003',
   'I make charts for my lab every week. Send me an export and I can turn it around in a day.', now() - interval '20 hours')
on conflict do nothing;

insert into public.messages (id, offer_id, sender_id, body, created_at)
select v.id::uuid, v.offer_id::uuid, coalesce(v.sender_id::uuid, me.id), v.body, now() - v.ago
from seed_me me, (values
  ('5eed0000-0000-4000-8000-0000000000e1', '5eed0000-0000-4000-8000-0000000000d2', '5eed0000-0000-4000-8000-000000000002',
   'Here''s my portfolio if it helps: two class projects and a club site.', interval '25 hours'),
  ('5eed0000-0000-4000-8000-0000000000e2', '5eed0000-0000-4000-8000-0000000000d2', null,
   'Thanks! Which of those was the most work? Trying to get a sense of timing.', interval '24 hours'),
  ('5eed0000-0000-4000-8000-0000000000e3', '5eed0000-0000-4000-8000-0000000000d2', '5eed0000-0000-4000-8000-000000000002',
   'The club site. About six hours start to finish.', interval '23 hours'),
  ('5eed0000-0000-4000-8000-0000000000e4', '5eed0000-0000-4000-8000-0000000000d3', '5eed0000-0000-4000-8000-000000000003',
   'Is a CSV export easy on your end?', interval '19 hours')
) as v (id, offer_id, sender_id, body, ago)
where exists (select 1 from public.offers o where o.id = v.offer_id::uuid)
on conflict (id) do nothing;

commit;

-- ---------------------------------------------------------------------------
-- Cleanup: deletes the test project; its roles, offers, messages and credits cascade.
-- ---------------------------------------------------------------------------
-- delete from public.projects where id = '5eed0000-0000-4000-8000-0000000000c1';
