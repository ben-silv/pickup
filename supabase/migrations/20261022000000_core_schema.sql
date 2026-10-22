-- Pickup core schema: profiles, projects, roles, offers, messages, credits.
-- Apply with `supabase db push`, or paste into Supabase → SQL Editor → Run.
--
-- Security model
--   * Every table has Row Level Security. Only signed-in users (role `authenticated`) can read anything;
--     the anonymous key can read nothing.
--   * Simple writes (create a project, edit your profile, send a message) go through RLS policies.
--   * State changes that touch several rows (accept an offer, finish a role) go through
--     SECURITY DEFINER functions that check who is calling. Tables have no UPDATE policy for those columns,
--     so the rules can't be skipped by writing to the table directly.

-- ---------------------------------------------------------------------------
-- Vocabulary
-- ---------------------------------------------------------------------------
create type public.project_stage  as enum ('idea', 'mockup', 'prototype', 'live');
create type public.project_status as enum ('draft', 'published', 'archived');
create type public.role_category  as enum ('design', 'frontend', 'backend', 'data', 'ml', 'mobile', 'writing', 'testing', 'other');
create type public.role_status    as enum ('open', 'in_progress', 'filled', 'closed');
create type public.offer_status   as enum ('pending', 'accepted', 'declined', 'withdrawn');

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text not null unique check (email ~* '^[^@\s]+@tufts\.edu$' and email = lower(email)),
  full_name        text not null default '' check (char_length(full_name) <= 80),
  class_year       text check (class_year in ('2027', '2028', '2029', '2030', 'Grad', 'Other')),
  major            text check (char_length(major) <= 80),
  bio              text check (char_length(bio) <= 400),
  skills           public.role_category[] not null default '{}',
  open_to_requests boolean not null default true,
  hours_per_week   smallint check (hours_per_week between 1 and 40),
  github_url       text check (github_url ~ '^https://'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(btrim(title)) between 3 and 80),
  pitch         text not null check (char_length(btrim(pitch)) between 10 and 120),
  description   text not null default '' check (char_length(description) <= 4000),
  stage         public.project_stage not null,
  prototype_url text check (prototype_url ~ '^https?://'),
  repo_url      text check (repo_url ~ '^https?://'),
  status        public.project_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index projects_owner_idx on public.projects (owner_id);
create index projects_feed_idx  on public.projects (status, created_at desc);

