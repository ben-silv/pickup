-- Post a project: the project and its roles are saved together, or not at all.
-- Apply after 20261022000000_core_schema.sql (`supabase db push`, or paste into Supabase → SQL Editor → Run).
--
-- SECURITY INVOKER: it runs as the signed-in student, so the same RLS policies as a direct insert apply
-- (you can only create projects as yourself and add roles to your own project). Plpgsql runs the whole
-- function in one transaction, so a bad role rolls back the project too.

create function public.create_project(
  p_title         text,
  p_pitch         text,
  p_description   text,
  p_stage         public.project_stage,
  p_prototype_url text,
  p_repo_url      text,
  p_status        public.project_status,
  p_roles         jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_project uuid;
  v_count   int;
begin
  if auth.uid() is null then
    raise exception 'Sign in to post a project.' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('draft', 'published') then
    raise exception 'A new project is either a draft or published.' using errcode = '22023';
  end if;
  if p_roles is null or jsonb_typeof(p_roles) <> 'array' then
    raise exception 'Add at least one role.' using errcode = '22023';
  end if;
  v_count := jsonb_array_length(p_roles);
  if v_count < 1 then
    raise exception 'Add at least one role.' using errcode = '22023';
  end if;
  if v_count > 5 then
    raise exception 'Up to 5 roles per project.' using errcode = '22023';
  end if;

  insert into public.projects (owner_id, title, pitch, description, stage, prototype_url, repo_url, status)
  values (auth.uid(), btrim(p_title), btrim(p_pitch), coalesce(btrim(p_description), ''), p_stage,
          nullif(btrim(p_prototype_url), ''), nullif(btrim(p_repo_url), ''), p_status)
  returning id into v_project;

  -- Microsecond steps keep the roles in the order they were entered.
  insert into public.roles (project_id, category, need, hours, created_at)
  select v_project,
         (r.value ->> 'category')::public.role_category,
         btrim(r.value ->> 'need'),
         (r.value ->> 'hours')::smallint,
         now() + (r.ordinality - 1) * interval '1 microsecond'
  from jsonb_array_elements(p_roles) with ordinality as r (value, ordinality);

  return v_project;
end $$;

revoke execute on function public.create_project(text, text, text, public.project_stage, text, text, public.project_status, jsonb)
  from public, anon;
grant execute on function public.create_project(text, text, text, public.project_stage, text, text, public.project_status, jsonb)
  to authenticated;
