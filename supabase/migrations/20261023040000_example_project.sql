-- One example project to show new students what a post looks like, until real ones arrive.
-- An example is clearly labelled in the app, never takes offers, and drops out of the Browse feed as soon as
-- any real project is published. Only the database owner (SQL Editor) can mark a project as an example.

alter table public.projects add column is_example boolean not null default false;

-- Students can't create or turn their own projects into examples.
create policy "only the admin marks examples" on public.projects
  as restrictive for insert to authenticated with check (not is_example);
create policy "only the admin marks examples (edits)" on public.projects
  as restrictive for update to authenticated with check (not is_example);

-- The seed's "Wet-lab protocol timer" stays as the example (no-op if it isn't in this database).
update public.projects set is_example = true where id = '5eed0000-0000-4000-8000-0000000000a3';

-- Examples never take offers (on top of the open/published/not-yours/no-block rules).
create or replace function public.can_offer_on(p_role uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.roles r join public.projects p on p.id = r.project_id
    where r.id = p_role and r.status = 'open' and p.status = 'published' and not p.is_example
      and p.owner_id <> (select auth.uid())
      and not public.blocked_between(p.owner_id, (select auth.uid()))
  )
$$;

-- The feed: same columns plus is_example; examples only show while no real project is published.
create or replace view public.open_roles with (security_invoker = true) as
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
       pr.major      as owner_major,
       p.is_example
from public.roles r
join public.projects p  on p.id = r.project_id
join public.profiles pr on pr.id = p.owner_id
where r.status = 'open' and p.status = 'published'
  and (not p.is_example
       or not exists (select 1 from public.projects real where real.status = 'published' and not real.is_example));