create table public.roles (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  category   public.role_category not null,
  need       text not null check (char_length(btrim(need)) between 5 and 200),
  hours      smallint not null check (hours between 1 and 40),
  status     public.role_status not null default 'open',
  helper_id  uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index roles_project_idx on public.roles (project_id);
create index roles_open_idx    on public.roles (status, category);

create table public.offers (
  id         uuid primary key default gen_random_uuid(),
  role_id    uuid not null references public.roles (id) on delete cascade,
  helper_id  uuid not null references public.profiles (id) on delete cascade,
  note       text not null check (char_length(btrim(note)) between 10 and 600),
  status     public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (role_id, helper_id)
);
create index offers_helper_idx on public.offers (helper_id);

-- One conversation per offer, between the helper and the project owner.
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  offer_id   uuid not null references public.offers (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages (offer_id, created_at);

create table public.credits (
  id         uuid primary key default gen_random_uuid(),
  role_id    uuid not null unique references public.roles (id) on delete cascade,
  helper_id  uuid not null references public.profiles (id) on delete cascade,
  hours      smallint not null check (hours between 1 and 80),
  note       text not null check (char_length(btrim(note)) between 1 and 400),
  created_at timestamptz not null default now()
);
create index credits_helper_idx on public.credits (helper_id);

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- New users: Tufts only, and every user gets a profile
-- ---------------------------------------------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or new.email !~* '^[^@\s]+@tufts\.edu$' then
    raise exception 'Pickup is for Tufts students. Sign in with a @tufts.edu email.'
      using errcode = 'check_violation';
  end if;
  insert into public.profiles (id, email) values (new.id, lower(new.email));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers used by policies (SECURITY DEFINER avoids policy recursion)
-- ---------------------------------------------------------------------------
create function public.project_owner_of_role(p_role uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select p.owner_id from public.roles r join public.projects p on p.id = r.project_id where r.id = p_role
$$;

create function public.is_offer_participant(p_offer uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.offers o
    join public.roles r    on r.id = o.role_id
    join public.projects p on p.id = r.project_id
    where o.id = p_offer and (select auth.uid()) in (o.helper_id, p.owner_id)
  )
$$;

create function public.can_offer_on(p_role uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.roles r join public.projects p on p.id = r.project_id
    where r.id = p_role and r.status = 'open' and p.status = 'published' and p.owner_id <> (select auth.uid())
  )
$$;

create function public.offer_is_active(p_offer uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.offers where id = p_offer and status in ('pending', 'accepted'))
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.roles    enable row level security;
alter table public.offers   enable row level security;
alter table public.messages enable row level security;
alter table public.credits  enable row level security;

revoke all on public.profiles, public.projects, public.roles, public.offers, public.messages, public.credits from anon;

-- Profiles: every signed-in student can see profiles; you can edit your own (not your email).
create policy "profiles are visible to signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "you can edit your own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (full_name, class_year, major, bio, skills, open_to_requests, hours_per_week, github_url)
  on public.profiles to authenticated;

-- Projects: published ones are public to signed-in users; drafts only to their owner.
create policy "published projects and your own are visible" on public.projects
  for select to authenticated using (status = 'published' or owner_id = (select auth.uid()));
create policy "you can create projects as yourself" on public.projects
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owners can edit their projects" on public.projects
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owners can delete their projects" on public.projects
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Roles: visible when their project is visible; only the project owner adds, edits or removes them.
-- Status and helper change only through the functions below.
create policy "roles follow their project's visibility" on public.roles
  for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id));
create policy "owners add roles" on public.roles
  for insert to authenticated
  with check (status = 'open' and helper_id is null
              and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy "owners edit roles" on public.roles
  for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create policy "owners delete roles" on public.roles
  for delete to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
revoke update on public.roles from authenticated;
grant update (category, need, hours) on public.roles to authenticated;

-- Offers: only the helper and the project owner can see an offer.
create policy "helpers and owners see offers" on public.offers
  for select to authenticated
  using (helper_id = (select auth.uid()) or public.project_owner_of_role(role_id) = (select auth.uid()));
create policy "students offer help on open roles in others' projects" on public.offers
  for insert to authenticated
  with check (helper_id = (select auth.uid()) and status = 'pending' and decided_at is null and public.can_offer_on(role_id));

-- Messages: only the two people in the conversation; no sending once an offer is declined or withdrawn.
create policy "participants read messages" on public.messages
  for select to authenticated using (public.is_offer_participant(offer_id));
create policy "participants send messages" on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_offer_participant(offer_id) and public.offer_is_active(offer_id));

-- Credits: public to signed-in users (they're the point); written only by complete_role().
create policy "credits are visible to signed-in users" on public.credits
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- State changes
-- ---------------------------------------------------------------------------

-- Owner accepts an offer: the role goes in progress with that helper; other pending offers are declined.
create function public.accept_offer(p_offer uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_role uuid; v_helper uuid; v_owner uuid;
  v_offer_status public.offer_status; v_role_status public.role_status;
begin
  select o.role_id, o.helper_id, o.status, r.status, p.owner_id
    into v_role, v_helper, v_offer_status, v_role_status, v_owner
  from public.offers o
  join public.roles r    on r.id = o.role_id
  join public.projects p on p.id = r.project_id
  where o.id = p_offer
  for update of o, r;

  if not found then raise exception 'Offer not found.' using errcode = 'P0002'; end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'Only the project owner can accept offers.' using errcode = '42501';
  end if;
  if v_offer_status <> 'pending' then raise exception 'This offer is no longer pending.' using errcode = '22023'; end if;
  if v_role_status <> 'open' then raise exception 'This role is no longer open.' using errcode = '22023'; end if;

  update public.offers set status = 'accepted', decided_at = now() where id = p_offer;
  update public.roles  set status = 'in_progress', helper_id = v_helper where id = v_role;
  update public.offers set status = 'declined', decided_at = now()
    where role_id = v_role and id <> p_offer and status = 'pending';
end $$;

-- Owner declines an offer.
create function public.decline_offer(p_offer uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_status public.offer_status;
begin
  select public.project_owner_of_role(o.role_id), o.status into v_owner, v_status
  from public.offers o where o.id = p_offer for update;
  if not found then raise exception 'Offer not found.' using errcode = 'P0002'; end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'Only the project owner can decline offers.' using errcode = '42501';
  end if;
  if v_status <> 'pending' then raise exception 'This offer is no longer pending.' using errcode = '22023'; end if;
  update public.offers set status = 'declined', decided_at = now() where id = p_offer;
end $$;

-- Helper withdraws their own pending offer.
create function public.withdraw_offer(p_offer uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_helper uuid; v_status public.offer_status;
begin
  select helper_id, status into v_helper, v_status from public.offers where id = p_offer for update;
  if not found then raise exception 'Offer not found.' using errcode = 'P0002'; end if;
  if v_helper is distinct from auth.uid() then
    raise exception 'Only the person who made the offer can withdraw it.' using errcode = '42501';
  end if;
  if v_status <> 'pending' then raise exception 'This offer is no longer pending.' using errcode = '22023'; end if;
  update public.offers set status = 'withdrawn', decided_at = now() where id = p_offer;
end $$;

-- Owner marks a role filled and leaves a credit note for the helper.
create function public.complete_role(p_role uuid, p_hours smallint, p_note text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_status public.role_status; v_helper uuid; v_credit uuid;
begin
  select p.owner_id, r.status, r.helper_id into v_owner, v_status, v_helper
  from public.roles r join public.projects p on p.id = r.project_id
  where r.id = p_role for update of r;
  if not found then raise exception 'Role not found.' using errcode = 'P0002'; end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'Only the project owner can mark a role filled.' using errcode = '42501';
  end if;
  if v_status <> 'in_progress' or v_helper is null then
    raise exception 'Accept an offer before marking the role filled.' using errcode = '22023';
  end if;

  update public.roles set status = 'filled' where id = p_role;
  insert into public.credits (role_id, helper_id, hours, note)
    values (p_role, v_helper, p_hours, p_note)
    returning id into v_credit;
  return v_credit;
end $$;

revoke execute on function public.accept_offer(uuid), public.decline_offer(uuid), public.withdraw_offer(uuid),
  public.complete_role(uuid, smallint, text) from public, anon;
grant execute on function public.accept_offer(uuid), public.decline_offer(uuid), public.withdraw_offer(uuid),
  public.complete_role(uuid, smallint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: stream new messages to the two people in a conversation (RLS still applies)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Feed view: open roles on published projects, newest first (RLS of the base tables applies)
-- ---------------------------------------------------------------------------
create view public.open_roles with (security_invoker = true) as
select r.id          as role_id,
       r.category,
       r.need,
       r.hours,
       r.created_at,
       p.id          as project_id,
       p.title,
       p.pitch,
       p.stage,
       pr.id         as owner_id,
       pr.full_name  as owner_name,
       pr.class_year as owner_class_year,
       pr.major      as owner_major
from public.roles r
join public.projects p  on p.id = r.project_id
join public.profiles pr on pr.id = p.owner_id
where r.status = 'open' and p.status = 'published';

revoke all on public.open_roles from anon;
