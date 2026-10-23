-- Safety: report a conversation, and block someone.
--
-- Reports are written only through report_conversation() and are visible to the person who filed them; the site
-- admin reviews them in the Supabase dashboard (Table Editor -> reports), which bypasses RLS.
-- Blocks are private to the blocker. While a block exists in either direction: no new messages in shared
-- conversations, no offers on each other's projects, and pending offers between the two are closed.

create type public.report_reason as enum ('spam', 'harassment', 'inappropriate', 'other');

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  offer_id    uuid references public.offers (id) on delete set null,
  reason      public.report_reason not null,
  details     text not null default '' check (char_length(details) <= 500),
  status      text not null default 'open' check (status in ('open', 'reviewed')),
  created_at  timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
-- One open report per person per conversation, so reports can't be spammed either.
create unique index reports_one_open_per_conversation on public.reports (reporter_id, offer_id) where status = 'open';

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.reports enable row level security;
alter table public.blocks  enable row level security;
revoke all on public.reports, public.blocks from anon;
revoke insert, update, delete on public.reports from authenticated;
revoke insert, update on public.blocks from authenticated;

create policy "see your own reports" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()));
create policy "see your own blocks" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "unblock people you blocked" on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- Is there a block either way between two people?
create function public.blocked_between(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a)
  )
$$;

-- The other person in a conversation, if the caller is in it.
create function public.other_participant(p_offer uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select case when o.helper_id = (select auth.uid()) then p.owner_id
              when p.owner_id = (select auth.uid()) then o.helper_id end
  from public.offers o
  join public.roles r on r.id = o.role_id
  join public.projects p on p.id = r.project_id
  where o.id = p_offer
$$;

-- Is this conversation closed by a block? Only answers for its two participants.
create function public.conversation_blocked(p_offer uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.blocked_between((select auth.uid()), public.other_participant(p_offer)), false)
$$;

-- No new messages across a block (restrictive: applies on top of the existing insert policy).
create policy "no messages across a block" on public.messages
  as restrictive for insert to authenticated
  with check (not public.conversation_blocked(offer_id));

-- No offers on the projects of someone you blocked, or who blocked you (covers new offers and resends).
create or replace function public.can_offer_on(p_role uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.roles r join public.projects p on p.id = r.project_id
    where r.id = p_role and r.status = 'open' and p.status = 'published' and p.owner_id <> (select auth.uid())
      and not public.blocked_between(p.owner_id, (select auth.uid()))
  )
$$;

create function public.report_conversation(p_offer uuid, p_reason public.report_reason, p_details text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_other uuid := public.other_participant(p_offer); v_details text := btrim(coalesce(p_details, ''));
begin
  if v_other is null then raise exception 'You can only report conversations you''re in.' using errcode = '42501'; end if;
  if char_length(v_details) > 500 then raise exception 'Keep the details under 500 characters.' using errcode = '22023'; end if;
  if exists (select 1 from public.reports where reporter_id = auth.uid() and offer_id = p_offer and status = 'open') then
    raise exception 'You''ve already reported this conversation. We''ll look into it.' using errcode = '22023';
  end if;
  insert into public.reports (reporter_id, reported_id, offer_id, reason, details)
    values (auth.uid(), v_other, p_offer, p_reason, v_details);
end $$;

-- Block the other person in a conversation, and close pending offers between you both.
create function public.block_in_conversation(p_offer uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_me uuid := auth.uid(); v_other uuid := public.other_participant(p_offer);
begin
  if v_other is null then raise exception 'You can only block people you''re talking to.' using errcode = '42501'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (v_me, v_other) on conflict do nothing;

  -- Their pending offers on my projects are declined; my pending offers on theirs are withdrawn.
  update public.offers o set status = 'declined', decided_at = now()
  from public.roles r join public.projects p on p.id = r.project_id
  where o.role_id = r.id and o.status = 'pending' and o.helper_id = v_other and p.owner_id = v_me;
  update public.offers o set status = 'withdrawn', decided_at = now()
  from public.roles r join public.projects p on p.id = r.project_id
  where o.role_id = r.id and o.status = 'pending' and o.helper_id = v_me and p.owner_id = v_other;
end $$;

create function public.unblock_in_conversation(p_offer uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.blocks where blocker_id = auth.uid() and blocked_id = public.other_participant(p_offer);
end $$;

revoke execute on function public.blocked_between(uuid, uuid), public.other_participant(uuid), public.conversation_blocked(uuid),
  public.report_conversation(uuid, public.report_reason, text), public.block_in_conversation(uuid),
  public.unblock_in_conversation(uuid) from public, anon;
grant execute on function public.conversation_blocked(uuid), public.report_conversation(uuid, public.report_reason, text),
  public.block_in_conversation(uuid), public.unblock_in_conversation(uuid) to authenticated;
revoke execute on function public.blocked_between(uuid, uuid), public.other_participant(uuid) from authenticated;
-- blocked_between and other_participant stay private: they're only called inside the SECURITY DEFINER functions
-- above, so nobody can probe who blocked whom.
